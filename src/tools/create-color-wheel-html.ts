/**
 * MCP tool for creating interactive color wheel HTML visualizations
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { ColorWheelVisualizationData } from '../visualization/html-generator';
import {
  enhancedHTMLGenerator,
  EnhancedVisualizationResult,
  EnhancedHTMLOptions,
} from '../visualization/enhanced-html-generator';
import { enhancedFileOutputManager } from '../utils/enhanced-file-output-manager';
import { logger } from '../utils/logger';
import { UnifiedColor } from '../color/unified-color';
import { validateColorInput } from '../validation/schemas';
import Joi from 'joi';

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

  enable_background_controls: Joi.boolean()
    .default(true)
    .description('Enable interactive background controls'),

  enable_accessibility_testing: Joi.boolean()
    .default(true)
    .description('Enable accessibility testing and warnings'),

  include_keyboard_help: Joi.boolean()
    .default(true)
    .description('Include keyboard shortcuts help'),
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
  enable_background_controls?: boolean;
  enable_accessibility_testing?: boolean;
  include_keyboard_help?: boolean;
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

    // Process highlight colors
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
    if (validatedParams.size && validatedParams.size > 600) {
      recommendations.push(
        'Large color wheels may impact performance on mobile devices'
      );
    }

    if (highlightColors.length > 6) {
      recommendations.push(
        'Consider using fewer highlight colors for better visual clarity'
      );
    }

    if (validatedParams.show_harmony && !validatedParams.harmony_type) {
      accessibilityNotes.push(
        'Harmony visualization requires a harmony_type parameter'
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
        description: `${validatedParams.type?.toUpperCase() || 'HSL'} color wheel with ${highlightColors.length} highlighted colors`,
        timestamp: new Date().toLocaleString(),
        wheelType: validatedParams.type || 'hsl',
      },
    };

    // Generate enhanced HTML with background controls
    let result: EnhancedVisualizationResult;

    try {
      const enhancedOptions: EnhancedHTMLOptions = {
        interactive: true, // Enable interactive features including JavaScript
        backgroundControls: {
          enableToggle: validatedParams.enable_background_controls ?? true,
          enableColorPicker: validatedParams.enable_background_controls ?? true,
          defaultBackground:
            validatedParams.theme === 'dark' ? 'dark' : 'light',
        },
        enableAccessibilityTesting:
          validatedParams.enable_accessibility_testing ?? true,
        includeKeyboardHelp: validatedParams.include_keyboard_help ?? true,
      };

      result = await enhancedHTMLGenerator.generateEnhancedColorWheelHTML(
        visualizationData,
        enhancedOptions
      );
    } catch (htmlError) {
      throw new Error(
        `Failed to generate enhanced HTML: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}`
      );
    }

    // Prepare export formats
    const exportFormats: Record<string, string | object> = {};

    exportFormats['css'] = generateColorWheelCSSExport(highlightColors);
    exportFormats['json'] = {
      wheel_type: validatedParams.type,
      size: validatedParams.size,
      highlight_colors: highlightColors.map(c => ({
        hex: c.hex,
        hue: c.hue,
        saturation: c.saturation,
        lightness: c.lightness,
      })),
      harmony_type: validatedParams.harmony_type,
      metadata: visualizationData.metadata,
    };

    const executionTime = Date.now() - startTime;

    // Try to save file using enhanced file output manager
    let visualizationResult;
    try {
      await enhancedFileOutputManager.initialize();

      // If we have HTML content, save it using the enhanced file output manager
      if (result.htmlContent) {
        visualizationResult =
          await enhancedFileOutputManager.saveHTMLVisualization(
            result.htmlContent,
            {
              toolName: 'create_color_wheel_html',
              description: `Enhanced color wheel visualization (${validatedParams.type || 'hsl'})`,
            }
          );
      }
    } catch (fileError) {
      // If file saving fails, we'll fall back to returning HTML content directly
      logger.warn('Failed to save HTML file, falling back to content', {
        error: fileError as Error,
      });
    }

    return {
      success: true,
      data: {
        wheel_type: validatedParams.type || 'hsl',
        size: validatedParams.size || 400,
        highlight_colors: highlightColors.map(c => c.hex),
        harmony_type: validatedParams.harmony_type,
        interactive: validatedParams.interactive !== false,
        file_path: result.filePath,
        file_name: result.fileName,
        file_size: result.fileSize,
        background_controls_enabled: result.backgroundControlsEnabled,
        accessibility_features: result.accessibilityFeatures,
      },
      metadata: {
        execution_time: executionTime,
        tool: 'create_color_wheel_html',
        timestamp: new Date().toISOString(),
        color_space_used: validatedParams.type?.toUpperCase() || 'HSL',
        accessibility_notes: accessibilityNotes,
        recommendations: [
          ...recommendations,
          'HTML file saved with interactive background controls',
          'Use Alt+T to toggle background theme',
          'Use Alt+C to open color picker',
        ],
      },
      visualizations: {
        html: result.htmlContent || `File saved: ${result.filePath}`,
        ...(visualizationResult?.html_file && {
          html_file: visualizationResult.html_file,
        }),
      },
      export_formats: exportFormats,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: `Color wheel HTML generation error: ${errorMessage}`,
        details: {
          errorMessage,
          errorStack,
          errorType: error?.constructor?.name || 'Unknown',
        },
        suggestions: [
          'Try with fewer highlight colors',
          'Verify all colors are in valid formats',
          'Check if the wheel type and size are supported',
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

function generateColorWheelCSSExport(
  highlightColors: Array<{
    hex: string;
    hue: number;
    saturation: number;
    lightness: number;
  }>
): string {
  let css = ':root {\n';

  highlightColors.forEach((color, index) => {
    css += `  --wheel-color-${index + 1}: ${color.hex.toLowerCase()};\n`;
    css += `  --wheel-color-${index + 1}-hue: ${color.hue}deg;\n`;
    css += `  --wheel-color-${index + 1}-saturation: ${color.saturation}%;\n`;
    css += `  --wheel-color-${index + 1}-lightness: ${color.lightness}%;\n`;
  });

  css += '}\n\n';
  css += '/* Color wheel highlight colors */\n';
  css += '.color-wheel-highlights {\n';

  highlightColors.forEach((_, index) => {
    css += `  --highlight-${index + 1}: var(--wheel-color-${index + 1});\n`;
  });

  css += '}';
  return css;
}

export const createColorWheelHtmlTool: ToolHandler = {
  name: 'create_color_wheel_html',
  description:
    'Generate interactive HTML color wheel visualizations with harmony highlighting and color selection',
  parameters: createColorWheelHtmlSchema.describe(),
  handler: async (params: unknown) =>
    createColorWheelHtml(params as CreateColorWheelHtmlParams),
};
