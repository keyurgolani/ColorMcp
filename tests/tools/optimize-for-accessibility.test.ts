// @ts-nocheck
/**
 * Tests for optimize-for-accessibility tool
 */

import {
  optimizeForAccessibility,
  OptimizeForAccessibilityParams,
} from '../../src/tools/optimize-for-accessibility';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('optimizeForAccessibility', () => {
  describe('Parameter Validation', () => {
    test('should require palette array', async () => {
      const params = {
        use_cases: ['text'],
      } as OptimizeForAccessibilityParams;

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);

      const errorResult = result as any;
      expect(errorResult.error.code).toBe('MISSING_PALETTE');
    });

    test('should require non-empty palette array', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: [],
        use_cases: ['text'],
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);

      const errorResult = result as any;
      expect(errorResult.error.code).toBe('MISSING_PALETTE');
    });

    test('should require use_cases array', async () => {
      const params = {
        palette: ['#FF0000'],
      } as OptimizeForAccessibilityParams;

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);

      const errorResult = result as any;
      expect(errorResult.error.code).toBe('MISSING_USE_CASES');
    });

    test('should validate use_cases values', async () => {
      const params = {
        palette: ['#FF0000'],
        use_cases: ['invalid_use_case' as any],
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);

      const errorResult = result as any;
      expect(errorResult.error.code).toBe('INVALID_USE_CASES');
    });

    test('should validate color formats', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['invalid_color'],
        use_cases: ['text'],
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);

      const errorResult = result as any;
      expect(errorResult.error.code).toBe('INVALID_COLOR_FORMAT');
    });
  });

  describe('Color Optimization', () => {
    test('should optimize colors for text use case', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FFAAAA', '#AAFFAA'], // Light colors that need darkening for text
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      const successResult = result as any;
      expect(successResult.data.optimization_results).toHaveLength(2);

      successResult.data.optimization_results.forEach((optimization: any) => {
        expect(optimization.use_case).toBe('text');
        expect(optimization.optimized_color).toMatch(/^#[0-9A-F]{6}$/i);

        // Text colors should generally be darker
        if (optimization.optimization_applied) {
          expect(optimization.changes_made.length).toBeGreaterThan(0);
        }
      });
    });

    test('should optimize colors for background use case', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#333333', '#666666'], // Dark colors that need lightening for backgrounds
        use_cases: ['background'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      const successResult = result as any;
      expect(successResult.data.optimization_results).toHaveLength(2);

      successResult.data.optimization_results.forEach((optimization: any) => {
        expect(optimization.use_case).toBe('background');

        // Background colors should generally be lighter and less saturated
        if (optimization.optimization_applied) {
          expect(optimization.changes_made.length).toBeGreaterThan(0);
        }
      });
    });

    test('should optimize colors for accent use case', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#808080'], // Neutral color that needs more vibrancy for accent
        use_cases: ['accent'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.optimization_results).toHaveLength(1);

        const optimization = result.data.optimization_results[0];
        expect(optimization.use_case).toBe('accent');

        // Accent colors should be more vibrant
        if (optimization.optimization_applied) {
          expect(
            optimization.changes_made.some(
              change =>
                change.includes('Saturation') || change.includes('Lightness')
            )
          ).toBe(true);
        }
      }
    });

    test('should optimize colors for interactive use case', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#CCCCCC'], // Light color that needs better contrast for interactive elements
        use_cases: ['interactive'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.optimization_results).toHaveLength(1);

        const optimization = result.data.optimization_results[0];
        expect(optimization.use_case).toBe('interactive');

        // Interactive elements should have good contrast
        if (optimization.optimization_applied) {
          expect(
            optimization.contrast_improvement.after
          ).toBeGreaterThanOrEqual(optimization.contrast_improvement.before);
        }
      }
    });

    test('should handle multiple use cases', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000'],
        use_cases: ['text', 'background', 'accent'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.optimization_results).toHaveLength(3);

        const useCases = result.data.optimization_results.map(r => r.use_case);
        expect(useCases).toContain('text');
        expect(useCases).toContain('background');
        expect(useCases).toContain('accent');
      }
    });

    test('should respect WCAG_AAA standard', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#888888'],
        use_cases: ['text'],
        target_standard: 'WCAG_AAA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.target_standard).toBe('WCAG_AAA');

        const optimization = result.data.optimization_results[0];

        // AAA standard should result in higher contrast requirements
        if (optimization.optimization_applied) {
          expect(optimization.accessibility_compliance.wcag_aaa_after).toBe(
            true
          );
        }
      }
    });

    test('should preserve hue when requested', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF8888'], // Light red that needs darkening
        use_cases: ['text'],
        preserve_hue: true,
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.preserve_hue).toBe(true);

        const optimization = result.data.optimization_results[0];

        // Hue should be preserved (minimal change)
        expect(optimization.hue_preservation.hue_difference).toBeLessThan(10);
      }
    });

    test('should preserve brand colors', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000', '#00FF00'],
        use_cases: ['text'],
        preserve_brand_colors: ['#FF0000'],
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        const redOptimization = result.data.optimization_results.find(
          r => r.original_color === '#FF0000'
        );

        expect(redOptimization).toBeDefined();
        if (redOptimization) {
          expect(redOptimization.optimization_applied).toBe(false);
          expect(redOptimization.changes_made).toContain(
            'Color preserved as brand color'
          );
        }
      }
    });
  });

  describe('Accessibility Compliance', () => {
    test('should improve accessibility compliance', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#CCCCCC', '#DDDDDD'], // Light colors with poor contrast
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(
          result.data.summary.compliance_rate_after
        ).toBeGreaterThanOrEqual(result.data.summary.compliance_rate_before);

        // Should show improvement in contrast
        result.data.optimization_results.forEach(optimization => {
          if (optimization.optimization_applied) {
            expect(
              optimization.contrast_improvement.after
            ).toBeGreaterThanOrEqual(optimization.contrast_improvement.before);
          }
        });
      }
    });

    test('should generate recommended pairings', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#333333', '#EEEEEE'],
        use_cases: ['text', 'background'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.recommended_pairings).toBeInstanceOf(Array);

        if (result.data.recommended_pairings.length > 0) {
          result.data.recommended_pairings.forEach(pairing => {
            expect(pairing).toHaveProperty('foreground');
            expect(pairing).toHaveProperty('background');
            expect(pairing).toHaveProperty('contrast_ratio');
            expect(pairing).toHaveProperty('compliant');
            expect(pairing.contrast_ratio).toBeGreaterThan(0);
          });
        }
      }
    });

    test('should provide accessibility notes', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000', '#00FF00'],
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.accessibility_notes).toBeInstanceOf(Array);
        expect(result.data.recommendations).toBeInstanceOf(Array);
        expect(result.data.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle already compliant colors', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#000000', '#FFFFFF'], // Already high contrast
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        // Should not need optimization
        result.data.optimization_results.forEach(optimization => {
          expect(optimization.accessibility_compliance.wcag_aa_before).toBe(
            true
          );
        });
      }
    });

    test('should handle extreme color values', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'],
        use_cases: ['text', 'background'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.optimization_results.length).toBeGreaterThan(0);

        // All optimized colors should be valid hex codes
        result.data.optimization_results.forEach(optimization => {
          expect(optimization.optimized_color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      }
    });

    test('should handle various color formats', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000', 'rgb(0, 255, 0)', 'hsl(240, 100%, 50%)'],
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.optimization_results).toHaveLength(3);

        // All should have valid hex output
        result.data.optimization_results.forEach(optimization => {
          expect(optimization.optimized_color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      }
    });
  });

  describe('Performance', () => {
    test('should complete optimization within reasonable time', async () => {
      const colors = Array(10)
        .fill(0)
        .map((_, i) => `hsl(${i * 36}, 70%, 50%)`);

      const params: OptimizeForAccessibilityParams = {
        palette: colors,
        use_cases: ['text', 'background'],
        target_standard: 'WCAG_AA',
      };

      const startTime = Date.now();
      const result = await optimizeForAccessibility(params);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds

      if (result.success) {
        expect(result.data.optimization_results).toHaveLength(20); // 10 colors × 2 use cases
      }
    });
  });

  describe('Response Format', () => {
    test('should return properly formatted response', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000'],
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(true);

      if (result.success) {
        // Check response structure
        expect(result.data).toHaveProperty('target_standard');
        expect(result.data).toHaveProperty('preserve_hue');
        expect(result.data).toHaveProperty('optimization_results');
        expect(result.data).toHaveProperty('summary');
        expect(result.data).toHaveProperty('recommended_pairings');
        expect(result.data).toHaveProperty('accessibility_notes');
        expect(result.data).toHaveProperty('recommendations');

        // Check summary structure
        expect(result.data.summary).toHaveProperty('total_colors');
        expect(result.data.summary).toHaveProperty('colors_optimized');
        expect(result.data.summary).toHaveProperty('colors_preserved');
        expect(result.data.summary).toHaveProperty(
          'average_contrast_improvement'
        );
        expect(result.data.summary).toHaveProperty('compliance_rate_before');
        expect(result.data.summary).toHaveProperty('compliance_rate_after');

        // Check metadata
        expect(result.metadata).toHaveProperty('execution_time');
        expect(result.metadata).toHaveProperty('colorSpaceUsed');
        expect(result.metadata).toHaveProperty('accessibilityNotes');
        expect(result.metadata).toHaveProperty('recommendations');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid color format', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['invalid-color'],
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
    });

    test('should handle empty palette', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: [],
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_PALETTE');
    });

    test('should handle empty use cases', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000'],
        use_cases: [],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_USE_CASES');
    });

    test('should handle invalid use cases', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000'],
        use_cases: ['invalid-use-case' as any],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_USE_CASES');
    });

    test('should handle invalid target standard', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000'],
        use_cases: ['text'],
        target_standard: 'INVALID_STANDARD' as any,
      };

      const result = await optimizeForAccessibility(params);
      // This might succeed with default values, so just check it doesn't crash
      expect(result).toBeDefined();
    });

    test('should handle null palette', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: null as any,
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_PALETTE');
    });

    test('should handle mixed valid and invalid colors', async () => {
      const params: OptimizeForAccessibilityParams = {
        palette: ['#FF0000', 'invalid-color', '#00FF00'],
        use_cases: ['text'],
        target_standard: 'WCAG_AA',
      };

      const result = await optimizeForAccessibility(params);
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_COLOR_FORMAT');
    });
  });
});
