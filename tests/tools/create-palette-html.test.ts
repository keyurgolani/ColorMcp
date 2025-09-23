/**
 * Tests for create-palette-html tool
 */

import { createPaletteHtmlTool } from '../../src/tools/create-palette-html';
import { ToolResponse, ErrorResponse } from '../../src/types/index';
import { extractHtmlContent, hasHtmlContent } from '../test-utils';

describe('create-palette-html tool', () => {
  describe('Basic functionality', () => {
    test('should generate HTML for simple palette', async () => {
      const params = {
        palette: ['#FF0000', '#00FF00', '#0000FF'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('colors');
      expect(result.data).toHaveProperty('color_count', 3);
      expect(hasHtmlContent(result)).toBe(true);

      const html = await extractHtmlContent(result);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Color Palette Visualization');
    });

    test('should handle different color formats', async () => {
      const params = {
        palette: ['#FF0000', 'rgb(0, 255, 0)', 'hsl(240, 100%, 50%)', 'blue'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('color_count', 4);

      const html = await extractHtmlContent(result);
      expect(html).toContain('#ff0000');
      expect(html).toContain('#00ff00');
      expect(html).toContain('#0000ff');
    });
  });

  describe('Layout options', () => {
    test('should support horizontal layout', async () => {
      const params = {
        palette: ['#FF0000', '#00FF00'],
        layout: 'horizontal' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain(
        'palette-layout-horizontal'
      );
    });

    test('should support vertical layout', async () => {
      const params = {
        palette: ['#FF0000', '#00FF00'],
        layout: 'vertical' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('palette-layout-vertical');
    });

    test('should support grid layout', async () => {
      const params = {
        palette: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        layout: 'grid' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('palette-layout-grid');
    });

    test('should support circular layout', async () => {
      const params = {
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        layout: 'circular' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('palette-layout-circular');
    });
  });

  describe('Size options', () => {
    test('should support small size', async () => {
      const params = {
        palette: ['#FF0000'],
        size: 'small' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('palette-size-small');
    });

    test('should support medium size (default)', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('palette-size-medium');
    });

    test('should support large size', async () => {
      const params = {
        palette: ['#FF0000'],
        size: 'large' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('palette-size-large');
    });

    test('should require custom_dimensions when size is custom', async () => {
      const params = {
        palette: ['#FF0000'],
        size: 'custom' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should accept custom dimensions when size is custom', async () => {
      const params = {
        palette: ['#FF0000'],
        size: 'custom' as const,
        custom_dimensions: [200, 150] as [number, number],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
    });
  });

  describe('Display options', () => {
    test('should show color values by default', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('color-values');
      expect(result.visualizations?.html).toContain('#ff0000');
    });

    test('should hide color values when disabled', async () => {
      const params = {
        palette: ['#FF0000'],
        show_values: false,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      // Should not show color values in the display
      const html = result.visualizations?.html || '';
      // Check that the color-values div is not present when show_values is false
      expect(html).not.toMatch(/<div class="color-values">/);
    });

    test('should show color names when enabled', async () => {
      const params = {
        palette: ['red', 'blue'],
        show_names: true,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('color-name');
    });
  });

  describe('Accessibility features', () => {
    test('should include accessibility information when enabled', async () => {
      const params = {
        palette: ['#FF0000', '#000000'],
        accessibility_info: true,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('accessibility-info');
      expect(result.visualizations?.html).toContain('contrast-ratio');
      expect(result.visualizations?.html).toContain('wcag-badge');
    });

    test('should include accessibility information when enabled', async () => {
      const params = {
        palette: ['#FF0000', '#000000'],
        accessibility_info: true,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('accessibility-info');
      expect(result.visualizations?.html).toContain('contrast-ratio');
      expect(result.visualizations?.html).toContain('wcag-badge');
    });

    test('should include proper ARIA labels', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('role="button"');
      expect(result.visualizations?.html).toContain('tabindex="0"');
      expect(result.visualizations?.html).toContain('aria-label=');
    });

    test('should include keyboard navigation support', async () => {
      const params = {
        palette: ['#FF0000', '#00FF00'],
        interactive: true,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('keydown');
      expect(result.visualizations?.html).toContain('ArrowRight');
      expect(result.visualizations?.html).toContain('ArrowLeft');
    });
  });

  describe('Interactive features', () => {
    test('should include interactive JavaScript when enabled', async () => {
      const params = {
        palette: ['#FF0000'],
        interactive: true,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('<script>');
      expect(result.visualizations?.html).toContain(
        'initializePaletteVisualization'
      );
      expect(result.visualizations?.html).toContain('copy-palette');
    });

    test('should include JavaScript even when interactive is disabled (for background controls)', async () => {
      const params = {
        palette: ['#FF0000'],
        interactive: false,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      // Enhanced HTML generator always includes background controller JavaScript
      expect(result.visualizations?.html).toContain('<script>');
      expect(result.visualizations?.html).toContain('BackgroundController');
    });

    test('should include export controls when export formats are specified', async () => {
      const params = {
        palette: ['#FF0000'],
        interactive: true,
        export_formats: ['hex', 'css'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('export-controls');
      expect(result.visualizations?.html).toContain('export-format');
      expect(result.visualizations?.html).toContain('export-palette');
    });
  });

  describe('Theme support', () => {
    test('should support light theme (default)', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('theme-light');
    });

    test('should support dark theme', async () => {
      const params = {
        palette: ['#FF0000'],
        theme: 'dark' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('theme-dark');
    });

    test('should support auto theme', async () => {
      const params = {
        palette: ['#FF0000'],
        theme: 'auto' as const,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('theme-auto');
    });
  });

  describe('Export formats', () => {
    test('should generate CSS export when requested', async () => {
      const params = {
        palette: ['#FF0000', '#00FF00'],
        export_formats: ['css'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats?.css).toContain(':root');
      expect(result.export_formats?.css).toContain('--red: #ff0000');
      expect(result.export_formats?.css).toContain('--lime: #00ff00');
    });

    test('should generate JSON export when requested', async () => {
      const params = {
        palette: ['#FF0000'],
        export_formats: ['json'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('json');
      expect(result.export_formats?.json).toHaveProperty('palette');
      expect(result.export_formats?.json).toHaveProperty('metadata');
    });
  });

  describe('Recommendations', () => {
    test('should recommend fewer colors for large palettes', async () => {
      const params = {
        palette: Array.from(
          { length: 15 },
          (_, i) => `hsl(${i * 24}, 70%, 50%)`
        ), // 15 colors > 10
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const successResult = result as ToolResponse;
      expect(successResult.metadata.recommendations).toContain(
        'Consider using fewer colors for better visual clarity'
      );
    });

    test('should recommend fewer colors for circular layout with many colors', async () => {
      const params = {
        palette: Array.from(
          { length: 12 },
          (_, i) => `hsl(${i * 30}, 70%, 50%)`
        ), // 12 colors > 8
        layout: 'circular',
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const successResult = result as ToolResponse;
      expect(successResult.metadata.recommendations).toContain(
        'Circular layout works best with 8 or fewer colors'
      );
    });
  });

  describe('Error handling', () => {
    test('should reject empty palette', async () => {
      const params = {
        palette: [],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject palette with too many colors', async () => {
      const params = {
        palette: Array(51).fill('#FF0000'),
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid color formats', async () => {
      const params = {
        palette: ['invalid-color'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error.suggestions).toContain('Use hex format like #FF0000');
    });

    test('should reject invalid layout option', async () => {
      const params = {
        palette: ['#FF0000'],
        layout: 'invalid' as any,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid size option', async () => {
      const params = {
        palette: ['#FF0000'],
        size: 'invalid' as any,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid custom dimensions', async () => {
      const params = {
        palette: ['#FF0000'],
        size: 'custom' as const,
        custom_dimensions: [10, 10] as [number, number], // Too small
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('HTML validation', () => {
    test('should generate valid HTML5 structure', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html?.trim()).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('<title>');
      expect(html).toContain('</html>');
    });

    test('should include proper meta tags', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('charset="UTF-8"');
      expect(html).toContain('name="viewport"');
      expect(html).toContain('name="description"');
    });

    test('should include embedded CSS', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('<style>');
      expect(html).toContain(':root {');
      expect(html).toContain('--color-primary');
      expect(html).toContain('</style>');
    });

    test('should be self-contained (no external dependencies)', async () => {
      const params = {
        palette: ['#FF0000'],
        interactive: true,
      };

      const result = (await createPaletteHtmlTool.handler(
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
        palette: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
      };

      const startTime = Date.now();
      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(result.metadata.execution_time).toBeLessThan(2000);
    });

    test('should handle large palettes efficiently', async () => {
      const params = {
        palette: Array(20)
          .fill(0)
          .map((_, i) => `hsl(${i * 18}, 70%, 50%)`),
      };

      const startTime = Date.now();
      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle large palettes
    });
  });

  describe('Responsive design', () => {
    test('should include responsive CSS', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('@media (max-width: 768px)');
      expect(html).toContain('clamp(');
    });

    test('should include accessibility media queries', async () => {
      const params = {
        palette: ['#FF0000'],
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('@media (prefers-contrast: high)');
      expect(html).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
