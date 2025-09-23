/**
 * Analyze Color MCP Tool
 * Provides comprehensive color analysis including brightness, temperature, contrast, and accessibility
 */

import { UnifiedColor } from '../color/unified-color';
import { ColorAnalyzer, ColorAnalysisResult } from '../color/color-analysis';
import { ToolResponse, ErrorResponse } from '../types/index';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createErrorResponse,
} from '../utils/response';
import { validateInput, analyzeColorSchema } from '../validation/schemas';
import { logger } from '../utils/logger';

export interface AnalyzeColorParams {
  color: string;
  analysis_types?: string[];
  compare_color?: string;
  include_recommendations?: boolean;
}

export interface AnalyzeColorResponse {
  color: string;
  analysis: ColorAnalysisResult;
  comparison?: {
    compare_color: string;
    distance: ColorAnalysisResult['distance'];
  };
  summary: {
    overall_score: number;
    primary_issues: string[];
    strengths: string[];
  };
}

/**
 * Analyze color properties and accessibility
 */
export async function analyzeColor(
  params: AnalyzeColorParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate input parameters using Joi schema
    const validation = validateInput(analyzeColorSchema, params);
    if (!validation.isValid) {
      logger.warn('Color analysis validation failed', {
        tool: 'analyze_color',
        executionTime: Date.now() - startTime,
      });
      return createValidationErrorResponse(
        'analyze_color',
        validation.error!,
        Date.now() - startTime
      );
    }

    const validatedParams = validation.value!;

    // Parse colors
    const color = new UnifiedColor(validatedParams.color);
    let compareColor: UnifiedColor | undefined;

    if (validatedParams.compare_color) {
      compareColor = new UnifiedColor(validatedParams.compare_color);
    }

    const analysisTypes = validatedParams.analysis_types;

    // Perform analysis
    const analysis = ColorAnalyzer.analyzeColor(
      color,
      analysisTypes,
      compareColor
    );

    // Calculate overall score and generate summary
    const summary = generateAnalysisSummary(analysis);

    // Prepare response data
    const responseData: AnalyzeColorResponse = {
      color: params.color,
      analysis,
      summary,
    };

    if (compareColor && analysis.distance) {
      responseData.comparison = {
        compare_color: params.compare_color!,
        distance: analysis.distance,
      };
    }

    const executionTime = Date.now() - startTime;

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    if (!analysis.accessibility.wcag_aa_normal) {
      accessibilityNotes.push(
        'Does not meet WCAG AA standards for normal text'
      );
    }
    if (!analysis.accessibility.color_blind_safe) {
      accessibilityNotes.push('May be difficult for color-blind users');
    }
    if (analysis.contrast.best_contrast < 3.0) {
      accessibilityNotes.push('Very low contrast - avoid using for text');
    }

    // Generate recommendations
    const recommendations: string[] = [
      ...analysis.accessibility.recommendations,
    ];

    if (analysis.brightness.brightness_category === 'very_dark') {
      recommendations.push(
        'Consider using white or light text on this background'
      );
    } else if (analysis.brightness.brightness_category === 'very_light') {
      recommendations.push('Consider using dark text on this background');
    }

    if (analysis.temperature.temperature === 'warm') {
      recommendations.push(
        'This warm color works well for energetic, friendly designs'
      );
    } else if (analysis.temperature.temperature === 'cool') {
      recommendations.push(
        'This cool color works well for professional, calming designs'
      );
    }

    return createSuccessResponse('analyze_color', responseData, executionTime, {
      colorSpaceUsed: 'sRGB',
      accessibilityNotes: accessibilityNotes,
      recommendations: recommendations.slice(0, 5), // Limit to top 5 recommendations
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return createErrorResponse(
      'analyze_color',
      'ANALYSIS_ERROR',
      `Failed to analyze color: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime,
      {
        details: {
          color: params.color,
        },
        suggestions: [
          'Check that the color format is supported',
          'Try a different color format',
        ],
      }
    );
  }
}

/**
 * Generate analysis summary with overall score and key insights
 */
function generateAnalysisSummary(
  analysis: ColorAnalysisResult
): AnalyzeColorResponse['summary'] {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 100;

  // Evaluate accessibility
  if (!analysis.accessibility.wcag_aa_normal) {
    issues.push('Poor contrast for text');
    score -= 30;
  } else if (analysis.accessibility.wcag_aaa_normal) {
    strengths.push('Excellent contrast for text');
    score += 10;
  } else {
    strengths.push('Good contrast for text');
  }

  // Evaluate color blind safety
  if (!analysis.accessibility.color_blind_safe) {
    issues.push('May be problematic for color-blind users');
    score -= 20;
  } else {
    strengths.push('Color-blind friendly');
  }

  // Evaluate brightness
  if (
    analysis.brightness.brightness_category === 'very_dark' ||
    analysis.brightness.brightness_category === 'very_light'
  ) {
    strengths.push('High contrast potential');
  } else if (analysis.brightness.brightness_category === 'medium') {
    issues.push('Medium brightness may limit contrast options');
    score -= 10;
  }

  // Evaluate temperature characteristics
  if (analysis.temperature.temperature !== 'neutral') {
    strengths.push(`Clear ${analysis.temperature.temperature} temperature`);
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    overall_score: score,
    primary_issues: issues.slice(0, 3), // Top 3 issues
    strengths: strengths.slice(0, 3), // Top 3 strengths
  };
}

// Tool definition for MCP registration
export const analyzeColorTool = {
  name: 'analyze_color',
  description:
    'Analyze color properties including brightness, temperature, contrast, accessibility, and optionally compare with another color',
  parameters: analyzeColorSchema.describe(),
  handler: async (params: unknown) =>
    analyzeColor(params as AnalyzeColorParams),
};
