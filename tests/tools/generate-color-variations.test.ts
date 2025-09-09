/**
 * Tests for generate-color-variations tool
 */

import { generateColorVariationsTool } from '../../src/tools/generate-color-variations';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

// Helper function to parse HSL string
function parseHSL(hslString: string) {
  const match = hslString.match(
    /hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/
  );
  if (!match || !match[1] || !match[2] || !match[3]) {
    throw new Error(`Invalid HSL string: ${hslString}`);
  }
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

describe('generate-color-variations tool', () => {
  describe('parameter validation', () => {
    test('should require base_color parameter', async () => {
      const result = (await generateColorVariationsTool.handler({
        variation_type: 'tints',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('base_color');
    });

    test('should require variation_type parameter', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('variation_type');
    });

    test('should validate variation_type values', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'invalid',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('tints, shades, tones, all');
    });

    test('should validate steps range', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
        steps: 2,
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('Minimum 3 steps');
    });

    test('should validate intensity range', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
        intensity: 150,
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('between 0 and 100');
    });
  });

  describe('tints generation', () => {
    test('should generate tints correctly', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
        steps: 5,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).variation_type).toBe('tints');
      expect((result.data as any).variations).toHaveLength(5);

      // Tints should get progressively lighter
      const variations = (result.data as any).variations;
      for (let i = 1; i < variations.length; i++) {
        const currentHSL = parseHSL(variations[i].hsl);
        const previousHSL = parseHSL(variations[i - 1].hsl);
        expect(currentHSL.l).toBeGreaterThanOrEqual(previousHSL.l);
      }
    });

    test('should maintain hue and saturation in tints', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
        steps: 3,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const baseColor = (result.data as any).base_color;
      const baseColorHSL = parseHSL(baseColor.hsl);
      const variations = (result.data as any).variations;

      variations.forEach((variation: any) => {
        const variationHSL = parseHSL(variation.hsl);
        expect(Math.abs(variationHSL.h - baseColorHSL.h)).toBeLessThan(1);
        expect(Math.abs(variationHSL.s - baseColorHSL.s)).toBeLessThan(1);
      });
    });
  });

  describe('shades generation', () => {
    test('should generate shades correctly', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'shades',
        steps: 5,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).variation_type).toBe('shades');
      expect((result.data as any).variations).toHaveLength(5);

      // Shades should get progressively darker
      const variations = (result.data as any).variations;
      for (let i = 1; i < variations.length; i++) {
        const currentHSL = parseHSL(variations[i].hsl);
        const previousHSL = parseHSL(variations[i - 1].hsl);
        expect(currentHSL.l).toBeLessThanOrEqual(previousHSL.l);
      }
    });

    test('should maintain hue and saturation in shades', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#00FF00',
        variation_type: 'shades',
        steps: 3,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const baseColor = (result.data as any).base_color;
      const baseColorHSL = parseHSL(baseColor.hsl);
      const variations = (result.data as any).variations;

      variations.forEach((variation: any) => {
        const variationHSL = parseHSL(variation.hsl);
        expect(Math.abs(variationHSL.h - baseColorHSL.h)).toBeLessThan(1);
        expect(Math.abs(variationHSL.s - baseColorHSL.s)).toBeLessThan(1);
      });
    });
  });

  describe('tones generation', () => {
    test('should generate tones correctly', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tones',
        steps: 5,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).variation_type).toBe('tones');
      expect((result.data as any).variations).toHaveLength(5);

      // Tones should get progressively less saturated
      const variations = (result.data as any).variations;
      for (let i = 1; i < variations.length; i++) {
        const currentHSL = parseHSL(variations[i].hsl);
        const previousHSL = parseHSL(variations[i - 1].hsl);
        expect(currentHSL.s).toBeLessThanOrEqual(previousHSL.s);
      }
    });

    test('should maintain hue and lightness in tones', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#0000FF',
        variation_type: 'tones',
        steps: 3,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const baseColor = (result.data as any).base_color;
      const baseColorHSL = parseHSL(baseColor.hsl);
      const variations = (result.data as any).variations;

      variations.forEach((variation: any) => {
        const variationHSL = parseHSL(variation.hsl);
        expect(Math.abs(variationHSL.h - baseColorHSL.h)).toBeLessThan(1);
        expect(Math.abs(variationHSL.l - baseColorHSL.l)).toBeLessThan(1);
      });
    });
  });

  describe('all variations generation', () => {
    test('should generate all variation types', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'all',
        steps: 3,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).variations).toHaveProperty('tints');
      expect((result.data as any).variations).toHaveProperty('shades');
      expect((result.data as any).variations).toHaveProperty('tones');
      expect((result.data as any).variations.tints).toHaveLength(3);
      expect((result.data as any).variations.shades).toHaveLength(3);
      expect((result.data as any).variations.tones).toHaveLength(3);
    });

    test('should include analysis for all variations', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'all',
        steps: 5,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).analysis).toHaveProperty('tints');
      expect((result.data as any).analysis).toHaveProperty('shades');
      expect((result.data as any).analysis).toHaveProperty('tones');
    });
  });

  describe('intensity parameter', () => {
    test('should respect intensity parameter', async () => {
      const lowIntensity = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
        steps: 5,
        intensity: 20,
      })) as ToolResponse;

      const highIntensity = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
        steps: 5,
        intensity: 80,
      })) as ToolResponse;

      expect(lowIntensity.success).toBe(true);
      expect(highIntensity.success).toBe(true);

      const lowVariations = (lowIntensity.data as any).variations;
      const highVariations = (highIntensity.data as any).variations;

      // High intensity should create more dramatic variations
      const lowLastHSL = parseHSL(lowVariations[lowVariations.length - 1].hsl);
      const lowFirstHSL = parseHSL(lowVariations[0].hsl);
      const lowRange = lowLastHSL.l - lowFirstHSL.l;

      const highLastHSL = parseHSL(
        highVariations[highVariations.length - 1].hsl
      );
      const highFirstHSL = parseHSL(highVariations[0].hsl);
      const highRange = highLastHSL.l - highFirstHSL.l;

      expect(highRange).toBeGreaterThan(lowRange);
    });
  });

  describe('error handling', () => {
    test('should handle invalid base color', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: 'invalid',
        variation_type: 'tints',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR');
      expect(result.error.message).toContain('Invalid base color');
    });

    test('should provide helpful error suggestions', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: 'invalid',
        variation_type: 'tints',
      })) as ErrorResponse;

      expect(result.error.suggestions).toBeDefined();
      expect(result.error.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    test('should complete generation in under 500ms', async () => {
      const startTime = Date.now();

      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'all',
        steps: 20,
      })) as ToolResponse;

      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('export formats', () => {
    test('should include CSS export format', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
        steps: 3,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats!.css).toContain('--color-tints-');
    });

    test('should include SCSS export format', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'shades',
        steps: 3,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('scss');
      expect(result.export_formats!.scss).toContain('$color-shades-');
    });

    test('should include JSON export format', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tones',
        steps: 3,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('json');
      expect((result.export_formats!.json as any).base_color).toBe('#FF0000');
    });
  });

  describe('analysis features', () => {
    test('should include variation analysis', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
        steps: 5,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).analysis).toBeDefined();
      expect((result.data as any).analysis.count).toBe(5);
      expect((result.data as any).analysis.lightness_range).toBeDefined();
    });

    test('should count accessibility compliant variations', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'shades',
        steps: 10,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(
        (result.data as any).analysis.accessibility_compliant
      ).toBeDefined();
      expect(typeof (result.data as any).analysis.accessibility_compliant).toBe(
        'number'
      );
    });
  });

  describe('accessibility features', () => {
    test('should include accessibility notes', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'tints',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toBeDefined();
      expect(result.metadata.accessibility_notes!.length).toBeGreaterThan(0);
    });

    test('should provide recommendations', async () => {
      const result = (await generateColorVariationsTool.handler({
        base_color: '#FF0000',
        variation_type: 'all',
        intensity: 10,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toBeDefined();
      expect(result.metadata.recommendations!.length).toBeGreaterThan(0);
    });
  });
});
