/**
 * Comprehensive color analysis system with brightness, temperature, contrast, and distance calculations
 */

import { UnifiedColor, RGB, LAB } from './unified-color';

export interface ColorAnalysisResult {
  brightness: BrightnessAnalysis;
  temperature: TemperatureAnalysis;
  contrast: ContrastAnalysis;
  accessibility: AccessibilityAnalysis;
  distance?: DistanceAnalysis;
}

export interface BrightnessAnalysis {
  perceived_brightness: number; // 0-255
  relative_luminance: number; // 0-1
  brightness_category: 'very_dark' | 'dark' | 'medium' | 'light' | 'very_light';
  is_light: boolean;
}

export interface TemperatureAnalysis {
  temperature: 'warm' | 'cool' | 'neutral';
  hue_category: string;
  kelvin_approximation: number;
  warmth_score: number; // -1 (cool) to 1 (warm)
}

export interface ContrastAnalysis {
  against_white: number;
  against_black: number;
  best_contrast: number;
  best_background: 'white' | 'black';
}

export interface AccessibilityAnalysis {
  wcag_aa_normal: boolean;
  wcag_aa_large: boolean;
  wcag_aaa_normal: boolean;
  wcag_aaa_large: boolean;
  apca_score?: number;
  color_blind_safe: boolean;
  recommendations: string[];
}

export interface DistanceAnalysis {
  cie76: number;
  cie94: number;
  cie2000: number;
  perceptual_difference:
    | 'identical'
    | 'very_similar'
    | 'similar'
    | 'different'
    | 'very_different';
}

export class ColorAnalyzer {
  /**
   * Perform comprehensive color analysis
   */
  static analyzeColor(
    color: UnifiedColor,
    _analysisTypes: string[] = ['all'],
    compareColor?: UnifiedColor
  ): ColorAnalysisResult {
    const result: ColorAnalysisResult = {
      brightness: this.analyzeBrightness(color),
      temperature: this.analyzeTemperature(color),
      contrast: this.analyzeContrast(color),
      accessibility: this.analyzeAccessibility(color),
    };

    // Add distance analysis if comparison color provided
    if (compareColor) {
      result.distance = this.analyzeDistance(color, compareColor);
    }

    return result;
  }

  /**
   * Calculate perceived brightness using standard formula
   */
  static analyzeBrightness(color: UnifiedColor): BrightnessAnalysis {
    const rgb = color.rgb;

    // Perceived brightness formula: 0.299×R + 0.587×G + 0.114×B
    const perceivedBrightness = Math.round(
      0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
    );

    // Calculate relative luminance for WCAG calculations
    const relativeLuminance = this.calculateRelativeLuminance(rgb);

    // Categorize brightness
    let brightnessCategory: BrightnessAnalysis['brightness_category'];
    if (perceivedBrightness < 51) {
      brightnessCategory = 'very_dark';
    } else if (perceivedBrightness < 102) {
      brightnessCategory = 'dark';
    } else if (perceivedBrightness < 153) {
      brightnessCategory = 'medium';
    } else if (perceivedBrightness < 204) {
      brightnessCategory = 'light';
    } else {
      brightnessCategory = 'very_light';
    }

    return {
      perceived_brightness: perceivedBrightness,
      relative_luminance: relativeLuminance,
      brightness_category: brightnessCategory,
      is_light: perceivedBrightness > 127,
    };
  }

  /**
   * Analyze color temperature (warm/cool/neutral classification)
   */
  static analyzeTemperature(color: UnifiedColor): TemperatureAnalysis {
    const hsl = color.hsl;
    const hue = hsl.h;

    let temperature: TemperatureAnalysis['temperature'];
    let hueCategory: string;
    let kelvinApproximation: number;
    let warmthScore: number;

    // Classify based on hue ranges
    if (hue >= 0 && hue < 30) {
      temperature = 'warm';
      hueCategory = 'red';
      kelvinApproximation = 1900; // Candlelight
      warmthScore = 1.0;
    } else if (hue >= 30 && hue < 60) {
      temperature = 'warm';
      hueCategory = 'orange';
      kelvinApproximation = 2700; // Incandescent
      warmthScore = 0.8;
    } else if (hue >= 60 && hue < 90) {
      temperature = 'neutral';
      hueCategory = 'yellow';
      kelvinApproximation = 3000; // Warm white
      warmthScore = 0.3;
    } else if (hue >= 90 && hue < 150) {
      temperature = 'neutral';
      hueCategory = 'yellow-green';
      kelvinApproximation = 4000; // Cool white
      warmthScore = 0.0;
    } else if (hue >= 150 && hue < 210) {
      temperature = 'cool';
      hueCategory = 'green-cyan';
      kelvinApproximation = 5000; // Daylight
      warmthScore = -0.5;
    } else if (hue >= 210 && hue < 270) {
      temperature = 'cool';
      hueCategory = 'blue';
      kelvinApproximation = 6500; // Cool daylight
      warmthScore = -1.0;
    } else if (hue >= 270 && hue < 300) {
      temperature = 'cool';
      hueCategory = 'purple';
      kelvinApproximation = 7000; // Cool daylight
      warmthScore = -0.7;
    } else {
      temperature = 'warm';
      hueCategory = 'magenta-red';
      kelvinApproximation = 2000; // Warm candlelight
      warmthScore = 0.9;
    }

    return {
      temperature,
      hue_category: hueCategory,
      kelvin_approximation: kelvinApproximation,
      warmth_score: warmthScore,
    };
  }

  /**
   * Analyze contrast ratios against white and black backgrounds
   */
  static analyzeContrast(color: UnifiedColor): ContrastAnalysis {
    const luminance = this.calculateRelativeLuminance(color.rgb);

    // WCAG contrast formula: (L1 + 0.05) / (L2 + 0.05)
    const whiteLuminance = 1.0;
    const blackLuminance = 0.0;

    const contrastWhite = (whiteLuminance + 0.05) / (luminance + 0.05);
    const contrastBlack = (luminance + 0.05) / (blackLuminance + 0.05);

    const bestContrast = Math.max(contrastWhite, contrastBlack);
    const bestBackground = contrastWhite > contrastBlack ? 'white' : 'black';

    return {
      against_white: Math.round(contrastWhite * 100) / 100,
      against_black: Math.round(contrastBlack * 100) / 100,
      best_contrast: Math.round(bestContrast * 100) / 100,
      best_background: bestBackground,
    };
  }

  /**
   * Analyze accessibility compliance with WCAG standards
   */
  static analyzeAccessibility(color: UnifiedColor): AccessibilityAnalysis {
    const contrast = this.analyzeContrast(color);
    const bestContrast = contrast.best_contrast;

    // WCAG AA standards: 4.5:1 for normal text, 3:1 for large text
    // WCAG AAA standards: 7:1 for normal text, 4.5:1 for large text
    const wcagAANormal = bestContrast >= 4.5;
    const wcagAALarge = bestContrast >= 3.0;
    const wcagAAANormal = bestContrast >= 7.0;
    const wcagAAALarge = bestContrast >= 4.5;

    // Basic color blind safety check
    const colorBlindSafe = this.isColorBlindSafe(color);

    // Generate recommendations
    const recommendations: string[] = [];
    if (!wcagAANormal) {
      recommendations.push(
        'Consider using a darker or lighter shade for better contrast'
      );
    }
    if (!colorBlindSafe) {
      recommendations.push(
        'This color may be difficult for color-blind users to distinguish'
      );
    }
    if (bestContrast < 3.0) {
      recommendations.push(
        'This color has very low contrast and should not be used for text'
      );
    }

    return {
      wcag_aa_normal: wcagAANormal,
      wcag_aa_large: wcagAALarge,
      wcag_aaa_normal: wcagAAANormal,
      wcag_aaa_large: wcagAAALarge,
      color_blind_safe: colorBlindSafe,
      recommendations,
    };
  }

  /**
   * Calculate color distance using Delta E algorithms
   */
  static analyzeDistance(
    color1: UnifiedColor,
    color2: UnifiedColor
  ): DistanceAnalysis {
    const lab1 = color1.lab;
    const lab2 = color2.lab;

    // CIE76 Delta E (simple Euclidean distance in LAB space)
    const cie76 = Math.sqrt(
      Math.pow(lab2.l - lab1.l, 2) +
        Math.pow(lab2.a - lab1.a, 2) +
        Math.pow(lab2.b - lab1.b, 2)
    );

    // CIE94 Delta E (improved formula with weighting factors)
    const cie94 = this.calculateCIE94(lab1, lab2);

    // CIE2000 Delta E (most accurate modern formula)
    const cie2000 = this.calculateCIE2000(lab1, lab2);

    // Determine perceptual difference based on CIE2000 values
    let perceptualDifference: DistanceAnalysis['perceptual_difference'];
    if (cie2000 < 1) {
      perceptualDifference = 'identical';
    } else if (cie2000 < 2.3) {
      perceptualDifference = 'very_similar';
    } else if (cie2000 < 5) {
      perceptualDifference = 'similar';
    } else if (cie2000 < 10) {
      perceptualDifference = 'different';
    } else {
      perceptualDifference = 'very_different';
    }

    return {
      cie76: Math.round(cie76 * 100) / 100,
      cie94: Math.round(cie94 * 100) / 100,
      cie2000: Math.round(cie2000 * 100) / 100,
      perceptual_difference: perceptualDifference,
    };
  }

  /**
   * Calculate relative luminance according to WCAG formula
   */
  private static calculateRelativeLuminance(rgb: RGB): number {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r =
      rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g =
      gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b =
      bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Check if color is relatively safe for color-blind users
   */
  private static isColorBlindSafe(color: UnifiedColor): boolean {
    const hsl = color.hsl;

    // Colors are generally safer if they have:
    // 1. Good contrast (handled by accessibility analysis)
    // 2. Are not purely in problematic red/green ranges
    // 3. Have sufficient lightness/darkness difference

    const isProblematicHue =
      (hsl.h >= 0 && hsl.h <= 60) || (hsl.h >= 90 && hsl.h <= 150);
    const hasSufficientSaturation = hsl.s > 30;
    const hasExtremeLightness = hsl.l < 20 || hsl.l > 80;

    // Color is considered safer if it's not in problematic hue range,
    // or if it has low saturation, or extreme lightness
    return !isProblematicHue || !hasSufficientSaturation || hasExtremeLightness;
  }

  /**
   * Calculate CIE94 Delta E
   */
  private static calculateCIE94(lab1: LAB, lab2: LAB): number {
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;

    const c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
    const c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
    const deltaC = c1 - c2;

    const deltaH = Math.sqrt(
      deltaA * deltaA + deltaB * deltaB - deltaC * deltaC
    );

    const sl = 1;
    const kc = 1;
    const kh = 1;
    const k1 = 0.045;
    const k2 = 0.015;

    const sc = 1 + k1 * c1;
    const sh = 1 + k2 * c1;

    return Math.sqrt(
      Math.pow(deltaL / (kc * sl), 2) +
        Math.pow(deltaC / (kc * sc), 2) +
        Math.pow(deltaH / (kh * sh), 2)
    );
  }

  /**
   * Calculate CIE2000 Delta E (simplified implementation)
   */
  private static calculateCIE2000(lab1: LAB, lab2: LAB): number {
    // This is a simplified implementation of CIE2000
    // For production use, consider using a dedicated library like delta-e
    const deltaL = lab2.l - lab1.l;
    const deltaA = lab2.a - lab1.a;
    const deltaB = lab2.b - lab1.b;

    const c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
    const c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
    const cBar = (c1 + c2) / 2;

    const g =
      0.5 *
      (1 -
        Math.sqrt(Math.pow(cBar, 7) / (Math.pow(cBar, 7) + Math.pow(25, 7))));

    const a1Prime = lab1.a * (1 + g);
    const a2Prime = lab2.a * (1 + g);

    const c1Prime = Math.sqrt(a1Prime * a1Prime + lab1.b * lab1.b);
    const c2Prime = Math.sqrt(a2Prime * a2Prime + lab2.b * lab2.b);

    const deltaCPrime = c2Prime - c1Prime;

    // Simplified calculation - full CIE2000 is much more complex
    return (
      Math.sqrt(
        Math.pow(deltaL, 2) +
          Math.pow(deltaCPrime, 2) +
          Math.pow(deltaA, 2) +
          Math.pow(deltaB, 2)
      ) / 2
    );
  }

  /**
   * Check contrast ratio between two colors
   */
  static checkContrast(
    foreground: UnifiedColor,
    background: UnifiedColor,
    textSize: 'normal' | 'large' = 'normal',
    standard: 'WCAG_AA' | 'WCAG_AAA' | 'APCA' = 'WCAG_AA'
  ): {
    ratio: number;
    wcag_aa: boolean;
    wcag_aaa: boolean;
    apca_score?: number;
    passes: boolean;
  } {
    const fgLuminance = this.calculateRelativeLuminance(foreground.rgb);
    const bgLuminance = this.calculateRelativeLuminance(background.rgb);

    const ratio =
      (Math.max(fgLuminance, bgLuminance) + 0.05) /
      (Math.min(fgLuminance, bgLuminance) + 0.05);

    const aaThreshold = textSize === 'large' ? 3.0 : 4.5;
    const aaaThreshold = textSize === 'large' ? 4.5 : 7.0;

    const wcagAA = ratio >= aaThreshold;
    const wcagAAA = ratio >= aaaThreshold;

    let passes = wcagAA;
    let apcaScore: number | undefined;

    // Calculate APCA score if requested
    if (standard === 'APCA') {
      apcaScore = this.calculateAPCA(foreground, background);
      // APCA passing criteria (simplified - actual APCA has more complex rules)
      const apcaThreshold = textSize === 'large' ? 60 : 75;
      passes = Math.abs(apcaScore) >= apcaThreshold;
    } else if (standard === 'WCAG_AAA') {
      passes = wcagAAA;
    }

    const result: {
      ratio: number;
      wcag_aa: boolean;
      wcag_aaa: boolean;
      apca_score?: number;
      passes: boolean;
    } = {
      ratio: Math.round(ratio * 100) / 100,
      wcag_aa: wcagAA,
      wcag_aaa: wcagAAA,
      passes,
    };

    if (apcaScore !== undefined) {
      result.apca_score = apcaScore;
    }

    return result;
  }

  /**
   * Calculate APCA (Advanced Perceptual Contrast Algorithm) score
   * Based on APCA 0.0.98G specification
   */
  private static calculateAPCA(
    foreground: UnifiedColor,
    background: UnifiedColor
  ): number {
    // Convert to linear RGB
    const fgLinear = this.sRGBtoLinear(foreground.rgb);
    const bgLinear = this.sRGBtoLinear(background.rgb);

    // Calculate luminance using APCA coefficients
    const fgLum =
      0.2126729 * fgLinear.r + 0.7151522 * fgLinear.g + 0.072175 * fgLinear.b;
    const bgLum =
      0.2126729 * bgLinear.r + 0.7151522 * bgLinear.g + 0.072175 * bgLinear.b;

    // APCA constants
    const normBG = 0.56;
    const normTXT = 0.57;
    const revTXT = 0.62;
    const revBG = 0.65;

    // Determine polarity and calculate contrast
    let contrast: number;

    if (bgLum > fgLum) {
      // Light background, dark text
      const bgY = Math.pow(bgLum, normBG);
      const fgY = Math.pow(fgLum, normTXT);
      contrast = (bgY - fgY) * 1.14;
    } else {
      // Dark background, light text
      const bgY = Math.pow(bgLum, revBG);
      const fgY = Math.pow(fgLum, revTXT);
      contrast = (bgY - fgY) * 1.14;
    }

    // Apply scaling and clamping
    if (Math.abs(contrast) < 0.1) {
      contrast = 0;
    } else {
      contrast = contrast < 0 ? contrast - 0.027 : contrast - 0.027;
    }

    // Convert to Lc (lightness contrast) percentage
    return Math.round(contrast * 100 * 100) / 100;
  }

  /**
   * Convert sRGB to linear RGB for APCA calculations
   */
  private static sRGBtoLinear(rgb: { r: number; g: number; b: number }): {
    r: number;
    g: number;
    b: number;
  } {
    const linearize = (channel: number): number => {
      const normalized = channel / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };

    return {
      r: linearize(rgb.r),
      g: linearize(rgb.g),
      b: linearize(rgb.b),
    };
  }
}
