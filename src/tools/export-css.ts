/**
 * Export CSS tool - Generate modern CSS with custom properties and fallbacks
 */

import Joi from 'joi';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { UnifiedColor } from '../color/unified-color';

const exportCssSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string())
    .min(1)
    .max(100)
    .required()
    .description('Array of colors to export'),

  format: Joi.string()
    .valid('variables', 'classes', 'both')
    .default('both')
    .description('CSS format type'),

  prefix: Joi.string()
    .pattern(/^[a-zA-Z][a-zA-Z0-9-_]*$/)
    .default('color')
    .description('Prefix for CSS variable and class names'),

  include_fallbacks: Joi.boolean()
    .default(true)
    .description('Include fallback values for older browsers'),

  include_rgb_hsl: Joi.boolean()
    .default(true)
    .description('Include RGB and HSL variants'),

  semantic_names: Joi.array()
    .items(Joi.string())
    .description('Optional semantic names for colors'),

  minify: Joi.boolean().default(false).description('Minify the CSS output'),
});

interface ExportCssParams {
  colors: string[];
  format?: 'variables' | 'classes' | 'both';
  prefix?: string;
  include_fallbacks?: boolean;
  include_rgb_hsl?: boolean;
  semantic_names?: string[];
  minify?: boolean;
}

async function exportCss(
  params: ExportCssParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value: validatedParams } = exportCssSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'export_css',
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
          'export_css',
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

    // Generate CSS
    const css = generateCSS(colors, validatedParams);

    // Generate additional export formats
    const exportFormats = {
      css,
      json: {
        colors: colors.map((color, index) => ({
          index: index + 1,
          hex: color.hex,
          rgb: color.rgb,
          hsl: color.hsl,
          semantic_name: validatedParams.semantic_names?.[index],
        })),
        format: validatedParams.format,
        prefix: validatedParams.prefix,
        metadata: {
          total_colors: colors.length,
          includes_fallbacks: validatedParams.include_fallbacks,
          includes_rgb_hsl: validatedParams.include_rgb_hsl,
          minified: validatedParams.minify,
        },
      },
    };

    const executionTime = Date.now() - startTime;

    return createSuccessResponse(
      'export_css',
      {
        css_output: css,
        format: validatedParams.format,
        color_count: colors.length,
        prefix: validatedParams.prefix,
        includes_fallbacks: validatedParams.include_fallbacks,
        includes_variants: validatedParams.include_rgb_hsl,
        minified: validatedParams.minify,
      },
      executionTime,
      {
        recommendations: [
          'Use CSS custom properties for better maintainability',
          'Consider using semantic color names for better readability',
          'Test fallback values in older browsers if needed',
        ],
        exportFormats,
      }
    );
  } catch (error) {
    return createErrorResponse(
      'export_css',
      'PROCESSING_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      Date.now() - startTime
    );
  }
}

/**
 * Generate CSS with custom properties and classes
 */
function generateCSS(colors: UnifiedColor[], params: ExportCssParams): string {
  const {
    format,
    prefix,
    include_fallbacks,
    include_rgb_hsl,
    semantic_names,
    minify,
  } = params;

  let css = '';
  const indent = minify ? '' : '  ';
  const newline = minify ? '' : '\n';
  const space = minify ? '' : ' ';

  // Generate CSS custom properties
  if (format === 'variables' || format === 'both') {
    css += `:root${space}{${newline}`;

    colors.forEach((color, index) => {
      const name = semantic_names?.[index] || `${prefix}-${index + 1}`;
      const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      // Main color variable
      css += `${indent}--${safeName}:${space}${color.hex};${newline}`;

      if (include_rgb_hsl) {
        // RGB values (useful for alpha variations)
        css += `${indent}--${safeName}-rgb:${space}${color.rgb.r},${space}${color.rgb.g},${space}${color.rgb.b};${newline}`;

        // HSL values (useful for variations)
        css += `${indent}--${safeName}-hsl:${space}${Math.round(color.hsl.h)},${space}${Math.round(color.hsl.s)}%,${space}${Math.round(color.hsl.l)}%;${newline}`;
      }

      if (include_fallbacks) {
        // Lighter and darker variants
        const lighterColor = new UnifiedColor(
          `hsl(${color.hsl.h}, ${color.hsl.s}%, ${Math.min(100, color.hsl.l + 10)}%)`
        );
        const darkerColor = new UnifiedColor(
          `hsl(${color.hsl.h}, ${color.hsl.s}%, ${Math.max(0, color.hsl.l - 10)}%)`
        );

        css += `${indent}--${safeName}-light:${space}${lighterColor.hex};${newline}`;
        css += `${indent}--${safeName}-dark:${space}${darkerColor.hex};${newline}`;
      }
    });

    css += `}${newline}${newline}`;
  }

  // Generate utility classes
  if (format === 'classes' || format === 'both') {
    colors.forEach((color, index) => {
      const name = semantic_names?.[index] || `${prefix}-${index + 1}`;
      const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      // Background color classes
      css += `.bg-${safeName}${space}{${newline}`;
      css += `${indent}background-color:${space}var(--${safeName},${space}${color.hex});${newline}`;
      css += `}${newline}`;

      // Text color classes
      css += `.text-${safeName}${space}{${newline}`;
      css += `${indent}color:${space}var(--${safeName},${space}${color.hex});${newline}`;
      css += `}${newline}`;

      // Border color classes
      css += `.border-${safeName}${space}{${newline}`;
      css += `${indent}border-color:${space}var(--${safeName},${space}${color.hex});${newline}`;
      css += `}${newline}`;

      if (include_fallbacks) {
        // Hover variants
        css += `.bg-${safeName}:hover${space}{${newline}`;
        css += `${indent}background-color:${space}var(--${safeName}-dark,${space}${color.hex});${newline}`;
        css += `}${newline}`;
      }

      if (!minify) {
        css += newline;
      }
    });
  }

  return css.trim();
}

export const exportCssTool: ToolHandler = {
  name: 'export_css',
  description:
    'Generate modern CSS with custom properties, utility classes, and fallbacks for color palettes',
  parameters: exportCssSchema.describe(),
  handler: async (params: unknown) => exportCss(params as ExportCssParams),
};
