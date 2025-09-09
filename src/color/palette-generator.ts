/**
 * Color harmony palette generation system with color theory algorithms
 */

import { UnifiedColor } from './unified-color';

export type HarmonyType =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'tetradic'
  | 'split_complementary'
  | 'double_complementary';

export interface ColorRelationship {
  fromIndex: number;
  toIndex: number;
  relationship: string;
  strength: number; // 0-1
  angle?: number; // Hue angle difference
}

export interface PaletteMetadata {
  type: 'harmony';
  baseColor: string;
  harmonyType: HarmonyType;
  algorithm: string;
  diversity: number; // 0-100
  harmonyScore: number; // 0-100
  accessibilityScore: number; // 0-100
  relationships: ColorRelationship[];
  generationTime: number;
}

export interface Palette {
  colors: UnifiedColor[];
  metadata: PaletteMetadata;
}

export interface HarmonyGenerationOptions {
  baseColor: string;
  harmonyType: HarmonyType;
  count?: number; // 3-10, default: 5
  variation?: number; // 0-100, default: 20
}

export class PaletteGenerator {
  /**
   * Generate a color harmony palette based on color theory principles
   */
  static generateHarmonyPalette(options: HarmonyGenerationOptions): Palette {
    const startTime = performance.now();

    // Validate inputs
    this.validateOptions(options);

    const baseColor = new UnifiedColor(options.baseColor);
    const count = Math.max(3, Math.min(10, options.count || 5));
    const variation = Math.max(0, Math.min(100, options.variation || 20));

    // Generate colors based on harmony type
    const colors = this.generateHarmonyColors(
      baseColor,
      options.harmonyType,
      count,
      variation
    );

    // Calculate relationships
    const relationships = this.calculateRelationships(
      colors,
      options.harmonyType
    );

    // Calculate metrics
    const diversity = this.calculateDiversity(colors);
    const harmonyScore = this.calculateHarmonyScore(
      colors,
      options.harmonyType
    );
    const accessibilityScore = this.calculateAccessibilityScore(colors);

    const endTime = performance.now();

    const metadata: PaletteMetadata = {
      type: 'harmony',
      baseColor: options.baseColor,
      harmonyType: options.harmonyType,
      algorithm: `${options.harmonyType}_harmony`,
      diversity,
      harmonyScore,
      accessibilityScore,
      relationships,
      generationTime: Math.round(endTime - startTime),
    };

    return {
      colors,
      metadata,
    };
  }

  /**
   * Validate harmony generation options
   */
  private static validateOptions(options: HarmonyGenerationOptions): void {
    if (!options.baseColor) {
      throw new Error('Base color is required');
    }

    if (!UnifiedColor.isValidColor(options.baseColor)) {
      throw new Error(`Invalid base color: ${options.baseColor}`);
    }

    const validHarmonyTypes: HarmonyType[] = [
      'monochromatic',
      'analogous',
      'complementary',
      'triadic',
      'tetradic',
      'split_complementary',
      'double_complementary',
    ];

    if (!validHarmonyTypes.includes(options.harmonyType)) {
      throw new Error(
        `Invalid harmony type: ${options.harmonyType}. Valid types: ${validHarmonyTypes.join(', ')}`
      );
    }

    if (
      options.count !== undefined &&
      (options.count < 3 || options.count > 10)
    ) {
      throw new Error('Count must be between 3 and 10');
    }

    if (
      options.variation !== undefined &&
      (options.variation < 0 || options.variation > 100)
    ) {
      throw new Error('Variation must be between 0 and 100');
    }
  }

  /**
   * Generate harmony colors based on color theory algorithms
   */
  private static generateHarmonyColors(
    baseColor: UnifiedColor,
    harmonyType: HarmonyType,
    count: number,
    variation: number
  ): UnifiedColor[] {
    switch (harmonyType) {
      case 'monochromatic':
        return this.generateMonochromatic(baseColor, count, variation);

      case 'analogous':
        return this.generateAnalogous(baseColor, count, variation);

      case 'complementary':
        return this.generateComplementary(baseColor, count, variation);

      case 'triadic':
        return this.generateTriadic(baseColor, count, variation);

      case 'tetradic':
        return this.generateTetradic(baseColor, count, variation);

      case 'split_complementary':
        return this.generateSplitComplementary(baseColor, count, variation);

      case 'double_complementary':
        return this.generateDoubleComplementary(baseColor, count, variation);

      default:
        throw new Error(`Unsupported harmony type: ${harmonyType}`);
    }
  }

  /**
   * Generate monochromatic palette (same hue, different saturation/lightness)
   */
  private static generateMonochromatic(
    baseColor: UnifiedColor,
    count: number,
    variation: number
  ): UnifiedColor[] {
    const baseHsl = baseColor.hsl;
    const colors: UnifiedColor[] = [baseColor];

    // Generate variations by adjusting saturation and lightness
    for (let i = 1; i < count; i++) {
      const factor = (i / (count - 1)) * 2 - 1; // -1 to 1
      const variationFactor = (variation / 100) * 0.5; // Scale variation

      let newSaturation = baseHsl.s + factor * variationFactor * 100;
      let newLightness = baseHsl.l + factor * variationFactor * 50;

      // Keep values in valid ranges
      newSaturation = Math.max(0, Math.min(100, newSaturation));
      newLightness = Math.max(10, Math.min(90, newLightness));

      const newColor = UnifiedColor.fromHsl(
        baseHsl.h,
        newSaturation,
        newLightness
      );
      colors.push(newColor);
    }

    return colors;
  }

  /**
   * Generate analogous palette (adjacent hues on color wheel)
   */
  private static generateAnalogous(
    baseColor: UnifiedColor,
    count: number,
    variation: number
  ): UnifiedColor[] {
    const baseHsl = baseColor.hsl;
    const colors: UnifiedColor[] = [baseColor];

    // Analogous colors are typically within 30-60 degrees
    const maxAngle = 30 + (variation / 100) * 30; // 30-60 degrees based on variation
    const angleStep = (maxAngle * 2) / (count - 1);

    for (let i = 1; i < count; i++) {
      const angle = -maxAngle + i * angleStep;
      const newHue = (baseHsl.h + angle + 360) % 360;

      // Add slight variation to saturation and lightness
      const satVariation = (Math.random() - 0.5) * (variation / 100) * 20;
      const lightVariation = (Math.random() - 0.5) * (variation / 100) * 20;

      const newSaturation = Math.max(
        0,
        Math.min(100, baseHsl.s + satVariation)
      );
      const newLightness = Math.max(
        10,
        Math.min(90, baseHsl.l + lightVariation)
      );

      const newColor = UnifiedColor.fromHsl(
        newHue,
        newSaturation,
        newLightness
      );
      colors.push(newColor);
    }

    return colors;
  }

  /**
   * Generate complementary palette (opposite hues)
   */
  private static generateComplementary(
    baseColor: UnifiedColor,
    count: number,
    variation: number
  ): UnifiedColor[] {
    const baseHsl = baseColor.hsl;
    const colors: UnifiedColor[] = [baseColor];

    // Complementary color is 180 degrees opposite
    const complementHue = (baseHsl.h + 180) % 360;

    if (count >= 2) {
      const complementColor = UnifiedColor.fromHsl(
        complementHue,
        baseHsl.s,
        baseHsl.l
      );
      colors.push(complementColor);
    }

    // Fill remaining slots with variations
    for (let i = 2; i < count; i++) {
      const useBase = i % 2 === 0;
      const sourceHue = useBase ? baseHsl.h : complementHue;

      // Add variation to create more colors
      const hueVariation = (Math.random() - 0.5) * (variation / 100) * 30;
      const satVariation = (Math.random() - 0.5) * (variation / 100) * 30;
      const lightVariation = (Math.random() - 0.5) * (variation / 100) * 30;

      const newHue = (sourceHue + hueVariation + 360) % 360;
      const newSaturation = Math.max(
        0,
        Math.min(100, baseHsl.s + satVariation)
      );
      const newLightness = Math.max(
        10,
        Math.min(90, baseHsl.l + lightVariation)
      );

      const newColor = UnifiedColor.fromHsl(
        newHue,
        newSaturation,
        newLightness
      );
      colors.push(newColor);
    }

    return colors;
  }

  /**
   * Generate triadic palette (120-degree intervals)
   */
  private static generateTriadic(
    baseColor: UnifiedColor,
    count: number,
    variation: number
  ): UnifiedColor[] {
    const baseHsl = baseColor.hsl;
    const colors: UnifiedColor[] = [baseColor];

    // Triadic colors are 120 degrees apart
    const hue2 = (baseHsl.h + 120) % 360;
    const hue3 = (baseHsl.h + 240) % 360;

    if (count >= 2) {
      const color2 = UnifiedColor.fromHsl(hue2, baseHsl.s, baseHsl.l);
      colors.push(color2);
    }

    if (count >= 3) {
      const color3 = UnifiedColor.fromHsl(hue3, baseHsl.s, baseHsl.l);
      colors.push(color3);
    }

    // Fill remaining slots with variations
    for (let i = 3; i < count; i++) {
      const hues = [baseHsl.h, hue2, hue3];
      const sourceHue = hues[i % 3]!;

      const hueVariation = (Math.random() - 0.5) * (variation / 100) * 20;
      const satVariation = (Math.random() - 0.5) * (variation / 100) * 30;
      const lightVariation = (Math.random() - 0.5) * (variation / 100) * 30;

      const newHue = (sourceHue + hueVariation + 360) % 360;
      const newSaturation = Math.max(
        0,
        Math.min(100, baseHsl.s + satVariation)
      );
      const newLightness = Math.max(
        10,
        Math.min(90, baseHsl.l + lightVariation)
      );

      const newColor = UnifiedColor.fromHsl(
        newHue,
        newSaturation,
        newLightness
      );
      colors.push(newColor);
    }

    return colors;
  }

  /**
   * Generate tetradic palette (90-degree intervals, rectangle on color wheel)
   */
  private static generateTetradic(
    baseColor: UnifiedColor,
    count: number,
    variation: number
  ): UnifiedColor[] {
    const baseHsl = baseColor.hsl;
    const colors: UnifiedColor[] = [baseColor];

    // Tetradic colors are 90 degrees apart
    const hue2 = (baseHsl.h + 90) % 360;
    const hue3 = (baseHsl.h + 180) % 360;
    const hue4 = (baseHsl.h + 270) % 360;

    const hues = [hue2, hue3, hue4];

    for (let i = 1; i < Math.min(4, count); i++) {
      const newColor = UnifiedColor.fromHsl(hues[i - 1]!, baseHsl.s, baseHsl.l);
      colors.push(newColor);
    }

    // Fill remaining slots with variations
    for (let i = 4; i < count; i++) {
      const allHues = [baseHsl.h, hue2, hue3, hue4];
      const sourceHue = allHues[i % 4]!;

      const hueVariation = (Math.random() - 0.5) * (variation / 100) * 15;
      const satVariation = (Math.random() - 0.5) * (variation / 100) * 25;
      const lightVariation = (Math.random() - 0.5) * (variation / 100) * 25;

      const newHue = (sourceHue + hueVariation + 360) % 360;
      const newSaturation = Math.max(
        0,
        Math.min(100, baseHsl.s + satVariation)
      );
      const newLightness = Math.max(
        10,
        Math.min(90, baseHsl.l + lightVariation)
      );

      const newColor = UnifiedColor.fromHsl(
        newHue,
        newSaturation,
        newLightness
      );
      colors.push(newColor);
    }

    return colors;
  }

  /**
   * Generate split-complementary palette (base + two colors adjacent to complement)
   */
  private static generateSplitComplementary(
    baseColor: UnifiedColor,
    count: number,
    variation: number
  ): UnifiedColor[] {
    const baseHsl = baseColor.hsl;
    const colors: UnifiedColor[] = [baseColor];

    // Split-complementary uses colors 150 and 210 degrees from base
    const complementHue = (baseHsl.h + 180) % 360;
    const splitAngle = 30; // Standard split angle

    const hue2 = (complementHue - splitAngle + 360) % 360;
    const hue3 = (complementHue + splitAngle) % 360;

    if (count >= 2) {
      const color2 = UnifiedColor.fromHsl(hue2, baseHsl.s, baseHsl.l);
      colors.push(color2);
    }

    if (count >= 3) {
      const color3 = UnifiedColor.fromHsl(hue3, baseHsl.s, baseHsl.l);
      colors.push(color3);
    }

    // Fill remaining slots with variations
    for (let i = 3; i < count; i++) {
      const hues = [baseHsl.h, hue2, hue3];
      const sourceHue = hues[i % 3]!;

      const hueVariation = (Math.random() - 0.5) * (variation / 100) * 20;
      const satVariation = (Math.random() - 0.5) * (variation / 100) * 30;
      const lightVariation = (Math.random() - 0.5) * (variation / 100) * 30;

      const newHue = (sourceHue + hueVariation + 360) % 360;
      const newSaturation = Math.max(
        0,
        Math.min(100, baseHsl.s + satVariation)
      );
      const newLightness = Math.max(
        10,
        Math.min(90, baseHsl.l + lightVariation)
      );

      const newColor = UnifiedColor.fromHsl(
        newHue,
        newSaturation,
        newLightness
      );
      colors.push(newColor);
    }

    return colors;
  }

  /**
   * Generate double-complementary palette (two complementary pairs)
   */
  private static generateDoubleComplementary(
    baseColor: UnifiedColor,
    count: number,
    variation: number
  ): UnifiedColor[] {
    const baseHsl = baseColor.hsl;
    const colors: UnifiedColor[] = [baseColor];

    // First complementary pair
    const complement1 = (baseHsl.h + 180) % 360;

    // Second pair offset by variation amount
    const offset = 30 + (variation / 100) * 60; // 30-90 degrees
    const base2 = (baseHsl.h + offset) % 360;
    const complement2 = (base2 + 180) % 360;

    const hues = [complement1, base2, complement2];

    for (let i = 1; i < Math.min(4, count); i++) {
      const newColor = UnifiedColor.fromHsl(hues[i - 1]!, baseHsl.s, baseHsl.l);
      colors.push(newColor);
    }

    // Fill remaining slots with variations
    for (let i = 4; i < count; i++) {
      const allHues = [baseHsl.h, complement1, base2, complement2];
      const sourceHue = allHues[i % 4]!;

      const hueVariation = (Math.random() - 0.5) * (variation / 100) * 15;
      const satVariation = (Math.random() - 0.5) * (variation / 100) * 25;
      const lightVariation = (Math.random() - 0.5) * (variation / 100) * 25;

      const newHue = (sourceHue + hueVariation + 360) % 360;
      const newSaturation = Math.max(
        0,
        Math.min(100, baseHsl.s + satVariation)
      );
      const newLightness = Math.max(
        10,
        Math.min(90, baseHsl.l + lightVariation)
      );

      const newColor = UnifiedColor.fromHsl(
        newHue,
        newSaturation,
        newLightness
      );
      colors.push(newColor);
    }

    return colors;
  }

  /**
   * Calculate relationships between colors in the palette
   */
  private static calculateRelationships(
    colors: UnifiedColor[],
    _harmonyType: HarmonyType
  ): ColorRelationship[] {
    const relationships: ColorRelationship[] = [];

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = colors[i];
        const color2 = colors[j];

        if (!color1 || !color2) continue;

        const hue1 = color1.hsl.h;
        const hue2 = color2.hsl.h;

        // Calculate hue angle difference
        let angleDiff = Math.abs(hue2 - hue1);
        if (angleDiff > 180) {
          angleDiff = 360 - angleDiff;
        }

        // Determine relationship type based on angle
        let relationshipType = 'related';
        let strength = 1.0;

        if (angleDiff < 30) {
          relationshipType = 'analogous';
          strength = 1.0 - (angleDiff / 30) * 0.3;
        } else if (angleDiff >= 150 && angleDiff <= 210) {
          relationshipType = 'complementary';
          strength = 1.0 - (Math.abs(angleDiff - 180) / 30) * 0.2;
        } else if (angleDiff >= 110 && angleDiff <= 130) {
          relationshipType = 'triadic';
          strength = 1.0 - (Math.abs(angleDiff - 120) / 10) * 0.2;
        } else if (angleDiff >= 80 && angleDiff <= 100) {
          relationshipType = 'tetradic';
          strength = 1.0 - (Math.abs(angleDiff - 90) / 10) * 0.2;
        }

        relationships.push({
          fromIndex: i,
          toIndex: j,
          relationship: relationshipType,
          strength: Math.max(0.1, strength),
          angle: angleDiff,
        });
      }
    }

    return relationships;
  }

  /**
   * Calculate palette diversity score (0-100)
   */
  private static calculateDiversity(colors: UnifiedColor[]): number {
    if (colors.length < 2) return 0;

    let totalHueDistance = 0;
    let totalSatDistance = 0;
    let totalLightDistance = 0;
    let comparisons = 0;

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = colors[i];
        const color2 = colors[j];

        if (!color1 || !color2) continue;

        const hsl1 = color1.hsl;
        const hsl2 = color2.hsl;

        // Calculate hue distance (circular)
        let hueDiff = Math.abs(hsl2.h - hsl1.h);
        if (hueDiff > 180) hueDiff = 360 - hueDiff;

        totalHueDistance += hueDiff;
        totalSatDistance += Math.abs(hsl2.s - hsl1.s);
        totalLightDistance += Math.abs(hsl2.l - hsl1.l);
        comparisons++;
      }
    }

    if (comparisons === 0) return 0;

    const avgHueDistance = totalHueDistance / comparisons;
    const avgSatDistance = totalSatDistance / comparisons;
    const avgLightDistance = totalLightDistance / comparisons;

    // Normalize and combine (hue is most important for diversity)
    const hueScore = Math.min(100, (avgHueDistance / 180) * 100);
    const satScore = Math.min(100, (avgSatDistance / 100) * 100);
    const lightScore = Math.min(100, (avgLightDistance / 100) * 100);

    return Math.round(hueScore * 0.6 + satScore * 0.2 + lightScore * 0.2);
  }

  /**
   * Calculate harmony score based on color theory compliance (0-100)
   */
  private static calculateHarmonyScore(
    colors: UnifiedColor[],
    harmonyType: HarmonyType
  ): number {
    if (colors.length < 2) return 100;

    const baseColor = colors[0];
    if (!baseColor) return 0;

    const baseHue = baseColor.hsl.h;
    const score = 100;
    let penalties = 0;

    // Check compliance with harmony rules
    for (let i = 1; i < colors.length; i++) {
      const color = colors[i];
      if (!color) continue;

      const hue = color.hsl.h;
      let hueDiff = Math.abs(hue - baseHue);
      if (hueDiff > 180) hueDiff = 360 - hueDiff;

      let expectedAngles: number[] = [];

      switch (harmonyType) {
        case 'monochromatic':
          expectedAngles = [0]; // Same hue
          break;
        case 'analogous':
          expectedAngles = [30, 60]; // Adjacent hues
          break;
        case 'complementary':
          expectedAngles = [180]; // Opposite
          break;
        case 'triadic':
          expectedAngles = [120, 240]; // 120-degree intervals
          break;
        case 'tetradic':
          expectedAngles = [90, 180, 270]; // 90-degree intervals
          break;
        case 'split_complementary':
          expectedAngles = [150, 210]; // Split complement
          break;
        case 'double_complementary':
          expectedAngles = [60, 120, 180, 240, 300]; // More flexible
          break;
      }

      // Find closest expected angle
      const closestExpected = expectedAngles.reduce((closest, angle) => {
        const diff1 = Math.abs(hueDiff - angle);
        const diff2 = Math.abs(hueDiff - closest);
        return diff1 < diff2 ? angle : closest;
      }, expectedAngles[0] || 0);

      const deviation = Math.abs(hueDiff - closestExpected);
      if (deviation > 15) {
        // Allow 15-degree tolerance
        penalties += Math.min(20, deviation - 15);
      }
    }

    return Math.max(0, Math.round(score - penalties));
  }

  /**
   * Calculate accessibility score for the palette (0-100)
   */
  private static calculateAccessibilityScore(colors: UnifiedColor[]): number {
    if (colors.length < 2) return 100;

    let totalContrast = 0;
    let contrastPairs = 0;
    let wcagCompliantPairs = 0;

    // Check all color pairs for contrast
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = colors[i];
        const color2 = colors[j];

        if (!color1 || !color2) continue;

        // Calculate luminance for both colors
        const lum1 = this.calculateLuminance(color1.rgb);
        const lum2 = this.calculateLuminance(color2.rgb);

        const contrast =
          (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
        totalContrast += contrast;
        contrastPairs++;

        if (contrast >= 4.5) {
          // WCAG AA standard
          wcagCompliantPairs++;
        }
      }
    }

    if (contrastPairs === 0) return 100;

    const avgContrast = totalContrast / contrastPairs;
    const complianceRatio = wcagCompliantPairs / contrastPairs;

    // Score based on average contrast and compliance ratio
    const contrastScore = Math.min(100, (avgContrast / 7) * 50); // Max 50 points for contrast
    const complianceScore = complianceRatio * 50; // Max 50 points for compliance

    return Math.round(contrastScore + complianceScore);
  }

  /**
   * Calculate relative luminance for accessibility calculations
   */
  private static calculateLuminance(rgb: {
    r: number;
    g: number;
    b: number;
  }): number {
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
}
