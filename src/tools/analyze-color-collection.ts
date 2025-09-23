/**
 * Analyze a collection of colors for diversity, harmony, and other metrics
 */

import Joi from 'joi';
import { UnifiedColor } from '../color/unified-color';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';

interface AnalyzeCollectionParams {
  colors: string[];
  metrics: string[];
}

const analyzeCollectionSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string().required())
    .min(2)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least 2 colors are required for analysis',
      'array.max': 'Maximum 50 colors can be analyzed at once',
    }),
  metrics: Joi.array()
    .items(
      Joi.string().valid(
        'diversity',
        'harmony',
        'contrast_range',
        'temperature_distribution',
        'accessibility_score'
      )
    )
    .default([
      'diversity',
      'harmony',
      'contrast_range',
      'temperature_distribution',
      'accessibility_score',
    ])
    .messages({
      'any.only':
        'Metrics must be one of: diversity, harmony, contrast_range, temperature_distribution, accessibility_score',
    }),
});

interface ColorAnalysis {
  color: UnifiedColor;
  hue: number;
  saturation: number;
  lightness: number;
  brightness: number;
  temperature: 'warm' | 'cool' | 'neutral';
  contrastWithWhite: number;
  contrastWithBlack: number;
}

interface DiversityResult {
  score: number;
  hue_spread: number;
  saturation_range: number;
  lightness_range: number;
  interpretation: string;
}

interface HarmonyResult {
  score: number;
  type: string;
  interpretation: string;
}

interface ContrastRangeResult {
  min_contrast: number;
  max_contrast: number;
  average_contrast: number;
  range: number;
  wcag_aa_compliant: number;
  wcag_aaa_compliant: number;
  accessibility_percentage: number;
}

interface TemperatureDistributionResult {
  warm_colors: number;
  cool_colors: number;
  neutral_colors: number;
  warm_percentage: number;
  cool_percentage: number;
  neutral_percentage: number;
  balance: string;
}

interface AccessibilityScoreResult {
  score: number;
  interpretation: string;
  recommendations: string[];
}

interface OverallAssessment {
  score: number;
  interpretation: string;
}

interface ColorSummary {
  hex: string;
  hue: number;
  saturation: number;
  lightness: number;
  temperature: string;
}

interface AnalysisResults {
  total_colors: number;
  color_summary: ColorSummary[];
  diversity?: DiversityResult | { score: number; details: string };
  harmony?: HarmonyResult | { score: number; details: string };
  contrast_range?: ContrastRangeResult | { score: number; details: string };
  temperature_distribution?:
    | TemperatureDistributionResult
    | { score: number; details: string };
  accessibility_score?:
    | AccessibilityScoreResult
    | { score: number; details: string };
  overall_assessment: OverallAssessment;
}

function calculateColorDiversity(
  analyses: ColorAnalysis[]
): DiversityResult | { score: number; details: string } {
  if (analyses.length < 2)
    return { score: 0, details: 'Insufficient colors for diversity analysis' };

  // Calculate hue diversity (spread across color wheel)
  const hues = analyses.map(a => a.hue);
  const hueSpread = calculateHueSpread(hues);

  // Calculate saturation diversity
  const saturations = analyses.map(a => a.saturation);
  const saturationRange = Math.max(...saturations) - Math.min(...saturations);
  const saturationDiversity = Math.min(100, saturationRange);

  // Calculate lightness diversity
  const lightnesses = analyses.map(a => a.lightness);
  const lightnessRange = Math.max(...lightnesses) - Math.min(...lightnesses);
  const lightnessDiversity = Math.min(100, lightnessRange);

  // Calculate overall diversity score (0-100)
  const diversityScore = Math.round(
    hueSpread * 0.5 + saturationDiversity * 0.25 + lightnessDiversity * 0.25
  );

  return {
    score: diversityScore,
    hue_spread: Math.round(hueSpread * 10) / 10,
    saturation_range: Math.round(saturationRange * 10) / 10,
    lightness_range: Math.round(lightnessRange * 10) / 10,
    interpretation: getDiversityInterpretation(diversityScore),
  };
}

function calculateHueSpread(hues: number[]): number {
  if (hues.length < 2) return 0;

  // Sort hues and calculate gaps
  const sortedHues = [...hues].sort((a, b) => a - b);
  const gaps: number[] = [];

  for (let i = 1; i < sortedHues.length; i++) {
    const current = sortedHues[i];
    const previous = sortedHues[i - 1];
    if (current !== undefined && previous !== undefined) {
      gaps.push(current - previous);
    }
  }

  // Add the wrap-around gap
  const lastHue = sortedHues[sortedHues.length - 1];
  const firstHue = sortedHues[0];
  if (lastHue !== undefined && firstHue !== undefined) {
    gaps.push(360 - lastHue + firstHue);
  }

  // Calculate the largest gap
  const maxGap = Math.max(...gaps);

  // Hue spread is the percentage of the color wheel covered
  return Math.min(100, ((360 - maxGap) / 360) * 100);
}

function calculateHarmonyScore(
  analyses: ColorAnalysis[]
): HarmonyResult | { score: number; details: string } {
  if (analyses.length < 2)
    return { score: 0, details: 'Insufficient colors for harmony analysis' };

  const hues = analyses.map(a => a.hue);
  let harmonyScore = 0;
  let harmonyType = 'custom';

  // Check for common harmony patterns
  if (hues.length === 2) {
    const hue1 = hues[0];
    const hue2 = hues[1];
    if (hue1 !== undefined && hue2 !== undefined) {
      const diff = Math.abs(hue1 - hue2);
      const complementaryDiff = Math.min(diff, 360 - diff);
      if (complementaryDiff >= 170 && complementaryDiff <= 190) {
        harmonyScore = 95;
        harmonyType = 'complementary';
      } else if (complementaryDiff >= 25 && complementaryDiff <= 35) {
        harmonyScore = 85;
        harmonyType = 'analogous';
      }
    }
  } else if (hues.length === 3) {
    // Check for triadic harmony
    const sortedHues = [...hues].sort((a, b) => a - b);
    const hue1 = sortedHues[0];
    const hue2 = sortedHues[1];
    const hue3 = sortedHues[2];

    if (hue1 !== undefined && hue2 !== undefined && hue3 !== undefined) {
      const gap1 = hue2 - hue1;
      const gap2 = hue3 - hue2;
      const gap3 = 360 - hue3 + hue1;

      if (
        Math.abs(gap1 - 120) <= 15 &&
        Math.abs(gap2 - 120) <= 15 &&
        Math.abs(gap3 - 120) <= 15
      ) {
        harmonyScore = 95;
        harmonyType = 'triadic';
      }
    }
  }

  // If no specific harmony detected, calculate based on color relationships
  if (harmonyScore === 0) {
    // Calculate average color distance and penalize extreme variations
    let totalDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const analysis1 = analyses[i];
        const analysis2 = analyses[j];
        if (!analysis1 || !analysis2) continue;

        const hueDiff = Math.min(
          Math.abs(analysis1.hue - analysis2.hue),
          360 - Math.abs(analysis1.hue - analysis2.hue)
        );
        const satDiff = Math.abs(analysis1.saturation - analysis2.saturation);
        const lightDiff = Math.abs(analysis1.lightness - analysis2.lightness);

        const distance = Math.sqrt(
          Math.pow(hueDiff / 180, 2) +
            Math.pow(satDiff / 100, 2) +
            Math.pow(lightDiff / 100, 2)
        );

        totalDistance += distance;
        comparisons++;
      }
    }

    const avgDistance = totalDistance / comparisons;
    // Harmony is better when colors are neither too similar nor too different
    const idealDistance = 0.5;
    harmonyScore = Math.max(
      0,
      100 - Math.abs(avgDistance - idealDistance) * 100
    );
  }

  return {
    score: Math.round(harmonyScore),
    type: harmonyType,
    interpretation: getHarmonyInterpretation(harmonyScore),
  };
}

function calculateContrastRange(
  analyses: ColorAnalysis[]
): ContrastRangeResult {
  const contrastRatios = analyses.map(a =>
    Math.max(a.contrastWithWhite, a.contrastWithBlack)
  );

  const minContrast = Math.min(...contrastRatios);
  const maxContrast = Math.max(...contrastRatios);
  const avgContrast =
    contrastRatios.reduce((sum, ratio) => sum + ratio, 0) /
    contrastRatios.length;

  // Count colors meeting accessibility standards
  const wcagAACount = contrastRatios.filter(ratio => ratio >= 4.5).length;
  const wcagAAACount = contrastRatios.filter(ratio => ratio >= 7.0).length;

  return {
    min_contrast: Math.round(minContrast * 100) / 100,
    max_contrast: Math.round(maxContrast * 100) / 100,
    average_contrast: Math.round(avgContrast * 100) / 100,
    range: Math.round((maxContrast - minContrast) * 100) / 100,
    wcag_aa_compliant: wcagAACount,
    wcag_aaa_compliant: wcagAAACount,
    accessibility_percentage: Math.round((wcagAACount / analyses.length) * 100),
  };
}

function calculateTemperatureDistribution(
  analyses: ColorAnalysis[]
): TemperatureDistributionResult {
  const temperatures = analyses.map(a => a.temperature);

  const warm = temperatures.filter(t => t === 'warm').length;
  const cool = temperatures.filter(t => t === 'cool').length;
  const neutral = temperatures.filter(t => t === 'neutral').length;

  const total = analyses.length;

  return {
    warm_colors: warm,
    cool_colors: cool,
    neutral_colors: neutral,
    warm_percentage: Math.round((warm / total) * 100),
    cool_percentage: Math.round((cool / total) * 100),
    neutral_percentage: Math.round((neutral / total) * 100),
    balance: getTemperatureBalance(warm, cool, neutral),
  };
}

function calculateAccessibilityScore(
  analyses: ColorAnalysis[]
): AccessibilityScoreResult {
  let totalScore = 0;
  let maxScore = 0;

  // Score each color based on accessibility factors
  analyses.forEach(analysis => {
    let colorScore = 0;
    let colorMaxScore = 0;

    // Contrast score (40% of total)
    const bestContrast = Math.max(
      analysis.contrastWithWhite,
      analysis.contrastWithBlack
    );
    if (bestContrast >= 7.0) colorScore += 40;
    else if (bestContrast >= 4.5) colorScore += 30;
    else if (bestContrast >= 3.0) colorScore += 15;
    colorMaxScore += 40;

    // Color blindness safety (30% of total)
    // Avoid pure red/green combinations and low saturation issues
    if (
      analysis.saturation > 20 ||
      analysis.lightness < 30 ||
      analysis.lightness > 70
    ) {
      colorScore += 30;
    } else if (analysis.saturation > 10) {
      colorScore += 15;
    }
    colorMaxScore += 30;

    // Lightness appropriateness (20% of total)
    if (analysis.lightness >= 20 && analysis.lightness <= 80) {
      colorScore += 20;
    } else if (analysis.lightness >= 10 && analysis.lightness <= 90) {
      colorScore += 10;
    }
    colorMaxScore += 20;

    // Saturation appropriateness (10% of total)
    if (analysis.saturation >= 10 && analysis.saturation <= 90) {
      colorScore += 10;
    } else if (analysis.saturation >= 5) {
      colorScore += 5;
    }
    colorMaxScore += 10;

    totalScore += colorScore;
    maxScore += colorMaxScore;
  });

  const finalScore =
    maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    score: finalScore,
    interpretation: getAccessibilityInterpretation(finalScore),
    recommendations: getAccessibilityRecommendations(analyses),
  };
}

function getDiversityInterpretation(score: number): string {
  if (score >= 80) return 'Highly diverse palette with excellent color variety';
  if (score >= 60) return 'Good diversity with adequate color variation';
  if (score >= 40)
    return 'Moderate diversity - consider adding more varied colors';
  if (score >= 20) return 'Low diversity - palette may appear monotonous';
  return 'Very low diversity - colors are too similar';
}

function getHarmonyInterpretation(score: number): string {
  if (score >= 90)
    return 'Excellent harmony - colors work beautifully together';
  if (score >= 70) return 'Good harmony with pleasing color relationships';
  if (score >= 50) return 'Moderate harmony - some colors may clash slightly';
  if (score >= 30)
    return 'Poor harmony - consider adjusting color relationships';
  return 'Very poor harmony - colors conflict significantly';
}

function getTemperatureBalance(
  warm: number,
  cool: number,
  neutral: number
): string {
  const total = warm + cool + neutral;
  const warmRatio = warm / total;
  const coolRatio = cool / total;

  if (Math.abs(warmRatio - coolRatio) <= 0.2) return 'balanced';
  if (warmRatio > coolRatio + 0.2) return 'warm-dominant';
  return 'cool-dominant';
}

function getAccessibilityInterpretation(score: number): string {
  if (score >= 90) return 'Excellent accessibility - suitable for all users';
  if (score >= 70) return 'Good accessibility with minor considerations';
  if (score >= 50) return 'Moderate accessibility - some improvements needed';
  if (score >= 30)
    return 'Poor accessibility - significant improvements required';
  return 'Very poor accessibility - major changes needed';
}

function getAccessibilityRecommendations(analyses: ColorAnalysis[]): string[] {
  const recommendations: string[] = [];

  const lowContrastColors = analyses.filter(
    a => Math.max(a.contrastWithWhite, a.contrastWithBlack) < 4.5
  ).length;

  if (lowContrastColors > 0) {
    recommendations.push(
      `${lowContrastColors} colors have insufficient contrast - consider darkening or lightening`
    );
  }

  const veryLowSaturation = analyses.filter(a => a.saturation < 10).length;
  if (veryLowSaturation > analyses.length * 0.5) {
    recommendations.push(
      'Many colors have very low saturation - may be difficult to distinguish'
    );
  }

  const extremeLightness = analyses.filter(
    a => a.lightness < 10 || a.lightness > 90
  ).length;
  if (extremeLightness > 0) {
    recommendations.push(
      'Some colors have extreme lightness values - may cause visibility issues'
    );
  }

  return recommendations;
}

async function analyzeCollectionHandler(
  params: unknown
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = analyzeCollectionSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'analyze_color_collection',
        'INVALID_PARAMETERS',
        `Invalid parameters: ${error.details.map(d => d.message).join(', ')}`,
        Date.now() - startTime,
        {
          details: error.details,
        }
      );
    }

    const { colors: colorStrings, metrics } = value as AnalyzeCollectionParams;

    // Parse colors and create analyses
    const analyses: ColorAnalysis[] = [];

    for (let i = 0; i < colorStrings.length; i++) {
      const colorString = colorStrings[i];
      if (!colorString) continue;

      try {
        const color = new UnifiedColor(colorString);
        const hsl = color.hsl;
        const rgb = color.rgb;
        const metadata = color.metadata;

        // Calculate brightness using perceived brightness formula
        const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;

        analyses.push({
          color,
          hue: hsl.h,
          saturation: hsl.s,
          lightness: hsl.l,
          brightness,
          temperature: metadata?.temperature || 'neutral',
          contrastWithWhite: color.getContrastRatio('#ffffff'),
          contrastWithBlack: color.getContrastRatio('#000000'),
        });
      } catch (error) {
        return createErrorResponse(
          'analyze_color_collection',
          'INVALID_COLOR',
          `Invalid color at index ${i}: ${colorString}`,
          Date.now() - startTime,
          {
            details: {
              colorIndex: i,
              providedColor: colorString,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            suggestions: [
              'Ensure all colors are in valid format (hex, rgb, hsl, etc.)',
              'Check color syntax and values',
            ],
          }
        );
      }
    }

    // Calculate requested metrics
    const results: AnalysisResults = {
      total_colors: colorStrings.length,
      color_summary: analyses.map(a => ({
        hex: a.color.hex,
        hue: Math.round(a.hue * 10) / 10,
        saturation: Math.round(a.saturation * 10) / 10,
        lightness: Math.round(a.lightness * 10) / 10,
        temperature: a.temperature,
      })),
      overall_assessment: {
        score: 0,
        interpretation: '',
      },
    };

    if (metrics.includes('diversity')) {
      results.diversity = calculateColorDiversity(analyses);
    }

    if (metrics.includes('harmony')) {
      results.harmony = calculateHarmonyScore(analyses);
    }

    if (metrics.includes('contrast_range')) {
      results.contrast_range = calculateContrastRange(analyses);
    }

    if (metrics.includes('temperature_distribution')) {
      results.temperature_distribution =
        calculateTemperatureDistribution(analyses);
    }

    if (metrics.includes('accessibility_score')) {
      results.accessibility_score = calculateAccessibilityScore(analyses);
    }

    const executionTime = Date.now() - startTime;

    // Generate overall assessment
    const overallScore = Math.round(
      [
        results.diversity?.score || 0,
        results.harmony?.score || 0,
        results.accessibility_score?.score || 0,
      ].reduce((sum, score) => sum + score, 0) / 3
    );

    results.overall_assessment = {
      score: overallScore,
      interpretation: getOverallInterpretation(overallScore),
    };

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    if (results.accessibility_score) {
      accessibilityNotes.push(
        `Accessibility score: ${results.accessibility_score.score}/100`
      );
      if (
        'recommendations' in results.accessibility_score &&
        results.accessibility_score.recommendations
      ) {
        accessibilityNotes.push(...results.accessibility_score.recommendations);
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (results.diversity && results.diversity.score < 50) {
      recommendations.push(
        'Consider adding more diverse colors to improve visual interest'
      );
    }
    if (results.harmony && results.harmony.score < 50) {
      recommendations.push('Adjust color relationships to improve harmony');
    }
    if (
      results.contrast_range &&
      'accessibility_percentage' in results.contrast_range &&
      results.contrast_range.accessibility_percentage < 70
    ) {
      recommendations.push('Improve contrast ratios for better accessibility');
    }

    return createSuccessResponse(
      'analyze_color_collection',
      results,
      executionTime,
      {
        colorSpaceUsed: 'hsl',
        accessibilityNotes: accessibilityNotes,
        recommendations,
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Error in analyze_color_collection tool', {
      error: error as Error,
    });

    return createErrorResponse(
      'analyze_color_collection',
      'PROCESSING_ERROR',
      'An error occurred while analyzing the color collection',
      executionTime,
      {
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        suggestions: [
          'Check that all input colors are valid',
          'Verify metrics parameter contains valid values',
          'Try with fewer colors if processing large collections',
        ],
      }
    );
  }
}

function getOverallInterpretation(score: number): string {
  if (score >= 80)
    return 'Excellent color collection with great diversity, harmony, and accessibility';
  if (score >= 60)
    return 'Good color collection with minor areas for improvement';
  if (score >= 40)
    return 'Moderate color collection - consider improvements in key areas';
  if (score >= 20)
    return 'Poor color collection - significant improvements needed';
  return 'Very poor color collection - major changes required';
}

export const analyzeColorCollectionTool: ToolHandler = {
  name: 'analyze_color_collection',
  description:
    'Analyze a collection of colors for diversity, harmony, contrast range, temperature distribution, and accessibility metrics.',
  parameters: {
    type: 'object',
    properties: {
      colors: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 50,
        description: 'Array of colors to analyze (2-50 colors)',
      },
      metrics: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'diversity',
            'harmony',
            'contrast_range',
            'temperature_distribution',
            'accessibility_score',
          ],
        },
        default: [
          'diversity',
          'harmony',
          'contrast_range',
          'temperature_distribution',
          'accessibility_score',
        ],
        description: 'Metrics to calculate for the color collection',
      },
    },
    required: ['colors'],
  },
  handler: analyzeCollectionHandler,
};
