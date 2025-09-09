/**
 * Check Contrast MCP Tool
 * Check color contrast compliance with WCAG standards
 */

import { UnifiedColor } from '../color/unified-color';
import { ColorAnalyzer } from '../color/color-analysis';
import { ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { validateColorInput } from '../validation/schemas';

export interface CheckContrastParams {
  foreground: string;
  background: string;
  text_size?: 'normal' | 'large';
  standard?: 'WCAG_AA' | 'WCAG_AAA' | 'APCA';
}

export interface CheckContrastResponse {
  foreground: string;
  background: string;
  contrast_ratio: number;
  apca_score?: number;
  text_size: 'normal' | 'large';
  standard: string;
  compliance: {
    wcag_aa: boolean;
    wcag_aaa: boolean;
    apca_passes?: boolean;
    passes: boolean;
  };
  recommendations: string[];
  alternative_combinations?:
    | {
        foreground_adjustments: Array<{
          color: string;
          contrast_ratio: number;
          apca_score?: number;
          passes: boolean;
        }>;
        background_adjustments: Array<{
          color: string;
          contrast_ratio: number;
          apca_score?: number;
          passes: boolean;
        }>;
      }
    | undefined;
}

/**
 * Check contrast ratio between foreground and background colors
 */
export async function checkContrast(
  params: CheckContrastParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate required parameters
    if (!params.foreground) {
      return createErrorResponse(
        'check_contrast',
        'MISSING_PARAMETER',
        'Foreground color parameter is required',
        Date.now() - startTime,
        {
          details: { parameter: 'foreground' },
          suggestions: ['Provide a foreground color in any supported format'],
        }
      );
    }

    if (!params.background) {
      return createErrorResponse(
        'check_contrast',
        'MISSING_PARAMETER',
        'Background color parameter is required',
        Date.now() - startTime,
        {
          details: { parameter: 'background' },
          suggestions: ['Provide a background color in any supported format'],
        }
      );
    }

    // Validate color inputs
    const fgValidation = validateColorInput(params.foreground);
    if (!fgValidation.isValid) {
      return createErrorResponse(
        'check_contrast',
        'INVALID_FOREGROUND_COLOR',
        `Invalid foreground color format: ${params.foreground}`,
        Date.now() - startTime,
        {
          details: { provided: params.foreground, error: fgValidation.error },
          suggestions: [
            'Use a valid color format like #FF0000 or rgb(255, 0, 0)',
          ],
        }
      );
    }

    const bgValidation = validateColorInput(params.background);
    if (!bgValidation.isValid) {
      return createErrorResponse(
        'check_contrast',
        'INVALID_BACKGROUND_COLOR',
        `Invalid background color format: ${params.background}`,
        Date.now() - startTime,
        {
          details: { provided: params.background, error: bgValidation.error },
          suggestions: [
            'Use a valid color format like #FFFFFF or rgb(255, 255, 255)',
          ],
        }
      );
    }

    // Parse colors
    const foregroundColor = new UnifiedColor(params.foreground);
    const backgroundColor = new UnifiedColor(params.background);

    // Set defaults
    const textSize = params.text_size || 'normal';
    const standard = params.standard || 'WCAG_AA';

    // Check contrast
    const contrastResult = ColorAnalyzer.checkContrast(
      foregroundColor,
      backgroundColor,
      textSize,
      standard
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (!contrastResult.passes) {
      recommendations.push(
        'This color combination does not meet accessibility standards'
      );

      if (contrastResult.ratio < 3.0) {
        recommendations.push(
          'Consider using colors with more contrast difference'
        );
      }

      // Suggest adjustments
      if (
        foregroundColor.metadata?.brightness &&
        backgroundColor.metadata?.brightness
      ) {
        const fgBrightness = foregroundColor.metadata.brightness;
        const bgBrightness = backgroundColor.metadata.brightness;

        if (Math.abs(fgBrightness - bgBrightness) < 100) {
          if (fgBrightness > 127) {
            recommendations.push('Try using a darker foreground color');
          } else {
            recommendations.push('Try using a lighter foreground color');
          }

          if (bgBrightness > 127) {
            recommendations.push('Try using a darker background color');
          } else {
            recommendations.push('Try using a lighter background color');
          }
        }
      }
    } else {
      if (contrastResult.wcag_aaa) {
        recommendations.push('Excellent contrast - meets AAA standards');
      } else {
        recommendations.push('Good contrast - meets AA standards');
      }
    }

    // Generate alternative combinations
    const alternativeCombinations = await generateAlternatives(
      foregroundColor,
      backgroundColor,
      textSize,
      contrastResult.ratio,
      standard
    );

    // Prepare response
    const responseData: CheckContrastResponse = {
      foreground: params.foreground,
      background: params.background,
      contrast_ratio: contrastResult.ratio,
      text_size: textSize,
      standard,
      compliance: (() => {
        const compliance: CheckContrastResponse['compliance'] = {
          wcag_aa: contrastResult.wcag_aa,
          wcag_aaa: contrastResult.wcag_aaa,
          passes: contrastResult.passes,
        };

        if (standard === 'APCA') {
          compliance.apca_passes = contrastResult.passes;
        }

        return compliance;
      })(),
      recommendations,
      alternative_combinations: alternativeCombinations,
    };

    if (contrastResult.apca_score !== undefined) {
      responseData.apca_score = contrastResult.apca_score;
    }

    const executionTime = Date.now() - startTime;

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    if (!contrastResult.wcag_aa) {
      accessibilityNotes.push(
        `Contrast ratio ${contrastResult.ratio}:1 does not meet WCAG AA standards`
      );
    }
    if (contrastResult.wcag_aaa) {
      accessibilityNotes.push(
        `Excellent contrast ratio ${contrastResult.ratio}:1 meets WCAG AAA standards`
      );
    }

    return createSuccessResponse(
      'check_contrast',
      responseData,
      executionTime,
      {
        colorSpaceUsed: 'sRGB',
        accessibilityNotes: accessibilityNotes,
        recommendations: recommendations.slice(0, 5),
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return createErrorResponse(
      'check_contrast',
      'CONTRAST_CHECK_ERROR',
      `Failed to check contrast: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime,
      {
        details: {
          foreground: params.foreground,
          background: params.background,
        },
        suggestions: [
          'Check that both colors are in valid formats',
          'Try different color formats',
        ],
      }
    );
  }
}

/**
 * Generate alternative color combinations with better contrast
 */
async function generateAlternatives(
  foreground: UnifiedColor,
  background: UnifiedColor,
  textSize: 'normal' | 'large',
  currentRatio: number,
  standard: 'WCAG_AA' | 'WCAG_AAA' | 'APCA' = 'WCAG_AA'
): Promise<CheckContrastResponse['alternative_combinations']> {
  const targetRatio = textSize === 'large' ? 3.0 : 4.5;

  if (currentRatio >= targetRatio) {
    return undefined; // No alternatives needed
  }

  const foregroundAdjustments: Array<{
    color: string;
    contrast_ratio: number;
    passes: boolean;
  }> = [];

  const backgroundAdjustments: Array<{
    color: string;
    contrast_ratio: number;
    passes: boolean;
  }> = [];

  // Generate foreground adjustments (lighter and darker versions)
  const fgHsl = foreground.hsl;
  const lightnessAdjustments = [-40, -30, -20, 20, 30, 40];

  for (const adjustment of lightnessAdjustments) {
    const newLightness = Math.max(0, Math.min(100, fgHsl.l + adjustment));
    if (Math.abs(newLightness - fgHsl.l) < 5) continue; // Skip minimal changes

    try {
      const adjustedFg = UnifiedColor.fromHsl(fgHsl.h, fgHsl.s, newLightness);
      const contrastResult = ColorAnalyzer.checkContrast(
        adjustedFg,
        background,
        textSize,
        standard
      );

      const adjustment: {
        color: string;
        contrast_ratio: number;
        passes: boolean;
        apca_score?: number;
      } = {
        color: adjustedFg.hex,
        contrast_ratio: contrastResult.ratio,
        passes: contrastResult.passes,
      };

      if (contrastResult.apca_score !== undefined) {
        adjustment.apca_score = contrastResult.apca_score;
      }

      foregroundAdjustments.push(adjustment);
    } catch {
      // Skip invalid color combinations
    }
  }

  // Generate background adjustments
  const bgHsl = background.hsl;

  for (const adjustment of lightnessAdjustments) {
    const newLightness = Math.max(0, Math.min(100, bgHsl.l + adjustment));
    if (Math.abs(newLightness - bgHsl.l) < 5) continue; // Skip minimal changes

    try {
      const adjustedBg = UnifiedColor.fromHsl(bgHsl.h, bgHsl.s, newLightness);
      const contrastResult = ColorAnalyzer.checkContrast(
        foreground,
        adjustedBg,
        textSize,
        standard
      );

      const adjustment: {
        color: string;
        contrast_ratio: number;
        passes: boolean;
        apca_score?: number;
      } = {
        color: adjustedBg.hex,
        contrast_ratio: contrastResult.ratio,
        passes: contrastResult.passes,
      };

      if (contrastResult.apca_score !== undefined) {
        adjustment.apca_score = contrastResult.apca_score;
      }

      backgroundAdjustments.push(adjustment);
    } catch {
      // Skip invalid color combinations
    }
  }

  // Sort by contrast ratio (best first)
  foregroundAdjustments.sort((a, b) => b.contrast_ratio - a.contrast_ratio);
  backgroundAdjustments.sort((a, b) => b.contrast_ratio - a.contrast_ratio);

  return {
    foreground_adjustments: foregroundAdjustments.slice(0, 5), // Top 5 alternatives
    background_adjustments: backgroundAdjustments.slice(0, 5), // Top 5 alternatives
  };
}

// Tool definition for MCP registration
export const checkContrastTool = {
  name: 'check_contrast',
  description:
    'Check color contrast compliance with WCAG accessibility standards',
  parameters: {
    type: 'object',
    properties: {
      foreground: {
        type: 'string',
        description: 'Foreground color (typically text color)',
      },
      background: {
        type: 'string',
        description: 'Background color',
      },
      text_size: {
        type: 'string',
        enum: ['normal', 'large'],
        description: 'Text size category for WCAG compliance',
        default: 'normal',
      },
      standard: {
        type: 'string',
        enum: ['WCAG_AA', 'WCAG_AAA', 'APCA'],
        description: 'Accessibility standard to check against',
        default: 'WCAG_AA',
      },
    },
    required: ['foreground', 'background'],
  },
  handler: async (params: unknown) =>
    checkContrast(params as CheckContrastParams),
};
