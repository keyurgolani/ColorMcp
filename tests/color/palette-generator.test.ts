/**
 * Comprehensive tests for color harmony palette generation system
 */

import {
  PaletteGenerator,
  HarmonyType,
} from '../../src/color/palette-generator';

describe('PaletteGenerator', () => {
  describe('generateHarmonyPalette', () => {
    test('should generate monochromatic palette', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'monochromatic',
        count: 5,
        variation: 20,
      });

      expect(palette.colors).toHaveLength(5);
      expect(palette.metadata.harmonyType).toBe('monochromatic');
      expect(palette.metadata.baseColor).toBe('#FF0000');

      // All colors should have the same hue (red = 0)
      palette.colors.forEach(color => {
        expect(color.hsl.h).toBeCloseTo(0, 1);
      });
    });

    test('should generate complementary palette', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000', // Red (hue: 0)
        harmonyType: 'complementary',
        count: 3,
        variation: 10,
      });

      expect(palette.colors).toHaveLength(3);
      expect(palette.metadata.harmonyType).toBe('complementary');

      // First color should be the base (red)
      expect(palette.colors[0]!.hsl.h).toBeCloseTo(0, 1);

      // Second color should be complement (cyan, hue: 180)
      expect(palette.colors[1]!.hsl.h).toBeCloseTo(180, 10);
    });

    test('should generate triadic palette', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000', // Red (hue: 0)
        harmonyType: 'triadic',
        count: 3,
        variation: 0,
      });

      expect(palette.colors).toHaveLength(3);
      expect(palette.metadata.harmonyType).toBe('triadic');

      // Check triadic relationships (120° apart)
      const hues = palette.colors.map(color => color.hsl.h);
      expect(hues[0]).toBeCloseTo(0, 1); // Red
      expect(hues[1]).toBeCloseTo(120, 5); // Green
      expect(hues[2]).toBeCloseTo(240, 5); // Blue
    });

    test('should generate tetradic palette', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000', // Red (hue: 0)
        harmonyType: 'tetradic',
        count: 4,
        variation: 0,
      });

      expect(palette.colors).toHaveLength(4);
      expect(palette.metadata.harmonyType).toBe('tetradic');

      // Check tetradic relationships (90° apart)
      const hues = palette.colors.map(color => color.hsl.h);
      expect(hues[0]).toBeCloseTo(0, 1); // Red
      expect(hues[1]).toBeCloseTo(90, 5); // Yellow-green
      expect(hues[2]).toBeCloseTo(180, 5); // Cyan
      expect(hues[3]).toBeCloseTo(270, 5); // Purple
    });

    test('should generate analogous palette', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000', // Red (hue: 0)
        harmonyType: 'analogous',
        count: 4,
        variation: 20,
      });

      expect(palette.colors).toHaveLength(4);
      expect(palette.metadata.harmonyType).toBe('analogous');

      // All colors should be within analogous range (±60° from base)
      const baseHue = palette.colors[0]!.hsl.h;
      palette.colors.forEach(color => {
        let hueDiff = Math.abs(color.hsl.h - baseHue);
        if (hueDiff > 180) hueDiff = 360 - hueDiff;
        expect(hueDiff).toBeLessThanOrEqual(60);
      });
    });

    test('should generate split-complementary palette', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000', // Red (hue: 0)
        harmonyType: 'split_complementary',
        count: 3,
        variation: 0,
      });

      expect(palette.colors).toHaveLength(3);
      expect(palette.metadata.harmonyType).toBe('split_complementary');

      const hues = palette.colors.map(color => color.hsl.h);
      expect(hues[0]).toBeCloseTo(0, 1); // Base red

      // Split-complementary colors should be around 150° and 210° from base
      const expectedHues = [150, 210];
      const actualSplitHues = hues.slice(1).sort((a, b) => a - b);

      expectedHues.forEach((expectedHue, index) => {
        expect(actualSplitHues[index]).toBeCloseTo(expectedHue, 15);
      });
    });

    test('should generate double-complementary palette', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000', // Red (hue: 0)
        harmonyType: 'double_complementary',
        count: 4,
        variation: 30,
      });

      expect(palette.colors).toHaveLength(4);
      expect(palette.metadata.harmonyType).toBe('double_complementary');

      // Should have two complementary pairs
      const hues = palette.colors.map(color => color.hsl.h);
      expect(hues[0]).toBeCloseTo(0, 1); // Base red
      expect(hues[1]).toBeCloseTo(180, 10); // Complement of red
    });

    test('should respect count parameter', () => {
      for (let count = 3; count <= 10; count++) {
        const palette = PaletteGenerator.generateHarmonyPalette({
          baseColor: '#0066CC',
          harmonyType: 'analogous',
          count,
          variation: 15,
        });

        expect(palette.colors).toHaveLength(count);
      }
    });

    test('should apply variation correctly', () => {
      const paletteNoVariation = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'monochromatic',
        count: 5,
        variation: 0,
      });

      const paletteWithVariation = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'monochromatic',
        count: 5,
        variation: 50,
      });

      // With variation, colors should be more diverse
      expect(paletteWithVariation.metadata.diversity).toBeGreaterThanOrEqual(
        paletteNoVariation.metadata.diversity
      );
    });

    test('should include base color as first color', () => {
      const baseColor = '#3366CC';
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor,
        harmonyType: 'complementary',
        count: 3,
      });

      expect(palette.colors[0]!.hex.toLowerCase()).toBe(
        baseColor.toLowerCase()
      );
    });

    test('should calculate relationships correctly', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'triadic',
        count: 3,
        variation: 0,
      });

      expect(palette.metadata.relationships).toBeDefined();
      expect(palette.metadata.relationships.length).toBeGreaterThan(0);

      // Check that relationships have required properties
      palette.metadata.relationships.forEach(rel => {
        expect(rel).toHaveProperty('fromIndex');
        expect(rel).toHaveProperty('toIndex');
        expect(rel).toHaveProperty('relationship');
        expect(rel).toHaveProperty('strength');
        expect(rel).toHaveProperty('angle');

        expect(rel.strength).toBeGreaterThanOrEqual(0);
        expect(rel.strength).toBeLessThanOrEqual(1);
      });
    });

    test('should calculate diversity score', () => {
      const monochromaticPalette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'monochromatic',
        count: 5,
        variation: 10,
      });

      const triadicPalette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'triadic',
        count: 5,
        variation: 10,
      });

      expect(monochromaticPalette.metadata.diversity).toBeGreaterThanOrEqual(0);
      expect(monochromaticPalette.metadata.diversity).toBeLessThanOrEqual(100);

      expect(triadicPalette.metadata.diversity).toBeGreaterThanOrEqual(0);
      expect(triadicPalette.metadata.diversity).toBeLessThanOrEqual(100);

      // Triadic should generally be more diverse than monochromatic
      expect(triadicPalette.metadata.diversity).toBeGreaterThan(
        monochromaticPalette.metadata.diversity
      );
    });

    test('should calculate harmony score', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'complementary',
        count: 3,
        variation: 0,
      });

      expect(palette.metadata.harmonyScore).toBeGreaterThanOrEqual(0);
      expect(palette.metadata.harmonyScore).toBeLessThanOrEqual(100);

      // Perfect complementary should have high harmony score
      expect(palette.metadata.harmonyScore).toBeGreaterThanOrEqual(80);
    });

    test('should calculate accessibility score', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'complementary',
        count: 3,
        variation: 20,
      });

      expect(palette.metadata.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(palette.metadata.accessibilityScore).toBeLessThanOrEqual(100);
    });

    test('should include generation time in metadata', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'triadic',
        count: 5,
      });

      expect(palette.metadata.generationTime).toBeGreaterThanOrEqual(0);
      expect(palette.metadata.generationTime).toBeLessThan(1000); // Should be under 1 second
    });

    test('should handle edge cases for count', () => {
      // Minimum count
      const minPalette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'triadic',
        count: 3,
      });
      expect(minPalette.colors).toHaveLength(3);

      // Maximum count
      const maxPalette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'triadic',
        count: 10,
      });
      expect(maxPalette.colors).toHaveLength(10);
    });

    test('should handle different color input formats', () => {
      const formats = ['#FF0000', 'rgb(255, 0, 0)', 'hsl(0, 100%, 50%)', 'red'];

      formats.forEach(format => {
        const palette = PaletteGenerator.generateHarmonyPalette({
          baseColor: format,
          harmonyType: 'complementary',
          count: 3,
        });

        expect(palette.colors).toHaveLength(3);
        expect(palette.metadata.baseColor).toBe(format);
      });
    });
  });

  describe('input validation', () => {
    test('should throw error for invalid base color', () => {
      expect(() => {
        PaletteGenerator.generateHarmonyPalette({
          baseColor: 'invalid-color',
          harmonyType: 'complementary',
        });
      }).toThrow('Invalid base color');
    });

    test('should throw error for invalid harmony type', () => {
      expect(() => {
        PaletteGenerator.generateHarmonyPalette({
          baseColor: '#FF0000',
          harmonyType: 'invalid-harmony' as HarmonyType,
        });
      }).toThrow('Invalid harmony type');
    });

    test('should throw error for count out of range', () => {
      expect(() => {
        PaletteGenerator.generateHarmonyPalette({
          baseColor: '#FF0000',
          harmonyType: 'complementary',
          count: 2, // Too low
        });
      }).toThrow('Count must be between 3 and 10');

      expect(() => {
        PaletteGenerator.generateHarmonyPalette({
          baseColor: '#FF0000',
          harmonyType: 'complementary',
          count: 11, // Too high
        });
      }).toThrow('Count must be between 3 and 10');
    });

    test('should throw error for variation out of range', () => {
      expect(() => {
        PaletteGenerator.generateHarmonyPalette({
          baseColor: '#FF0000',
          harmonyType: 'complementary',
          variation: -1, // Too low
        });
      }).toThrow('Variation must be between 0 and 100');

      expect(() => {
        PaletteGenerator.generateHarmonyPalette({
          baseColor: '#FF0000',
          harmonyType: 'complementary',
          variation: 101, // Too high
        });
      }).toThrow('Variation must be between 0 and 100');
    });

    test('should throw error for missing base color', () => {
      expect(() => {
        PaletteGenerator.generateHarmonyPalette({
          baseColor: '',
          harmonyType: 'complementary',
        });
      }).toThrow('Base color is required');
    });
  });

  describe('performance requirements', () => {
    test('should generate palette within performance requirements', () => {
      const startTime = performance.now();

      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'triadic',
        count: 8,
        variation: 30,
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete within 500ms as per requirements
      expect(executionTime).toBeLessThan(500);
      expect(palette.metadata.generationTime).toBeLessThan(500);
    });

    test('should handle multiple rapid generations', () => {
      const startTime = performance.now();

      const palettes = [];
      for (let i = 0; i < 10; i++) {
        palettes.push(
          PaletteGenerator.generateHarmonyPalette({
            baseColor: `hsl(${i * 36}, 70%, 50%)`,
            harmonyType: 'complementary',
            count: 5,
          })
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(palettes).toHaveLength(10);
      expect(totalTime).toBeLessThan(2000); // 10 palettes in under 2 seconds
    });
  });

  describe('color theory compliance', () => {
    test('complementary colors should be approximately 180° apart', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000', // Red (0°)
        harmonyType: 'complementary',
        count: 3,
        variation: 0,
      });

      const hue1 = palette.colors[0]!.hsl.h;
      const hue2 = palette.colors[1]!.hsl.h;

      let hueDiff = Math.abs(hue2 - hue1);
      if (hueDiff > 180) hueDiff = 360 - hueDiff;

      expect(hueDiff).toBeCloseTo(180, 5);
    });

    test('triadic colors should be approximately 120° apart', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000', // Red (0°)
        harmonyType: 'triadic',
        count: 3,
        variation: 0,
      });

      const hues = palette.colors.map(color => color.hsl.h);

      // Check 120° spacing
      expect(Math.abs(hues[1]! - hues[0]!)).toBeCloseTo(120, 10);
      expect(Math.abs(hues[2]! - hues[0]!)).toBeCloseTo(240, 10);
    });

    test('analogous colors should be within 60° of base', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'analogous',
        count: 5,
        variation: 20,
      });

      const baseHue = palette.colors[0]!.hsl.h;

      palette.colors.slice(1).forEach(color => {
        let hueDiff = Math.abs(color.hsl.h - baseHue);
        if (hueDiff > 180) hueDiff = 360 - hueDiff;
        expect(hueDiff).toBeLessThanOrEqual(60);
      });
    });

    test('monochromatic colors should have same hue', () => {
      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'monochromatic',
        count: 5,
        variation: 30,
      });

      const baseHue = palette.colors[0]!.hsl.h;

      palette.colors.forEach(color => {
        expect(color.hsl.h).toBeCloseTo(baseHue, 1);
      });
    });
  });
});
