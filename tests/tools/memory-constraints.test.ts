/**
 * Tests for memory constraint functionality added to PNG generation tools
 */

import { createPalettePngTool } from '../../src/tools/create-palette-png';
import { createGradientPngTool } from '../../src/tools/create-gradient-png';
import { createColorComparisonPngTool } from '../../src/tools/create-color-comparison-png';
import { ErrorResponse, ToolResponse } from '../../src/types/index';

describe('Memory Constraint Tests', () => {
  describe('Palette PNG Memory Constraints', () => {
    it('should handle large dimensions with memory limit error', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
        dimensions: [15000, 15000], // 225 megapixels - exceeds 100MP limit
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('MEMORY_LIMIT_ERROR');
      expect(errorResult.error.message).toContain('memory limits');
    });

    it('should handle large dimensions successfully', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
        dimensions: [5000, 5000], // 25 megapixels - well within limits
      });

      expect(result.success).toBe(true);
      const successResult = result as ToolResponse;
      expect(successResult.data).toBeDefined();
    }, 120000); // Increase timeout to 2 minutes for large image generation in CI

    it('should handle custom background colors', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
        background: 'custom',
        background_color: '#333333',
      });

      expect(result.success).toBe(true);
      const successResult = result as ToolResponse;
      expect(successResult.data).toBeDefined();
    });

    it('should handle invalid custom background color', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
        background: 'custom',
        background_color: 'invalid-color',
      });

      // Should still succeed but use fallback background
      expect(result.success).toBe(true);
    });

    it('should handle transparent background', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
        background: 'transparent',
      });

      expect(result.success).toBe(true);
      const successResult = result as ToolResponse;
      expect(successResult.data).toBeDefined();
    });

    it('should handle different label styles', async () => {
      const labelStyles = ['minimal', 'detailed', 'branded'] as const;

      for (const labelStyle of labelStyles) {
        const result = await createPalettePngTool.handler({
          palette: ['#FF0000', '#00FF00'],
          labels: true,
          label_style: labelStyle,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle circular layout with many colors', async () => {
      const colors = Array.from(
        { length: 20 },
        (_, i) => `hsl(${i * 18}, 70%, 50%)`
      );

      const result = await createPalettePngTool.handler({
        palette: colors,
        layout: 'circular',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Gradient PNG Memory Constraints', () => {
    it('should handle large dimensions with memory limit error', async () => {
      const result = await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [15000, 15000], // 225 megapixels
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('MEMORY_LIMIT_ERROR');
    });

    it('should handle conic gradients with custom center', async () => {
      const result = await createGradientPngTool.handler({
        gradient: {
          type: 'conic',
          colors: ['#FF0000', '#00FF00', '#0000FF'],
          center: [25, 75],
        },
        dimensions: [400, 400],
      });

      expect(result.success).toBe(true);
    });

    it('should handle gradients with many colors', async () => {
      const colors = Array.from(
        { length: 15 },
        (_, i) => `hsl(${i * 24}, 70%, 50%)`
      );

      const result = await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors,
          positions: colors.map((_, i) => (i / (colors.length - 1)) * 100),
        },
        dimensions: [800, 600],
      });

      expect(result.success).toBe(true);
    });

    it('should handle different PNG formats', async () => {
      const formats = ['png', 'png24', 'png32'] as const;

      for (const format of formats) {
        const result = await createGradientPngTool.handler({
          gradient: {
            type: 'radial',
            colors: ['#FF0000', '#0000FF'],
          },
          dimensions: [200, 200],
          format,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle all quality levels', async () => {
      const qualities = ['draft', 'standard', 'high', 'ultra'] as const;

      for (const quality of qualities) {
        const result = await createGradientPngTool.handler({
          gradient: {
            type: 'linear',
            colors: ['#FF0000', '#0000FF'],
          },
          dimensions: [200, 200],
          quality,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle individual effects', async () => {
      const effects = ['noise', 'shadow', 'border'] as const;

      for (const effect of effects) {
        const result = await createGradientPngTool.handler({
          gradient: {
            type: 'linear',
            colors: ['#FF0000', '#0000FF'],
          },
          dimensions: [200, 200],
          effects: [effect],
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Color Comparison PNG Memory Constraints', () => {
    it('should handle large dimensions with memory limit error', async () => {
      const result = await createColorComparisonPngTool.handler({
        color_sets: [['#FF0000'], ['#00FF00']],
        dimensions: [15000, 15000], // 225 megapixels
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('MEMORY_LIMIT_ERROR');
    });

    it('should handle all comparison types', async () => {
      const comparisonTypes = [
        'side_by_side',
        'overlay',
        'difference',
        'harmony',
      ] as const;

      for (const comparisonType of comparisonTypes) {
        const result = await createColorComparisonPngTool.handler({
          color_sets: [
            ['#FF0000', '#FF8000'],
            ['#00FF00', '#80FF00'],
          ],
          comparison_type: comparisonType,
        });

        expect(result.success).toBe(true);
      }
    }, 120000); // 2 minute timeout for comparison generation

    it('should handle all chart styles', async () => {
      const chartStyles = ['professional', 'artistic', 'scientific'] as const;

      for (const chartStyle of chartStyles) {
        const result = await createColorComparisonPngTool.handler({
          color_sets: [['#FF0000'], ['#00FF00']],
          chart_style: chartStyle,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle different format optimizations', async () => {
      const formats = ['web', 'print', 'presentation'] as const;

      for (const formatFor of formats) {
        const result = await createColorComparisonPngTool.handler({
          color_sets: [['#FF0000'], ['#00FF00']],
          format_for: formatFor,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle annotations disabled', async () => {
      const result = await createColorComparisonPngTool.handler({
        color_sets: [['#FF0000'], ['#00FF00']],
        annotations: false,
      });

      expect(result.success).toBe(true);
    });

    it('should handle maximum color sets', async () => {
      const colorSets = Array.from({ length: 8 }, (_, i) => [
        `hsl(${i * 45}, 70%, 50%)`,
        `hsl(${i * 45 + 180}, 70%, 50%)`,
      ]);

      const result = await createColorComparisonPngTool.handler({
        color_sets: colorSets,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Named Color Support', () => {
    it('should handle CSS named colors in palette PNG', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['red', 'green', 'blue', 'yellow', 'purple'],
      });

      expect(result.success).toBe(true);
    });

    it('should handle CSS named colors in gradient PNG', async () => {
      const result = await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['red', 'blue', 'green'],
        },
        dimensions: [400, 300],
      });

      expect(result.success).toBe(true);
    });

    it('should handle CSS named colors in comparison PNG', async () => {
      const result = await createColorComparisonPngTool.handler({
        color_sets: [
          ['red', 'darkred'],
          ['blue', 'darkblue'],
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid named colors', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['red', 'invalid-color-name', 'blue'],
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_COLOR_FORMAT');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty palette gracefully', async () => {
      const result = await createPalettePngTool.handler({
        palette: [],
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should handle too many colors in palette', async () => {
      const colors = Array.from(
        { length: 150 },
        (_, i) => `#${i.toString(16).padStart(6, '0')}`
      );

      const result = await createPalettePngTool.handler({
        palette: colors,
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should handle gradient with too many colors', async () => {
      const colors = Array.from(
        { length: 25 },
        (_, i) => `#${i.toString(16).padStart(6, '0')}`
      );

      const result = await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors,
        },
        dimensions: [400, 300],
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should handle comparison with too many color sets', async () => {
      const colorSets = Array.from({ length: 15 }, () => ['#FF0000']);

      const result = await createColorComparisonPngTool.handler({
        color_sets: colorSets,
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should handle invalid dimensions', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000'],
        dimensions: [50, 50], // Below minimum
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should handle invalid resolution', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000'],
        resolution: 999 as any, // Invalid resolution
      });

      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_PARAMETERS');
    });
  });
});
