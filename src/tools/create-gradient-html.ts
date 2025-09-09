/**
 * MCP tool for creating HTML gradient visualizations
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import {
  HTMLGenerator,
  GradientVisualizationData,
} from '../visualization/html-generator';
import * as Joi from 'joi';

// Parameter validation schema
const createGradientHtmlSchema = Joi.object({
  gradient_css: Joi.string()
    .required()
    .allow('')
    .description('CSS gradient definition'),

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
});

interface CreateGradientHtmlParams {
  gradient_css: string;
  preview_shapes?: string[];
  size?: [number, number];
  show_css_code?: boolean;
  interactive_controls?: boolean;
  variations?: boolean;
  theme?: 'light' | 'dark' | 'auto';
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
            'Verify size dimensions are between 100 and 2000 pixels',
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

    // Validate CSS gradient format
    const gradientCSS = validatedParams.gradient_css.trim();
    if (!gradientCSS || !isValidGradientCSS(gradientCSS)) {
      return {
        success: false,
        error: {
          code: 'INVALID_GRADIENT_CSS',
          message: 'Invalid CSS gradient format provided',
          details: { gradient_css: gradientCSS },
          suggestions: [
            'Use linear-gradient() format: linear-gradient(45deg, #ff0000, #0000ff)',
            'Use radial-gradient() format: radial-gradient(circle, #ff0000, #0000ff)',
            'Use conic-gradient() format: conic-gradient(#ff0000, #0000ff)',
            'Check CSS gradient syntax documentation',
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

    // Analyze gradient for recommendations
    const gradientType = getGradientType(gradientCSS);

    if (
      validatedParams.preview_shapes &&
      validatedParams.preview_shapes.length > 4
    ) {
      recommendations.push(
        'Consider using fewer preview shapes for better performance'
      );
    }

    if (validatedParams.interactive_controls && gradientType !== 'linear') {
      recommendations.push(
        'Interactive controls work best with linear gradients'
      );
    }

    if (gradientType === 'conic' || gradientType === 'radial') {
      accessibilityNotes.push(
        'Complex gradients may not be visible to users with certain visual impairments'
      );
    }

    // Prepare visualization data
    const visualizationData: GradientVisualizationData = {
      gradientCSS,
      previewShapes: validatedParams.preview_shapes || ['rectangle'],
      size: validatedParams.size || [400, 300],
      showCSSCode: validatedParams.show_css_code !== false,
      interactiveControls: validatedParams.interactive_controls || false,
      variations: validatedParams.variations || false,
      metadata: {
        title: 'Gradient Preview',
        description: `${gradientType} gradient visualization with ${validatedParams.preview_shapes?.length || 1} preview shapes`,
        timestamp: new Date().toLocaleString(),
        gradientType,
      },
    };

    // Generate HTML
    const htmlGenerator = new HTMLGenerator();
    const html = htmlGenerator.generateGradientHTML(visualizationData);

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        gradient_type: gradientType,
        preview_shapes: validatedParams.preview_shapes || ['rectangle'],
        size: validatedParams.size || [400, 300],
        interactive: validatedParams.interactive_controls || false,
        css_code: gradientCSS,
      },
      metadata: {
        execution_time: executionTime,
        tool: 'create_gradient_html',
        timestamp: new Date().toISOString(),
        color_space_used: 'sRGB',
        accessibility_notes: accessibilityNotes,
        recommendations,
      },
      visualizations: {
        html,
      },
      export_formats: {
        css: gradientCSS,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          'An unexpected error occurred while generating the gradient visualization',
        details: error,
        suggestions: [
          'Try with a simpler gradient definition',
          'Verify the CSS gradient syntax',
          'Check if the preview shapes are supported',
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

function isValidGradientCSS(css: string): boolean {
  // Basic validation for CSS gradient formats
  const gradientPatterns = [
    /^linear-gradient\s*\(/i,
    /^radial-gradient\s*\(/i,
    /^conic-gradient\s*\(/i,
    /^repeating-linear-gradient\s*\(/i,
    /^repeating-radial-gradient\s*\(/i,
    /^repeating-conic-gradient\s*\(/i,
  ];

  return gradientPatterns.some(pattern => pattern.test(css.trim()));
}

function getGradientType(css: string): string {
  const lowerCSS = css.toLowerCase().trim();

  if (lowerCSS.startsWith('linear-gradient')) return 'linear';
  if (lowerCSS.startsWith('radial-gradient')) return 'radial';
  if (lowerCSS.startsWith('conic-gradient')) return 'conic';
  if (lowerCSS.startsWith('repeating-linear-gradient'))
    return 'repeating-linear';
  if (lowerCSS.startsWith('repeating-radial-gradient'))
    return 'repeating-radial';
  if (lowerCSS.startsWith('repeating-conic-gradient')) return 'repeating-conic';

  return 'unknown';
}

export const createGradientHtmlTool: ToolHandler = {
  name: 'create_gradient_html',
  description:
    'Generate HTML gradient preview visualizations with CSS code display and interactive controls',
  parameters: createGradientHtmlSchema.describe(),
  handler: async (params: unknown) =>
    createGradientHtml(params as CreateGradientHtmlParams),
};
