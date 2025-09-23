/**
 * MCP tool for creating theme preview HTML mockups showing colors in realistic UI contexts
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { ThemePreviewVisualizationData } from '../visualization/html-generator';
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
const createThemePreviewHtmlSchema = Joi.object({
  theme_colors: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .required()
    .description('Semantic color mapping object'),

  preview_type: Joi.string()
    .valid('website', 'mobile_app', 'dashboard', 'components')
    .default('website')
    .description('Preview type'),

  components: Joi.array()
    .items(
      Joi.string().valid(
        'header',
        'sidebar',
        'content',
        'footer',
        'buttons',
        'forms',
        'cards'
      )
    )
    .default(['header', 'content', 'buttons'])
    .description('Components to show'),

  interactive: Joi.boolean().default(true).description('Enable interactivity'),

  responsive: Joi.boolean().default(true).description('Responsive design'),

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

interface CreateThemePreviewHtmlParams {
  theme_colors: Record<string, string>;
  preview_type?: 'website' | 'mobile_app' | 'dashboard' | 'components';
  components?: string[];
  interactive?: boolean;
  responsive?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  enable_background_controls?: boolean;
  enable_accessibility_testing?: boolean;
  include_keyboard_help?: boolean;
}

async function createThemePreviewHtml(
  params: CreateThemePreviewHtmlParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = createThemePreviewHtmlSchema.validate(params);
    if (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid parameters provided',
          details: error.details,
          suggestions: [
            'Ensure theme_colors is an object with color name keys and color value strings',
            'Check that preview_type is one of: website, mobile_app, dashboard, components',
            'Verify components array contains valid component names',
          ],
        },
        metadata: {
          execution_time: Date.now() - startTime,
          tool: 'create_theme_preview_html',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const validatedParams = value as CreateThemePreviewHtmlParams;

    // Validate and process theme colors
    const processedThemeColors: Record<
      string,
      {
        hex: string;
        rgb: string;
        hsl: string;
        name: string;
        accessibility?: {
          contrastRatio: number;
          wcagAA: boolean;
          wcagAAA: boolean;
        };
      }
    > = {};

    const accessibilityNotes: string[] = [];
    const recommendations: string[] = [];

    // Required semantic colors for different preview types
    const requiredColors = getRequiredColorsForPreviewType(
      validatedParams.preview_type || 'website'
    );
    const missingColors: string[] = [];

    for (const [colorName, colorValue] of Object.entries(
      validatedParams.theme_colors
    )) {
      if (!colorValue || typeof colorValue !== 'string') {
        return {
          success: false,
          error: {
            code: 'INVALID_COLOR_VALUE',
            message: `Invalid color value for "${colorName}": ${colorValue}`,
            details: { colorName, colorValue },
            suggestions: [
              'Ensure all color values are valid color strings',
              'Use hex format like #FF0000',
              'Use RGB format like rgb(255, 0, 0)',
              'Use HSL format like hsl(0, 100%, 50%)',
            ],
          },
          metadata: {
            execution_time: Date.now() - startTime,
            tool: 'create_theme_preview_html',
            timestamp: new Date().toISOString(),
          },
        };
      }

      try {
        // Validate color format
        const colorValidation = validateColorInput(colorValue);
        if (!colorValidation.isValid) {
          return {
            success: false,
            error: {
              code: 'INVALID_COLOR_FORMAT',
              message: `Invalid color format for "${colorName}": ${colorValue}`,
              details: {
                colorName,
                colorValue,
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
              tool: 'create_theme_preview_html',
              timestamp: new Date().toISOString(),
            },
          };
        }

        const unifiedColor = new UnifiedColor(colorValue);

        // Calculate accessibility information
        let accessibility;
        if (colorName === 'text' || colorName === 'primary') {
          // Calculate contrast against background colors
          const backgroundColors = ['background', 'surface'];
          let bestContrast = 0;

          for (const bgColorName of backgroundColors) {
            if (validatedParams.theme_colors[bgColorName]) {
              try {
                const bgColor = new UnifiedColor(
                  validatedParams.theme_colors[bgColorName]
                );
                const contrast = unifiedColor.getContrastRatio(bgColor.hex);
                bestContrast = Math.max(bestContrast, contrast);
              } catch {
                // Ignore errors for background color processing
              }
            }
          }

          if (bestContrast > 0) {
            accessibility = {
              contrastRatio: bestContrast,
              wcagAA: bestContrast >= 4.5,
              wcagAAA: bestContrast >= 7.0,
            };

            if (!accessibility.wcagAA) {
              accessibilityNotes.push(
                `Color "${colorName}" may not meet WCAG AA contrast requirements (${bestContrast.toFixed(2)}:1)`
              );
            }
          }
        }

        processedThemeColors[colorName] = {
          hex: unifiedColor.hex,
          rgb: unifiedColor.toFormat('rgb'),
          hsl: unifiedColor.toFormat('hsl'),
          name: colorName,
          ...(accessibility && { accessibility }),
        };
      } catch (colorError) {
        return {
          success: false,
          error: {
            code: 'COLOR_PROCESSING_ERROR',
            message: `Failed to process color "${colorName}": ${colorValue}`,
            details: { colorName, colorValue, error: colorError },
            suggestions: [
              'Verify the color format is supported',
              'Check for typos in color values',
              'Try a different color format',
            ],
          },
          metadata: {
            execution_time: Date.now() - startTime,
            tool: 'create_theme_preview_html',
            timestamp: new Date().toISOString(),
          },
        };
      }
    }

    // Check for missing required colors
    for (const requiredColor of requiredColors) {
      if (!processedThemeColors[requiredColor]) {
        missingColors.push(requiredColor);
      }
    }

    if (missingColors.length > 0) {
      recommendations.push(
        `Consider adding these semantic colors for better ${validatedParams.preview_type} preview: ${missingColors.join(', ')}`
      );
    }

    // Generate additional recommendations
    const colorCount = Object.keys(processedThemeColors).length;
    if (colorCount < 3) {
      recommendations.push(
        'Consider adding more semantic colors (background, text, primary, secondary) for a complete theme'
      );
    }

    if (
      validatedParams.preview_type === 'dashboard' &&
      !processedThemeColors['sidebar']
    ) {
      recommendations.push(
        'Dashboard previews work best with a sidebar color defined'
      );
    }

    // Prepare visualization data
    const visualizationData: ThemePreviewVisualizationData = {
      themeColors: processedThemeColors,
      previewType: validatedParams.preview_type || 'website',
      components: validatedParams.components || [
        'header',
        'content',
        'buttons',
      ],
      interactive: validatedParams.interactive !== false,
      responsive: validatedParams.responsive !== false,
      theme: validatedParams.theme || 'light',
      metadata: {
        title: 'Theme Preview',
        description: `${validatedParams.preview_type || 'Website'} preview with ${colorCount} theme colors`,
        timestamp: new Date().toLocaleString(),
        colorCount,
        previewType: validatedParams.preview_type || 'website',
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

      result = await enhancedHTMLGenerator.generateEnhancedThemePreviewHTML(
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

    exportFormats['css'] = generateThemeCSSExport(processedThemeColors);
    exportFormats['scss'] = generateThemeSCSSExport(processedThemeColors);
    exportFormats['json'] = {
      theme_colors: Object.fromEntries(
        Object.entries(processedThemeColors).map(([name, color]) => [
          name,
          {
            hex: color.hex,
            rgb: color.rgb,
            hsl: color.hsl,
            accessibility: color.accessibility,
          },
        ])
      ),
      preview_type: validatedParams.preview_type,
      components: validatedParams.components,
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
              toolName: 'create_theme_preview_html',
              description: `Enhanced theme preview with ${colorCount} colors`,
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
        theme_colors: Object.fromEntries(
          Object.entries(processedThemeColors).map(([name, color]) => [
            name,
            color.hex,
          ])
        ),
        preview_type: validatedParams.preview_type || 'website',
        components: validatedParams.components || [
          'header',
          'content',
          'buttons',
        ],
        color_count: colorCount,
        accessibility_compliant: Object.values(processedThemeColors).every(
          color => !color.accessibility || color.accessibility.wcagAA
        ),
        file_path: result.filePath,
        file_name: result.fileName,
        file_size: result.fileSize,
        background_controls_enabled: result.backgroundControlsEnabled,
        accessibility_features: result.accessibilityFeatures,
      },
      metadata: {
        execution_time: executionTime,
        tool: 'create_theme_preview_html',
        timestamp: new Date().toISOString(),
        color_space_used: 'sRGB',
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
        message: `Theme preview HTML generation error: ${errorMessage}`,
        details: {
          errorMessage,
          errorStack,
          errorType: error?.constructor?.name || 'Unknown',
        },
        suggestions: [
          'Verify all theme colors are in valid formats',
          'Check that the preview type and components are supported',
          'Try with a simpler theme color set',
        ],
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'create_theme_preview_html',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function getRequiredColorsForPreviewType(previewType: string): string[] {
  const baseColors = ['background', 'text', 'primary'];

  switch (previewType) {
    case 'website':
      return [...baseColors, 'surface', 'secondary'];
    case 'mobile_app':
      return [...baseColors, 'surface', 'accent'];
    case 'dashboard':
      return [
        ...baseColors,
        'surface',
        'sidebar',
        'accent',
        'success',
        'warning',
        'error',
      ];
    case 'components':
      return [
        ...baseColors,
        'secondary',
        'success',
        'warning',
        'error',
        'info',
      ];
    default:
      return baseColors;
  }
}

function generateThemeCSSExport(
  themeColors: Record<
    string,
    { hex: string; rgb: string; hsl: string; name: string }
  >
): string {
  let css = ':root {\n';

  Object.entries(themeColors).forEach(([name, colorData]) => {
    const cssName = name.toLowerCase().replace(/\s+/g, '-');
    css += `  --color-${cssName}: ${colorData.hex.toLowerCase()};\n`;
    css += `  --color-${cssName}-rgb: ${colorData.rgb};\n`;
    css += `  --color-${cssName}-hsl: ${colorData.hsl};\n`;
  });

  css += '}\n\n';
  css += '/* Theme color utility classes */\n';

  Object.entries(themeColors).forEach(([name]) => {
    const cssName = name.toLowerCase().replace(/\s+/g, '-');
    css += `.bg-${cssName} { background-color: var(--color-${cssName}); }\n`;
    css += `.text-${cssName} { color: var(--color-${cssName}); }\n`;
    css += `.border-${cssName} { border-color: var(--color-${cssName}); }\n`;
  });

  return css;
}

function generateThemeSCSSExport(
  themeColors: Record<
    string,
    { hex: string; rgb: string; hsl: string; name: string }
  >
): string {
  let scss = '// Theme color variables\n';

  Object.entries(themeColors).forEach(([name, colorData]) => {
    const scssName = name.toLowerCase().replace(/\s+/g, '-');
    scss += `$color-${scssName}: ${colorData.hex.toLowerCase()};\n`;
  });

  scss += '\n// Theme color map\n';
  scss += '$theme-colors: (\n';

  Object.entries(themeColors).forEach(([name], index, array) => {
    const scssName = name.toLowerCase().replace(/\s+/g, '-');
    scss += `  "${scssName}": $color-${scssName}`;
    if (index < array.length - 1) scss += ',';
    scss += '\n';
  });

  scss += ');\n\n';
  scss += '// Theme color mixins\n';
  scss += '@mixin theme-color($color-name, $property: color) {\n';
  scss += '  #{$property}: map-get($theme-colors, $color-name);\n';
  scss += '}\n\n';
  scss += '@mixin bg-theme-color($color-name) {\n';
  scss += '  @include theme-color($color-name, background-color);\n';
  scss += '}\n';

  return scss;
}

export const createThemePreviewHtmlTool: ToolHandler = {
  name: 'create_theme_preview_html',
  description:
    'Generate HTML theme preview mockups showing colors in realistic UI contexts',
  parameters: createThemePreviewHtmlSchema.describe(),
  handler: async (params: unknown) =>
    createThemePreviewHtml(params as CreateThemePreviewHtmlParams),
};
