/**
 * MCP tool for creating HTML theme preview visualizations
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import {
  HTMLGenerator,
  ThemePreviewVisualizationData,
} from '../visualization/html-generator';
import { UnifiedColor } from '../color/unified-color';
import { validateColorInput } from '../validation/schemas';
import Joi from 'joi';

// Parameter validation schema
const createThemePreviewHtmlSchema = Joi.object({
  theme_colors: Joi.object()
    .pattern(Joi.string(), Joi.string().required())
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
});

interface CreateThemePreviewHtmlParams {
  theme_colors: Record<string, string>;
  preview_type?: 'website' | 'mobile_app' | 'dashboard' | 'components';
  components?: string[];
  interactive?: boolean;
  responsive?: boolean;
  theme?: 'light' | 'dark' | 'auto';
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
            'Ensure theme_colors is an object with color values',
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
    const processedColors: Record<
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

    // Process each color in the theme
    for (const [colorName, colorValue] of Object.entries(
      validatedParams.theme_colors
    )) {
      if (!colorValue) {
        return {
          success: false,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: `Color value for '${colorName}' is undefined or null`,
            details: { colorName, colorValue },
            suggestions: [
              'Ensure all theme colors have valid color values',
              'Check for undefined or null values in the theme_colors object',
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
              message: `Invalid color format for '${colorName}': ${colorValue}`,
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

        // Calculate accessibility information for text colors
        let accessibility;
        if (colorName.includes('text') || colorName.includes('foreground')) {
          // Find appropriate background color for contrast calculation
          const backgroundColorName = colorName.includes('text')
            ? 'background'
            : 'surface';
          const backgroundColor =
            validatedParams.theme_colors[backgroundColorName] || '#ffffff';

          try {
            const backgroundUnified = new UnifiedColor(backgroundColor);
            const contrastRatio = unifiedColor.getContrastRatio(
              backgroundUnified.hex
            );

            accessibility = {
              contrastRatio,
              wcagAA: contrastRatio >= 4.5,
              wcagAAA: contrastRatio >= 7.0,
            };

            if (!accessibility.wcagAA) {
              accessibilityNotes.push(
                `Color '${colorName}' (${unifiedColor.hex}) may not meet WCAG AA contrast requirements against '${backgroundColorName}'`
              );
            }
          } catch {
            // If background color is invalid, skip accessibility check
          }
        }

        processedColors[colorName] = {
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
            message: `Failed to process color '${colorName}': ${colorValue}`,
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

    // Generate recommendations
    const requiredColors = ['primary', 'background', 'text'];
    const missingColors = requiredColors.filter(
      color => !processedColors[color]
    );
    if (missingColors.length > 0) {
      recommendations.push(
        `Consider adding these essential colors: ${missingColors.join(', ')}`
      );
    }

    if (Object.keys(processedColors).length > 15) {
      recommendations.push(
        'Consider using fewer colors for better theme consistency'
      );
    }

    if (
      validatedParams.preview_type === 'mobile_app' &&
      !processedColors['accent']
    ) {
      recommendations.push(
        'Mobile apps typically benefit from an accent color for interactive elements'
      );
    }

    // Prepare visualization data
    const visualizationData: ThemePreviewVisualizationData = {
      themeColors: processedColors,
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
        description: `${validatedParams.preview_type || 'website'} theme preview with ${Object.keys(processedColors).length} colors`,
        timestamp: new Date().toLocaleString(),
        colorCount: Object.keys(processedColors).length,
        previewType: validatedParams.preview_type || 'website',
      },
    };

    // Generate HTML
    const htmlGenerator = new HTMLGenerator();
    const html = htmlGenerator.generateThemePreviewHTML(visualizationData);

    // Prepare export formats
    const exportFormats: Record<string, string | object> = {};

    exportFormats['css'] = generateThemeCSSExport(processedColors);
    exportFormats['scss'] = generateThemeSCSSExport(processedColors);
    exportFormats['json'] = {
      theme: Object.fromEntries(
        Object.entries(processedColors).map(([name, color]) => [
          name,
          {
            hex: color.hex,
            rgb: color.rgb,
            hsl: color.hsl,
          },
        ])
      ),
      metadata: visualizationData.metadata,
    };

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        preview_type: validatedParams.preview_type || 'website',
        color_count: Object.keys(processedColors).length,
        components: validatedParams.components || [
          'header',
          'content',
          'buttons',
        ],
        interactive: validatedParams.interactive !== false,
        responsive: validatedParams.responsive !== false,
        theme_colors: Object.fromEntries(
          Object.entries(processedColors).map(([name, color]) => [
            name,
            color.hex,
          ])
        ),
        accessibility_compliant: Object.values(processedColors)
          .filter(color => color.accessibility)
          .every(color => color.accessibility?.wcagAA),
      },
      metadata: {
        execution_time: executionTime,
        tool: 'create_theme_preview_html',
        timestamp: new Date().toISOString(),
        color_space_used: 'sRGB',
        accessibility_notes: accessibilityNotes,
        recommendations,
      },
      visualizations: {
        html,
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
        message: `Theme preview error: ${errorMessage}`,
        details: {
          errorMessage,
          errorStack,
          errorType: error?.constructor?.name || 'Unknown',
        },
        suggestions: [
          'Try with fewer theme colors',
          'Verify all colors are in valid formats',
          'Check if the preview type and components are supported',
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

function generateThemeCSSExport(
  colors: Record<
    string,
    { hex: string; rgb: string; hsl: string; name: string }
  >
): string {
  let css = ':root {\n';
  Object.entries(colors).forEach(([name, color]) => {
    const cssName = name.toLowerCase().replace(/\s+/g, '-');
    css += `  --color-${cssName}: ${color.hex.toLowerCase()};\n`;
    css += `  --color-${cssName}-rgb: ${color.rgb};\n`;
    css += `  --color-${cssName}-hsl: ${color.hsl};\n`;
  });
  css += '}';
  return css;
}

function generateThemeSCSSExport(
  colors: Record<
    string,
    { hex: string; rgb: string; hsl: string; name: string }
  >
): string {
  let scss = '// Theme Colors\n';
  Object.entries(colors).forEach(([name, color]) => {
    const scssName = name.toLowerCase().replace(/\s+/g, '-');
    scss += `$color-${scssName}: ${color.hex.toLowerCase()};\n`;
  });

  scss += '\n// Color Map\n';
  scss += '$theme-colors: (\n';
  Object.entries(colors).forEach(([name], index, array) => {
    const scssName = name.toLowerCase().replace(/\s+/g, '-');
    scss += `  "${scssName}": $color-${scssName}`;
    if (index < array.length - 1) scss += ',';
    scss += '\n';
  });
  scss += ');\n';

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
