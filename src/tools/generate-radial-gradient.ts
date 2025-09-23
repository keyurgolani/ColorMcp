/**
 * MCP tool for generating radial gradients with precise mathematical control
 */

import { colord, extend, Colord } from 'colord';
import namesPlugin from 'colord/plugins/names';
import Joi from 'joi';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';

// Extend colord with names plugin
extend([namesPlugin]);

interface RadialGradientParams {
  colors: string[];
  positions?: number[];
  center?: [number, number];
  shape?: 'circle' | 'ellipse';
  size?:
    | 'closest_side'
    | 'closest_corner'
    | 'farthest_side'
    | 'farthest_corner'
    | 'explicit';
  dimensions?: [number, number];
  interpolation?: 'linear' | 'ease' | 'ease_in' | 'ease_out' | 'bezier';
  color_space?: 'rgb' | 'hsl' | 'lab' | 'lch';
  steps?: number;
}

interface RadialGradientData {
  css: string;
  type: 'radial';
  center: [number, number];
  shape: string;
  size: string;
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

const radialGradientSchema = Joi.object({
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

  center: Joi.array()
    .items(Joi.number().min(0).max(100))
    .length(2)
    .default([50, 50])
    .description(
      'Center point [x, y] as percentages (0-100, default: [50, 50])'
    ),

  shape: Joi.string()
    .valid('circle', 'ellipse')
    .default('circle')
    .description('Gradient shape'),

  size: Joi.string()
    .valid(
      'closest_side',
      'closest_corner',
      'farthest_side',
      'farthest_corner',
      'explicit'
    )
    .default('farthest_corner')
    .description('Gradient size method'),

  dimensions: Joi.array()
    .items(Joi.number().min(1).max(10000))
    .length(2)
    .when('size', {
      is: 'explicit',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('[width, height] dimensions when size is explicit'),

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
 * Generate size specification for CSS
 */
function generateSizeSpec(
  size: string,
  shape: string,
  dimensions?: [number, number]
): string {
  if (size === 'explicit' && dimensions) {
    const [width, height] = dimensions;
    if (shape === 'circle') {
      // For circles, use the smaller dimension as radius
      const radius = Math.min(width, height) / 2;
      return `${radius}px`;
    } else {
      // For ellipses, use both dimensions
      return `${width / 2}px ${height / 2}px`;
    }
  }

  // Use CSS keywords for other size types
  return size.replace('_', '-');
}

/**
 * Generate CSS radial gradient string
 */
function generateRadialGradientCSS(
  colors: Array<{ color: Colord; original: string }>,
  positions: number[],
  center: [number, number],
  shape: string,
  size: string,
  dimensions?: [number, number],
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

  // Build gradient specification
  const sizeSpec = generateSizeSpec(size, shape, dimensions);
  const centerSpec = `${center[0]}% ${center[1]}%`;

  let gradientSpec = '';

  if (shape === 'circle') {
    if (size === 'explicit') {
      gradientSpec = `circle ${sizeSpec} at ${centerSpec}`;
    } else {
      gradientSpec = `circle ${sizeSpec} at ${centerSpec}`;
    }
  } else {
    if (size === 'explicit') {
      gradientSpec = `ellipse ${sizeSpec} at ${centerSpec}`;
    } else {
      gradientSpec = `ellipse ${sizeSpec} at ${centerSpec}`;
    }
  }

  return `radial-gradient(${gradientSpec}, ${cssStops.join(', ')})`;
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
 * Generate radial gradient
 */
async function generateRadialGradient(
  params: RadialGradientParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = radialGradientSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'generate_radial_gradient',
        'INVALID_PARAMETERS',
        `Invalid parameters: ${error.details.map(d => d.message).join(', ')}`,
        startTime,
        {
          details: error.details,
          suggestions: [
            'Ensure colors array has 2-20 valid color strings',
            'Check that positions (if provided) match color count and are in ascending order',
            'Verify center coordinates are between 0-100',
            'Use supported shape: circle or ellipse',
            'Provide dimensions when size is explicit',
          ],
        }
      );
    }

    const validatedParams = value as RadialGradientParams;

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
    const css = generateRadialGradientCSS(
      validatedColors,
      interpolatedPositions,
      validatedParams.center || [50, 50],
      validatedParams.shape || 'circle',
      validatedParams.size || 'farthest_corner',
      validatedParams.dimensions,
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

    const data: RadialGradientData = {
      css,
      type: 'radial',
      center: validatedParams.center || [50, 50],
      shape: validatedParams.shape || 'circle',
      size: validatedParams.size || 'farthest_corner',
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
    if (
      validatedParams.center &&
      (validatedParams.center[0] !== 50 || validatedParams.center[1] !== 50)
    ) {
      recommendations.push(
        'Off-center gradients can create interesting visual effects'
      );
    }
    if (validatedParams.steps && validatedParams.steps > 20) {
      recommendations.push(
        'High step counts may impact performance on older devices'
      );
    }
    if (
      validatedParams.shape === 'ellipse' &&
      validatedParams.size === 'explicit'
    ) {
      recommendations.push(
        'Elliptical gradients with explicit dimensions work well for specific aspect ratios'
      );
    }

    return createSuccessResponse(
      'generate_radial_gradient',
      data,
      executionTime,
      {
        colorSpaceUsed: validatedParams.color_space || 'rgb',
        accessibilityNotes: [
          'Ensure sufficient contrast between gradient colors and any overlaid text',
          'Test gradient visibility with color vision deficiency simulators',
          'Radial gradients can create focus points - use carefully for accessibility',
        ],
        recommendations,
        exportFormats: {
          css: css,
          scss: `$gradient: ${css};`,
          json: {
            type: 'radial',
            center: validatedParams.center || [50, 50],
            shape: validatedParams.shape || 'circle',
            size: validatedParams.size || 'farthest_corner',
            colors: colorData,
            css: css,
          },
        },
      }
    );
  } catch (error) {
    logger.error('Error generating radial gradient', { error: error as Error });
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return createErrorResponse(
      'generate_radial_gradient',
      'GRADIENT_GENERATION_ERROR',
      errorMessage,
      startTime,
      {
        details: { error: errorMessage },
        suggestions: [
          'Check that all colors are in valid formats (hex, rgb, hsl, named)',
          'Ensure positions array matches color count if provided',
          'Verify all parameters are within valid ranges',
          'Provide dimensions when using explicit size',
        ],
      }
    );
  }
}

export const generateRadialGradientTool: ToolHandler = {
  name: 'generate_radial_gradient',
  description:
    'Generate radial gradients with precise mathematical control and CSS output',
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
      center: {
        type: 'array',
        items: { type: 'number', minimum: 0, maximum: 100 },
        minItems: 2,
        maxItems: 2,
        default: [50, 50],
        description:
          'Center point [x, y] as percentages (0-100, default: [50, 50])',
      },
      shape: {
        type: 'string',
        enum: ['circle', 'ellipse'],
        default: 'circle',
        description: 'Gradient shape',
      },
      size: {
        type: 'string',
        enum: [
          'closest_side',
          'closest_corner',
          'farthest_side',
          'farthest_corner',
          'explicit',
        ],
        default: 'farthest_corner',
        description: 'Gradient size method',
      },
      dimensions: {
        type: 'array',
        items: { type: 'number', minimum: 1, maximum: 10000 },
        minItems: 2,
        maxItems: 2,
        description: '[width, height] dimensions when size is explicit',
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
    generateRadialGradient(params as RadialGradientParams),
};
