/**
 * MCP tool for creating HTML palette visualizations
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import {
  HTMLGeneratorOptions,
  PaletteVisualizationData,
} from '../visualization/html-generator';
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
const createPaletteHtmlSchema = Joi.object({
  palette: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .max(50)
    .required()
    .description('Array of colors in any supported format'),

  layout: Joi.string()
    .valid('horizontal', 'vertical', 'grid', 'circular', 'wave')
    .default('horizontal')
    .description('Layout style for the palette'),

  style: Joi.string()
    .valid('swatches', 'gradient', 'cards', 'minimal', 'detailed')
    .default('swatches')
    .description('Visual style of the palette'),

  size: Joi.string()
    .valid('small', 'medium', 'large', 'custom')
    .default('medium')
    .description('Size of color swatches'),

  custom_dimensions: Joi.array()
    .items(Joi.number().integer().min(50).max(2000))
    .length(2)
    .when('size', {
      is: 'custom',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('Custom dimensions [width, height] when size is custom'),

  show_values: Joi.boolean()
    .default(true)
    .description('Show color values on swatches'),

  show_names: Joi.boolean()
    .default(false)
    .description('Show color names if available'),

  interactive: Joi.boolean()
    .default(true)
    .description('Enable interactive features'),

  export_formats: Joi.array()
    .items(Joi.string().valid('hex', 'rgb', 'hsl', 'css', 'json'))
    .default(['hex', 'rgb', 'hsl'])
    .description('Available export formats'),

  accessibility_info: Joi.boolean()
    .default(false)
    .description('Show accessibility information'),

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

interface CreatePaletteHtmlParams {
  palette: string[];
  layout?: 'horizontal' | 'vertical' | 'grid' | 'circular' | 'wave';
  style?: 'swatches' | 'gradient' | 'cards' | 'minimal' | 'detailed';
  size?: 'small' | 'medium' | 'large' | 'custom';
  custom_dimensions?: [number, number];
  show_values?: boolean;
  show_names?: boolean;
  interactive?: boolean;
  export_formats?: string[];
  accessibility_info?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  enable_background_controls?: boolean;
  enable_accessibility_testing?: boolean;
  include_keyboard_help?: boolean;
}

async function createPaletteHtml(
  params: CreatePaletteHtmlParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = createPaletteHtmlSchema.validate(params);
    if (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid parameters provided',
          details: error.details,
          suggestions: [
            'Check that palette contains valid color strings',
            'Ensure layout is one of: horizontal, vertical, grid, circular, wave',
            'Verify custom_dimensions are provided when size is custom',
          ],
        },
        metadata: {
          execution_time: Date.now() - startTime,
          tool: 'create_palette_html',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const validatedParams = value as CreatePaletteHtmlParams;

    // Parse and validate colors
    const colors: Array<{
      hex: string;
      rgb: string;
      hsl: string;
      name?: string;
      accessibility?: {
        contrastRatio: number;
        wcagAA: boolean;
        wcagAAA: boolean;
      };
    }> = [];

    const accessibilityNotes: string[] = [];
    const recommendations: string[] = [];

    for (let i = 0; i < validatedParams.palette.length; i++) {
      const colorInput = validatedParams.palette[i];

      if (!colorInput) {
        return {
          success: false,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: `Color at index ${i} is undefined or null`,
            details: { index: i, color: colorInput },
            suggestions: [
              'Ensure all palette entries are valid color strings',
              'Check for undefined or null values in the palette array',
            ],
          },
          metadata: {
            execution_time: Date.now() - startTime,
            tool: 'create_palette_html',
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
              message: `Invalid color format at index ${i}: ${colorInput}`,
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
              tool: 'create_palette_html',
              timestamp: new Date().toISOString(),
            },
          };
        }

        let unifiedColor: UnifiedColor;
        try {
          unifiedColor = new UnifiedColor(colorInput);
        } catch (colorError) {
          throw new Error(
            `Failed to create UnifiedColor for "${colorInput}": ${colorError instanceof Error ? colorError.message : String(colorError)}`
          );
        }

        // Calculate accessibility information if requested
        let accessibility;
        if (validatedParams.accessibility_info) {
          // Calculate contrast against white and black backgrounds
          const whiteContrast = unifiedColor.getContrastRatio('#ffffff');
          const blackContrast = unifiedColor.getContrastRatio('#000000');
          const bestContrast = Math.max(whiteContrast, blackContrast);

          accessibility = {
            contrastRatio: bestContrast,
            wcagAA: bestContrast >= 4.5,
            wcagAAA: bestContrast >= 7.0,
          };

          // Add accessibility notes
          if (!accessibility.wcagAA) {
            accessibilityNotes.push(
              `Color ${unifiedColor.hex} may not meet WCAG AA contrast requirements`
            );
          }
        }

        const colorName = unifiedColor.getName();
        colors.push({
          hex: unifiedColor.hex,
          rgb: unifiedColor.toFormat('rgb'),
          hsl: unifiedColor.toFormat('hsl'),
          ...(colorName && { name: colorName }),
          ...(accessibility && { accessibility }),
        });
      } catch (colorError) {
        return {
          success: false,
          error: {
            code: 'COLOR_PROCESSING_ERROR',
            message: `Failed to process color at index ${i}: ${colorInput}`,
            details: { index: i, color: colorInput, error: colorError },
            suggestions: [
              'Verify the color format is supported',
              'Check for typos in color values',
              'Try a different color format',
            ],
          },
          metadata: {
            execution_time: Date.now() - startTime,
            tool: 'create_palette_html',
            timestamp: new Date().toISOString(),
          },
        };
      }
    }

    // Generate recommendations
    if (colors.length > 10) {
      recommendations.push(
        'Consider using fewer colors for better visual clarity'
      );
    }

    if (validatedParams.layout === 'circular' && colors.length > 8) {
      recommendations.push('Circular layout works best with 8 or fewer colors');
    }

    if (validatedParams.accessibility_info) {
      const lowContrastColors = colors.filter(
        c => c.accessibility && !c.accessibility.wcagAA
      ).length;
      if (lowContrastColors > 0) {
        recommendations.push(
          `${lowContrastColors} colors may need contrast adjustment for accessibility`
        );
      }
    }

    // Prepare visualization data
    const options: HTMLGeneratorOptions = {
      ...(validatedParams.layout && { layout: validatedParams.layout }),
      ...(validatedParams.style && { style: validatedParams.style }),
      ...(validatedParams.size && { size: validatedParams.size }),
      ...(validatedParams.custom_dimensions && {
        customDimensions: validatedParams.custom_dimensions,
      }),
      ...(validatedParams.show_values !== undefined && {
        showValues: validatedParams.show_values,
      }),
      ...(validatedParams.show_names !== undefined && {
        showNames: validatedParams.show_names,
      }),
      ...(validatedParams.interactive !== undefined && {
        interactive: validatedParams.interactive,
      }),
      ...(validatedParams.export_formats && {
        exportFormats: validatedParams.export_formats,
      }),
      ...(validatedParams.accessibility_info !== undefined && {
        accessibilityInfo: validatedParams.accessibility_info,
      }),
      ...(validatedParams.theme && { theme: validatedParams.theme }),
    };

    const visualizationData: PaletteVisualizationData = {
      colors,
      options,
      metadata: {
        title: 'Color Palette Visualization',
        description: `Interactive color palette with ${colors.length} colors`,
        timestamp: new Date().toLocaleString(),
        colorCount: colors.length,
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

      result = await enhancedHTMLGenerator.generateEnhancedPaletteHTML(
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

    if (validatedParams.export_formats?.includes('css')) {
      exportFormats['css'] = generateCSSExport(colors);
    }

    if (validatedParams.export_formats?.includes('json')) {
      exportFormats['json'] = {
        palette: colors.map(c => ({
          hex: c.hex,
          rgb: c.rgb,
          hsl: c.hsl,
          name: c.name,
        })),
        metadata: visualizationData.metadata,
      };
    }

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
              toolName: 'create_palette_html',
              description: `Enhanced palette visualization with ${colors.length} colors`,
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
        colors: colors.map(c => ({
          hex: c.hex,
          rgb: c.rgb,
          hsl: c.hsl,
          name: c.name,
        })),
        layout: validatedParams.layout,
        color_count: colors.length,
        accessibility_compliant: validatedParams.accessibility_info
          ? colors.every(c => c.accessibility?.wcagAA)
          : undefined,
        file_path: result.filePath,
        file_name: result.fileName,
        file_size: result.fileSize,
        background_controls_enabled: result.backgroundControlsEnabled,
        accessibility_features: result.accessibilityFeatures,
      },
      metadata: {
        execution_time: executionTime,
        tool: 'create_palette_html',
        timestamp: new Date().toISOString(),
        color_space_used: 'sRGB',
        accessibility_notes: accessibilityNotes,
        recommendations: [
          ...recommendations,
          'HTML file saved with interactive background controls',
          'Use Alt+T to toggle background theme',
          'Use Alt+C to open color picker',
        ],
        colorCount: colors.length,
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
        message: `HTML visualization error: ${errorMessage}`,
        details: {
          errorMessage,
          errorStack,
          errorType: error?.constructor?.name || 'Unknown',
        },
        suggestions: [
          'Try with a smaller palette',
          'Verify all colors are in valid formats',
          'Check if the layout and style options are supported',
        ],
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'create_palette_html',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function generateCSSExport(
  colors: Array<{ hex: string; rgb: string; hsl: string; name?: string }>
): string {
  let css = ':root {\n';
  colors.forEach((color, index) => {
    const name = color.name
      ? color.name.toLowerCase().replace(/\s+/g, '-')
      : `color-${index + 1}`;
    css += `  --${name}: ${color.hex.toLowerCase()};\n`;
    css += `  --${name}-rgb: ${color.rgb};\n`;
    css += `  --${name}-hsl: ${color.hsl};\n`;
  });
  css += '}';
  return css;
}

export const createPaletteHtmlTool: ToolHandler = {
  name: 'create_palette_html',
  description:
    'Generate interactive HTML visualizations of color palettes with accessibility features and multiple layout options',
  parameters: createPaletteHtmlSchema.describe(),
  handler: async (params: unknown) =>
    createPaletteHtml(params as CreatePaletteHtmlParams),
};
