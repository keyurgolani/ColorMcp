/**
 * Export Tailwind CSS tool - Generate Tailwind CSS utility class configuration
 */

import Joi from 'joi';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { UnifiedColor } from '../color/unified-color';

const exportTailwindSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string())
    .min(1)
    .max(100)
    .required()
    .description('Array of colors to export'),

  format: Joi.string()
    .valid('config', 'plugin', 'css', 'all')
    .default('config')
    .description('Tailwind export format'),

  prefix: Joi.string()
    .pattern(/^[a-zA-Z][a-zA-Z0-9-]*$/)
    .default('custom')
    .description('Prefix for color names'),

  include_shades: Joi.boolean()
    .default(true)
    .description('Include shade variations (50, 100, 200, etc.)'),

  semantic_names: Joi.array()
    .items(Joi.string())
    .description('Optional semantic names for colors'),

  extend_default: Joi.boolean()
    .default(true)
    .description('Extend default Tailwind colors instead of replacing'),

  generate_utilities: Joi.array()
    .items(
      Joi.string().valid(
        'background',
        'text',
        'border',
        'ring',
        'shadow',
        'all'
      )
    )
    .default(['all'])
    .description('Which utility classes to generate'),
});

interface ExportTailwindParams {
  colors: string[];
  format?: 'config' | 'plugin' | 'css' | 'all';
  prefix?: string;
  include_shades?: boolean;
  semantic_names?: string[];
  extend_default?: boolean;
  generate_utilities?: string[];
}

async function exportTailwind(
  params: ExportTailwindParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value: validatedParams } =
      exportTailwindSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'export_tailwind',
        'INVALID_PARAMETERS',
        `Invalid parameters: ${error.details.map(d => d.message).join(', ')}`,
        Date.now() - startTime
      );
    }

    // Parse colors
    const colors: UnifiedColor[] = [];
    for (const colorStr of validatedParams.colors) {
      try {
        const color = new UnifiedColor(colorStr);
        colors.push(color);
      } catch {
        return createErrorResponse(
          'export_tailwind',
          'INVALID_COLOR',
          `Invalid color format: ${colorStr}`,
          Date.now() - startTime,
          {
            details: { provided: colorStr },
            suggestions: [
              'Use hex format like #FF0000',
              'Use RGB format like rgb(255, 0, 0)',
              'Use HSL format like hsl(0, 100%, 50%)',
            ],
          }
        );
      }
    }

    // Generate Tailwind configuration
    const tailwindConfig = generateTailwindConfig(colors, validatedParams);
    const tailwindPlugin = generateTailwindPlugin(colors, validatedParams);
    const tailwindCSS = generateTailwindCSS(colors, validatedParams);

    // Determine output based on format
    let output = '';
    switch (validatedParams.format) {
      case 'config':
        output = tailwindConfig;
        break;
      case 'plugin':
        output = tailwindPlugin;
        break;
      case 'css':
        output = tailwindCSS;
        break;
      case 'all':
        output = `// Tailwind Config\n${tailwindConfig}\n\n// Tailwind Plugin\n${tailwindPlugin}\n\n// Generated CSS\n${tailwindCSS}`;
        break;
    }

    // Generate additional export formats
    const exportFormats = {
      tailwind: output,
      config: tailwindConfig,
      plugin: tailwindPlugin,
      css: tailwindCSS,
      json: {
        colors: colors.map((color, index) => ({
          index: index + 1,
          hex: color.hex,
          rgb: color.rgb,
          hsl: color.hsl,
          semantic_name: validatedParams.semantic_names?.[index],
          tailwind_name: getTailwindColorName(index, validatedParams),
        })),
        format: validatedParams.format,
        prefix: validatedParams.prefix,
        metadata: {
          total_colors: colors.length,
          includes_shades: validatedParams.include_shades,
          extends_default: validatedParams.extend_default,
          utilities: validatedParams.generate_utilities,
        },
      },
    };

    const executionTime = Date.now() - startTime;

    return createSuccessResponse(
      'export_tailwind',
      {
        tailwind_output: output,
        format: validatedParams.format,
        color_count: colors.length,
        prefix: validatedParams.prefix,
        includes_shades: validatedParams.include_shades,
        extends_default: validatedParams.extend_default,
        utilities: validatedParams.generate_utilities,
      },
      executionTime,
      {
        recommendations: [
          'Use semantic color names for better maintainability',
          'Consider including shade variations for more design flexibility',
          'Test the configuration in your Tailwind CSS setup',
        ],
        exportFormats,
      }
    );
  } catch (error) {
    return createErrorResponse(
      'export_tailwind',
      'PROCESSING_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      Date.now() - startTime
    );
  }
}

/**
 * Generate Tailwind CSS configuration
 */
function generateTailwindConfig(
  colors: UnifiedColor[],
  params: ExportTailwindParams
): string {
  const { prefix, include_shades, semantic_names, extend_default } = params;

  let config = `/** @type {import('tailwindcss').Config} */\n`;
  config += `module.exports = {\n`;
  config += `  theme: {\n`;
  config += `    ${extend_default ? 'extend: {' : ''}\n`;
  config += `      colors: {\n`;

  colors.forEach((color, index) => {
    const name = semantic_names?.[index] || `${prefix}-${index + 1}`;
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (include_shades) {
      config += `        '${safeName}': {\n`;

      // Generate shade variations
      const shades = generateColorShades(color);
      Object.entries(shades).forEach(([shade, shadeColor]) => {
        config += `          '${shade}': '${shadeColor}',\n`;
      });

      config += `        },\n`;
    } else {
      config += `        '${safeName}': '${color.hex}',\n`;
    }
  });

  config += `      },\n`;
  config += `    ${extend_default ? '},' : ''}\n`;
  config += `  },\n`;
  config += `  plugins: [],\n`;
  config += `}`;

  return config;
}

/**
 * Generate Tailwind CSS plugin
 */
function generateTailwindPlugin(
  colors: UnifiedColor[],
  params: ExportTailwindParams
): string {
  const { prefix, semantic_names, generate_utilities } = params;

  let plugin = `const plugin = require('tailwindcss/plugin');\n\n`;
  plugin += `module.exports = plugin(function({ addUtilities, theme }) {\n`;
  plugin += `  const colors = {\n`;

  colors.forEach((color, index) => {
    const name = semantic_names?.[index] || `${prefix}-${index + 1}`;
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    plugin += `    '${safeName}': '${color.hex}',\n`;
  });

  plugin += `  };\n\n`;

  // Generate utility classes
  const utilities = generate_utilities?.includes('all')
    ? ['background', 'text', 'border', 'ring', 'shadow']
    : generate_utilities || [];

  if (utilities.includes('background') || utilities.includes('all')) {
    plugin += `  // Background utilities\n`;
    plugin += `  const backgroundUtilities = {};\n`;
    plugin += `  Object.entries(colors).forEach(([name, color]) => {\n`;
    plugin += `    backgroundUtilities[\`.bg-\${name}\`] = { backgroundColor: color };\n`;
    plugin += `  });\n`;
    plugin += `  addUtilities(backgroundUtilities);\n\n`;
  }

  if (utilities.includes('text') || utilities.includes('all')) {
    plugin += `  // Text utilities\n`;
    plugin += `  const textUtilities = {};\n`;
    plugin += `  Object.entries(colors).forEach(([name, color]) => {\n`;
    plugin += `    textUtilities[\`.text-\${name}\`] = { color: color };\n`;
    plugin += `  });\n`;
    plugin += `  addUtilities(textUtilities);\n\n`;
  }

  if (utilities.includes('border') || utilities.includes('all')) {
    plugin += `  // Border utilities\n`;
    plugin += `  const borderUtilities = {};\n`;
    plugin += `  Object.entries(colors).forEach(([name, color]) => {\n`;
    plugin += `    borderUtilities[\`.border-\${name}\`] = { borderColor: color };\n`;
    plugin += `  });\n`;
    plugin += `  addUtilities(borderUtilities);\n\n`;
  }

  plugin += `});`;

  return plugin;
}

/**
 * Generate Tailwind CSS utility classes
 */
function generateTailwindCSS(
  colors: UnifiedColor[],
  params: ExportTailwindParams
): string {
  const { prefix, semantic_names, generate_utilities } = params;

  let css = `/* Generated Tailwind CSS Utilities */\n\n`;

  const utilities = generate_utilities?.includes('all')
    ? ['background', 'text', 'border', 'ring', 'shadow']
    : generate_utilities || [];

  colors.forEach((color, index) => {
    const name = semantic_names?.[index] || `${prefix}-${index + 1}`;
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (utilities.includes('background') || utilities.includes('all')) {
      css += `.bg-${safeName} {\n`;
      css += `  background-color: ${color.hex};\n`;
      css += `}\n\n`;
    }

    if (utilities.includes('text') || utilities.includes('all')) {
      css += `.text-${safeName} {\n`;
      css += `  color: ${color.hex};\n`;
      css += `}\n\n`;
    }

    if (utilities.includes('border') || utilities.includes('all')) {
      css += `.border-${safeName} {\n`;
      css += `  border-color: ${color.hex};\n`;
      css += `}\n\n`;
    }

    if (utilities.includes('ring') || utilities.includes('all')) {
      css += `.ring-${safeName} {\n`;
      css += `  --tw-ring-color: ${color.hex};\n`;
      css += `}\n\n`;
    }
  });

  return css;
}

/**
 * Generate color shades (50, 100, 200, ..., 900, 950)
 */
function generateColorShades(color: UnifiedColor): Record<string, string> {
  const shades: Record<string, string> = {};
  const baseHue = color.hsl.h;
  const baseSat = color.hsl.s;

  // Tailwind shade scale
  const shadeMap = {
    '50': 95, // Very light
    '100': 90, // Light
    '200': 80, // Light
    '300': 70, // Light-medium
    '400': 60, // Medium-light
    '500': 50, // Medium (base)
    '600': 40, // Medium-dark
    '700': 30, // Dark
    '800': 20, // Dark
    '900': 10, // Very dark
    '950': 5, // Darkest
  };

  // Find the closest shade to the original color
  const originalLightness = color.hsl.l;
  let closestShade = '500';
  let closestDiff = Math.abs(50 - originalLightness);

  Object.entries(shadeMap).forEach(([shade, lightness]) => {
    const diff = Math.abs(lightness - originalLightness);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestShade = shade;
    }
  });

  // Generate all shades
  Object.entries(shadeMap).forEach(([shade, lightness]) => {
    if (shade === closestShade) {
      // Use original color for closest shade
      shades[shade] = color.hex;
    } else {
      // Generate shade variation
      const shadeColor = new UnifiedColor(
        `hsl(${baseHue}, ${baseSat}%, ${lightness}%)`
      );
      shades[shade] = shadeColor.hex;
    }
  });

  return shades;
}

/**
 * Get Tailwind color name for a color
 */
function getTailwindColorName(
  index: number,
  params: ExportTailwindParams
): string {
  const name =
    params.semantic_names?.[index] || `${params.prefix}-${index + 1}`;
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

export const exportTailwindTool: ToolHandler = {
  name: 'export_tailwind',
  description:
    'Generate Tailwind CSS configuration, plugins, and utility classes for color palettes',
  parameters: exportTailwindSchema.describe(),
  handler: async (params: unknown) =>
    exportTailwind(params as ExportTailwindParams),
};
