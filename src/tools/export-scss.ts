/**
 * Export SCSS tool - Generate SCSS variables and mixins
 */

import Joi from 'joi';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { UnifiedColor } from '../color/unified-color';

const exportScssSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string())
    .min(1)
    .max(100)
    .required()
    .description('Array of colors to export'),

  format: Joi.string()
    .valid('variables', 'map', 'mixins', 'all')
    .default('all')
    .description('SCSS format type'),

  prefix: Joi.string()
    .pattern(/^[a-zA-Z][a-zA-Z0-9-_]*$/)
    .default('color')
    .description('Prefix for SCSS variable names'),

  include_functions: Joi.boolean()
    .default(true)
    .description('Include utility functions and mixins'),

  include_variants: Joi.boolean()
    .default(true)
    .description('Include lighter/darker variants'),

  semantic_names: Joi.array()
    .items(Joi.string())
    .description('Optional semantic names for colors'),

  namespace: Joi.string()
    .pattern(/^[a-zA-Z][a-zA-Z0-9-_]*$/)
    .description('Optional namespace for variables'),
});

interface ExportScssParams {
  colors: string[];
  format?: 'variables' | 'map' | 'mixins' | 'all';
  prefix?: string;
  include_functions?: boolean;
  include_variants?: boolean;
  semantic_names?: string[];
  namespace?: string;
}

async function exportScss(
  params: ExportScssParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value: validatedParams } = exportScssSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'export_scss',
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
          'export_scss',
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

    // Generate SCSS
    const scss = generateSCSS(colors, validatedParams);

    // Generate additional export formats
    const exportFormats = {
      scss,
      css: convertScssToCSS(scss),
      json: {
        colors: colors.map((color, index) => ({
          index: index + 1,
          hex: color.hex,
          rgb: color.rgb,
          hsl: color.hsl,
          semantic_name: validatedParams.semantic_names?.[index],
          variable_name: getVariableName(index, validatedParams),
        })),
        format: validatedParams.format,
        prefix: validatedParams.prefix,
        namespace: validatedParams.namespace,
        metadata: {
          total_colors: colors.length,
          includes_functions: validatedParams.include_functions,
          includes_variants: validatedParams.include_variants,
        },
      },
    };

    const executionTime = Date.now() - startTime;

    return createSuccessResponse(
      'export_scss',
      {
        scss_output: scss,
        format: validatedParams.format,
        color_count: colors.length,
        prefix: validatedParams.prefix,
        namespace: validatedParams.namespace,
        includes_functions: validatedParams.include_functions,
        includes_variants: validatedParams.include_variants,
      },
      executionTime,
      {
        recommendations: [
          'Use SCSS maps for better organization of large color palettes',
          'Consider using mixins for consistent color application',
          'Use functions for dynamic color manipulation',
        ],
        exportFormats,
      }
    );
  } catch (error) {
    return createErrorResponse(
      'export_scss',
      'PROCESSING_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      Date.now() - startTime
    );
  }
}

/**
 * Generate SCSS variables, maps, and mixins
 */
function generateSCSS(
  colors: UnifiedColor[],
  params: ExportScssParams
): string {
  const {
    format,
    prefix,
    include_functions,
    include_variants,
    semantic_names,
    namespace,
  } = params;

  let scss = '';
  const ns = namespace ? `${namespace}-` : '';

  // Header comment
  scss += `// Generated SCSS Color Palette\n`;
  scss += `// Format: ${format}\n`;
  scss += `// Colors: ${colors.length}\n\n`;

  // Generate SCSS variables
  if (format === 'variables' || format === 'all') {
    scss += `// Color Variables\n`;

    colors.forEach((color, index) => {
      const name = semantic_names?.[index] || `${prefix}-${index + 1}`;
      const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      scss += `$${ns}${safeName}: ${color.hex};\n`;

      if (include_variants) {
        const lighterColor = new UnifiedColor(
          `hsl(${color.hsl.h}, ${color.hsl.s}%, ${Math.min(100, color.hsl.l + 15)}%)`
        );
        const darkerColor = new UnifiedColor(
          `hsl(${color.hsl.h}, ${color.hsl.s}%, ${Math.max(0, color.hsl.l - 15)}%)`
        );

        scss += `$${ns}${safeName}-light: ${lighterColor.hex};\n`;
        scss += `$${ns}${safeName}-dark: ${darkerColor.hex};\n`;
      }
    });

    scss += '\n';
  }

  // Generate SCSS color map
  if (format === 'map' || format === 'all') {
    scss += `// Color Map\n`;
    scss += `$${ns}colors: (\n`;

    colors.forEach((color, index) => {
      const name = semantic_names?.[index] || `${prefix}-${index + 1}`;
      const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      scss += `  '${safeName}': ${color.hex},\n`;

      if (include_variants) {
        const lighterColor = new UnifiedColor(
          `hsl(${color.hsl.h}, ${color.hsl.s}%, ${Math.min(100, color.hsl.l + 15)}%)`
        );
        const darkerColor = new UnifiedColor(
          `hsl(${color.hsl.h}, ${color.hsl.s}%, ${Math.max(0, color.hsl.l - 15)}%)`
        );

        scss += `  '${safeName}-light': ${lighterColor.hex},\n`;
        scss += `  '${safeName}-dark': ${darkerColor.hex},\n`;
      }
    });

    scss += `);\n\n`;
  }

  // Generate utility functions and mixins
  if ((format === 'mixins' || format === 'all') && include_functions) {
    scss += `// Utility Functions\n`;

    // Color getter function
    scss += `@function ${ns}color($name) {\n`;
    scss += `  @if map-has-key($${ns}colors, $name) {\n`;
    scss += `    @return map-get($${ns}colors, $name);\n`;
    scss += `  }\n`;
    scss += `  @warn "Color '#{$name}' not found in $${ns}colors map";\n`;
    scss += `  @return null;\n`;
    scss += `}\n\n`;

    // Background color mixin
    scss += `// Background Color Mixin\n`;
    scss += `@mixin ${ns}bg-color($name, $opacity: 1) {\n`;
    scss += `  $color: ${ns}color($name);\n`;
    scss += `  @if $color {\n`;
    scss += `    @if $opacity == 1 {\n`;
    scss += `      background-color: $color;\n`;
    scss += `    } @else {\n`;
    scss += `      background-color: rgba($color, $opacity);\n`;
    scss += `    }\n`;
    scss += `  }\n`;
    scss += `}\n\n`;

    // Text color mixin
    scss += `// Text Color Mixin\n`;
    scss += `@mixin ${ns}text-color($name, $opacity: 1) {\n`;
    scss += `  $color: ${ns}color($name);\n`;
    scss += `  @if $color {\n`;
    scss += `    @if $opacity == 1 {\n`;
    scss += `      color: $color;\n`;
    scss += `    } @else {\n`;
    scss += `      color: rgba($color, $opacity);\n`;
    scss += `    }\n`;
    scss += `  }\n`;
    scss += `}\n\n`;

    // Border color mixin
    scss += `// Border Color Mixin\n`;
    scss += `@mixin ${ns}border-color($name, $width: 1px, $style: solid) {\n`;
    scss += `  $color: ${ns}color($name);\n`;
    scss += `  @if $color {\n`;
    scss += `    border: $width $style $color;\n`;
    scss += `  }\n`;
    scss += `}\n\n`;

    // Theme mixin
    scss += `// Theme Mixin\n`;
    scss += `@mixin ${ns}theme($background, $text, $accent: null) {\n`;
    scss += `  @include ${ns}bg-color($background);\n`;
    scss += `  @include ${ns}text-color($text);\n`;
    scss += `  \n`;
    scss += `  @if $accent {\n`;
    scss += `    a, .accent {\n`;
    scss += `      @include ${ns}text-color($accent);\n`;
    scss += `    }\n`;
    scss += `  }\n`;
    scss += `}\n\n`;
  }

  return scss;
}

/**
 * Convert SCSS to CSS (basic conversion for preview)
 */
function convertScssToCSS(scss: string): string {
  // This is a simplified conversion for preview purposes
  // In a real implementation, you'd use a proper SCSS compiler
  let css = scss;

  // Remove comments
  css = css.replace(/\/\/.*$/gm, '');

  // Convert simple variables to CSS custom properties
  css = css.replace(/\$([a-zA-Z0-9-_]+):\s*([^;]+);/g, '--$1: $2;');

  // Wrap in :root
  if (css.includes('--')) {
    css =
      ':root {\n' +
      css
        .split('\n')
        .filter(line => line.includes('--'))
        .join('\n') +
      '\n}';
  }

  return css;
}

/**
 * Get variable name for a color
 */
function getVariableName(index: number, params: ExportScssParams): string {
  const name =
    params.semantic_names?.[index] || `${params.prefix}-${index + 1}`;
  const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const ns = params.namespace ? `${params.namespace}-` : '';
  return `$${ns}${safeName}`;
}

export const exportScssTool: ToolHandler = {
  name: 'export_scss',
  description:
    'Generate SCSS variables, maps, and mixins for color palettes with utility functions',
  parameters: exportScssSchema.describe(),
  handler: async (params: unknown) => exportScss(params as ExportScssParams),
};
