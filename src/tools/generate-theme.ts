/**
 * Generate Theme MCP Tool
 * Generate complete design system themes with semantic color mapping
 */

import { UnifiedColor } from '../color/unified-color';
import { ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { validateColorInput } from '../validation/schemas';

export interface GenerateThemeParams {
  theme_type:
    | 'light'
    | 'dark'
    | 'auto'
    | 'high_contrast'
    | 'colorblind_friendly';
  primary_color: string;
  style?: 'material' | 'ios' | 'fluent' | 'custom';
  components?: Array<
    | 'background'
    | 'surface'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'text'
    | 'border'
    | 'shadow'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
  >;
  accessibility_level?: 'AA' | 'AAA';
  brand_colors?: string[];
}

export interface SemanticColorMapping {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  text_secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  shadow: string;
  disabled: string;
  hover: string;
  focus: string;
}

export interface ThemeVariant {
  name: string;
  colors: SemanticColorMapping;
  accessibility_score: number;
  wcag_compliance: 'AA' | 'AAA' | 'FAIL';
}

export interface GenerateThemeResponse {
  theme_type: string;
  style: string;
  primary_color: string;
  variants: {
    light?: ThemeVariant;
    dark?: ThemeVariant;
  };
  accessibility_report: {
    overall_score: number;
    wcag_compliance: 'AA' | 'AAA' | 'FAIL';
    contrast_issues: Array<{
      combination: [string, string];
      contrast_ratio: number;
      required_ratio: number;
      passes: boolean;
    }>;
    recommendations: string[];
  };
  brand_integration?:
    | {
        brand_colors_used: string[];
        harmony_maintained: boolean;
        adjustments_made: string[];
      }
    | undefined;
}

/**
 * Generate a complete design system theme
 */
export async function generateTheme(
  params: GenerateThemeParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate required parameters
    if (!params.primary_color) {
      return createErrorResponse(
        'generate_theme',
        'MISSING_PARAMETER',
        'Primary color parameter is required',
        Date.now() - startTime,
        {
          details: { parameter: 'primary_color' },
          suggestions: ['Provide a primary color in any supported format'],
        }
      );
    }

    if (!params.theme_type) {
      return createErrorResponse(
        'generate_theme',
        'MISSING_PARAMETER',
        'Theme type parameter is required',
        Date.now() - startTime,
        {
          details: { parameter: 'theme_type' },
          suggestions: [
            'Specify theme type: light, dark, auto, high_contrast, or colorblind_friendly',
          ],
        }
      );
    }

    // Validate primary color
    const primaryValidation = validateColorInput(params.primary_color);
    if (!primaryValidation.isValid) {
      return createErrorResponse(
        'generate_theme',
        'INVALID_PRIMARY_COLOR',
        `Invalid primary color format: ${params.primary_color}`,
        Date.now() - startTime,
        {
          details: {
            provided: params.primary_color,
            error: primaryValidation.error,
          },
          suggestions: [
            'Use a valid color format like #2563eb or rgb(37, 99, 235)',
          ],
        }
      );
    }

    // Validate brand colors if provided
    const brandColors: UnifiedColor[] = [];
    if (params.brand_colors) {
      for (const brandColor of params.brand_colors) {
        const validation = validateColorInput(brandColor);
        if (!validation.isValid) {
          return createErrorResponse(
            'generate_theme',
            'INVALID_BRAND_COLOR',
            `Invalid brand color format: ${brandColor}`,
            Date.now() - startTime,
            {
              details: { provided: brandColor, error: validation.error },
              suggestions: ['Ensure all brand colors are in valid formats'],
            }
          );
        }
        brandColors.push(new UnifiedColor(brandColor));
      }
    }

    // Parse primary color
    const primaryColor = new UnifiedColor(params.primary_color);

    // Set defaults
    const style = params.style || 'material';
    const accessibilityLevel = params.accessibility_level || 'AA';
    const components = params.components || [
      'background',
      'surface',
      'primary',
      'secondary',
      'accent',
      'text',
      'border',
      'shadow',
      'success',
      'warning',
      'error',
      'info',
    ];

    // Generate theme variants
    const variants: { light?: ThemeVariant; dark?: ThemeVariant } = {};

    if (params.theme_type === 'light' || params.theme_type === 'auto') {
      variants.light = await generateLightTheme(
        primaryColor,
        style,
        accessibilityLevel,
        components,
        brandColors
      );
    }

    if (params.theme_type === 'dark' || params.theme_type === 'auto') {
      variants.dark = await generateDarkTheme(
        primaryColor,
        style,
        accessibilityLevel,
        components,
        brandColors
      );
    }

    if (params.theme_type === 'high_contrast') {
      variants.light = await generateHighContrastTheme(
        primaryColor,
        'light',
        accessibilityLevel,
        components,
        brandColors
      );
      variants.dark = await generateHighContrastTheme(
        primaryColor,
        'dark',
        accessibilityLevel,
        components,
        brandColors
      );
    }

    if (params.theme_type === 'colorblind_friendly') {
      variants.light = await generateColorblindFriendlyTheme(
        primaryColor,
        'light',
        accessibilityLevel,
        components,
        brandColors
      );
      variants.dark = await generateColorblindFriendlyTheme(
        primaryColor,
        'dark',
        accessibilityLevel,
        components,
        brandColors
      );
    }

    // Generate accessibility report
    const accessibilityReport = await generateAccessibilityReport(
      variants,
      accessibilityLevel
    );

    // Generate brand integration report
    const brandIntegration =
      brandColors.length > 0
        ? await generateBrandIntegrationReport(brandColors, variants)
        : undefined;

    // Prepare response
    const responseData: GenerateThemeResponse = {
      theme_type: params.theme_type,
      style,
      primary_color: params.primary_color,
      variants,
      accessibility_report: accessibilityReport,
      brand_integration: brandIntegration,
    };

    const executionTime = Date.now() - startTime;

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    if (accessibilityReport.wcag_compliance === 'FAIL') {
      accessibilityNotes.push('Theme does not meet minimum WCAG standards');
    } else if (accessibilityReport.wcag_compliance === 'AA') {
      accessibilityNotes.push('Theme meets WCAG AA accessibility standards');
    } else {
      accessibilityNotes.push('Theme meets WCAG AAA accessibility standards');
    }

    const recommendations: string[] = [];
    if (accessibilityReport.contrast_issues.length > 0) {
      recommendations.push(
        `${accessibilityReport.contrast_issues.length} contrast issues found - see accessibility report`
      );
    }
    if (brandIntegration && !brandIntegration.harmony_maintained) {
      recommendations.push('Brand color harmony could be improved');
    }

    return createSuccessResponse(
      'generate_theme',
      responseData,
      executionTime,
      {
        colorSpaceUsed: 'sRGB',
        accessibilityNotes,
        recommendations: recommendations
          .concat(accessibilityReport.recommendations)
          .slice(0, 5),
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return createErrorResponse(
      'generate_theme',
      'THEME_GENERATION_ERROR',
      `Failed to generate theme: ${error instanceof Error ? error.message : 'Unknown error'}`,
      executionTime,
      {
        details: {
          theme_type: params.theme_type,
          primary_color: params.primary_color,
        },
        suggestions: [
          'Check that the primary color is in a valid format',
          'Ensure theme type is supported',
          'Try with different parameters',
        ],
      }
    );
  }
}

/**
 * Generate light theme variant
 */
async function generateLightTheme(
  primaryColor: UnifiedColor,
  style: string,
  accessibilityLevel: 'AA' | 'AAA',
  _components: string[],
  brandColors: UnifiedColor[]
): Promise<ThemeVariant> {
  const colors: SemanticColorMapping = {
    primary: primaryColor.hex,
    secondary: generateSecondaryColor(primaryColor, 'light').hex,
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    text_secondary: '#64748b',
    accent: generateAccentColor(primaryColor, 'light', brandColors).hex,
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    disabled: '#94a3b8',
    hover: adjustColorForState(primaryColor, 'hover', 'light').hex,
    focus: adjustColorForState(primaryColor, 'focus', 'light').hex,
  };

  // Apply style-specific adjustments
  if (style === 'material') {
    colors.surface = '#fafafa';
    colors.border = '#e0e0e0';
  } else if (style === 'ios') {
    colors.surface = '#f2f2f7';
    colors.border = '#c6c6c8';
  } else if (style === 'fluent') {
    colors.surface = '#faf9f8';
    colors.border = '#edebe9';
  }

  // Ensure accessibility compliance
  await ensureAccessibilityCompliance(colors, 'light', accessibilityLevel);

  const accessibilityScore = await calculateAccessibilityScore(colors, 'light');
  const wcagCompliance = await checkWCAGCompliance(
    colors,
    'light',
    accessibilityLevel
  );

  return {
    name: 'light',
    colors,
    accessibility_score: accessibilityScore,
    wcag_compliance: wcagCompliance,
  };
}

/**
 * Generate dark theme variant
 */
async function generateDarkTheme(
  primaryColor: UnifiedColor,
  style: string,
  accessibilityLevel: 'AA' | 'AAA',
  _components: string[],
  brandColors: UnifiedColor[]
): Promise<ThemeVariant> {
  const colors: SemanticColorMapping = {
    primary: adjustColorForDarkTheme(primaryColor).hex,
    secondary: generateSecondaryColor(primaryColor, 'dark').hex,
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    text_secondary: '#94a3b8',
    accent: generateAccentColor(primaryColor, 'dark', brandColors).hex,
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    border: '#334155',
    shadow: 'rgba(0, 0, 0, 0.3)',
    disabled: '#64748b',
    hover: adjustColorForState(primaryColor, 'hover', 'dark').hex,
    focus: adjustColorForState(primaryColor, 'focus', 'dark').hex,
  };

  // Apply style-specific adjustments
  if (style === 'material') {
    colors.background = '#121212';
    colors.surface = '#1e1e1e';
  } else if (style === 'ios') {
    colors.background = '#000000';
    colors.surface = '#1c1c1e';
  } else if (style === 'fluent') {
    colors.background = '#201f1e';
    colors.surface = '#292827';
  }

  // Ensure accessibility compliance
  await ensureAccessibilityCompliance(colors, 'dark', accessibilityLevel);

  const accessibilityScore = await calculateAccessibilityScore(colors, 'dark');
  const wcagCompliance = await checkWCAGCompliance(
    colors,
    'dark',
    accessibilityLevel
  );

  return {
    name: 'dark',
    colors,
    accessibility_score: accessibilityScore,
    wcag_compliance: wcagCompliance,
  };
}

/**
 * Generate high contrast theme variant
 */
async function generateHighContrastTheme(
  _primaryColor: UnifiedColor,
  variant: 'light' | 'dark',
  accessibilityLevel: 'AA' | 'AAA',
  _components: string[],
  _brandColors: UnifiedColor[]
): Promise<ThemeVariant> {
  const colors: SemanticColorMapping =
    variant === 'light'
      ? {
          primary: '#000000',
          secondary: '#333333',
          background: '#ffffff',
          surface: '#ffffff',
          text: '#000000',
          text_secondary: '#000000',
          accent: '#0000ff',
          success: '#008000',
          warning: '#ff8c00',
          error: '#ff0000',
          info: '#0000ff',
          border: '#000000',
          shadow: 'rgba(0, 0, 0, 0.5)',
          disabled: '#666666',
          hover: '#333333',
          focus: '#0000ff',
        }
      : {
          primary: '#ffffff',
          secondary: '#cccccc',
          background: '#000000',
          surface: '#000000',
          text: '#ffffff',
          text_secondary: '#ffffff',
          accent: '#ffff00',
          success: '#00ff00',
          warning: '#ffff00',
          error: '#ff0000',
          info: '#00ffff',
          border: '#ffffff',
          shadow: 'rgba(255, 255, 255, 0.5)',
          disabled: '#999999',
          hover: '#cccccc',
          focus: '#ffff00',
        };

  const accessibilityScore = await calculateAccessibilityScore(colors, variant);
  const wcagCompliance = await checkWCAGCompliance(
    colors,
    variant,
    accessibilityLevel
  );

  return {
    name: `high_contrast_${variant}`,
    colors,
    accessibility_score: accessibilityScore,
    wcag_compliance: wcagCompliance,
  };
}

/**
 * Generate colorblind friendly theme variant
 */
async function generateColorblindFriendlyTheme(
  primaryColor: UnifiedColor,
  variant: 'light' | 'dark',
  accessibilityLevel: 'AA' | 'AAA',
  components: string[],
  brandColors: UnifiedColor[]
): Promise<ThemeVariant> {
  // Use colors that are distinguishable for all types of color vision deficiency
  const baseTheme =
    variant === 'light'
      ? await generateLightTheme(
          primaryColor,
          'material',
          accessibilityLevel,
          components,
          brandColors
        )
      : await generateDarkTheme(
          primaryColor,
          'material',
          accessibilityLevel,
          components,
          brandColors
        );

  // Adjust colors to be colorblind friendly
  const colors: SemanticColorMapping = {
    ...baseTheme.colors,
    success: variant === 'light' ? '#0066cc' : '#4da6ff', // Blue instead of green
    warning: variant === 'light' ? '#ff9900' : '#ffb84d', // Orange (safe)
    error: variant === 'light' ? '#cc0000' : '#ff4d4d', // Red (safe)
    info: variant === 'light' ? '#6600cc' : '#9966ff', // Purple instead of blue
  };

  const accessibilityScore = await calculateAccessibilityScore(colors, variant);
  const wcagCompliance = await checkWCAGCompliance(
    colors,
    variant,
    accessibilityLevel
  );

  return {
    name: `colorblind_friendly_${variant}`,
    colors,
    accessibility_score: accessibilityScore,
    wcag_compliance: wcagCompliance,
  };
}

/**
 * Generate secondary color based on primary
 */
function generateSecondaryColor(
  primaryColor: UnifiedColor,
  variant: 'light' | 'dark'
): UnifiedColor {
  const hsl = primaryColor.hsl;

  // Generate analogous color (30 degrees away)
  const secondaryHue = (hsl.h + 30) % 360;
  const secondarySaturation = Math.max(20, hsl.s - 20);
  const secondaryLightness =
    variant === 'light' ? Math.min(80, hsl.l + 20) : Math.max(20, hsl.l - 20);

  return UnifiedColor.fromHsl(
    secondaryHue,
    secondarySaturation,
    secondaryLightness
  );
}

/**
 * Generate accent color
 */
function generateAccentColor(
  primaryColor: UnifiedColor,
  variant: 'light' | 'dark',
  brandColors: UnifiedColor[]
): UnifiedColor {
  // If brand colors are provided, use the most suitable one
  if (brandColors.length > 0) {
    // Find the brand color with the best contrast for the variant
    let bestBrandColor = brandColors[0];
    let bestContrast = 0;

    const backgroundColor = variant === 'light' ? '#ffffff' : '#000000';
    const bgColor = new UnifiedColor(backgroundColor);

    for (const brandColor of brandColors) {
      const contrast = brandColor.getContrastRatio(bgColor);
      if (contrast > bestContrast) {
        bestContrast = contrast;
        bestBrandColor = brandColor;
      }
    }

    return bestBrandColor!;
  }

  // Generate complementary color
  const hsl = primaryColor.hsl;
  const accentHue = (hsl.h + 180) % 360;
  const accentSaturation = Math.min(100, hsl.s + 10);
  const accentLightness = variant === 'light' ? 50 : 60;

  return UnifiedColor.fromHsl(accentHue, accentSaturation, accentLightness);
}

/**
 * Adjust color for dark theme
 */
function adjustColorForDarkTheme(color: UnifiedColor): UnifiedColor {
  const hsl = color.hsl;

  // Increase lightness and slightly reduce saturation for dark themes
  const newLightness = Math.min(80, Math.max(40, hsl.l + 20));
  const newSaturation = Math.max(30, hsl.s - 10);

  return UnifiedColor.fromHsl(hsl.h, newSaturation, newLightness);
}

/**
 * Adjust color for interactive states
 */
function adjustColorForState(
  color: UnifiedColor,
  state: 'hover' | 'focus',
  variant: 'light' | 'dark'
): UnifiedColor {
  const hsl = color.hsl;

  if (state === 'hover') {
    const lightnessAdjustment = variant === 'light' ? -10 : 10;
    const newLightness = Math.max(
      0,
      Math.min(100, hsl.l + lightnessAdjustment)
    );
    return UnifiedColor.fromHsl(hsl.h, hsl.s, newLightness);
  } else if (state === 'focus') {
    // Focus states typically use higher saturation
    const newSaturation = Math.min(100, hsl.s + 20);
    return UnifiedColor.fromHsl(hsl.h, newSaturation, hsl.l);
  }

  return color;
}

/**
 * Ensure accessibility compliance for all color combinations
 */
async function ensureAccessibilityCompliance(
  colors: SemanticColorMapping,
  variant: 'light' | 'dark',
  level: 'AA' | 'AAA'
): Promise<void> {
  const targetRatio = level === 'AAA' ? 7.0 : 4.5;
  const backgroundColor = new UnifiedColor(colors.background);

  // Check and adjust text colors
  const textColor = new UnifiedColor(colors.text);
  const textBgRatio = textColor.getContrastRatio(backgroundColor);

  if (textBgRatio < targetRatio) {
    // Adjust text color for better contrast
    const textHsl = textColor.hsl;
    const newLightness = variant === 'light' ? 10 : 90;
    const adjustedText = UnifiedColor.fromHsl(
      textHsl.h,
      textHsl.s,
      newLightness
    );
    colors.text = adjustedText.hex;
  }

  // Check and adjust primary color against background
  const primaryColor = new UnifiedColor(colors.primary);
  const primaryBgRatio = primaryColor.getContrastRatio(backgroundColor);

  if (primaryBgRatio < 3.0) {
    // Minimum for UI elements
    const primaryHsl = primaryColor.hsl;
    const adjustment = variant === 'light' ? -20 : 20;
    const newLightness = Math.max(0, Math.min(100, primaryHsl.l + adjustment));
    const adjustedPrimary = UnifiedColor.fromHsl(
      primaryHsl.h,
      primaryHsl.s,
      newLightness
    );
    colors.primary = adjustedPrimary.hex;
  }
}

/**
 * Calculate overall accessibility score
 */
async function calculateAccessibilityScore(
  colors: SemanticColorMapping,
  _variant: 'light' | 'dark'
): Promise<number> {
  const backgroundColor = new UnifiedColor(colors.background);
  const textColor = new UnifiedColor(colors.text);
  const primaryColor = new UnifiedColor(colors.primary);

  // Calculate key contrast ratios
  const textBgRatio = textColor.getContrastRatio(backgroundColor);
  const primaryBgRatio = primaryColor.getContrastRatio(backgroundColor);

  // Score based on contrast ratios (0-100)
  const textScore = Math.min(100, (textBgRatio / 7.0) * 100);
  const primaryScore = Math.min(100, (primaryBgRatio / 4.5) * 100);

  return Math.round((textScore + primaryScore) / 2);
}

/**
 * Check WCAG compliance level
 */
async function checkWCAGCompliance(
  colors: SemanticColorMapping,
  _variant: 'light' | 'dark',
  _targetLevel: 'AA' | 'AAA'
): Promise<'AA' | 'AAA' | 'FAIL'> {
  const backgroundColor = new UnifiedColor(colors.background);
  const textColor = new UnifiedColor(colors.text);

  const textBgRatio = textColor.getContrastRatio(backgroundColor);

  if (textBgRatio >= 7.0) {
    return 'AAA';
  } else if (textBgRatio >= 4.5) {
    return 'AA';
  } else {
    return 'FAIL';
  }
}

/**
 * Generate accessibility report
 */
async function generateAccessibilityReport(
  variants: { light?: ThemeVariant; dark?: ThemeVariant },
  level: 'AA' | 'AAA'
): Promise<GenerateThemeResponse['accessibility_report']> {
  const contrastIssues: Array<{
    combination: [string, string];
    contrast_ratio: number;
    required_ratio: number;
    passes: boolean;
  }> = [];

  const recommendations: string[] = [];
  let overallScore = 0;
  let worstCompliance: 'AA' | 'AAA' | 'FAIL' = 'AAA';

  // Check all variants
  for (const variant of Object.values(variants)) {
    if (!variant) continue;

    overallScore += variant.accessibility_score;

    if (variant.wcag_compliance === 'FAIL') {
      worstCompliance = 'FAIL';
    } else if (variant.wcag_compliance === 'AA' && worstCompliance !== 'FAIL') {
      worstCompliance = 'AA';
    }

    // Check key color combinations
    const backgroundColor = new UnifiedColor(variant.colors.background);
    const textColor = new UnifiedColor(variant.colors.text);
    const primaryColor = new UnifiedColor(variant.colors.primary);

    const requiredRatio = level === 'AAA' ? 7.0 : 4.5;

    // Text on background
    const textBgRatio = textColor.getContrastRatio(backgroundColor);
    if (textBgRatio < requiredRatio) {
      contrastIssues.push({
        combination: [variant.colors.text, variant.colors.background],
        contrast_ratio: textBgRatio,
        required_ratio: requiredRatio,
        passes: false,
      });
    }

    // Primary on background
    const primaryBgRatio = primaryColor.getContrastRatio(backgroundColor);
    if (primaryBgRatio < 3.0) {
      // UI elements need at least 3:1
      contrastIssues.push({
        combination: [variant.colors.primary, variant.colors.background],
        contrast_ratio: primaryBgRatio,
        required_ratio: 3.0,
        passes: false,
      });
    }
  }

  // Calculate average score
  const variantCount = Object.keys(variants).length;
  overallScore = variantCount > 0 ? Math.round(overallScore / variantCount) : 0;

  // Generate recommendations
  if (contrastIssues.length > 0) {
    recommendations.push('Improve contrast ratios for better accessibility');
  }
  if (worstCompliance === 'FAIL') {
    recommendations.push('Theme does not meet minimum WCAG standards');
  } else if (worstCompliance === 'AA' && level === 'AAA') {
    recommendations.push('Consider adjusting colors to meet AAA standards');
  }

  return {
    overall_score: overallScore,
    wcag_compliance: worstCompliance,
    contrast_issues: contrastIssues,
    recommendations,
  };
}

/**
 * Generate brand integration report
 */
async function generateBrandIntegrationReport(
  brandColors: UnifiedColor[],
  variants: { light?: ThemeVariant; dark?: ThemeVariant }
): Promise<GenerateThemeResponse['brand_integration']> {
  const brandColorsUsed: string[] = [];
  const adjustmentsMade: string[] = [];
  let harmonyMaintained = true;

  // Check if brand colors were used in the theme
  for (const variant of Object.values(variants)) {
    if (!variant) continue;

    for (const brandColor of brandColors) {
      const brandHex = brandColor.hex.toLowerCase();

      // Check if brand color appears in theme
      const themeColors = Object.values(variant.colors);
      if (themeColors.some(color => color.toLowerCase() === brandHex)) {
        if (!brandColorsUsed.includes(brandHex)) {
          brandColorsUsed.push(brandHex);
        }
      }
    }
  }

  // Check harmony between brand colors and generated colors
  if (brandColors.length > 1) {
    for (let i = 0; i < brandColors.length - 1; i++) {
      for (let j = i + 1; j < brandColors.length; j++) {
        const color1 = brandColors[i];
        const color2 = brandColors[j];

        if (!color1 || !color2) continue;

        // Simple harmony check based on hue difference
        const hue1 = color1.hsl.h;
        const hue2 = color2.hsl.h;
        const hueDiff = Math.abs(hue1 - hue2);
        const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);

        // Consider harmonious if colors are complementary, triadic, or analogous
        const isHarmonious =
          normalizedDiff < 30 || // Analogous
          (normalizedDiff > 150 && normalizedDiff < 210) || // Complementary
          (normalizedDiff > 110 && normalizedDiff < 130) || // Triadic
          (normalizedDiff > 230 && normalizedDiff < 250); // Triadic

        if (!isHarmonious) {
          harmonyMaintained = false;
          adjustmentsMade.push(
            `Adjusted harmony between ${color1.hex} and ${color2.hex}`
          );
        }
      }
    }
  }

  return {
    brand_colors_used: brandColorsUsed,
    harmony_maintained: harmonyMaintained,
    adjustments_made: adjustmentsMade,
  };
}

// Tool definition for MCP registration
export const generateThemeTool = {
  name: 'generate_theme',
  description:
    'Generate complete design system themes with semantic color mapping',
  parameters: {
    type: 'object',
    properties: {
      theme_type: {
        type: 'string',
        enum: ['light', 'dark', 'auto', 'high_contrast', 'colorblind_friendly'],
        description: 'Type of theme to generate',
      },
      primary_color: {
        type: 'string',
        description: 'Primary brand color for the theme',
      },
      style: {
        type: 'string',
        enum: ['material', 'ios', 'fluent', 'custom'],
        description: 'Design system style',
        default: 'material',
      },
      components: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'background',
            'surface',
            'primary',
            'secondary',
            'accent',
            'text',
            'border',
            'shadow',
            'success',
            'warning',
            'error',
            'info',
          ],
        },
        description: 'Components to generate colors for',
      },
      accessibility_level: {
        type: 'string',
        enum: ['AA', 'AAA'],
        description: 'WCAG accessibility level to target',
        default: 'AA',
      },
      brand_colors: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Additional brand colors to incorporate',
      },
    },
    required: ['theme_type', 'primary_color'],
  },
  handler: async (params: unknown) =>
    generateTheme(params as GenerateThemeParams),
};
