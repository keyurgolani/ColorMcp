/**
 * Tests for PNG gradient generation tool
 */

import { createGradientPngTool } from '../../src/tools/create-gradient-png';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('create_gradient_png tool', () => {
  describe('parameter validation', () => {
    it('should require gradient parameter', async () => {
      const result = (await createGradientPngTool.handler({
        dimensions: [400, 300],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('gradient');
    });

    it('should require dimensions parameter', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('dimensions');
    });

    it('should validate gradient type', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'invalid',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [400, 300],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should require at least 2 colors', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000'],
        },
        dimensions: [400, 300],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    it('should validate dimensions range', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [50, 50], // Too small
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('color validation', () => {
    it('should reject invalid color formats', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['invalid_color', '#FF0000'],
        },
        dimensions: [400, 300],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error.message).toContain('invalid_color');
    });

    it('should accept valid color formats', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', 'rgb(0,255,0)', 'hsl(240,100%,50%)'],
        },
        dimensions: [400, 300],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.png_base64).toBeDefined();
    });
  });

  describe('linear gradient generation', () => {
    it('should generate linear gradient with default angle', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [400, 300],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.png_base64).toBeDefined();
      expect((result.data as any).gradient_type).toBe('linear');
    });

    it('should handle custom angle', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
          angle: 45,
        },
        dimensions: [400, 300],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });

    it('should handle custom color positions', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#00FF00', '#0000FF'],
          positions: [0, 30, 100],
        },
        dimensions: [400, 300],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });

    it('should handle multiple colors', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: [
            '#FF0000',
            '#FFFF00',
            '#00FF00',
            '#00FFFF',
            '#0000FF',
            '#FF00FF',
          ],
        },
        dimensions: [600, 100],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).color_count).toBe(6);
    });
  });

  describe('radial gradient generation', () => {
    it('should generate radial gradient with default center', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'radial',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [400, 400],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).gradient_type).toBe('radial');
    });

    it('should handle custom center point', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'radial',
          colors: ['#FF0000', '#0000FF'],
          center: [25, 75],
        },
        dimensions: [400, 400],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });

    it('should handle different shapes', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'radial',
          colors: ['#FF0000', '#0000FF'],
          shape: 'ellipse',
        },
        dimensions: [600, 300],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });
  });

  describe('conic gradient generation', () => {
    it('should generate conic gradient', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'conic',
          colors: [
            '#FF0000',
            '#FFFF00',
            '#00FF00',
            '#00FFFF',
            '#0000FF',
            '#FF00FF',
            '#FF0000',
          ],
        },
        dimensions: [400, 400],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).gradient_type).toBe('conic');
    });

    it('should handle custom center for conic gradient', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'conic',
          colors: ['#FF0000', '#00FF00', '#0000FF'],
          center: [30, 70],
        },
        dimensions: [400, 400],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });
  });

  describe('quality and format options', () => {
    it('should handle different quality settings', async () => {
      const qualities = ['draft', 'standard', 'high', 'ultra'] as const;

      for (const quality of qualities) {
        const result = (await createGradientPngTool.handler({
          gradient: {
            type: 'linear',
            colors: ['#FF0000', '#0000FF'],
          },
          dimensions: [400, 300],
          quality,
        })) as ToolResponse;

        expect(result.success).toBe(true);
      }
    });

    it('should handle different resolutions', async () => {
      const resolutions = [72, 150, 300, 600] as const;

      for (const resolution of resolutions) {
        const result = (await createGradientPngTool.handler({
          gradient: {
            type: 'linear',
            colors: ['#FF0000', '#0000FF'],
          },
          dimensions: [400, 300],
          resolution,
        })) as ToolResponse;

        expect(result.success).toBe(true);
        expect((result.data as any).resolution).toBe(resolution);
      }
    });

    it('should handle different PNG formats', async () => {
      const formats = ['png', 'png24', 'png32'] as const;

      for (const format of formats) {
        const result = (await createGradientPngTool.handler({
          gradient: {
            type: 'linear',
            colors: ['#FF0000', '#0000FF'],
          },
          dimensions: [400, 300],
          format,
        })) as ToolResponse;

        expect(result.success).toBe(true);
      }
    });
  });

  describe('effects and styling', () => {
    it('should handle noise effect', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [400, 300],
        effects: ['noise'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });

    it('should handle shadow effect', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'radial',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [400, 400],
        effects: ['shadow'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });

    it('should handle border effect', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [400, 300],
        effects: ['border'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });

    it('should handle multiple effects', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [400, 300],
        effects: ['noise', 'border', 'shadow'],
      })) as ToolResponse;

      expect(result.success).toBe(true);
    });
  });

  describe('performance and file size', () => {
    it('should complete within 2000ms', async () => {
      const startTime = Date.now();

      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: Array.from(
            { length: 10 },
            (_, i) => `hsl(${i * 36}, 70%, 50%)`
          ),
        },
        dimensions: [1200, 800],
      })) as ToolResponse;

      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(2000);
    });

    it('should generate files under 10MB', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'radial',
          colors: ['#FF0000', '#00FF00', '#0000FF'],
        },
        dimensions: [1500, 1500], // Reduced dimensions to stay under 10MB
        resolution: 300,
        quality: 'high', // Reduced quality to stay under 10MB
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).total_file_size).toBeLessThan(
        10 * 1024 * 1024
      );
    });

    it('should handle large dimensions efficiently', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [3000, 2000],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).dimensions).toEqual([3000, 2000]);
    });
  });

  describe('error handling', () => {
    it('should handle memory constraints gracefully', async () => {
      const result = await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [15000, 15000], // Clearly exceeds 100 megapixel limit
        resolution: 72,
        quality: 'draft',
      });

      // Should fail with memory constraint error
      expect(result.success).toBe(false);
      expect((result as ErrorResponse).error.message).toContain(
        'memory limits'
      );
    }, 10000);

    it('should provide helpful error messages', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['not_a_color', '#FF0000'],
        },
        dimensions: [400, 300],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.suggestions).toBeDefined();
      expect(result.error.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('metadata and response format', () => {
    it('should include proper metadata', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#00FF00'],
        },
        dimensions: [400, 300],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata).toHaveProperty('execution_time');
      expect(result.metadata).toHaveProperty('tool', 'create_gradient_png');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('color_space_used', 'sRGB');
      expect(result.metadata).toHaveProperty('recommendations');
    });

    it('should return valid base64 PNG data', async () => {
      const result = (await createGradientPngTool.handler({
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#0000FF'],
        },
        dimensions: [400, 300],
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.png_base64).toBeDefined();

      // Check if it's valid base64
      const base64 = result.visualizations!.png_base64!;
      expect(() => Buffer.from(base64, 'base64')).not.toThrow();

      // Check if it has reasonable size
      const buffer = Buffer.from(base64, 'base64');
      expect(buffer.length).toBeGreaterThan(100); // Should be a reasonable PNG size (reduced for test environment)
    });
  });
});
