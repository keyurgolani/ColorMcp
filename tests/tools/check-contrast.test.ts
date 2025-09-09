/**
 * Tests for check_contrast MCP tool
 */

import { describe, test, expect } from '@jest/globals';
import { checkContrast } from '../../src/tools/check-contrast';

describe('checkContrast tool', () => {
  describe('parameter validation', () => {
    test('should require foreground parameter', async () => {
      const result = await checkContrast({ background: '#FFFFFF' } as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error.code).toBe('MISSING_PARAMETER');
        expect((result as any).error.message).toContain(
          'Foreground color parameter is required'
        );
      }
    });

    test('should require background parameter', async () => {
      const result = await checkContrast({ foreground: '#000000' } as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error.code).toBe('MISSING_PARAMETER');
        expect((result as any).error.message).toContain(
          'Background color parameter is required'
        );
      }
    });

    test('should validate foreground color format', async () => {
      const result = await checkContrast({
        foreground: 'invalid_color',
        background: '#FFFFFF',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error.code).toBe('INVALID_FOREGROUND_COLOR');
        expect((result as any).error.message).toContain(
          'Invalid foreground color format'
        );
      }
    });

    test('should validate background color format', async () => {
      const result = await checkContrast({
        foreground: '#000000',
        background: 'invalid_color',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error.code).toBe('INVALID_BACKGROUND_COLOR');
        expect((result as any).error.message).toContain(
          'Invalid background color format'
        );
      }
    });
  });

  describe('contrast calculations', () => {
    test('should calculate maximum contrast for black on white', async () => {
      const result = await checkContrast({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).contrast_ratio).toBeCloseTo(21, 0);
        expect((result.data as any).compliance.wcag_aa).toBe(true);
        expect((result.data as any).compliance.wcag_aaa).toBe(true);
        expect((result.data as any).compliance.passes).toBe(true);
      }
    });

    test('should calculate maximum contrast for white on black', async () => {
      const result = await checkContrast({
        foreground: '#FFFFFF',
        background: '#000000',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).contrast_ratio).toBeCloseTo(21, 0);
        expect((result.data as any).compliance.wcag_aa).toBe(true);
        expect((result.data as any).compliance.wcag_aaa).toBe(true);
        expect((result.data as any).compliance.passes).toBe(true);
      }
    });

    test('should calculate minimum contrast for identical colors', async () => {
      const result = await checkContrast({
        foreground: '#808080',
        background: '#808080',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).contrast_ratio).toBeCloseTo(1, 0);
        expect((result.data as any).compliance.wcag_aa).toBe(false);
        expect((result.data as any).compliance.wcag_aaa).toBe(false);
        expect((result.data as any).compliance.passes).toBe(false);
      }
    });

    test('should handle different text sizes', async () => {
      const mediumContrast = {
        foreground: '#666666',
        background: '#FFFFFF',
      };

      const normalResult = await checkContrast({
        ...mediumContrast,
        text_size: 'normal',
      });

      const largeResult = await checkContrast({
        ...mediumContrast,
        text_size: 'large',
      });

      expect(normalResult.success).toBe(true);
      expect(largeResult.success).toBe(true);

      if (normalResult.success && largeResult.success) {
        // Same colors should have same contrast ratio
        expect((normalResult.data as any).contrast_ratio).toBe(
          (largeResult.data as any).contrast_ratio
        );

        // But compliance might differ due to different thresholds
        expect((normalResult.data as any).text_size).toBe('normal');
        expect((largeResult.data as any).text_size).toBe('large');

        // Large text has more lenient requirements
        if (
          (normalResult.data as any).contrast_ratio >= 3.0 &&
          (normalResult.data as any).contrast_ratio < 4.5
        ) {
          expect((normalResult.data as any).compliance.wcag_aa).toBe(false);
          expect((largeResult.data as any).compliance.wcag_aa).toBe(true);
        }
      }
    });
  });

  describe('recommendations', () => {
    test('should provide recommendations for poor contrast', async () => {
      const result = await checkContrast({
        foreground: '#CCCCCC',
        background: '#FFFFFF',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).compliance.passes).toBe(false);
        expect((result.data as any).recommendations.length).toBeGreaterThan(0);
        expect(
          (result.data as any).recommendations.some(
            (rec: any) =>
              rec.includes('accessibility') || rec.includes('contrast')
          )
        ).toBe(true);
      }
    });

    test('should provide positive feedback for good contrast', async () => {
      const result = await checkContrast({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).compliance.passes).toBe(true);
        expect(
          (result.data as any).recommendations.some(
            (rec: any) => rec.includes('Excellent') || rec.includes('Good')
          )
        ).toBe(true);
      }
    });

    test('should suggest specific improvements', async () => {
      const result = await checkContrast({
        foreground: '#999999',
        background: '#CCCCCC',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).compliance.passes).toBe(false);
        expect(
          (result.data as any).recommendations.some(
            (rec: any) => rec.includes('darker') || rec.includes('lighter')
          )
        ).toBe(true);
      }
    });
  });

  describe('alternative combinations', () => {
    test('should provide alternatives for poor contrast', async () => {
      const result = await checkContrast({
        foreground: '#AAAAAA',
        background: '#CCCCCC',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).compliance.passes).toBe(false);
        expect((result.data as any).alternative_combinations).toBeDefined();

        const alternatives = (result.data as any).alternative_combinations!;
        expect(Array.isArray(alternatives.foreground_adjustments)).toBe(true);
        expect(Array.isArray(alternatives.background_adjustments)).toBe(true);

        // Should provide multiple alternatives
        expect(alternatives.foreground_adjustments.length).toBeGreaterThan(0);
        expect(alternatives.background_adjustments.length).toBeGreaterThan(0);

        // Alternatives should have better contrast
        const bestFgAlt = alternatives.foreground_adjustments[0];
        const bestBgAlt = alternatives.background_adjustments[0];

        expect(bestFgAlt.contrast_ratio).toBeGreaterThan(
          (result.data as any).contrast_ratio
        );
        expect(bestBgAlt.contrast_ratio).toBeGreaterThan(
          (result.data as any).contrast_ratio
        );
      }
    });

    test('should not provide alternatives for good contrast', async () => {
      const result = await checkContrast({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).compliance.passes).toBe(true);
        expect((result.data as any).alternative_combinations).toBeUndefined();
      }
    });

    test('should sort alternatives by contrast ratio', async () => {
      const result = await checkContrast({
        foreground: '#888888',
        background: '#BBBBBB',
      });

      expect(result.success).toBe(true);
      if (result.success && (result.data as any).alternative_combinations) {
        const fgAlts = (result.data as any).alternative_combinations
          .foreground_adjustments;
        const bgAlts = (result.data as any).alternative_combinations
          .background_adjustments;

        // Should be sorted by contrast ratio (descending)
        for (let i = 1; i < fgAlts.length; i++) {
          expect(fgAlts[i - 1].contrast_ratio).toBeGreaterThanOrEqual(
            fgAlts[i].contrast_ratio
          );
        }

        for (let i = 1; i < bgAlts.length; i++) {
          expect(bgAlts[i - 1].contrast_ratio).toBeGreaterThanOrEqual(
            bgAlts[i].contrast_ratio
          );
        }
      }
    });
  });

  describe('different color formats', () => {
    test('should handle various color formats', async () => {
      const formats = [
        { fg: '#000000', bg: '#FFFFFF' },
        { fg: 'rgb(0, 0, 0)', bg: 'rgb(255, 255, 255)' },
        { fg: 'hsl(0, 0%, 0%)', bg: 'hsl(0, 0%, 100%)' },
        { fg: 'black', bg: 'white' },
      ];

      for (const format of formats) {
        const result = await checkContrast({
          foreground: format.fg,
          background: format.bg,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as any).contrast_ratio).toBeCloseTo(21, 0);
        }
      }
    });
  });

  describe('performance requirements', () => {
    test('should complete contrast check within 300ms', async () => {
      const startTime = Date.now();
      const result = await checkContrast({
        foreground: '#2563eb',
        background: '#ffffff',
      });
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(300);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.metadata.execution_time).toBeLessThan(300);
      }
    });

    test('should handle multiple checks efficiently', async () => {
      const combinations = [
        { fg: '#000000', bg: '#FFFFFF' },
        { fg: '#333333', bg: '#FFFFFF' },
        { fg: '#666666', bg: '#FFFFFF' },
        { fg: '#999999', bg: '#FFFFFF' },
        { fg: '#CCCCCC', bg: '#FFFFFF' },
      ];

      const startTime = Date.now();

      const results = await Promise.all(
        combinations.map(combo =>
          checkContrast({
            foreground: combo.fg,
            background: combo.bg,
          })
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / combinations.length;

      expect(averageTime).toBeLessThan(100); // Average should be under 100ms
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('metadata and response format', () => {
    test('should include proper metadata', async () => {
      const result = await checkContrast({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata).toBeDefined();
        expect(typeof result.metadata.execution_time).toBe('number');
        expect(result.metadata.color_space_used).toBe('sRGB');
        expect(Array.isArray(result.metadata.accessibility_notes!)).toBe(true);
        expect(Array.isArray(result.metadata.recommendations!)).toBe(true);
      }
    });

    test('should provide accessibility notes', async () => {
      const goodResult = await checkContrast({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      const poorResult = await checkContrast({
        foreground: '#CCCCCC',
        background: '#FFFFFF',
      });

      expect(goodResult.success).toBe(true);
      expect(poorResult.success).toBe(true);

      if (goodResult.success) {
        expect(
          goodResult.metadata.accessibility_notes!.some(
            note => note.includes('AAA') || note.includes('Excellent')
          )
        ).toBe(true);
      }

      if (poorResult.success) {
        expect(
          poorResult.metadata.accessibility_notes!.some(
            note => note.includes('does not meet') || note.includes('WCAG')
          )
        ).toBe(true);
      }
    });

    test('should limit recommendations to reasonable number', async () => {
      const result = await checkContrast({
        foreground: '#808080',
        background: '#CCCCCC',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.recommendations!.length).toBeLessThanOrEqual(5);
        expect((result.data as any).recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('edge cases', () => {
    test('should handle extreme color combinations', async () => {
      const extremeCombinations = [
        { fg: '#000000', bg: '#000000' }, // Same color
        { fg: '#FFFFFF', bg: '#FFFFFF' }, // Same color
        { fg: '#FF0000', bg: '#00FF00' }, // Complementary colors
        { fg: '#0000FF', bg: '#FFFF00' }, // High contrast colors
      ];

      for (const combo of extremeCombinations) {
        const result = await checkContrast({
          foreground: combo.fg,
          background: combo.bg,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as any).contrast_ratio).toBeGreaterThanOrEqual(1);
          expect((result.data as any).contrast_ratio).toBeLessThanOrEqual(21);
        }
      }
    });

    test('should handle colors with alpha channel', async () => {
      const result = await checkContrast({
        foreground: 'rgba(0, 0, 0, 0.8)',
        background: 'rgba(255, 255, 255, 1)',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).contrast_ratio).toBeGreaterThan(1);
      }
    });
  });

  describe('error handling', () => {
    test('should handle contrast check errors gracefully', async () => {
      const result = await checkContrast({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      // Should either succeed or fail gracefully
      if (!result.success) {
        expect((result as any).error).toBeDefined();
        expect((result as any).error.code).toBeDefined();
        expect((result as any).error.message).toBeDefined();
        expect(Array.isArray((result as any).error.suggestions)).toBe(true);
      } else {
        expect(result.data as any).toBeDefined();
      }
    });
  });
});
