/**
 * Comprehensive tests for color analysis system
 */

import { describe, test, expect } from '@jest/globals';
import { UnifiedColor } from '../../src/color/unified-color';
import { ColorAnalyzer } from '../../src/color/color-analysis';

describe('ColorAnalyzer', () => {
  describe('analyzeBrightness', () => {
    test('should calculate perceived brightness correctly', () => {
      // Test pure colors
      const red = new UnifiedColor('#FF0000');
      const green = new UnifiedColor('#00FF00');
      const blue = new UnifiedColor('#0000FF');
      const white = new UnifiedColor('#FFFFFF');
      const black = new UnifiedColor('#000000');

      const redAnalysis = ColorAnalyzer.analyzeBrightness(red);
      const greenAnalysis = ColorAnalyzer.analyzeBrightness(green);
      const blueAnalysis = ColorAnalyzer.analyzeBrightness(blue);
      const whiteAnalysis = ColorAnalyzer.analyzeBrightness(white);
      const blackAnalysis = ColorAnalyzer.analyzeBrightness(black);

      // Test perceived brightness formula: 0.299×R + 0.587×G + 0.114×B
      expect(redAnalysis.perceived_brightness).toBe(Math.round(0.299 * 255)); // ~76
      expect(greenAnalysis.perceived_brightness).toBe(Math.round(0.587 * 255)); // ~150
      expect(blueAnalysis.perceived_brightness).toBe(Math.round(0.114 * 255)); // ~29
      expect(whiteAnalysis.perceived_brightness).toBe(255);
      expect(blackAnalysis.perceived_brightness).toBe(0);

      // Test brightness categories
      expect(blackAnalysis.brightness_category).toBe('very_dark');
      expect(blueAnalysis.brightness_category).toBe('very_dark');
      expect(redAnalysis.brightness_category).toBe('dark');
      expect(greenAnalysis.brightness_category).toBe('medium');
      expect(whiteAnalysis.brightness_category).toBe('very_light');

      // Test is_light flag
      expect(whiteAnalysis.is_light).toBe(true);
      expect(greenAnalysis.is_light).toBe(true);
      expect(redAnalysis.is_light).toBe(false);
      expect(blackAnalysis.is_light).toBe(false);
    });

    test('should calculate relative luminance correctly', () => {
      const white = new UnifiedColor('#FFFFFF');
      const black = new UnifiedColor('#000000');
      const gray = new UnifiedColor('#808080');

      const whiteAnalysis = ColorAnalyzer.analyzeBrightness(white);
      const blackAnalysis = ColorAnalyzer.analyzeBrightness(black);
      const grayAnalysis = ColorAnalyzer.analyzeBrightness(gray);

      expect(whiteAnalysis.relative_luminance).toBeCloseTo(1.0, 2);
      expect(blackAnalysis.relative_luminance).toBeCloseTo(0.0, 2);
      expect(grayAnalysis.relative_luminance).toBeCloseTo(0.22, 1); // Approximate for #808080
    });
  });

  describe('analyzeTemperature', () => {
    test('should classify color temperature correctly', () => {
      const red = new UnifiedColor('#FF0000'); // 0° hue
      const orange = new UnifiedColor('#FF8000'); // ~30° hue
      const yellow = new UnifiedColor('#FFFF00'); // 60° hue
      const green = new UnifiedColor('#00FF00'); // 120° hue
      const cyan = new UnifiedColor('#00FFFF'); // 180° hue
      const blue = new UnifiedColor('#0000FF'); // 240° hue
      const purple = new UnifiedColor('#8000FF'); // ~270° hue
      const magenta = new UnifiedColor('#FF00FF'); // 300° hue

      expect(ColorAnalyzer.analyzeTemperature(red).temperature).toBe('warm');
      expect(ColorAnalyzer.analyzeTemperature(orange).temperature).toBe('warm');
      expect(ColorAnalyzer.analyzeTemperature(yellow).temperature).toBe(
        'neutral'
      );
      expect(ColorAnalyzer.analyzeTemperature(green).temperature).toBe(
        'neutral'
      );
      expect(ColorAnalyzer.analyzeTemperature(cyan).temperature).toBe('cool');
      expect(ColorAnalyzer.analyzeTemperature(blue).temperature).toBe('cool');
      expect(ColorAnalyzer.analyzeTemperature(purple).temperature).toBe('cool');
      expect(ColorAnalyzer.analyzeTemperature(magenta).temperature).toBe(
        'warm'
      );
    });

    test('should provide hue categories', () => {
      const red = new UnifiedColor('#FF0000');
      const blue = new UnifiedColor('#0000FF');

      const redTemp = ColorAnalyzer.analyzeTemperature(red);
      const blueTemp = ColorAnalyzer.analyzeTemperature(blue);

      expect(redTemp.hue_category).toBe('red');
      expect(blueTemp.hue_category).toBe('blue');
    });

    test('should provide warmth scores', () => {
      const red = new UnifiedColor('#FF0000');
      const blue = new UnifiedColor('#0000FF');
      const yellow = new UnifiedColor('#FFFF00');

      const redTemp = ColorAnalyzer.analyzeTemperature(red);
      const blueTemp = ColorAnalyzer.analyzeTemperature(blue);
      const yellowTemp = ColorAnalyzer.analyzeTemperature(yellow);

      expect(redTemp.warmth_score).toBe(1.0); // Maximum warm
      expect(blueTemp.warmth_score).toBe(-1.0); // Maximum cool
      expect(yellowTemp.warmth_score).toBeCloseTo(0.3, 1); // Neutral-warm
    });
  });

  describe('analyzeContrast', () => {
    test('should calculate contrast ratios correctly', () => {
      const white = new UnifiedColor('#FFFFFF');
      const black = new UnifiedColor('#000000');
      const gray = new UnifiedColor('#808080');

      const whiteContrast = ColorAnalyzer.analyzeContrast(white);
      const blackContrast = ColorAnalyzer.analyzeContrast(black);
      const grayContrast = ColorAnalyzer.analyzeContrast(gray);

      // White should have maximum contrast against black
      expect(whiteContrast.against_black).toBeCloseTo(21, 0);
      expect(whiteContrast.against_white).toBe(1);
      expect(whiteContrast.best_background).toBe('black');

      // Black should have maximum contrast against white
      expect(blackContrast.against_white).toBeCloseTo(21, 0);
      expect(blackContrast.against_black).toBe(1);
      expect(blackContrast.best_background).toBe('white');

      // Gray should have moderate contrast
      expect(grayContrast.best_contrast).toBeGreaterThan(1);
      expect(grayContrast.best_contrast).toBeLessThan(21);
    });
  });

  describe('analyzeAccessibility', () => {
    test('should check WCAG compliance correctly', () => {
      const white = new UnifiedColor('#FFFFFF');
      const black = new UnifiedColor('#000000');
      const lightGray = new UnifiedColor('#CCCCCC');
      const darkGray = new UnifiedColor('#333333');

      const whiteAccessibility = ColorAnalyzer.analyzeAccessibility(white);
      const blackAccessibility = ColorAnalyzer.analyzeAccessibility(black);
      const lightGrayAccessibility =
        ColorAnalyzer.analyzeAccessibility(lightGray);
      const darkGrayAccessibility =
        ColorAnalyzer.analyzeAccessibility(darkGray);

      // White and black should meet all standards
      expect(whiteAccessibility.wcag_aa_normal).toBe(true);
      expect(whiteAccessibility.wcag_aaa_normal).toBe(true);
      expect(blackAccessibility.wcag_aa_normal).toBe(true);
      expect(blackAccessibility.wcag_aaa_normal).toBe(true);

      // Light gray meets AA standards (good contrast with black) but not AAA
      expect(lightGrayAccessibility.wcag_aa_normal).toBe(true);
      expect(lightGrayAccessibility.wcag_aaa_normal).toBe(true); // 13:1 contrast exceeds 7:1 AAA requirement

      // Dark gray should meet AA standards
      expect(darkGrayAccessibility.wcag_aa_normal).toBe(true);
    });

    test('should provide accessibility recommendations', () => {
      const lightGray = new UnifiedColor('#CCCCCC');
      const accessibility = ColorAnalyzer.analyzeAccessibility(lightGray);

      // Should provide recommendations array (may be empty if color is good)
      expect(Array.isArray(accessibility.recommendations)).toBe(true);
    });
  });

  describe('analyzeDistance', () => {
    test('should calculate color distance correctly', () => {
      const red = new UnifiedColor('#FF0000');
      const blue = new UnifiedColor('#0000FF');
      const darkRed = new UnifiedColor('#800000');
      const identicalRed = new UnifiedColor('#FF0000');

      const redBlueDistance = ColorAnalyzer.analyzeDistance(red, blue);
      const redDarkRedDistance = ColorAnalyzer.analyzeDistance(red, darkRed);
      const identicalDistance = ColorAnalyzer.analyzeDistance(
        red,
        identicalRed
      );

      // Red and blue should be very different
      expect(redBlueDistance.perceptual_difference).toBe('very_different');
      expect(redBlueDistance.cie2000).toBeGreaterThan(10);

      // Red and dark red are actually quite different (different lightness)
      expect(redDarkRedDistance.perceptual_difference).toBe('very_different');

      // Identical colors should have zero distance
      expect(identicalDistance.cie76).toBeCloseTo(0, 1);
      expect(identicalDistance.perceptual_difference).toBe('identical');
    });

    test('should provide multiple distance algorithms', () => {
      const red = new UnifiedColor('#FF0000');
      const blue = new UnifiedColor('#0000FF');

      const distance = ColorAnalyzer.analyzeDistance(red, blue);

      expect(distance.cie76).toBeGreaterThan(0);
      expect(distance.cie94).toBeGreaterThan(0);
      expect(distance.cie2000).toBeGreaterThan(0);

      // CIE2000 should generally be more accurate (lower values for same perceptual difference)
      expect(distance.cie2000).toBeLessThanOrEqual(distance.cie76);
    });
  });

  describe('checkContrast', () => {
    test('should check contrast between two colors', () => {
      const white = new UnifiedColor('#FFFFFF');
      const black = new UnifiedColor('#000000');
      const gray = new UnifiedColor('#808080');

      const whiteBlackContrast = ColorAnalyzer.checkContrast(white, black);
      const whiteGrayContrast = ColorAnalyzer.checkContrast(white, gray);
      const grayBlackContrast = ColorAnalyzer.checkContrast(gray, black);

      // White on black should have maximum contrast
      expect(whiteBlackContrast.ratio).toBeCloseTo(21, 0);
      expect(whiteBlackContrast.wcag_aa).toBe(true);
      expect(whiteBlackContrast.wcag_aaa).toBe(true);
      expect(whiteBlackContrast.passes).toBe(true);

      // White on gray should have moderate contrast
      expect(whiteGrayContrast.ratio).toBeGreaterThan(1);
      expect(whiteGrayContrast.ratio).toBeLessThan(21);

      // Gray on black should have reasonable contrast
      expect(grayBlackContrast.ratio).toBeGreaterThan(3);
    });

    test('should handle different text sizes', () => {
      const mediumGray = new UnifiedColor('#999999');
      const white = new UnifiedColor('#FFFFFF');

      const normalTextContrast = ColorAnalyzer.checkContrast(
        mediumGray,
        white,
        'normal'
      );
      const largeTextContrast = ColorAnalyzer.checkContrast(
        mediumGray,
        white,
        'large'
      );

      // Same colors should have same ratio regardless of text size
      expect(normalTextContrast.ratio).toBe(largeTextContrast.ratio);

      // But compliance might differ due to different thresholds
      // Large text has lower requirements (3:1 vs 4.5:1 for AA)
      if (normalTextContrast.ratio >= 3.0 && normalTextContrast.ratio < 4.5) {
        expect(normalTextContrast.wcag_aa).toBe(false);
        expect(largeTextContrast.wcag_aa).toBe(true);
      }
    });
  });

  describe('comprehensive analysis', () => {
    test('should perform complete color analysis', () => {
      const testColor = new UnifiedColor('#2563eb'); // Blue color
      const compareColor = new UnifiedColor('#dc2626'); // Red color

      const analysis = ColorAnalyzer.analyzeColor(
        testColor,
        ['all'],
        compareColor
      );

      // Should include all analysis types
      expect(analysis.brightness).toBeDefined();
      expect(analysis.temperature).toBeDefined();
      expect(analysis.contrast).toBeDefined();
      expect(analysis.accessibility).toBeDefined();
      expect(analysis.distance).toBeDefined();

      // Brightness analysis
      expect(analysis.brightness.perceived_brightness).toBeGreaterThan(0);
      expect(analysis.brightness.brightness_category).toBeDefined();
      expect(typeof analysis.brightness.is_light).toBe('boolean');

      // Temperature analysis
      expect(['warm', 'cool', 'neutral']).toContain(
        analysis.temperature.temperature
      );
      expect(analysis.temperature.warmth_score).toBeGreaterThanOrEqual(-1);
      expect(analysis.temperature.warmth_score).toBeLessThanOrEqual(1);

      // Contrast analysis
      expect(analysis.contrast.against_white).toBeGreaterThan(0);
      expect(analysis.contrast.against_black).toBeGreaterThan(0);
      expect(['white', 'black']).toContain(analysis.contrast.best_background);

      // Accessibility analysis
      expect(typeof analysis.accessibility.wcag_aa_normal).toBe('boolean');
      expect(typeof analysis.accessibility.wcag_aaa_normal).toBe('boolean');
      expect(Array.isArray(analysis.accessibility.recommendations)).toBe(true);

      // Distance analysis (since compare color provided)
      expect(analysis.distance?.cie76).toBeGreaterThan(0);
      expect(analysis.distance?.cie94).toBeGreaterThan(0);
      expect(analysis.distance?.cie2000).toBeGreaterThan(0);
      expect(analysis.distance?.perceptual_difference).toBeDefined();
    });

    test('should work without comparison color', () => {
      const testColor = new UnifiedColor('#00FF00');
      const analysis = ColorAnalyzer.analyzeColor(testColor);

      expect(analysis.brightness).toBeDefined();
      expect(analysis.temperature).toBeDefined();
      expect(analysis.contrast).toBeDefined();
      expect(analysis.accessibility).toBeDefined();
      expect(analysis.distance).toBeUndefined(); // No comparison color provided
    });
  });

  describe('performance tests', () => {
    test('should complete analysis within 300ms', async () => {
      const testColor = new UnifiedColor('#FF5733');
      const compareColor = new UnifiedColor('#33FF57');

      const startTime = Date.now();
      const analysis = ColorAnalyzer.analyzeColor(
        testColor,
        ['all'],
        compareColor
      );
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(300);
      expect(analysis).toBeDefined();
    });

    test('should handle multiple analyses efficiently', async () => {
      const colors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFFF00',
        '#FF00FF',
        '#00FFFF',
        '#800000',
        '#008000',
        '#000080',
        '#808000',
        '#800080',
        '#008080',
      ];

      const startTime = Date.now();

      for (const colorStr of colors) {
        const color = new UnifiedColor(colorStr);
        const analysis = ColorAnalyzer.analyzeColor(color);
        expect(analysis).toBeDefined();
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / colors.length;

      expect(averageTime).toBeLessThan(50); // Average should be under 50ms per analysis
    });
  });

  describe('edge cases', () => {
    test('should handle extreme colors correctly', () => {
      const pureWhite = new UnifiedColor('#FFFFFF');
      const pureBlack = new UnifiedColor('#000000');
      const pureRed = new UnifiedColor('#FF0000');
      const pureGreen = new UnifiedColor('#00FF00');
      const pureBlue = new UnifiedColor('#0000FF');

      const extremeColors = [
        pureWhite,
        pureBlack,
        pureRed,
        pureGreen,
        pureBlue,
      ];

      for (const color of extremeColors) {
        const analysis = ColorAnalyzer.analyzeColor(color);

        expect(analysis.brightness.perceived_brightness).toBeGreaterThanOrEqual(
          0
        );
        expect(analysis.brightness.perceived_brightness).toBeLessThanOrEqual(
          255
        );
        expect(analysis.brightness.relative_luminance).toBeGreaterThanOrEqual(
          0
        );
        expect(analysis.brightness.relative_luminance).toBeLessThanOrEqual(1);
        expect(analysis.contrast.against_white).toBeGreaterThanOrEqual(1);
        expect(analysis.contrast.against_black).toBeGreaterThanOrEqual(1);
      }
    });

    test('should handle colors with alpha channel', () => {
      const semiTransparentRed = new UnifiedColor('rgba(255, 0, 0, 0.5)');
      const analysis = ColorAnalyzer.analyzeColor(semiTransparentRed);

      expect(analysis).toBeDefined();
      expect(analysis.brightness).toBeDefined();
      expect(analysis.temperature).toBeDefined();
    });
  });
});
