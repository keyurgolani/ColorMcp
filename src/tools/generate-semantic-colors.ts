/**
 * Generate Semantic Colors MCP Tool
 * Map colors to semantic roles for UI design
 */

import { UnifiedColor } from '../color/unified-color';
import { ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { validateColorInput } from '../validation/schemas';

export interface GenerateSemanticColorsParams {
  base_palette: string[];
  semantic_roles?: Array<
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral'
  >;
  context?: 'web' | 'mobile' | 'desktop' | 'print';
  ensure_contrast?: boolean;
  accessibility_level?: 'AA' | 'AAA';
}

export interface SemanticColorRole {
  role: string;
  color: string;
  original_color?: string | undefined;
  adjusted: boolean;
  contrast_ratio?: number;
  accessibility_notes: string[];
  usage_guidelines: string[];
}

export interface GenerateSemanticColorsResponse {
  base_palette: string[];
  context: string;
  semantic_mapping: SemanticColorRole[];
  accessibility_report: {
    overall_compliance: 'AA' | 'AAA' | 'FAIL';
    contrast_issues: Array<{
      role: string;
      color: string;
      issue: string;
      recommendation: string;
    }>;
    adjustments_made: number;
  };
  usage_recommendations: string[];
}

/**
 * Generate semantic color mapping from base palette
 */
export async function generateSemanticColors(
  params: GenerateSemanticColorsParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate required parameters
    if (!params.base_palette || params.base_palette.length === 0) {
      return createErrorResponse(
        'generate_semantic_colors',
        'MISSING_PARAMETER',
        'Base palette parameter is required and must contain at least one color',
        Date.now() - startTime,
        {
          details: { parameter: 'base_palette' },
          suggestions: ['Provide an array of colors in any supported format'],
        }
      );
    }

    // Validate all colors in base palette
    const basePalette: UnifiedColor[] = [];
    for (let i = 0; i < params.base_palette.length; i++) {
      const colorStr = params.base_palette[i];
      if (!colorStr) {
        return createErrorResponse(
          'generate_semantic_colors',
          'INVALID_COLOR',
          `Color at index ${i} is undefined`,
          Date.now() - startTime,
          {
            details: { index: i },
            suggestions: ['Ensure all colors in the palette are defined'],
          }
        );
      }

      const validation = validateColorInput(colorStr);
      if (!validation.isValid) {
        return createErrorResponse(
          'generate_semantic_colors',
          'INVALID_COLOR',
          `Invalid color at index ${i}: ${colorStr}`,
          Date.now() - startTime,
          {
            details: { index: i, provided: colorStr, error: validation.error },
            suggestions: [
              'Ensure all colors are in valid formats like #FF0000 or rgb(255, 0, 0)',
            ],
          }
        );
      }
      basePalette.push(new UnifiedColor(colorStr));
    }

    // Set defaults
    const semanticRoles = params.semantic_roles || [
      'primary',
      'secondary',
      'success',
      'warning',
      'error',
      'info',
      'neutral',
    ];
    const context = params.context || 'web';
    const ensureContrast = params.ensure_contrast !== false; // Default to true
    const accessibilityLevel = params.accessibility_level || 'AA';

    // Generate semantic mapping
    const semanticMapping = await generateSemanticMapping(
      basePalette,
      semanticRoles,
      context,
      ensureContrast,
      accessibilityLevel
    );

    // Generate accessibility report
    const accessibilityReport = await generateSemanticAccessibilityReport(
      semanticMapping,
      accessibilityLevel
    );

    // Generate usage recommendations
    const usageRecommendations = generateUsageRecommendations(
      semanticMapping,
      context,
      accessibilityReport
    );

    // Prepare response
    const responseData: GenerateSemanticColorsResponse = {
      base_palette: params.base_palette,
      context,
      semantic_mapping: semanticMapping,
      accessibility_report: accessibilityReport,
      usage_recommendations: usageRecommendations,
    };

    const executionTime = Date.now() - startTime;

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    if (accessibilityReport.overall_compliance === 'FAIL') {
      accessibilityNotes.push(
        'Some semantic colors do not meet accessibility standards'
      );
    } else if (accessibilityReport.overall_compliance === 'AA') {
      accessibilityNotes.push('Semantic colors meet WCAG AA standards');
    } else {
      accessibilityNotes.push('Semantic colors meet WCAG AAA standards');
    }

    if (accessibilityReport.adjustments_made > 0) {
      accessibilityNotes.push(
        `${accessibilityReport.adjustments_made} colors were adjusted for accessibility`
      );
    }

    const recommendations: string[] = [];
    if (accessibilityReport.contrast_issues.length > 0) {
      recommendations.push(
        `${accessibilityReport.contrast_issues.length} contrast issues found`
      );
    }
    recommendations.push(...usageRecommendations.slice(0, 3));

    return createSuccessResponse(
      'generate_semantic_colors',
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
      'generate_semantic_colors',
      'SEMANTIC_MAPPING_ERROR',
      `Failed to generate semantic colors: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime,
      {
        details: {
          base_palette: params.base_palette,
          context: params.context,
        },
        suggestions: [
          'Check that all colors in the base palette are valid',
          'Ensure the context is supported',
          'Try with different parameters',
        ],
      }
    );
  }
}

/**
 * Generate semantic color mapping
 */
async function generateSemanticMapping(
  basePalette: UnifiedColor[],
  semanticRoles: string[],
  context: string,
  ensureContrast: boolean,
  accessibilityLevel: 'AA' | 'AAA'
): Promise<SemanticColorRole[]> {
  const mapping: SemanticColorRole[] = [];

  for (const role of semanticRoles) {
    const semanticColor = await assignColorToRole(
      role,
      basePalette,
      context,
      ensureContrast,
      accessibilityLevel
    );
    mapping.push(semanticColor);
  }

  return mapping;
}

/**
 * Assign a color to a specific semantic role
 */
async function assignColorToRole(
  role: string,
  basePalette: UnifiedColor[],
  context: string,
  ensureContrast: boolean,
  accessibilityLevel: 'AA' | 'AAA'
): Promise<SemanticColorRole> {
  if (basePalette.length === 0) {
    throw new Error('Base palette cannot be empty');
  }

  let bestColor: UnifiedColor;
  let adjusted = false;

  // Find the best color for this role based on color theory
  switch (role) {
    case 'primary':
      bestColor = findBestPrimaryColor(basePalette);
      break;
    case 'secondary':
      bestColor = findBestSecondaryColor(basePalette);
      break;
    case 'success':
      bestColor = findBestSuccessColor(basePalette);
      break;
    case 'warning':
      bestColor = findBestWarningColor(basePalette);
      break;
    case 'error':
      bestColor = findBestErrorColor(basePalette);
      break;
    case 'info':
      bestColor = findBestInfoColor(basePalette);
      break;
    case 'neutral':
      bestColor = findBestNeutralColor(basePalette);
      break;
    default:
      bestColor = basePalette[0]!; // Fallback to first color (we know it exists)
  }

  const originalColor = bestColor;

  // Adjust for accessibility if needed
  if (ensureContrast) {
    const adjustedColor = await adjustColorForAccessibility(
      bestColor,
      role,
      context,
      accessibilityLevel
    );
    if (adjustedColor.hex !== bestColor.hex) {
      bestColor = adjustedColor;
      adjusted = true;
    }
  }

  // Calculate contrast ratio against common backgrounds
  const whiteBackground = new UnifiedColor('#ffffff');
  const blackBackground = new UnifiedColor('#000000');
  const contrastRatio = Math.max(
    bestColor.getContrastRatio(whiteBackground),
    bestColor.getContrastRatio(blackBackground)
  );

  // Generate accessibility notes
  const accessibilityNotes = generateAccessibilityNotes(
    bestColor,
    role,
    contrastRatio,
    accessibilityLevel
  );

  // Generate usage guidelines
  const usageGuidelines = generateUsageGuidelines(role, bestColor, context);

  return {
    role,
    color: bestColor.hex,
    original_color: adjusted ? originalColor.hex : undefined,
    adjusted,
    contrast_ratio: contrastRatio,
    accessibility_notes: accessibilityNotes,
    usage_guidelines: usageGuidelines,
  };
}

/**
 * Find the best primary color from palette
 */
function findBestPrimaryColor(palette: UnifiedColor[]): UnifiedColor {
  if (palette.length === 0) {
    throw new Error('Palette cannot be empty');
  }

  // Look for colors with good saturation and moderate lightness
  let bestColor = palette[0]!;
  let bestScore = 0;

  for (const color of palette) {
    const hsl = color.hsl;
    // Score based on saturation (prefer higher) and balanced lightness
    const saturationScore = hsl.s / 100;
    const lightnessScore = 1 - Math.abs(hsl.l - 50) / 50; // Prefer colors around 50% lightness
    const score = saturationScore * 0.7 + lightnessScore * 0.3;

    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  return bestColor;
}

/**
 * Find the best secondary color from palette
 */
function findBestSecondaryColor(palette: UnifiedColor[]): UnifiedColor {
  if (palette.length === 0) {
    throw new Error('Palette cannot be empty');
  }
  if (palette.length < 2) return palette[0]!;

  const primaryColor = findBestPrimaryColor(palette);
  const primaryHue = primaryColor.hsl.h;

  // Look for analogous or complementary colors
  let bestColor = palette.find(c => c.hex !== primaryColor.hex) || palette[0]!;
  let bestScore = 0;

  for (const color of palette) {
    if (color.hex === primaryColor.hex) continue;

    const hue = color.hsl.h;
    const hueDiff = Math.abs(hue - primaryHue);
    const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);

    // Prefer analogous (30-60 degrees) or complementary (150-210 degrees)
    let harmonyScore = 0;
    if (normalizedDiff >= 30 && normalizedDiff <= 60) {
      harmonyScore = 1; // Analogous
    } else if (normalizedDiff >= 150 && normalizedDiff <= 210) {
      harmonyScore = 0.8; // Complementary
    } else {
      harmonyScore = 0.3; // Other relationships
    }

    if (harmonyScore > bestScore) {
      bestScore = harmonyScore;
      bestColor = color;
    }
  }

  return bestColor;
}

/**
 * Find the best success color (green-ish)
 */
function findBestSuccessColor(palette: UnifiedColor[]): UnifiedColor {
  if (palette.length === 0) {
    throw new Error('Palette cannot be empty');
  }

  let bestColor = palette[0]!;
  let bestScore = 0;

  for (const color of palette) {
    const hsl = color.hsl;
    // Prefer green hues (90-150 degrees)
    let hueScore = 0;
    if (hsl.h >= 90 && hsl.h <= 150) {
      hueScore = 1;
    } else if (hsl.h >= 60 && hsl.h <= 180) {
      hueScore = 0.7;
    } else {
      hueScore = 0.2;
    }

    const saturationScore = hsl.s / 100;
    const score = hueScore * 0.8 + saturationScore * 0.2;

    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  // If no good green found, create one
  if (bestScore < 0.5) {
    return UnifiedColor.fromHsl(120, 60, 45); // Default green
  }

  return bestColor;
}

/**
 * Find the best warning color (orange/yellow-ish)
 */
function findBestWarningColor(palette: UnifiedColor[]): UnifiedColor {
  if (palette.length === 0) {
    throw new Error('Palette cannot be empty');
  }

  let bestColor = palette[0]!;
  let bestScore = 0;

  for (const color of palette) {
    const hsl = color.hsl;
    // Prefer orange/yellow hues (30-60 degrees)
    let hueScore = 0;
    if (hsl.h >= 30 && hsl.h <= 60) {
      hueScore = 1;
    } else if (hsl.h >= 15 && hsl.h <= 75) {
      hueScore = 0.7;
    } else {
      hueScore = 0.2;
    }

    const saturationScore = hsl.s / 100;
    const score = hueScore * 0.8 + saturationScore * 0.2;

    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  // If no good orange/yellow found, create one
  if (bestScore < 0.5) {
    return UnifiedColor.fromHsl(45, 80, 55); // Default orange
  }

  return bestColor;
}

/**
 * Find the best error color (red-ish)
 */
function findBestErrorColor(palette: UnifiedColor[]): UnifiedColor {
  if (palette.length === 0) {
    throw new Error('Palette cannot be empty');
  }

  let bestColor = palette[0]!;
  let bestScore = 0;

  for (const color of palette) {
    const hsl = color.hsl;
    // Prefer red hues (0-30 or 330-360 degrees)
    let hueScore = 0;
    if ((hsl.h >= 0 && hsl.h <= 30) || (hsl.h >= 330 && hsl.h <= 360)) {
      hueScore = 1;
    } else if ((hsl.h >= 315 && hsl.h <= 360) || (hsl.h >= 0 && hsl.h <= 45)) {
      hueScore = 0.7;
    } else {
      hueScore = 0.2;
    }

    const saturationScore = hsl.s / 100;
    const score = hueScore * 0.8 + saturationScore * 0.2;

    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  // If no good red found, create one
  if (bestScore < 0.5) {
    return UnifiedColor.fromHsl(0, 70, 50); // Default red
  }

  return bestColor;
}

/**
 * Find the best info color (blue-ish)
 */
function findBestInfoColor(palette: UnifiedColor[]): UnifiedColor {
  if (palette.length === 0) {
    throw new Error('Palette cannot be empty');
  }

  let bestColor = palette[0]!;
  let bestScore = 0;

  for (const color of palette) {
    const hsl = color.hsl;
    // Prefer blue hues (210-270 degrees)
    let hueScore = 0;
    if (hsl.h >= 210 && hsl.h <= 270) {
      hueScore = 1;
    } else if (hsl.h >= 180 && hsl.h <= 300) {
      hueScore = 0.7;
    } else {
      hueScore = 0.2;
    }

    const saturationScore = hsl.s / 100;
    const score = hueScore * 0.8 + saturationScore * 0.2;

    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  // If no good blue found, create one
  if (bestScore < 0.5) {
    return UnifiedColor.fromHsl(220, 70, 50); // Default blue
  }

  return bestColor;
}

/**
 * Find the best neutral color (low saturation)
 */
function findBestNeutralColor(palette: UnifiedColor[]): UnifiedColor {
  if (palette.length === 0) {
    throw new Error('Palette cannot be empty');
  }

  let bestColor = palette[0]!;
  let bestScore = Infinity;

  for (const color of palette) {
    const hsl = color.hsl;
    // Prefer low saturation colors
    const saturationScore = hsl.s; // Lower is better for neutrals

    if (saturationScore < bestScore) {
      bestScore = saturationScore;
      bestColor = color;
    }
  }

  return bestColor;
}

/**
 * Adjust color for accessibility compliance
 */
async function adjustColorForAccessibility(
  color: UnifiedColor,
  _role: string,
  _context: string,
  level: 'AA' | 'AAA'
): Promise<UnifiedColor> {
  const targetRatio = level === 'AAA' ? 7.0 : 4.5;
  const whiteBackground = new UnifiedColor('#ffffff');
  const blackBackground = new UnifiedColor('#000000');

  const whiteContrast = color.getContrastRatio(whiteBackground);
  const blackContrast = color.getContrastRatio(blackBackground);
  const maxContrast = Math.max(whiteContrast, blackContrast);

  // If already meets requirements, return as-is
  if (maxContrast >= targetRatio) {
    return color;
  }

  // Adjust lightness to improve contrast
  const hsl = color.hsl;
  let adjustedColor = color;
  let bestContrast = maxContrast;

  // Try different lightness values
  for (let lightness = 10; lightness <= 90; lightness += 10) {
    const testColor = UnifiedColor.fromHsl(hsl.h, hsl.s, lightness);
    const testWhiteContrast = testColor.getContrastRatio(whiteBackground);
    const testBlackContrast = testColor.getContrastRatio(blackBackground);
    const testMaxContrast = Math.max(testWhiteContrast, testBlackContrast);

    if (testMaxContrast > bestContrast && testMaxContrast >= targetRatio) {
      bestContrast = testMaxContrast;
      adjustedColor = testColor;
    }
  }

  return adjustedColor;
}

/**
 * Generate accessibility notes for a semantic color
 */
function generateAccessibilityNotes(
  _color: UnifiedColor,
  role: string,
  contrastRatio: number,
  _level: 'AA' | 'AAA'
): string[] {
  const notes: string[] = [];

  if (contrastRatio >= 7.0) {
    notes.push('Excellent contrast - meets AAA standards');
  } else if (contrastRatio >= 4.5) {
    notes.push('Good contrast - meets AA standards');
  } else if (contrastRatio >= 3.0) {
    notes.push('Acceptable for UI elements but not for text');
  } else {
    notes.push('Poor contrast - may not be accessible');
  }

  // Role-specific notes
  if (role === 'error' && contrastRatio < 4.5) {
    notes.push('Error colors should have high contrast for visibility');
  }
  if (role === 'warning' && contrastRatio < 3.0) {
    notes.push('Warning colors should be easily distinguishable');
  }

  return notes;
}

/**
 * Generate usage guidelines for a semantic color
 */
function generateUsageGuidelines(
  role: string,
  _color: UnifiedColor,
  context: string
): string[] {
  const guidelines: string[] = [];

  switch (role) {
    case 'primary':
      guidelines.push('Use for main actions, links, and brand elements');
      guidelines.push('Ensure sufficient contrast against backgrounds');
      if (context === 'web') {
        guidelines.push('Consider hover and focus states');
      }
      break;

    case 'secondary':
      guidelines.push('Use for secondary actions and supporting elements');
      guidelines.push('Should complement but not compete with primary color');
      break;

    case 'success':
      guidelines.push(
        'Use for positive feedback, confirmations, and success states'
      );
      guidelines.push('Avoid using green alone - add icons or text');
      break;

    case 'warning':
      guidelines.push(
        'Use for cautions, warnings, and attention-needed states'
      );
      guidelines.push('Ensure visibility for colorblind users');
      break;

    case 'error':
      guidelines.push('Use for errors, failures, and destructive actions');
      guidelines.push('Must have high contrast for accessibility');
      break;

    case 'info':
      guidelines.push('Use for informational messages and neutral feedback');
      guidelines.push('Should be distinguishable from primary colors');
      break;

    case 'neutral':
      guidelines.push('Use for borders, dividers, and subtle backgrounds');
      guidelines.push('Should not interfere with content readability');
      break;
  }

  // Context-specific guidelines
  if (context === 'mobile') {
    guidelines.push('Ensure touch targets are clearly visible');
  } else if (context === 'print') {
    guidelines.push('Test appearance in grayscale');
  }

  return guidelines;
}

/**
 * Generate accessibility report for semantic mapping
 */
async function generateSemanticAccessibilityReport(
  semanticMapping: SemanticColorRole[],
  level: 'AA' | 'AAA'
): Promise<GenerateSemanticColorsResponse['accessibility_report']> {
  const contrastIssues: Array<{
    role: string;
    color: string;
    issue: string;
    recommendation: string;
  }> = [];

  let adjustmentsMade = 0;
  let worstCompliance: 'AA' | 'AAA' | 'FAIL' = 'AAA';

  for (const mapping of semanticMapping) {
    if (mapping.adjusted) {
      adjustmentsMade++;
    }

    const contrastRatio = mapping.contrast_ratio || 0;

    if (contrastRatio < 3.0) {
      worstCompliance = 'FAIL';
      contrastIssues.push({
        role: mapping.role,
        color: mapping.color,
        issue: 'Insufficient contrast for accessibility',
        recommendation: 'Increase lightness difference from backgrounds',
      });
    } else if (contrastRatio < 4.5 && worstCompliance !== 'FAIL') {
      if (level === 'AA') {
        contrastIssues.push({
          role: mapping.role,
          color: mapping.color,
          issue: 'Does not meet AA standards for text',
          recommendation: 'Use only for UI elements, not text',
        });
      } else {
        worstCompliance = 'AA';
      }
    } else if (
      contrastRatio < 7.0 &&
      level === 'AAA' &&
      worstCompliance === 'AAA'
    ) {
      worstCompliance = 'AA';
    }
  }

  return {
    overall_compliance: worstCompliance,
    contrast_issues: contrastIssues,
    adjustments_made: adjustmentsMade,
  };
}

/**
 * Generate usage recommendations
 */
function generateUsageRecommendations(
  _semanticMapping: SemanticColorRole[],
  context: string,
  accessibilityReport: GenerateSemanticColorsResponse['accessibility_report']
): string[] {
  const recommendations: string[] = [];

  // General recommendations
  recommendations.push('Test colors with actual content and backgrounds');
  recommendations.push(
    'Consider colorblind users - use icons and text alongside colors'
  );

  // Context-specific recommendations
  if (context === 'web') {
    recommendations.push(
      'Define hover and focus states for interactive elements'
    );
    recommendations.push('Test across different devices and screen settings');
  } else if (context === 'mobile') {
    recommendations.push('Ensure colors work in both light and dark modes');
    recommendations.push('Test under various lighting conditions');
  } else if (context === 'print') {
    recommendations.push('Verify colors work in grayscale');
    recommendations.push('Consider ink costs for large color areas');
  }

  // Accessibility-based recommendations
  if (accessibilityReport.overall_compliance === 'FAIL') {
    recommendations.push('Improve contrast ratios before using in production');
  }
  if (accessibilityReport.adjustments_made > 0) {
    recommendations.push(
      'Review adjusted colors to ensure they still meet design goals'
    );
  }

  return recommendations;
}

// Tool definition for MCP registration
export const generateSemanticColorsTool = {
  name: 'generate_semantic_colors',
  description:
    'Map colors to semantic roles for UI design with accessibility compliance',
  parameters: {
    type: 'object',
    properties: {
      base_palette: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Array of base colors to map to semantic roles',
      },
      semantic_roles: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'primary',
            'secondary',
            'success',
            'warning',
            'error',
            'info',
            'neutral',
          ],
        },
        description: 'Semantic roles to generate colors for',
        default: [
          'primary',
          'secondary',
          'success',
          'warning',
          'error',
          'info',
          'neutral',
        ],
      },
      context: {
        type: 'string',
        enum: ['web', 'mobile', 'desktop', 'print'],
        description: 'Context for color usage',
        default: 'web',
      },
      ensure_contrast: {
        type: 'boolean',
        description: 'Ensure WCAG contrast compliance',
        default: true,
      },
      accessibility_level: {
        type: 'string',
        enum: ['AA', 'AAA'],
        description: 'WCAG accessibility level to target',
        default: 'AA',
      },
    },
    required: ['base_palette'],
  },
  handler: async (params: unknown) =>
    generateSemanticColors(params as GenerateSemanticColorsParams),
};
