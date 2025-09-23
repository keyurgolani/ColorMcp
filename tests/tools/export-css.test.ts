/**
 * Tests for export-css tool
 */

import { exportCssTool } from '../../src/tools/export-css';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('export-css tool', () => {
  describe('basic functionality', () => {
    test('should export CSS variables format', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        format: 'variables' as const,
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('css_output');
      expect(result.data).toHaveProperty('format', 'variables');
      expect(result.data).toHaveProperty('color_count', 3);

      const css = (result.data as any).css_output;
      expect(css).toContain(':root');
      expect(css).toContain('--color-1: #ff0000;');
      expect(css).toContain('--color-2: #00ff00;');
      expect(css).toContain('--color-3: #0000ff;');
    });

    test('should export CSS classes format', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        format: 'classes' as const,
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;
      expect(css).toContain('.bg-color-1');
      expect(css).toContain('.text-color-1');
      expect(css).toContain('.border-color-1');
      expect(css).toContain('background-color: var(--color-1, #ff0000);');
    });

    test('should export both variables and classes', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'both' as const,
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;
      expect(css).toContain(':root');
      expect(css).toContain('--color-1');
      expect(css).toContain('.bg-color-1');
      expect(css).toContain('.text-color-1');
    });
  });

  describe('customization options', () => {
    test('should use custom prefix', async () => {
      const params = {
        colors: ['#FF0000'],
        prefix: 'brand',
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;
      expect(css).toContain('--brand-1');
      expect(css).toContain('.bg-brand-1');
    });

    test('should use semantic names', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        semantic_names: ['primary', 'secondary'],
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;
      expect(css).toContain('--primary');
      expect(css).toContain('--secondary');
      expect(css).toContain('.bg-primary');
      expect(css).toContain('.bg-secondary');
    });

    test('should include RGB and HSL variants', async () => {
      const params = {
        colors: ['#FF0000'],
        include_rgb_hsl: true,
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;
      expect(css).toContain('--color-1-rgb: 255, 0, 0;');
      expect(css).toContain('--color-1-hsl: 0, 100%, 50%;');
    });

    test('should include fallback variants', async () => {
      const params = {
        colors: ['#FF0000'],
        include_fallbacks: true,
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;
      expect(css).toContain('--color-1-light');
      expect(css).toContain('--color-1-dark');
      expect(css).toContain('.bg-color-1:hover');
    });

    test('should minify CSS output', async () => {
      const params = {
        colors: ['#FF0000'],
        minify: true,
        include_rgb_hsl: false,
        include_fallbacks: false,
        format: 'variables' as const,
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;
      expect(css).not.toContain('\n  '); // No indentation
      expect(css).toContain(':root{--color-1:#ff0000;}');
    });
  });

  describe('export formats', () => {
    test('should include export formats', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats).toHaveProperty('json');

      const jsonData = result.export_formats!.json as any;
      expect(jsonData.colors).toHaveLength(2);
      expect(jsonData.colors[0]).toHaveProperty('hex', '#ff0000');
      expect(jsonData.metadata).toHaveProperty('total_colors', 2);
    });
  });

  describe('error handling', () => {
    test('should handle invalid color format', async () => {
      const params = {
        colors: ['invalid-color'],
      };

      const result = (await exportCssTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR');
      expect(result.error.message).toContain('Invalid color format');
      expect(result.error.details).toHaveProperty('provided', 'invalid-color');
    });

    test('should handle empty colors array', async () => {
      const params = {
        colors: [],
      };

      const result = (await exportCssTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle invalid prefix', async () => {
      const params = {
        colors: ['#FF0000'],
        prefix: '123invalid',
      };

      const result = (await exportCssTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('performance', () => {
    test('should handle large color arrays efficiently', async () => {
      const colors = Array(50)
        .fill(0)
        .map((_, i) => `hsl(${i * 7}, 70%, 50%)`);

      const startTime = Date.now();
      const result = (await exportCssTool.handler({ colors })) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
      expect((result.data as any).color_count).toBe(50);
    });

    test('should complete within performance requirements', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
        format: 'both' as const,
        include_rgb_hsl: true,
        include_fallbacks: true,
      };

      const startTime = Date.now();
      const result = (await exportCssTool.handler(params)) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
    });
  });

  describe('CSS output validation', () => {
    test('should generate valid CSS syntax', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        format: 'both' as const,
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;

      // Check for proper CSS syntax
      expect(css).toMatch(/:root\s*\{/);
      expect(css).toMatch(/--[\w-]+:\s*#[0-9a-f]{6};/i);
      expect(css).toMatch(/\.[\w-]+\s*\{/);
      expect(css).toMatch(
        /background-color:\s*var\(--[\w-]+,\s*#[0-9a-f]{6}\);/i
      );
    });

    test('should sanitize semantic names', async () => {
      const params = {
        colors: ['#FF0000'],
        semantic_names: ['Primary Color!@#'],
      };

      const result = (await exportCssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).css_output;
      expect(css).toContain('--primary-color-');
      expect(css).not.toContain('!@#');
    });
  });
});
