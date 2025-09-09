/**
 * MCP tool for creating HTML color wheel visualizations
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import {
  HTMLGenerator,
  ColorWheelVisualizationData,
} from '../visualization/html-generator';
import { UnifiedColor } from '../color/unified-color';
import { validateColorInput } from '../validation/schemas';
import * as Joi from 'joi';

// Parameter validation schema
const createColorWheelHtmlSchema = Joi.object({
  type: Joi.string()
    .valid('hsl', 'hsv', 'rgb', 'ryw', 'ryb')
    .default('hsl')
    .description('Color wheel type'),

  size: Joi.number()
    .integer()
    .min(200)
    .max(1000)
    .default(400)
    .description('Size in pixels'),

  interactive: Joi.boolean().default(true).description('Enable interactivity'),

  show_harmony: Joi.boolean()
    .default(false)
    .description('Show harmony relationships'),

  harmony_type: Joi.string()
    .valid(
      'complementary',
      'triadic',
      'analogous',
      'split_complementary',
      'tetradic'
    )
    .when('show_harmony', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('Harmony type if show_harmony is true'),

  highlight_colors: Joi.array()
    .items(Joi.string())
    .max(10)
    .default([])
    .description('Colors to highlight on wheel'),

  theme: Joi.string()
    .valid('light', 'dark', 'auto')
    .default('light')
    .description('Color theme for the visualization'),
});

interface CreateColorWheelHtmlParams {
  type?: 'hsl' | 'hsv' | 'rgb' | 'ryw' | 'ryb';
  size?: number;
  interactive?: boolean;
  show_harmony?: boolean;
  harmony_type?:
    | 'complementary'
    | 'triadic'
    | 'analogous'
    | 'split_complementary'
    | 'tetradic';
  highlight_colors?: string[];
  theme?: 'light' | 'dark' | 'auto';
}

async function createColorWheelHtml(
  params: CreateColorWheelHtmlParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = createColorWheelHtmlSchema.validate(params);
    if (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid parameters provided',
          details: error.details,
          suggestions: [
            'Check that type is one of: hsl, hsv, rgb, ryw, ryb',
            'Ensure size is between 200 and 1000 pixels',
            'Verify harmony_type is provided when show_harmony is true',
          ],
        },
        metadata: {
          execution_time: Date.now() - startTime,
          tool: 'create_color_wheel_html',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const validatedParams = value as CreateColorWheelHtmlParams;

    // Validate and process highlight colors
    const highlightColors: Array<{
      hex: string;
      hue: number;
      saturation: number;
      lightness: number;
    }> = [];

    const accessibilityNotes: string[] = [];
    const recommendations: string[] = [];

    if (
      validatedParams.highlight_colors &&
      validatedParams.highlight_colors.length > 0
    ) {
      for (let i = 0; i < validatedParams.highlight_colors.length; i++) {
        const colorInput = validatedParams.highlight_colors[i];

        if (!colorInput) {
          return {
            success: false,
            error: {
              code: 'INVALID_COLOR_FORMAT',
              message: `Color at index ${i} is undefined or null`,
              details: { index: i, color: colorInput },
              suggestions: [
                'Ensure all highlight colors are valid color strings',
                'Check for undefined or null values in the highlight_colors array',
              ],
            },
            metadata: {
              execution_time: Date.now() - startTime,
              tool: 'create_color_wheel_html',
              timestamp: new Date().toISOString(),
            },
          };
        }

        try {
          // Validate color format
          const colorValidation = validateColorInput(colorInput);
          if (!colorValidation.isValid) {
            return {
              success: false,
              error: {
                code: 'INVALID_COLOR_FORMAT',
                message: `Invalid color format in highlight_colors at index ${i}: ${colorInput}`,
                details: {
                  index: i,
                  color: colorInput,
                  reason: colorValidation.error,
                },
                suggestions: [
                  'Use hex format like #FF0000',
                  'Use RGB format like rgb(255, 0, 0)',
                  'Use HSL format like hsl(0, 100%, 50%)',
                  'Check the color format documentation',
                ],
              },
              metadata: {
                execution_time: Date.now() - startTime,
                tool: 'create_color_wheel_html',
                timestamp: new Date().toISOString(),
              },
            };
          }

          const unifiedColor = new UnifiedColor(colorInput);
          const hsl = unifiedColor.hsl;

          highlightColors.push({
            hex: unifiedColor.hex,
            hue: hsl.h,
            saturation: hsl.s,
            lightness: hsl.l,
          });
        } catch (colorError) {
          return {
            success: false,
            error: {
              code: 'COLOR_PROCESSING_ERROR',
              message: `Failed to process highlight color at index ${i}: ${colorInput}`,
              details: { index: i, color: colorInput, error: colorError },
              suggestions: [
                'Verify the color format is supported',
                'Check for typos in color values',
                'Try a different color format',
              ],
            },
            metadata: {
              execution_time: Date.now() - startTime,
              tool: 'create_color_wheel_html',
              timestamp: new Date().toISOString(),
            },
          };
        }
      }
    }

    // Generate recommendations
    if (validatedParams.size && validatedParams.size > 800) {
      recommendations.push(
        'Large color wheels may impact performance on mobile devices'
      );
    }

    if (validatedParams.show_harmony && !validatedParams.harmony_type) {
      recommendations.push(
        'Specify harmony_type when show_harmony is enabled for better visualization'
      );
    }

    if (highlightColors.length > 5) {
      recommendations.push(
        'Consider using fewer highlight colors for better visual clarity'
      );
    }

    // Prepare visualization data
    const visualizationData: ColorWheelVisualizationData = {
      type: validatedParams.type || 'hsl',
      size: validatedParams.size || 400,
      interactive: validatedParams.interactive !== false,
      showHarmony: validatedParams.show_harmony || false,
      ...(validatedParams.harmony_type && {
        harmonyType: validatedParams.harmony_type,
      }),
      highlightColors,
      theme: validatedParams.theme || 'light',
      metadata: {
        title: 'Interactive Color Wheel',
        description: `${validatedParams.type?.toUpperCase() || 'HSL'} color wheel visualization`,
        timestamp: new Date().toLocaleString(),
        wheelType: validatedParams.type || 'hsl',
      },
    };

    // Generate HTML
    const htmlGenerator = new HTMLGenerator();
    const html = htmlGenerator.generateColorWheelHTML(visualizationData);

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        wheel_type: validatedParams.type || 'hsl',
        size: validatedParams.size || 400,
        interactive: validatedParams.interactive !== false,
        highlight_colors: highlightColors.map(c => c.hex),
        harmony_type: validatedParams.harmony_type,
      },
      metadata: {
        execution_time: executionTime,
        tool: 'create_color_wheel_html',
        timestamp: new Date().toISOString(),
        color_space_used: validatedParams.type || 'hsl',
        accessibility_notes: accessibilityNotes,
        recommendations,
      },
      visualizations: {
        html,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          'An unexpected error occurred while generating the color wheel visualization',
        details: error,
        suggestions: [
          'Try with fewer highlight colors',
          'Verify all colors are in valid formats',
          'Check if the wheel type and options are supported',
        ],
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'create_color_wheel_html',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const createColorWheelHtmlTool: ToolHandler = {
  name: 'create_color_wheel_html',
  description:
    'Generate interactive HTML color wheel visualizations with harmony highlighting and color selection',
  parameters: createColorWheelHtmlSchema.describe(),
  handler: async (params: unknown) =>
    createColorWheelHtml(params as CreateColorWheelHtmlParams),
};
