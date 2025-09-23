// @ts-nocheck
/**
 * Tests for APCA support in check-contrast tool
 */

import {
  checkContrast,
  CheckContrastParams,
} from '../../src/tools/check-contrast';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('checkContrast with APCA support', () => {
  describe('APCA Standard', () => {
    test('should calculate APCA score for light text on dark background', async () => {
      const params: CheckContrastParams = {
        foreground: '#FFFFFF',
        background: '#000000',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.standard).toBe('APCA');
        expect(result.data.apca_score).toBeDefined();
        expect(typeof result.data.apca_score).toBe('number');
        expect(result.data.compliance.apca_passes).toBeDefined();

        // White on black should have high APCA score
        expect(Math.abs(result.data.apca_score!)).toBeGreaterThan(75);
        expect(result.data.compliance.apca_passes).toBe(true);
      }
    });

    test('should calculate APCA score for dark text on light background', async () => {
      const params: CheckContrastParams = {
        foreground: '#000000',
        background: '#FFFFFF',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.apca_score).toBeDefined();
        expect(typeof result.data.apca_score).toBe('number');

        // Black on white should have high APCA score (negative value)
        expect(Math.abs(result.data.apca_score!)).toBeGreaterThan(75);
        expect(result.data.compliance.apca_passes).toBe(true);
      }
    });

    test('should handle low contrast combinations with APCA', async () => {
      const params: CheckContrastParams = {
        foreground: '#888888',
        background: '#999999',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.apca_score).toBeDefined();

        // Low contrast should have low APCA score
        expect(Math.abs(result.data.apca_score!)).toBeLessThan(30);
        expect(result.data.compliance.apca_passes).toBe(false);
      }
    });

    test('should respect text size for APCA thresholds', async () => {
      const params: CheckContrastParams = {
        foreground: '#666666',
        background: '#FFFFFF',
        text_size: 'large',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.text_size).toBe('large');
        expect(result.data.apca_score).toBeDefined();

        // Large text has lower APCA threshold (60 vs 75)
        // This combination might pass for large text but not normal text
      }
    });

    test('should include APCA scores in alternative combinations', async () => {
      const params: CheckContrastParams = {
        foreground: '#CCCCCC',
        background: '#DDDDDD',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success && result.data.alternative_combinations) {
        // Check that alternatives include APCA scores
        result.data.alternative_combinations.foreground_adjustments.forEach(
          adjustment => {
            expect(adjustment.apca_score).toBeDefined();
            expect(typeof adjustment.apca_score).toBe('number');
          }
        );

        result.data.alternative_combinations.background_adjustments.forEach(
          adjustment => {
            expect(adjustment.apca_score).toBeDefined();
            expect(typeof adjustment.apca_score).toBe('number');
          }
        );
      }
    });
  });

  describe('WCAG vs APCA Comparison', () => {
    test('should show different results between WCAG and APCA for same colors', async () => {
      const colors = {
        foreground: '#767676',
        background: '#FFFFFF',
      };

      // Test with WCAG_AA
      const wcagResult = await checkContrast({
        ...colors,
        standard: 'WCAG_AA',
      });

      // Test with APCA
      const apcaResult = await checkContrast({
        ...colors,
        standard: 'APCA',
      });

      expect(wcagResult.success).toBe(true);
      expect(apcaResult.success).toBe(true);

      if (wcagResult.success && apcaResult.success) {
        // Both should have contrast ratio
        expect(wcagResult.data.contrast_ratio).toBeDefined();
        expect(apcaResult.data.contrast_ratio).toBeDefined();

        // Only APCA should have APCA score
        expect(wcagResult.data.apca_score).toBeUndefined();
        expect(apcaResult.data.apca_score).toBeDefined();

        // Compliance might differ between standards
        expect(wcagResult.data.compliance.passes).toBeDefined();
        expect(apcaResult.data.compliance.passes).toBeDefined();
      }
    });

    test('should maintain WCAG calculations when using APCA', async () => {
      const params: CheckContrastParams = {
        foreground: '#000000',
        background: '#FFFFFF',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        // WCAG values should still be calculated
        expect(result.data.contrast_ratio).toBeDefined();
        expect(result.data.compliance.wcag_aa).toBeDefined();
        expect(result.data.compliance.wcag_aaa).toBeDefined();

        // APCA values should also be present
        expect(result.data.apca_score).toBeDefined();
        expect(result.data.compliance.apca_passes).toBeDefined();
      }
    });
  });

  describe('APCA Edge Cases', () => {
    test('should handle identical colors with APCA', async () => {
      const params: CheckContrastParams = {
        foreground: '#808080',
        background: '#808080',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        // Identical colors should have zero or near-zero APCA score
        expect(Math.abs(result.data.apca_score!)).toBeLessThan(5);
        expect(result.data.compliance.apca_passes).toBe(false);
      }
    });

    test('should handle extreme color combinations with APCA', async () => {
      const extremeCombinations = [
        { foreground: '#000000', background: '#000000' },
        { foreground: '#FFFFFF', background: '#FFFFFF' },
        { foreground: '#FF0000', background: '#00FF00' },
        { foreground: '#0000FF', background: '#FFFF00' },
      ];

      for (const combination of extremeCombinations) {
        const params: CheckContrastParams = {
          ...combination,
          standard: 'APCA',
        };

        const result = await checkContrast(params);
        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.apca_score).toBeDefined();
          expect(typeof result.data.apca_score).toBe('number');
          expect(isFinite(result.data.apca_score!)).toBe(true);
        }
      }
    });

    test('should handle very similar colors with APCA', async () => {
      const params: CheckContrastParams = {
        foreground: '#808080',
        background: '#818181',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        // Very similar colors should have very low APCA score
        expect(Math.abs(result.data.apca_score!)).toBeLessThan(10);
        expect(result.data.compliance.apca_passes).toBe(false);
      }
    });
  });

  describe('APCA Recommendations', () => {
    test('should provide APCA-specific recommendations', async () => {
      const params: CheckContrastParams = {
        foreground: '#999999',
        background: '#AAAAAA',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.recommendations).toBeInstanceOf(Array);
        expect(result.data.recommendations.length).toBeGreaterThan(0);

        // Should include accessibility-related recommendations
        const recommendationText = result.data.recommendations
          .join(' ')
          .toLowerCase();
        expect(recommendationText).toMatch(/contrast|accessibility|color/);
      }
    });

    test('should generate accessibility notes for APCA', async () => {
      const params: CheckContrastParams = {
        foreground: '#CCCCCC',
        background: '#FFFFFF',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.metadata.accessibilityNotes).toBeInstanceOf(Array);

        if (result.metadata.accessibilityNotes.length > 0) {
          const notesText = result.metadata.accessibilityNotes
            .join(' ')
            .toLowerCase();
          expect(notesText).toMatch(/contrast|apca|accessibility/);
        }
      }
    });
  });

  describe('APCA Performance', () => {
    test('should calculate APCA within reasonable time', async () => {
      const params: CheckContrastParams = {
        foreground: '#FF0000',
        background: '#FFFFFF',
        standard: 'APCA',
      };

      const startTime = Date.now();
      const result = await checkContrast(params);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast

      if (result.success) {
        expect(result.data.apca_score).toBeDefined();
      }
    });
  });

  describe('APCA Response Format', () => {
    test('should include APCA fields in response structure', async () => {
      const params: CheckContrastParams = {
        foreground: '#000000',
        background: '#FFFFFF',
        standard: 'APCA',
      };

      const result = await checkContrast(params);
      expect(result.success).toBe(true);

      if (result.success) {
        // Check APCA-specific fields
        expect(result.data).toHaveProperty('apca_score');
        expect(result.data.compliance).toHaveProperty('apca_passes');

        // Ensure WCAG fields are still present
        expect(result.data).toHaveProperty('contrast_ratio');
        expect(result.data.compliance).toHaveProperty('wcag_aa');
        expect(result.data.compliance).toHaveProperty('wcag_aaa');

        // Check metadata
        expect(result.metadata).toHaveProperty('execution_time');
        expect(result.metadata).toHaveProperty('colorSpaceUsed');
      }
    });
  });
});
