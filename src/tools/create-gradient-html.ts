/**
 * MCP tool for creating gradient preview HTML visualizations with CSS code display
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { GradientVisualizationData } from '../visualization/html-generator';
import {
  enhancedHTMLGenerator,
  EnhancedVisualizationResult,
  EnhancedHTMLOptions,
} from '../visualization/enhanced-html-generator';
import { enhancedFileOutputManager } from '../utils/enhanced-file-output-manager';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Parameter validation schema
const createGradientHtmlSchema = Joi.object({
  gradient_css: Joi.string().required().description('CSS gradient definition'),

  preview_shapes: Joi.array()
    .items(Joi.string().valid('rectangle', 'circle', 'text', 'button', 'card'))
    .default(['rectangle'])
    .description('Preview shapes to show'),

  size: Joi.array()
    .items(Joi.number().integer().min(100).max(2000))
    .length(2)
    .default([400, 300])
    .description('Preview size [width, height]'),

  show_css_code: Joi.boolean().default(true).description('Display CSS code'),

  interactive_controls: Joi.boolean()
    .default(false)
    .description('Enable interactive controls'),

  variations: Joi.boolean()
    .default(false)
    .description('Show angle/position variations'),

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

interface CreateGradientHtmlParams {
  gradient_css: string;
  preview_shapes?: string[];
  size?: [number, number];
  show_css_code?: boolean;
  interactive_controls?: boolean;
  variations?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  enable_background_controls?: boolean;
  enable_accessibility_testing?: boolean;
  include_keyboard_help?: boolean;
}

async function createGradientHtml(
  params: CreateGradientHtmlParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = createGradientHtmlSchema.validate(params);
    if (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid parameters provided',
          details: error.details,
          suggestions: [
            'Ensure gradient_css is a valid CSS gradient string',
            'Check that preview_shapes contains valid shape names',
            'Verify size is an array of two numbers [width, height]',
          ],
        },
        metadata: {
          execution_time: Date.now() - startTime,
          tool: 'create_gradient_html',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const validatedParams = value as CreateGradientHtmlParams;

    // Validate CSS gradient syntax
    const gradientValidation = validateGradientCSS(
      validatedParams.gradient_css
    );
    if (!gradientValidation.isValid) {
      return {
        success: false,
        error: {
          code: 'INVALID_GRADIENT_CSS',
          message: 'Invalid CSS gradient syntax',
          details: {
            gradient: validatedParams.gradient_css,
            reason: gradientValidation.error,
          },
          suggestions: [
            'Use valid CSS gradient syntax like "linear-gradient(45deg, #ff0000, #0000ff)"',
            'Check for proper color format in gradient stops',
            'Ensure gradient type is supported (linear-gradient, radial-gradient, conic-gradient)',
          ],
        },
        metadata: {
          execution_time: Date.now() - startTime,
          tool: 'create_gradient_html',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const accessibilityNotes: string[] = [];
    const recommendations: string[] = [];

    // Analyze gradient for accessibility and recommendations
    const gradientAnalysis = analyzeGradient(validatedParams.gradient_css);

    if (gradientAnalysis.colorCount > 5) {
      recommendations.push(
        'Consider using fewer colors for smoother gradient transitions'
      );
    }

    if (gradientAnalysis.hasLowContrast) {
      accessibilityNotes.push(
        'Some color combinations in the gradient may have low contrast'
      );
    }

    if (
      validatedParams.preview_shapes &&
      validatedParams.preview_shapes.length > 4
    ) {
      recommendations.push(
        'Consider using fewer preview shapes for better performance'
      );
    }

    // Determine gradient type for metadata
    const gradientType = determineGradientType(validatedParams.gradient_css);

    // Prepare visualization data
    const visualizationData: GradientVisualizationData = {
      gradientCSS: validatedParams.gradient_css,
      previewShapes: validatedParams.preview_shapes || ['rectangle'],
      size: validatedParams.size || [400, 300],
      showCSSCode: validatedParams.show_css_code !== false,
      interactiveControls: validatedParams.interactive_controls || false,
      variations: validatedParams.variations || false,
      metadata: {
        title: 'Gradient Preview',
        description: `${gradientType} gradient with ${gradientAnalysis.colorCount} colors`,
        timestamp: new Date().toLocaleString(),
        gradientType,
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

      result = await enhancedHTMLGenerator.generateEnhancedGradientHTML(
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

    exportFormats['css'] = generateGradientCSSExport(
      validatedParams.gradient_css,
      gradientType
    );
    exportFormats['scss'] = generateGradientSCSSExport(
      validatedParams.gradient_css,
      gradientType
    );
    exportFormats['json'] = {
      gradient_css: validatedParams.gradient_css,
      gradient_type: gradientType,
      color_count: gradientAnalysis.colorCount,
      preview_shapes: validatedParams.preview_shapes,
      size: validatedParams.size,
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
              toolName: 'create_gradient_html',
              description: `Enhanced gradient visualization (${gradientType})`,
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
        gradient_css: validatedParams.gradient_css,
        gradient_type: gradientType,
        color_count: gradientAnalysis.colorCount,
        preview_shapes: validatedParams.preview_shapes || ['rectangle'],
        size: validatedParams.size || [400, 300],
        has_interactive_controls: validatedParams.interactive_controls || false,
        file_path: result.filePath,
        file_name: result.fileName,
        file_size: result.fileSize,
        background_controls_enabled: result.backgroundControlsEnabled,
        accessibility_features: result.accessibilityFeatures,
      },
      metadata: {
        execution_time: executionTime,
        tool: 'create_gradient_html',
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
        message: `Gradient HTML generation error: ${errorMessage}`,
        details: {
          errorMessage,
          errorStack,
          errorType: error?.constructor?.name || 'Unknown',
        },
        suggestions: [
          'Verify the CSS gradient syntax is correct',
          'Try with simpler gradient definitions',
          'Check if all colors in the gradient are valid',
        ],
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'create_gradient_html',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function validateGradientCSS(gradientCSS: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    // Basic validation for CSS gradient syntax
    const trimmed = gradientCSS.trim();

    // Check for basic gradient function patterns
    const gradientPatterns = [
      /^linear-gradient\s*\(/i,
      /^radial-gradient\s*\(/i,
      /^conic-gradient\s*\(/i,
      /^repeating-linear-gradient\s*\(/i,
      /^repeating-radial-gradient\s*\(/i,
    ];

    const hasValidPattern = gradientPatterns.some(pattern =>
      pattern.test(trimmed)
    );

    if (!hasValidPattern) {
      return {
        isValid: false,
        error:
          'CSS must start with a valid gradient function (linear-gradient, radial-gradient, etc.)',
      };
    }

    // Check for balanced parentheses
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      return {
        isValid: false,
        error: 'Unbalanced parentheses in CSS gradient',
      };
    }

    // Check for at least two colors (basic requirement for gradients)
    const colorMatches = trimmed.match(/#[0-9a-f]{3,6}|rgb\(|hsl\(|[a-z]+/gi);
    if (!colorMatches || colorMatches.length < 2) {
      return {
        isValid: false,
        error: 'Gradient must contain at least two colors',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `CSS validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function analyzeGradient(gradientCSS: string): {
  colorCount: number;
  hasLowContrast: boolean;
  colors: string[];
} {
  // Extract colors from gradient CSS
  const colorMatches =
    gradientCSS.match(
      /#[0-9a-f]{3,6}|rgb\([^)]+\)|hsl\([^)]+\)|rgba\([^)]+\)|hsla\([^)]+\)/gi
    ) || [];

  // Simple contrast analysis (basic implementation)
  const hasLowContrast =
    colorMatches.length > 1 &&
    colorMatches.some((color, index) => {
      if (index === 0) return false;
      const prevColor = colorMatches[index - 1];
      // This is a simplified check - in a real implementation,
      // you'd calculate actual contrast ratios
      return prevColor && color.toLowerCase() === prevColor.toLowerCase();
    });

  return {
    colorCount: colorMatches.length,
    hasLowContrast,
    colors: colorMatches,
  };
}

function determineGradientType(gradientCSS: string): string {
  const trimmed = gradientCSS.trim().toLowerCase();

  if (trimmed.startsWith('linear-gradient')) return 'linear';
  if (trimmed.startsWith('radial-gradient')) return 'radial';
  if (trimmed.startsWith('conic-gradient')) return 'conic';
  if (trimmed.startsWith('repeating-linear-gradient'))
    return 'repeating-linear';
  if (trimmed.startsWith('repeating-radial-gradient'))
    return 'repeating-radial';

  return 'unknown';
}

function generateGradientCSSExport(
  gradientCSS: string,
  gradientType: string
): string {
  return `.gradient-${gradientType} {
  background: ${gradientCSS};
}

.gradient-fallback {
  background: ${gradientCSS};
  /* Fallback for older browsers */
  background: -webkit-${gradientCSS};
  background: -moz-${gradientCSS};
  background: -o-${gradientCSS};
}`;
}

function generateGradientSCSSExport(
  gradientCSS: string,
  gradientType: string
): string {
  return `$gradient-${gradientType}: ${gradientCSS};

@mixin gradient-${gradientType}() {
  background: $gradient-${gradientType};
  background: -webkit-#{$gradient-${gradientType}};
  background: -moz-#{$gradient-${gradientType}};
  background: -o-#{$gradient-${gradientType}};
}

.gradient-${gradientType} {
  @include gradient-${gradientType}();
}`;
}

export const createGradientHtmlTool: ToolHandler = {
  name: 'create_gradient_html',
  description:
    'Generate HTML gradient preview visualizations with CSS code display and interactive controls',
  parameters: createGradientHtmlSchema.describe(),
  handler: async (params: unknown) =>
    createGradientHtml(params as CreateGradientHtmlParams),
};
