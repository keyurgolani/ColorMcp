/**
 * Optimize for Accessibility MCP Tool
 * Optimize colors for accessibility compliance while preserving hue when possible
 */

import { UnifiedColor } from '../color/unified-color';
import { ColorAnalyzer } from '../color/color-analysis';
import { ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { validateColorInput } from '../validation/schemas';

export interface OptimizeForAccessibilityParams {
  palette: string[];
  use_cases: ('text' | 'background' | 'accent' | 'interactive')[];
  target_standard?: 'WCAG_AA' | 'WCAG_AAA';
  preserve_hue?: boolean;
  preserve_brand_colors?: string[]; // Colors that should not be modified
}

export interface ColorOptimizationResult {
  original_color: string;
  optimized_color: string;
  use_case: string;
  optimization_applied: boolean;
  changes_made: string[];
  contrast_improvement: {
    before: number;
    after: number;
    improvement_percentage: number;
  };
  accessibility_compliance: {
    wcag_aa_before: boolean;
    wcag_aa_after: boolean;
    wcag_aaa_before: boolean;
    wcag_aaa_after: boolean;
  };
  hue_preservation: {
    hue_changed: boolean;
    hue_difference: number; // degrees
  };
}

export interface OptimizeForAccessibilityResponse {
  target_standard: string;
  preserve_hue: boolean;
  optimization_results: ColorOptimizationResult[];
  summary: {
    total_colors: number;
    colors_optimized: number;
    colors_preserved: number;
    average_contrast_improvement: number;
    compliance_rate_before: number;
    compliance_rate_after: number;
  };
  recommended_pairings: Array<{
    foreground: string;
    background: string;
    contrast_ratio: number;
    use_case: string;
    compliant: boolean;
  }>;
  accessibility_notes: string[];
  recommendations: string[];
}

/**
 * Optimize colors for accessibility compliance
 */
export async function optimizeForAccessibility(
  params: OptimizeForAccessibilityParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate required parameters
    if (
      !params.palette ||
      !Array.isArray(params.palette) ||
      params.palette.length === 0
    ) {
      return createErrorResponse(
        'optimize_for_accessibility',
        'MISSING_PALETTE',
        'Palette array parameter is required and must not be empty',
        Date.now() - startTime,
        {
          details: { provided: params.palette },
          suggestions: ['Provide an array of colors to optimize'],
        }
      );
    }

    if (
      !params.use_cases ||
      !Array.isArray(params.use_cases) ||
      params.use_cases.length === 0
    ) {
      return createErrorResponse(
        'optimize_for_accessibility',
        'MISSING_USE_CASES',
        'Use cases array parameter is required and must not be empty',
        Date.now() - startTime,
        {
          details: { provided: params.use_cases },
          suggestions: [
            'Specify use cases: text, background, accent, interactive',
          ],
        }
      );
    }

    // Validate use cases
    const validUseCases = ['text', 'background', 'accent', 'interactive'];
    const invalidUseCases = params.use_cases.filter(
      uc => !validUseCases.includes(uc)
    );
    if (invalidUseCases.length > 0) {
      return createErrorResponse(
        'optimize_for_accessibility',
        'INVALID_USE_CASES',
        `Invalid use cases: ${invalidUseCases.join(', ')}`,
        Date.now() - startTime,
        {
          details: { invalid: invalidUseCases, valid: validUseCases },
          suggestions: [
            'Use only valid use cases: text, background, accent, interactive',
          ],
        }
      );
    }

    // Set defaults
    const targetStandard = params.target_standard || 'WCAG_AA';
    const preserveHue = params.preserve_hue ?? true;
    const preserveBrandColors = params.preserve_brand_colors || [];

    // Validate all color inputs
    const validatedColors: UnifiedColor[] = [];
    const preserveBrandSet = new Set(preserveBrandColors);

    for (let i = 0; i < params.palette.length; i++) {
      const colorInput = params.palette[i];
      if (!colorInput) {
        return createErrorResponse(
          'optimize_for_accessibility',
          'INVALID_COLOR_FORMAT',
          `Color at index ${i} is undefined or null`,
          Date.now() - startTime,
          {
            details: { index: i, provided: colorInput },
            suggestions: ['Ensure all colors in the palette are valid strings'],
          }
        );
      }

      const validation = validateColorInput(colorInput);

      if (!validation.isValid) {
        return createErrorResponse(
          'optimize_for_accessibility',
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
          'optimize_for_accessibility',
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

    // Optimize each color for each use case
    const optimizationResults: ColorOptimizationResult[] = [];
    let totalOptimized = 0;
    let totalPreserved = 0;
    let totalContrastImprovement = 0;
    let complianceBefore = 0;
    let complianceAfter = 0;

    for (let i = 0; i < validatedColors.length; i++) {
      const originalColor = validatedColors[i];
      const originalColorString = params.palette[i];

      if (!originalColor || !originalColorString) {
        continue; // Skip invalid entries
      }

      const shouldPreserve = preserveBrandSet.has(originalColorString);

      for (const useCase of params.use_cases) {
        const optimizationResult = await optimizeColorForUseCase(
          originalColor,
          originalColorString,
          useCase,
          targetStandard,
          preserveHue,
          shouldPreserve
        );

        optimizationResults.push(optimizationResult);

        if (optimizationResult.optimization_applied) {
          totalOptimized++;
        } else {
          totalPreserved++;
        }

        totalContrastImprovement +=
          optimizationResult.contrast_improvement.improvement_percentage;

        // Count compliance rates
        if (targetStandard === 'WCAG_AA') {
          if (optimizationResult.accessibility_compliance.wcag_aa_before)
            complianceBefore++;
          if (optimizationResult.accessibility_compliance.wcag_aa_after)
            complianceAfter++;
        } else {
          if (optimizationResult.accessibility_compliance.wcag_aaa_before)
            complianceBefore++;
          if (optimizationResult.accessibility_compliance.wcag_aaa_after)
            complianceAfter++;
        }
      }
    }

    // Generate recommended color pairings
    const recommendedPairings = generateRecommendedPairings(
      optimizationResults,
      targetStandard
    );

    // Calculate summary statistics
    const totalResults = optimizationResults.length;
    const averageContrastImprovement =
      totalResults > 0 ? totalContrastImprovement / totalResults : 0;
    const complianceRateBefore =
      totalResults > 0 ? (complianceBefore / totalResults) * 100 : 0;
    const complianceRateAfter =
      totalResults > 0 ? (complianceAfter / totalResults) * 100 : 0;

    // Generate accessibility notes and recommendations
    const accessibilityNotes = generateAccessibilityNotes(
      optimizationResults,
      targetStandard
    );
    const recommendations = generateOptimizationRecommendations(
      optimizationResults,
      complianceRateBefore,
      complianceRateAfter,
      preserveHue
    );

    const responseData: OptimizeForAccessibilityResponse = {
      target_standard: targetStandard,
      preserve_hue: preserveHue,
      optimization_results: optimizationResults,
      summary: {
        total_colors: validatedColors.length,
        colors_optimized: totalOptimized,
        colors_preserved: totalPreserved,
        average_contrast_improvement:
          Math.round(averageContrastImprovement * 100) / 100,
        compliance_rate_before: Math.round(complianceRateBefore * 100) / 100,
        compliance_rate_after: Math.round(complianceRateAfter * 100) / 100,
      },
      recommended_pairings: recommendedPairings,
      accessibility_notes: accessibilityNotes,
      recommendations: recommendations,
    };

    const executionTime = Date.now() - startTime;

    return createSuccessResponse(
      'optimize_for_accessibility',
      responseData,
      executionTime,
      {
        colorSpaceUsed: 'sRGB',
        accessibilityNotes: accessibilityNotes.slice(0, 5),
        recommendations: recommendations.slice(0, 5),
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return createErrorResponse(
      'optimize_for_accessibility',
      'OPTIMIZATION_ERROR',
      `Failed to optimize colors for accessibility: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime,
      {
        details: {
          palette_size: params.palette?.length || 0,
          use_cases: params.use_cases,
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
 * Optimize a single color for a specific use case
 */
async function optimizeColorForUseCase(
  originalColor: UnifiedColor,
  originalColorString: string,
  useCase: string,
  targetStandard: string,
  preserveHue: boolean,
  shouldPreserve: boolean
): Promise<ColorOptimizationResult> {
  const originalHsl = originalColor.hsl;
  let optimizedColor = originalColor;
  let optimizationApplied = false;
  const changesMade: string[] = [];

  // Skip optimization if color should be preserved
  if (shouldPreserve) {
    changesMade.push('Color preserved as brand color');
  } else {
    // Determine optimization strategy based on use case
    switch (useCase) {
      case 'text':
        optimizedColor = optimizeForText(
          originalColor,
          targetStandard,
          preserveHue
        );
        break;
      case 'background':
        optimizedColor = optimizeForBackground(
          originalColor,
          targetStandard,
          preserveHue
        );
        break;
      case 'accent':
        optimizedColor = optimizeForAccent(
          originalColor,
          targetStandard,
          preserveHue
        );
        break;
      case 'interactive':
        optimizedColor = optimizeForInteractive(
          originalColor,
          targetStandard,
          preserveHue
        );
        break;
    }

    // Check if optimization was applied
    optimizationApplied = !colorsEqual(originalColor, optimizedColor);

    if (optimizationApplied) {
      const optimizedHsl = optimizedColor.hsl;

      if (Math.abs(originalHsl.l - optimizedHsl.l) > 5) {
        changesMade.push(
          `Lightness adjusted from ${Math.round(originalHsl.l)}% to ${Math.round(optimizedHsl.l)}%`
        );
      }

      if (Math.abs(originalHsl.s - optimizedHsl.s) > 5) {
        changesMade.push(
          `Saturation adjusted from ${Math.round(originalHsl.s)}% to ${Math.round(optimizedHsl.s)}%`
        );
      }

      if (!preserveHue && Math.abs(originalHsl.h - optimizedHsl.h) > 5) {
        changesMade.push(
          `Hue adjusted from ${Math.round(originalHsl.h)}° to ${Math.round(optimizedHsl.h)}°`
        );
      }
    }
  }

  // Calculate contrast improvements (using white background as reference)
  const whiteBackground = UnifiedColor.fromHex('#FFFFFF');
  const contrastBefore = ColorAnalyzer.checkContrast(
    originalColor,
    whiteBackground
  ).ratio;
  const contrastAfter = ColorAnalyzer.checkContrast(
    optimizedColor,
    whiteBackground
  ).ratio;
  const improvementPercentage =
    contrastBefore > 0
      ? ((contrastAfter - contrastBefore) / contrastBefore) * 100
      : 0;

  // Check accessibility compliance
  const accessibilityBefore = ColorAnalyzer.analyzeAccessibility(originalColor);
  const accessibilityAfter = ColorAnalyzer.analyzeAccessibility(optimizedColor);

  // Calculate hue preservation
  const hueDifference = Math.abs(originalHsl.h - optimizedColor.hsl.h);
  const hueChanged = hueDifference > 5;

  return {
    original_color: originalColorString,
    optimized_color: optimizedColor.hex,
    use_case: useCase,
    optimization_applied: optimizationApplied,
    changes_made: changesMade,
    contrast_improvement: {
      before: Math.round(contrastBefore * 100) / 100,
      after: Math.round(contrastAfter * 100) / 100,
      improvement_percentage: Math.round(improvementPercentage * 100) / 100,
    },
    accessibility_compliance: {
      wcag_aa_before: accessibilityBefore.wcag_aa_normal,
      wcag_aa_after: accessibilityAfter.wcag_aa_normal,
      wcag_aaa_before: accessibilityBefore.wcag_aaa_normal,
      wcag_aaa_after: accessibilityAfter.wcag_aaa_normal,
    },
    hue_preservation: {
      hue_changed: hueChanged,
      hue_difference: Math.round(hueDifference * 100) / 100,
    },
  };
}

/**
 * Optimize color for text use case
 */
function optimizeForText(
  color: UnifiedColor,
  _targetStandard: string,
  preserveHue: boolean
): UnifiedColor {
  const hsl = color.hsl;

  // For text, we typically want darker colors for better contrast on light backgrounds
  let optimizedLightness = hsl.l;

  // If the color is too light for good text contrast, darken it
  if (hsl.l > 50) {
    optimizedLightness = Math.max(20, hsl.l - 30);
  }

  // Increase saturation slightly for better visibility
  const optimizedSaturation = Math.min(100, hsl.s + 10);

  // Preserve hue if requested
  const optimizedHue = preserveHue ? hsl.h : hsl.h;

  return UnifiedColor.fromHsl(
    optimizedHue,
    optimizedSaturation,
    optimizedLightness
  );
}

/**
 * Optimize color for background use case
 */
function optimizeForBackground(
  color: UnifiedColor,
  _targetStandard: string,
  preserveHue: boolean
): UnifiedColor {
  const hsl = color.hsl;

  // For backgrounds, we typically want lighter, less saturated colors
  let optimizedLightness = hsl.l;
  let optimizedSaturation = hsl.s;

  // If the color is too dark or too saturated for a background, adjust it
  if (hsl.l < 80) {
    optimizedLightness = Math.max(85, hsl.l + 20);
  }

  if (hsl.s > 30) {
    optimizedSaturation = Math.max(10, hsl.s - 20);
  }

  const optimizedHue = preserveHue ? hsl.h : hsl.h;

  return UnifiedColor.fromHsl(
    optimizedHue,
    optimizedSaturation,
    optimizedLightness
  );
}

/**
 * Optimize color for accent use case
 */
function optimizeForAccent(
  color: UnifiedColor,
  _targetStandard: string,
  preserveHue: boolean
): UnifiedColor {
  const hsl = color.hsl;

  // For accents, we want vibrant but accessible colors
  let optimizedLightness = hsl.l;
  let optimizedSaturation = hsl.s;

  // Ensure good contrast while maintaining vibrancy
  if (hsl.l > 70 || hsl.l < 30) {
    optimizedLightness = 50; // Mid-range lightness for good contrast
  }

  // Increase saturation for vibrancy, but not too much
  if (hsl.s < 60) {
    optimizedSaturation = Math.min(80, hsl.s + 20);
  }

  const optimizedHue = preserveHue ? hsl.h : hsl.h;

  return UnifiedColor.fromHsl(
    optimizedHue,
    optimizedSaturation,
    optimizedLightness
  );
}

/**
 * Optimize color for interactive elements
 */
function optimizeForInteractive(
  color: UnifiedColor,
  _targetStandard: string,
  preserveHue: boolean
): UnifiedColor {
  const hsl = color.hsl;

  // Interactive elements need good contrast and clear visibility
  let optimizedLightness = hsl.l;
  let optimizedSaturation = hsl.s;

  // Ensure sufficient contrast for interactive elements
  if (hsl.l > 60) {
    optimizedLightness = Math.max(40, hsl.l - 20);
  } else if (hsl.l < 40) {
    optimizedLightness = Math.min(60, hsl.l + 20);
  }

  // Maintain good saturation for visibility
  if (hsl.s < 50) {
    optimizedSaturation = Math.min(70, hsl.s + 15);
  }

  const optimizedHue = preserveHue ? hsl.h : hsl.h;

  return UnifiedColor.fromHsl(
    optimizedHue,
    optimizedSaturation,
    optimizedLightness
  );
}

/**
 * Check if two colors are equal (within tolerance)
 */
function colorsEqual(color1: UnifiedColor, color2: UnifiedColor): boolean {
  const rgb1 = color1.rgb;
  const rgb2 = color2.rgb;

  return (
    Math.abs(rgb1.r - rgb2.r) < 2 &&
    Math.abs(rgb1.g - rgb2.g) < 2 &&
    Math.abs(rgb1.b - rgb2.b) < 2
  );
}

/**
 * Generate recommended color pairings
 */
function generateRecommendedPairings(
  results: ColorOptimizationResult[],
  targetStandard: string
): Array<{
  foreground: string;
  background: string;
  contrast_ratio: number;
  use_case: string;
  compliant: boolean;
}> {
  const pairings: Array<{
    foreground: string;
    background: string;
    contrast_ratio: number;
    use_case: string;
    compliant: boolean;
  }> = [];

  // Find text and background colors
  const textColors = results.filter(r => r.use_case === 'text');
  const backgroundColors = results.filter(r => r.use_case === 'background');

  // Generate pairings between text and background colors
  for (const textResult of textColors) {
    for (const bgResult of backgroundColors) {
      try {
        const textColor = new UnifiedColor(textResult.optimized_color);
        const bgColor = new UnifiedColor(bgResult.optimized_color);

        const contrastCheck = ColorAnalyzer.checkContrast(textColor, bgColor);
        const isCompliant =
          targetStandard === 'WCAG_AAA'
            ? contrastCheck.wcag_aaa
            : contrastCheck.wcag_aa;

        pairings.push({
          foreground: textResult.optimized_color,
          background: bgResult.optimized_color,
          contrast_ratio: contrastCheck.ratio,
          use_case: 'text_on_background',
          compliant: isCompliant,
        });
      } catch {
        // Skip invalid color combinations
      }
    }
  }

  // Sort by contrast ratio (best first) and return top 10
  return pairings
    .sort((a, b) => b.contrast_ratio - a.contrast_ratio)
    .slice(0, 10);
}

/**
 * Generate accessibility notes
 */
function generateAccessibilityNotes(
  results: ColorOptimizationResult[],
  targetStandard: string
): string[] {
  const notes: string[] = [];

  const optimizedCount = results.filter(r => r.optimization_applied).length;
  const complianceImproved = results.filter(r => {
    const beforeCompliant =
      targetStandard === 'WCAG_AAA'
        ? r.accessibility_compliance.wcag_aaa_before
        : r.accessibility_compliance.wcag_aa_before;
    const afterCompliant =
      targetStandard === 'WCAG_AAA'
        ? r.accessibility_compliance.wcag_aaa_after
        : r.accessibility_compliance.wcag_aa_after;
    return !beforeCompliant && afterCompliant;
  }).length;

  if (optimizedCount > 0) {
    notes.push(
      `${optimizedCount} colors were optimized for better accessibility`
    );
  }

  if (complianceImproved > 0) {
    notes.push(
      `${complianceImproved} colors now meet ${targetStandard} standards`
    );
  }

  const hueChanges = results.filter(r => r.hue_preservation.hue_changed).length;
  if (hueChanges > 0) {
    notes.push(`${hueChanges} colors had hue adjustments for accessibility`);
  }

  return notes;
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(
  results: ColorOptimizationResult[],
  complianceRateBefore: number,
  complianceRateAfter: number,
  preserveHue: boolean
): string[] {
  const recommendations: string[] = [];

  const improvementRate = complianceRateAfter - complianceRateBefore;

  if (improvementRate > 20) {
    recommendations.push('Significant accessibility improvements achieved');
  } else if (improvementRate > 0) {
    recommendations.push('Moderate accessibility improvements made');
  }

  if (complianceRateAfter < 80) {
    recommendations.push('Consider further adjustments for better compliance');
  }

  if (preserveHue) {
    recommendations.push('Hue preservation maintained brand consistency');
  } else {
    recommendations.push('Hue adjustments may require brand guideline updates');
  }

  const stillNonCompliant = results.filter(
    r => !r.accessibility_compliance.wcag_aa_after
  ).length;
  if (stillNonCompliant > 0) {
    recommendations.push(
      `${stillNonCompliant} colors still need manual review`
    );
  }

  recommendations.push('Test optimized colors with actual users');
  recommendations.push('Validate color combinations in real UI contexts');

  return recommendations;
}

// Tool definition for MCP registration
export const optimizeForAccessibilityTool = {
  name: 'optimize_for_accessibility',
  description:
    'Optimize colors for accessibility compliance while preserving hue when possible',
  parameters: {
    type: 'object',
    properties: {
      palette: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of colors to optimize',
      },
      use_cases: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['text', 'background', 'accent', 'interactive'],
        },
        description: 'Use cases for the colors',
      },
      target_standard: {
        type: 'string',
        enum: ['WCAG_AA', 'WCAG_AAA'],
        description: 'Target accessibility standard',
        default: 'WCAG_AA',
      },
      preserve_hue: {
        type: 'boolean',
        description: 'Preserve original hues when possible',
        default: true,
      },
      preserve_brand_colors: {
        type: 'array',
        items: { type: 'string' },
        description: 'Colors that should not be modified',
        default: [],
      },
    },
    required: ['palette', 'use_cases'],
  },
  handler: async (params: unknown) =>
    optimizeForAccessibility(params as OptimizeForAccessibilityParams),
};
