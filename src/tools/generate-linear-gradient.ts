/**
 * MCP tool for generating linear gradients with precise mathematical control
 */

import { colord, extend, Colord } from 'colord';
import namesPlugin from 'colord/plugins/names';
import Joi from 'joi';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';

// Extend colord with names plugin
extend([namesPlugin]);

interface LinearGradientParams {
  colors: string[];
  positions?: number[];
  angle?: number;
  interpolation?: 'linear' | 'ease' | 'ease_in' | 'ease_out' | 'bezier';
  color_space?: 'rgb' | 'hsl' | 'lab' | 'lch';
  steps?: number;
}

interface LinearGradientData {
  css: string;
  type: 'linear';
  angle: number;
  colors: Array<{
    color: string;
    position: number;
    hex: string;
    rgb: string;
    hsl: string;
  }>;
  interpolation: string;
  color_space: string;
  total_stops: number;
}

const linearGradientSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string())
    .min(2)
    .max(20)
    .required()
    .description('Array of color strings for the gradient'),

  positions: Joi.array()
    .items(Joi.number().min(0).max(100))
    .optional()
    .description(
      'Stop positions (0-100). If not provided, colors are evenly distributed'
    ),

  angle: Joi.number()
    .min(0)
    .max(360)
    .optional()
    .description('Gradient angle in degrees (0-360, default: 90)'),

  interpolation: Joi.string()
    .valid('linear', 'ease', 'ease_in', 'ease_out', 'bezier')
    .default('linear')
    .description('Interpolation method for color transitions'),

  color_space: Joi.string()
    .valid('rgb', 'hsl', 'lab', 'lch')
    .default('rgb')
    .description('Color space for interpolation'),

  steps: Joi.number()
    .integer()
    .min(2)
    .max(100)
    .optional()
    .description(
      'Number of steps for stepped gradients (creates discrete color bands)'
    ),
});

/**
 * Validate and parse colors
 */
function validateColors(
  colors: string[]
): Array<{ color: Colord; original: string }> {
  const validatedColors: Array<{ color: Colord; original: string }> = [];
  const invalidColors: string[] = [];

  colors.forEach((colorStr, index) => {
    try {
      const color = colord(colorStr);
      if (!color.isValid()) {
        invalidColors.push(`${colorStr} at index ${index}`);
      } else {
        validatedColors.push({ color, original: colorStr });
      }
    } catch {
      invalidColors.push(`${colorStr} at index ${index}`);
    }
  });

  if (invalidColors.length > 0) {
    throw new Error(`Invalid colors found: ${invalidColors.join(', ')}`);
  }

  return validatedColors;
}

/**
 * Calculate positions for colors if not provided
 */
function calculatePositions(
  colorCount: number,
  positions?: number[]
): number[] {
  if (positions) {
    if (positions.length !== colorCount) {
      throw new Error(
        `Position count (${positions.length}) must match color count (${colorCount})`
      );
    }
    // Validate positions are in ascending order
    for (let i = 1; i < positions.length; i++) {
      const current = positions[i];
      const previous = positions[i - 1];
      if (
        current !== undefined &&
        previous !== undefined &&
        current <= previous
      ) {
        throw new Error('Positions must be in ascending order');
      }
    }
    return positions;
  }

  // Evenly distribute colors
  if (colorCount === 1) return [50];
  if (colorCount === 2) return [0, 100];

  const step = 100 / (colorCount - 1);
  return Array.from(
    { length: colorCount },
    (_, i) => Math.round(i * step * 100) / 100
  );
}

/**
 * Apply interpolation easing to positions
 */
function applyInterpolation(
  positions: number[],
  interpolation: string
): number[] {
  if (interpolation === 'linear') {
    return positions;
  }

  return positions.map((pos, index) => {
    if (index === 0 || index === positions.length - 1) {
      return pos; // Keep first and last positions unchanged
    }

    const normalizedPos = pos / 100;
    let easedPos: number;

    switch (interpolation) {
      case 'ease':
        easedPos =
          0.25 * Math.sin(normalizedPos * Math.PI - Math.PI / 2) +
          0.25 * normalizedPos +
          0.5;
        break;
      case 'ease_in':
        easedPos = normalizedPos * normalizedPos;
        break;
      case 'ease_out':
        easedPos = 1 - (1 - normalizedPos) * (1 - normalizedPos);
        break;
      case 'bezier':
        // Cubic bezier approximation (0.25, 0.1, 0.25, 1)
        easedPos = normalizedPos * normalizedPos * (3 - 2 * normalizedPos);
        break;
      default:
        easedPos = normalizedPos;
    }

    return Math.round(easedPos * 100 * 100) / 100;
  });
}

/**
 * Generate stepped gradient positions
 */
function generateSteppedPositions(
  colors: string[],
  steps: number
): Array<{ color: string; position: number }> {
  const steppedColors: Array<{ color: string; position: number }> = [];
  const stepSize = 100 / steps;

  for (let i = 0; i < steps; i++) {
    const colorIndex = Math.floor((i / (steps - 1)) * (colors.length - 1));
    const position = i * stepSize;
    const selectedColor = colors[Math.min(colorIndex, colors.length - 1)];
    if (selectedColor) {
      steppedColors.push({
        color: selectedColor,
        position: Math.round(position * 100) / 100,
      });
    }
  }

  return steppedColors;
}

/**
 * Generate CSS linear gradient string
 */
function generateLinearGradientCSS(
  colors: Array<{ color: Colord; original: string }>,
  positions: number[],
  angle: number,
  steps?: number
): string {
  let cssStops: string[];

  if (steps) {
    // Generate stepped gradient
    const steppedColors = generateSteppedPositions(
      colors.map(c => c.color.toHex()),
      steps
    );
    cssStops = steppedColors.map(
      ({ color, position }) => `${color} ${position}%`
    );
  } else {
    // Generate smooth gradient
    cssStops = colors.map((colorObj, index) => {
      const color = colorObj.color.toHex();
      const position = positions[index];
      return `${color} ${position}%`;
    });
  }

  return `linear-gradient(${angle}deg, ${cssStops.join(', ')})`;
}

/**
 * Generate browser-compatible CSS with fallbacks
 */
// function generateCompatibleCSS(baseCSS: string): string {
//   const fallbacks = [
//     `background: ${baseCSS};`,
//     `background: -webkit-${baseCSS};`,
//     `background: -moz-${baseCSS};`,
//     `background: -o-${baseCSS};`,
//   ];

//   return fallbacks.join('\n');
// }

/**
 * Generate linear gradient
 */
async function generateLinearGradient(
  params: LinearGradientParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = linearGradientSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'generate_linear_gradient',
        'INVALID_PARAMETERS',
        `Invalid parameters: ${error.details.map(d => d.message).join(', ')}`,
        startTime,
        {
          details: error.details,
          suggestions: [
            'Ensure colors array has 2-20 valid color strings',
            'Check that positions (if provided) match color count and are in ascending order',
            'Verify angle is between 0-360 degrees',
            'Use supported interpolation methods: linear, ease, ease_in, ease_out, bezier',
          ],
        }
      );
    }

    const validatedParams = value as LinearGradientParams;

    // Validate colors
    const validatedColors = validateColors(validatedParams.colors);

    // Calculate positions
    const positions = calculatePositions(
      validatedColors.length,
      validatedParams.positions
    );

    // Apply interpolation
    const interpolatedPositions = applyInterpolation(
      positions,
      validatedParams.interpolation || 'linear'
    );

    // Generate CSS
    const angle =
      validatedParams.angle !== undefined ? validatedParams.angle : 90;
    const css = generateLinearGradientCSS(
      validatedColors,
      interpolatedPositions,
      angle,
      validatedParams.steps
    );

    // Prepare response data
    const colorData = validatedColors.map((colorObj, index) => ({
      color: colorObj.original,
      position: interpolatedPositions[index] || 0,
      hex: colorObj.color.toHex(),
      rgb: colorObj.color.toRgbString(),
      hsl: colorObj.color.toHslString(),
    }));

    const data: LinearGradientData = {
      css,
      type: 'linear',
      angle,
      colors: colorData,
      interpolation: validatedParams.interpolation || 'linear',
      color_space: validatedParams.color_space || 'rgb',
      total_stops: validatedParams.steps || validatedColors.length,
    };

    const executionTime = Date.now() - startTime;

    // Generate recommendations
    const recommendations: string[] = [];
    if (validatedColors.length > 5) {
      recommendations.push(
        'Consider using fewer colors for better performance'
      );
    }
    if (angle % 45 !== 0) {
      recommendations.push(
        'Consider using multiples of 45° for common gradient angles'
      );
    }
    if (validatedParams.steps && validatedParams.steps > 20) {
      recommendations.push(
        'High step counts may impact performance on older devices'
      );
    }

    return createSuccessResponse(
      'generate_linear_gradient',
      data,
      executionTime,
      {
        colorSpaceUsed: validatedParams.color_space || 'rgb',
        accessibilityNotes: [
          'Ensure sufficient contrast between gradient colors and any overlaid text',
          'Test gradient visibility with color vision deficiency simulators',
        ],
        recommendations,
        exportFormats: {
          css: css,
          scss: `$gradient: ${css};`,
          json: {
            type: 'linear',
            angle: validatedParams.angle || 90,
            colors: colorData,
            css: css,
          },
        },
      }
    );
  } catch (error) {
    logger.error('Error generating linear gradient', { error: error as Error });
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return createErrorResponse(
      'generate_linear_gradient',
      'GRADIENT_GENERATION_ERROR',
      errorMessage,
      startTime,
      {
        details: { error: errorMessage },
        suggestions: [
          'Check that all colors are in valid formats (hex, rgb, hsl, named)',
          'Ensure positions array matches color count if provided',
          'Verify all parameters are within valid ranges',
        ],
      }
    );
  }
}

export const generateLinearGradientTool: ToolHandler = {
  name: 'generate_linear_gradient',
  description:
    'Generate linear gradients with precise mathematical control and CSS output',
  parameters: {
    type: 'object',
    properties: {
      colors: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 20,
        description: 'Array of color strings for the gradient',
      },
      positions: {
        type: 'array',
        items: { type: 'number', minimum: 0, maximum: 100 },
        description:
          'Stop positions (0-100). If not provided, colors are evenly distributed',
      },
      angle: {
        type: 'number',
        minimum: 0,
        maximum: 360,
        default: 90,
        description: 'Gradient angle in degrees (0-360, default: 90)',
      },
      interpolation: {
        type: 'string',
        enum: ['linear', 'ease', 'ease_in', 'ease_out', 'bezier'],
        default: 'linear',
        description: 'Interpolation method for color transitions',
      },
      color_space: {
        type: 'string',
        enum: ['rgb', 'hsl', 'lab', 'lch'],
        default: 'rgb',
        description: 'Color space for interpolation',
      },
      steps: {
        type: 'number',
        minimum: 2,
        maximum: 100,
        description:
          'Number of steps for stepped gradients (creates discrete color bands)',
      },
    },
    required: ['colors'],
  },
  handler: async (params: unknown) =>
    generateLinearGradient(params as LinearGradientParams),
};
