/**
 * Simulate Colorblindness MCP Tool
 * Simulate how colors appear to users with color vision deficiencies
 */

import { UnifiedColor } from '../color/unified-color';
import { ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { validateColorInput } from '../validation/schemas';

export interface SimulateColorblindnessParams {
  colors: string[];
  type:
    | 'protanopia'
    | 'deuteranopia'
    | 'tritanopia'
    | 'protanomaly'
    | 'deuteranomaly'
    | 'tritanomaly'
    | 'monochromacy';
  severity?: number; // 0-100, default 100
}

export interface ColorblindSimulationResult {
  original_color: string;
  simulated_color: string;
  difference_score: number; // How different the simulated color is from original (0-100)
  accessibility_impact: 'none' | 'minimal' | 'moderate' | 'severe';
}

export interface SimulateColorblindnessResponse {
  deficiency_type: string;
  severity: number;
  results: ColorblindSimulationResult[];
  summary: {
    total_colors: number;
    colors_affected: number;
    average_difference: number;
    accessibility_concerns: string[];
  };
  recommendations: string[];
}

/**
 * Color vision deficiency transformation matrices
 * Based on Brettel, Viénot and Mollon JOSA 1997
 */
const CVD_MATRICES = {
  // Protanopia (missing L-cones, red-blind)
  protanopia: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0, 0.242, 0.758],
  ],

  // Deuteranopia (missing M-cones, green-blind)
  deuteranopia: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],

  // Tritanopia (missing S-cones, blue-blind)
  tritanopia: [
    [0.95, 0.05, 0.0],
    [0.0, 0.433, 0.567],
    [0.0, 0.475, 0.525],
  ],
};

/**
 * Simulate colorblindness for an array of colors
 */
export async function simulateColorblindness(
  params: SimulateColorblindnessParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate required parameters
    if (
      !params.colors ||
      !Array.isArray(params.colors) ||
      params.colors.length === 0
    ) {
      return createErrorResponse(
        'simulate_colorblindness',
        'MISSING_COLORS',
        'Colors array parameter is required and must not be empty',
        Date.now() - startTime,
        {
          details: { provided: params.colors },
          suggestions: ['Provide an array of colors in any supported format'],
        }
      );
    }

    if (!params.type) {
      return createErrorResponse(
        'simulate_colorblindness',
        'MISSING_TYPE',
        'Deficiency type parameter is required',
        Date.now() - startTime,
        {
          details: {
            supportedTypes: [
              'protanopia',
              'deuteranopia',
              'tritanopia',
              'protanomaly',
              'deuteranomaly',
              'tritanomaly',
              'monochromacy',
            ],
          },
          suggestions: ['Specify a color vision deficiency type'],
        }
      );
    }

    // Validate deficiency type
    const validTypes = [
      'protanopia',
      'deuteranopia',
      'tritanopia',
      'protanomaly',
      'deuteranomaly',
      'tritanomaly',
      'monochromacy',
    ];
    if (!validTypes.includes(params.type)) {
      return createErrorResponse(
        'simulate_colorblindness',
        'INVALID_DEFICIENCY_TYPE',
        `Invalid deficiency type: ${params.type}`,
        Date.now() - startTime,
        {
          details: { provided: params.type, supported: validTypes },
          suggestions: ['Use one of the supported deficiency types'],
        }
      );
    }

    // Validate severity
    const severity = params.severity ?? 100;
    if (severity < 0 || severity > 100) {
      return createErrorResponse(
        'simulate_colorblindness',
        'INVALID_SEVERITY',
        'Severity must be between 0 and 100',
        Date.now() - startTime,
        {
          details: { provided: severity },
          suggestions: [
            'Use a severity value between 0 (no effect) and 100 (full effect)',
          ],
        }
      );
    }

    // Validate all color inputs
    const validatedColors: UnifiedColor[] = [];
    for (let i = 0; i < params.colors.length; i++) {
      const colorInput = params.colors[i];
      if (!colorInput) {
        return createErrorResponse(
          'simulate_colorblindness',
          'INVALID_COLOR_FORMAT',
          `Color at index ${i} is undefined or null`,
          Date.now() - startTime,
          {
            details: { index: i, provided: colorInput },
            suggestions: ['Ensure all colors in the array are valid strings'],
          }
        );
      }

      const validation = validateColorInput(colorInput);

      if (!validation.isValid) {
        return createErrorResponse(
          'simulate_colorblindness',
          'INVALID_COLOR_FORMAT',
          `Invalid color format at index ${i}: ${colorInput}`,
          Date.now() - startTime,
          {
            details: {
              index: i,
              provided: colorInput,
              error: validation.error,
            },
            suggestions: [
              'Use valid color formats like #FF0000 or rgb(255, 0, 0)',
            ],
          }
        );
      }

      try {
        validatedColors.push(new UnifiedColor(colorInput));
      } catch (error) {
        return createErrorResponse(
          'simulate_colorblindness',
          'COLOR_PARSING_ERROR',
          `Failed to parse color at index ${i}: ${colorInput}`,
          Date.now() - startTime,
          {
            details: {
              index: i,
              provided: colorInput,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            suggestions: ['Check the color format and try again'],
          }
        );
      }
    }

    // Simulate colorblindness for each color
    const results: ColorblindSimulationResult[] = [];
    let totalDifference = 0;
    let colorsAffected = 0;

    for (let i = 0; i < validatedColors.length; i++) {
      const originalColor = validatedColors[i];
      const originalColorString = params.colors[i];

      if (!originalColor || !originalColorString) {
        continue; // Skip invalid entries
      }

      const simulatedColor = simulateColorVisionDeficiency(
        originalColor,
        params.type,
        severity
      );

      // Calculate difference between original and simulated colors
      const differenceScore = calculateColorDifference(
        originalColor,
        simulatedColor
      );

      // Determine accessibility impact
      let accessibilityImpact: ColorblindSimulationResult['accessibility_impact'];
      if (differenceScore < 5) {
        accessibilityImpact = 'none';
      } else if (differenceScore < 15) {
        accessibilityImpact = 'minimal';
      } else if (differenceScore < 30) {
        accessibilityImpact = 'moderate';
      } else {
        accessibilityImpact = 'severe';
      }

      if (differenceScore > 5) {
        colorsAffected++;
      }

      totalDifference += differenceScore;

      results.push({
        original_color: originalColorString,
        simulated_color: simulatedColor.hex,
        difference_score: Math.round(differenceScore * 100) / 100,
        accessibility_impact: accessibilityImpact,
      });
    }

    // Generate summary
    const averageDifference = totalDifference / validatedColors.length;
    const accessibilityConcerns: string[] = [];

    if (colorsAffected > 0) {
      accessibilityConcerns.push(
        `${colorsAffected} out of ${validatedColors.length} colors are significantly affected`
      );
    }

    if (averageDifference > 20) {
      accessibilityConcerns.push('High overall color distortion detected');
    }

    if (params.type.includes('anomaly') && severity > 50) {
      accessibilityConcerns.push(
        'Moderate to severe color vision anomaly simulation'
      );
    }

    // Generate recommendations
    const recommendations = generateRecommendations(
      params.type,
      results,
      averageDifference
    );

    const responseData: SimulateColorblindnessResponse = {
      deficiency_type: params.type,
      severity,
      results,
      summary: {
        total_colors: validatedColors.length,
        colors_affected: colorsAffected,
        average_difference: Math.round(averageDifference * 100) / 100,
        accessibility_concerns: accessibilityConcerns,
      },
      recommendations,
    };

    const executionTime = Date.now() - startTime;

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    if (colorsAffected > 0) {
      accessibilityNotes.push(
        `${colorsAffected} colors show significant changes for ${params.type} users`
      );
    }
    if (averageDifference > 15) {
      accessibilityNotes.push(
        'Consider using alternative color combinations for better accessibility'
      );
    }

    return createSuccessResponse(
      'simulate_colorblindness',
      responseData,
      executionTime,
      {
        colorSpaceUsed: 'sRGB',
        accessibilityNotes,
        recommendations: recommendations.slice(0, 5),
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return createErrorResponse(
      'simulate_colorblindness',
      'SIMULATION_ERROR',
      `Failed to simulate colorblindness: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime,
      {
        details: {
          type: params.type,
          colors: params.colors?.length || 0,
        },
        suggestions: [
          'Check input parameters and try again',
          'Ensure all colors are in valid formats',
        ],
      }
    );
  }
}

/**
 * Simulate color vision deficiency for a single color
 */
function simulateColorVisionDeficiency(
  color: UnifiedColor,
  deficiencyType: SimulateColorblindnessParams['type'],
  severity: number
): UnifiedColor {
  const rgb = color.rgb;

  // Convert RGB to linear RGB (remove gamma correction)
  const linearR = Math.pow(rgb.r / 255, 2.2);
  const linearG = Math.pow(rgb.g / 255, 2.2);
  const linearB = Math.pow(rgb.b / 255, 2.2);

  let transformedR: number, transformedG: number, transformedB: number;

  switch (deficiencyType) {
    case 'protanopia':
    case 'protanomaly': {
      const result = applyMatrix(
        [linearR, linearG, linearB],
        CVD_MATRICES.protanopia
      );
      transformedR = result[0] ?? 0;
      transformedG = result[1] ?? 0;
      transformedB = result[2] ?? 0;
      break;
    }

    case 'deuteranopia':
    case 'deuteranomaly': {
      const result = applyMatrix(
        [linearR, linearG, linearB],
        CVD_MATRICES.deuteranopia
      );
      transformedR = result[0] ?? 0;
      transformedG = result[1] ?? 0;
      transformedB = result[2] ?? 0;
      break;
    }

    case 'tritanopia':
    case 'tritanomaly': {
      const result = applyMatrix(
        [linearR, linearG, linearB],
        CVD_MATRICES.tritanopia
      );
      transformedR = result[0] ?? 0;
      transformedG = result[1] ?? 0;
      transformedB = result[2] ?? 0;
      break;
    }

    case 'monochromacy':
      // Convert to grayscale using luminance formula
      const luminance = 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
      transformedR = transformedG = transformedB = luminance;
      break;

    default:
      transformedR = linearR;
      transformedG = linearG;
      transformedB = linearB;
  }

  // Apply severity (blend between original and transformed)
  const severityFactor = severity / 100;
  const blendedR = linearR + (transformedR - linearR) * severityFactor;
  const blendedG = linearG + (transformedG - linearG) * severityFactor;
  const blendedB = linearB + (transformedB - linearB) * severityFactor;

  // Convert back to sRGB (apply gamma correction)
  const srgbR = Math.round(
    Math.pow(Math.max(0, Math.min(1, blendedR)), 1 / 2.2) * 255
  );
  const srgbG = Math.round(
    Math.pow(Math.max(0, Math.min(1, blendedG)), 1 / 2.2) * 255
  );
  const srgbB = Math.round(
    Math.pow(Math.max(0, Math.min(1, blendedB)), 1 / 2.2) * 255
  );

  return UnifiedColor.fromRgb(srgbR, srgbG, srgbB);
}

/**
 * Apply transformation matrix to RGB values
 */
function applyMatrix(rgb: number[], matrix: number[][]): number[] {
  return [
    (matrix[0]?.[0] ?? 0) * (rgb[0] ?? 0) +
      (matrix[0]?.[1] ?? 0) * (rgb[1] ?? 0) +
      (matrix[0]?.[2] ?? 0) * (rgb[2] ?? 0),
    (matrix[1]?.[0] ?? 0) * (rgb[0] ?? 0) +
      (matrix[1]?.[1] ?? 0) * (rgb[1] ?? 0) +
      (matrix[1]?.[2] ?? 0) * (rgb[2] ?? 0),
    (matrix[2]?.[0] ?? 0) * (rgb[0] ?? 0) +
      (matrix[2]?.[1] ?? 0) * (rgb[1] ?? 0) +
      (matrix[2]?.[2] ?? 0) * (rgb[2] ?? 0),
  ];
}

/**
 * Calculate perceptual difference between two colors
 */
function calculateColorDifference(
  color1: UnifiedColor,
  color2: UnifiedColor
): number {
  // Use Delta E CIE2000 for accurate perceptual difference
  const lab1 = color1.lab;
  const lab2 = color2.lab;

  // Simplified Delta E calculation (for full accuracy, use a dedicated library)
  const deltaL = lab2.l - lab1.l;
  const deltaA = lab2.a - lab1.a;
  const deltaB = lab2.b - lab1.b;

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Generate recommendations based on simulation results
 */
function generateRecommendations(
  deficiencyType: string,
  results: ColorblindSimulationResult[],
  averageDifference: number
): string[] {
  const recommendations: string[] = [];

  // Count severely affected colors
  const severelyAffected = results.filter(
    r => r.accessibility_impact === 'severe'
  ).length;
  const moderatelyAffected = results.filter(
    r => r.accessibility_impact === 'moderate'
  ).length;

  if (severelyAffected > 0) {
    recommendations.push(
      `${severelyAffected} colors are severely affected by ${deficiencyType}`
    );
    recommendations.push(
      'Consider using alternative colors with better differentiation'
    );
  }

  if (moderatelyAffected > 0) {
    recommendations.push(
      `${moderatelyAffected} colors show moderate changes for ${deficiencyType} users`
    );
  }

  // Type-specific recommendations
  switch (deficiencyType) {
    case 'protanopia':
    case 'protanomaly':
      recommendations.push('Avoid red-green color combinations');
      recommendations.push('Use blue and yellow for better differentiation');
      break;

    case 'deuteranopia':
    case 'deuteranomaly':
      recommendations.push('Avoid green-red color combinations');
      recommendations.push('Use blue and orange for better contrast');
      break;

    case 'tritanopia':
    case 'tritanomaly':
      recommendations.push('Avoid blue-yellow color combinations');
      recommendations.push('Use red and green for better differentiation');
      break;

    case 'monochromacy':
      recommendations.push(
        'Ensure sufficient brightness contrast between colors'
      );
      recommendations.push(
        'Use patterns, textures, or labels in addition to color'
      );
      break;
  }

  if (averageDifference > 20) {
    recommendations.push('Consider using high-contrast color schemes');
    recommendations.push(
      'Test with actual users who have color vision deficiencies'
    );
  }

  // General accessibility recommendations
  recommendations.push('Use text labels or icons in addition to color coding');
  recommendations.push(
    'Ensure sufficient contrast ratios for text readability'
  );

  return recommendations;
}

// Tool definition for MCP registration
export const simulateColorblindnessTool = {
  name: 'simulate_colorblindness',
  description:
    'Simulate how colors appear to users with color vision deficiencies',
  parameters: {
    type: 'object',
    properties: {
      colors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of colors to simulate',
      },
      type: {
        type: 'string',
        enum: [
          'protanopia',
          'deuteranopia',
          'tritanopia',
          'protanomaly',
          'deuteranomaly',
          'tritanomaly',
          'monochromacy',
        ],
        description: 'Type of color vision deficiency to simulate',
      },
      severity: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Severity percentage (0-100, default: 100)',
        default: 100,
      },
    },
    required: ['colors', 'type'],
  },
  handler: async (params: unknown) =>
    simulateColorblindness(params as SimulateColorblindnessParams),
};
