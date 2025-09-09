/**
 * Tests for create-color-wheel-html tool
 */

import { createColorWheelHtmlTool } from '../../src/tools/create-color-wheel-html';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('create-color-wheel-html tool', () => {
  describe('Basic functionality', () => {
    test('should generate HTML for basic color wheel', async () => {
      const params = {};

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('wheel_type', 'hsl');
      expect(result.data).toHaveProperty('size', 400);
      expect(result.data).toHaveProperty('interactive', true);
      expect(result.visualizations).toHaveProperty('html');
      expect(result.visualizations?.html).toContain('<!DOCTYPE html>');
      expect(result.visualizations?.html).toContain('Interactive Color Wheel');
    });

    test('should handle different wheel types', async () => {
      const types = ['hsl', 'hsv', 'rgb', 'ryw', 'ryb'];

      for (const type of types) {
        const params = { type: type as any };
        const result = (await createColorWheelHtmlTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
        expect((result.data as any).wheel_type).toBe(type);
        expect(result.visualizations?.html).toContain(
          `${type.toUpperCase()} color wheel`
        );
      }
    });
  });

  describe('Size options', () => {
    test('should support custom size', async () => {
      const params = { size: 600 };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).size).toBe(600);
      expect(result.visualizations?.html).toContain('width="600"');
      expect(result.visualizations?.html).toContain('height="600"');
    });

    test('should reject size too small', async () => {
      const params = { size: 100 };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject size too large', async () => {
      const params = { size: 1500 };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Highlight colors', () => {
    test('should handle valid highlight colors', async () => {
      const params = {
        highlight_colors: ['#FF0000', '#00FF00', '#0000FF'],
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).highlight_colors).toEqual([
        '#ff0000',
        '#00ff00',
        '#0000ff',
      ]);
      expect(result.visualizations?.html).toContain('highlight-color');
    });

    test('should reject invalid highlight colors', async () => {
      const params = {
        highlight_colors: ['invalid-color'],
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
    });

    test('should handle different color formats in highlights', async () => {
      const params = {
        highlight_colors: ['#FF0000', 'rgb(0, 255, 0)', 'hsl(240, 100%, 50%)'],
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).highlight_colors).toHaveLength(3);
    });

    test('should reject too many highlight colors', async () => {
      const params = {
        highlight_colors: Array(15).fill('#FF0000'),
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Harmony features', () => {
    test('should show harmony when enabled', async () => {
      const params = {
        show_harmony: true,
        harmony_type: 'complementary' as const,
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).harmony_type).toBe('complementary');
      expect(result.visualizations?.html).toContain('harmony-info');
      expect(result.visualizations?.html).toContain(
        'Color Harmony: complementary'
      );
    });

    test('should require harmony_type when show_harmony is true', async () => {
      const params = {
        show_harmony: true,
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should support all harmony types', async () => {
      const harmonyTypes = [
        'complementary',
        'triadic',
        'analogous',
        'split_complementary',
        'tetradic',
      ];

      for (const harmonyType of harmonyTypes) {
        const params = {
          show_harmony: true,
          harmony_type: harmonyType as any,
        };

        const result = (await createColorWheelHtmlTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
        expect((result.data as any).harmony_type).toBe(harmonyType);
      }
    });
  });

  describe('Interactive features', () => {
    test('should include interactive JavaScript when enabled', async () => {
      const params = { interactive: true };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('<script>');
      expect(result.visualizations?.html).toContain('initializeColorWheel');
      expect(result.visualizations?.html).toContain('handleWheelClick');
    });

    test('should not include JavaScript when interactive is disabled', async () => {
      const params = { interactive: false };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).not.toContain('<script>');
    });

    test('should include keyboard navigation support', async () => {
      const params = { interactive: true };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain(
        'setupWheelKeyboardNavigation'
      );
      expect(result.visualizations?.html).toContain('ArrowRight');
      expect(result.visualizations?.html).toContain('ArrowLeft');
    });
  });

  describe('Theme support', () => {
    test('should support light theme (default)', async () => {
      const params = {};

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('theme-light');
    });

    test('should support dark theme', async () => {
      const params = { theme: 'dark' as const };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('theme-dark');
    });

    test('should support auto theme', async () => {
      const params = { theme: 'auto' as const };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('theme-auto');
    });
  });

  describe('HTML validation', () => {
    test('should generate valid HTML5 structure', async () => {
      const params = {};

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html?.trim()).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('</html>');
    });

    test('should include proper SVG structure', async () => {
      const params = {};

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 400 400"');
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label=');
    });

    test('should include accessibility attributes', async () => {
      const params = {};

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('role="group"');
      expect(html).toContain('aria-label=');
      // tabindex is added by JavaScript, so check for the JavaScript that adds it
      expect(html).toContain("setAttribute('tabindex', '0')");
    });

    test('should be self-contained (no external dependencies)', async () => {
      const params = { interactive: true };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      // Should not contain external links or scripts
      expect(html).not.toContain('src="http');
      expect(html).not.toContain('href="http');
      expect(html).not.toContain('cdn.');
    });
  });

  describe('Performance', () => {
    test('should complete within performance requirements', async () => {
      const params = {
        size: 800,
        highlight_colors: ['#FF0000', '#00FF00', '#0000FF'],
        show_harmony: true,
        harmony_type: 'triadic' as const,
      };

      const startTime = Date.now();
      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(result.metadata.execution_time).toBeLessThan(2000);
    });

    test('should handle large wheels efficiently', async () => {
      const params = {
        size: 1000,
        highlight_colors: Array(8)
          .fill(0)
          .map((_, i) => `hsl(${i * 45}, 70%, 50%)`),
      };

      const startTime = Date.now();
      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle large wheels

      // Should recommend performance consideration for large wheels
      const successResult = result as ToolResponse;
      expect(successResult.metadata.recommendations).toContain(
        'Large color wheels may impact performance on mobile devices'
      );
    });
  });

  describe('Error handling', () => {
    test('should reject invalid wheel type', async () => {
      const params = { type: 'invalid' as any };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid harmony type', async () => {
      const params = {
        show_harmony: true,
        harmony_type: 'invalid' as any,
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid theme', async () => {
      const params = { theme: 'invalid' as any };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid size values', async () => {
      const params = { size: 50 }; // Too small

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject extremely large size values', async () => {
      const params = { size: 2000 }; // Too large

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid highlight colors', async () => {
      const params = { highlight_colors: ['invalid-color'] };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
    });

    test('should reject too many highlight colors', async () => {
      const params = {
        highlight_colors: Array(20).fill('#FF0000'), // Too many colors
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle null parameters gracefully', async () => {
      const params = { highlight_colors: null as any };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle show_harmony without harmony_type', async () => {
      const params = { show_harmony: true }; // Missing harmony_type

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Recommendations', () => {
    test('should provide performance recommendations for large wheels', async () => {
      const params = { size: 900 };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Large color wheels may impact performance on mobile devices'
      );
    });

    test('should recommend fewer highlight colors when many are used', async () => {
      const params = {
        highlight_colors: Array(8).fill('#FF0000'),
      };

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Consider using fewer highlight colors for better visual clarity'
      );
    });
  });

  describe('Responsive design', () => {
    test('should include responsive CSS', async () => {
      const params = {};

      const result = (await createColorWheelHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('@media (max-width: 768px)');
    });
  });
});
