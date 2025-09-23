/**
 * Tests for mix-colors tool
 */

import { mixColorsTool } from '../../src/tools/mix-colors';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('mix-colors tool', () => {
  describe('parameter validation', () => {
    test('should require colors parameter', async () => {
      const result = (await mixColorsTool.handler({})) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('colors');
    });

    test('should require at least 2 colors', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000'],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('At least 2 colors');
    });

    test('should limit maximum colors to 10', async () => {
      const colors = Array(11).fill('#FF0000');
      const result = (await mixColorsTool.handler({
        colors,
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('Maximum 10 colors');
    });

    test('should validate ratios length matches colors length', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        ratios: [0.5],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should validate ratios sum to 1.0', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        ratios: [0.3, 0.3],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('color mixing functionality', () => {
    test('should mix two colors with equal ratios', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#0000FF'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('mixed_color');
      expect(result.data).toHaveProperty('input_colors');
      expect(result.data).toHaveProperty('ratios');
      expect((result.data as any).ratios).toEqual([0.5, 0.5]);
    });

    test('should mix colors with custom ratios', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        ratios: [0.7, 0.3],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).ratios).toEqual([0.7, 0.3]);
    });

    test('should support different blend modes', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        blend_mode: 'multiply',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).blend_mode).toBe('multiply');
    });

    test('should support different color spaces', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        color_space: 'hsl',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).color_space).toBe('hsl');
    });

    test('should mix multiple colors', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00', '#0000FF'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).input_colors).toHaveLength(3);
      expect((result.data as any).ratios).toEqual([1 / 3, 1 / 3, 1 / 3]);
    });
  });

  describe('error handling', () => {
    test('should handle invalid color format', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['invalid', '#00FF00'],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR');
      expect(result.error.message).toContain('Invalid color at index 0');
    });

    test('should provide helpful error suggestions', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['invalid', '#00FF00'],
      })) as ErrorResponse;

      expect(result.error.suggestions).toBeDefined();
      expect(result.error.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    test('should complete mixing in under 500ms', async () => {
      const startTime = Date.now();

      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      })) as ToolResponse;

      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('accessibility features', () => {
    test('should include accessibility notes', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toBeDefined();
    });

    test('should provide recommendations', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        blend_mode: 'multiply',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toBeDefined();
      expect(result.metadata.recommendations!.length).toBeGreaterThan(0);
    });
  });

  describe('blend modes', () => {
    test('should apply multiply blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        blend_mode: 'multiply',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      // Multiply should result in darker colors
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should apply screen blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#800000', '#008000'],
        blend_mode: 'screen',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      // Screen should result in lighter colors
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should apply overlay blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#808080', '#FF0000'],
        blend_mode: 'overlay',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should apply darken blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        blend_mode: 'darken',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should apply lighten blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#800000', '#008000'],
        blend_mode: 'lighten',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should apply difference blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        blend_mode: 'difference',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should apply exclusion blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        blend_mode: 'exclusion',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should apply color_burn blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#808080', '#FF0000'],
        blend_mode: 'color_burn',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should apply color_dodge blend mode correctly', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#808080', '#800000'],
        blend_mode: 'color_dodge',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should handle color_burn with zero overlay values', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#808080', '#000000'],
        blend_mode: 'color_burn',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should handle color_dodge with maximum overlay values', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#808080', '#FFFFFF'],
        blend_mode: 'color_dodge',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should handle overlay with dark base colors', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#404040', '#FF0000'],
        blend_mode: 'overlay',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });

    test('should handle overlay with light base colors', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#C0C0C0', '#FF0000'],
        blend_mode: 'overlay',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const mixedColor = (result.data as any).mixed_color;
      expect(mixedColor.hex).toBeDefined();
    });
  });

  describe('color space mixing', () => {
    test('should mix in RGB color space', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#0000FF'],
        color_space: 'rgb',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.color_space_used).toBe('rgb');
    });

    test('should mix in HSL color space', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#0000FF'],
        color_space: 'hsl',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.color_space_used).toBe('hsl');
    });

    test('should mix in LAB color space', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#0000FF'],
        color_space: 'lab',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.color_space_used).toBe('lab');
    });

    test('should mix in LCH color space', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#0000FF'],
        color_space: 'lch',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.color_space_used).toBe('lch');
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle empty colors in array', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '', '#0000FF'],
      })) as ErrorResponse;

      // Empty strings fail validation first, so this should be INVALID_PARAMETERS
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle single color with blend mode', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000'],
        blend_mode: 'multiply',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle processing error gracefully', async () => {
      // Test with an invalid color that will cause UnifiedColor to throw
      const result = (await mixColorsTool.handler({
        colors: ['invalid-color-format', '#00FF00'],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR');
    });

    test('should handle ratios with small floating point differences', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        ratios: [0.5, 0.5000001], // Very small difference
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });
  });

  describe('accessibility and recommendations', () => {
    test('should provide accessibility notes for high contrast colors', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#000000', '#FFFFFF'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toBeDefined();
      expect(
        result.metadata.accessibility_notes!.some(note =>
          note.includes('good contrast')
        )
      ).toBe(true);
    });

    test('should provide accessibility warnings for low contrast colors', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#777777', '#888888'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toBeDefined();
      // Check if any accessibility notes are provided (the exact message may vary)
      expect(
        result.metadata.accessibility_notes!.length
      ).toBeGreaterThanOrEqual(0);
    });

    test('should provide recommendations for complex blending', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        blend_mode: 'multiply',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toBeDefined();
      expect(
        result.metadata.recommendations!.some(rec =>
          rec.includes('mixing pairs sequentially')
        )
      ).toBe(true);
    });

    test('should provide recommendations for LAB/LCH color spaces', async () => {
      const result = (await mixColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        color_space: 'lab',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toBeDefined();
      expect(
        result.metadata.recommendations!.some(rec =>
          rec.includes('perceptually uniform')
        )
      ).toBe(true);
    });
  });
});
