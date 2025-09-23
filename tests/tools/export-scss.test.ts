/**
 * Tests for export-scss tool
 */

import { exportScssTool } from '../../src/tools/export-scss';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('export-scss tool', () => {
  describe('basic functionality', () => {
    test('should export SCSS variables format', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        format: 'variables' as const,
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('scss_output');
      expect(result.data).toHaveProperty('format', 'variables');
      expect(result.data).toHaveProperty('color_count', 3);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('$color-1: #ff0000;');
      expect(scss).toContain('$color-2: #00ff00;');
      expect(scss).toContain('$color-3: #0000ff;');
    });

    test('should export SCSS map format', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        format: 'map' as const,
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('$colors: (');
      expect(scss).toContain("'color-1': #ff0000,");
      expect(scss).toContain("'color-2': #00ff00,");
      expect(scss).toContain(');');
    });

    test('should export SCSS mixins format', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'mixins' as const,
        include_functions: true,
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('@function color($name)');
      expect(scss).toContain('@mixin bg-color($name, $opacity: 1)');
      expect(scss).toContain('@mixin text-color($name, $opacity: 1)');
      expect(scss).toContain(
        '@mixin border-color($name, $width: 1px, $style: solid)'
      );
    });

    test('should export all SCSS formats', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'all' as const,
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('$color-1: #ff0000;'); // Variables
      expect(scss).toContain('$colors: ('); // Map
      expect(scss).toContain('@function color($name)'); // Functions
    });
  });

  describe('customization options', () => {
    test('should use custom prefix', async () => {
      const params = {
        colors: ['#FF0000'],
        prefix: 'brand',
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('$brand-1: #ff0000;');
    });

    test('should use semantic names', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        semantic_names: ['primary', 'secondary'],
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('$primary: #ff0000;');
      expect(scss).toContain('$secondary: #00ff00;');
    });

    test('should use namespace', async () => {
      const params = {
        colors: ['#FF0000'],
        namespace: 'theme',
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('$theme-color-1: #ff0000;');
      expect(scss).toContain('$theme-colors: (');
      expect(scss).toContain('@function theme-color($name)');
    });

    test('should include color variants', async () => {
      const params = {
        colors: ['#FF0000'],
        include_variants: true,
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('$color-1-light:');
      expect(scss).toContain('$color-1-dark:');
    });

    test('should exclude functions when requested', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'all' as const,
        include_functions: false,
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).not.toContain('@function');
      expect(scss).not.toContain('@mixin');
    });
  });

  describe('export formats', () => {
    test('should include export formats', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('scss');
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats).toHaveProperty('json');

      const jsonData = result.export_formats!.json as any;
      expect(jsonData.colors).toHaveLength(2);
      expect(jsonData.colors[0]).toHaveProperty('variable_name', '$color-1');
    });

    test('should convert SCSS to CSS preview', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'variables' as const,
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('css');

      const css = result.export_formats!.css as string;
      expect(css).toContain(':root');
      expect(css).toContain('--color-1: #ff0000;');
    });
  });

  describe('error handling', () => {
    test('should handle invalid color format', async () => {
      const params = {
        colors: ['invalid-color'],
      };

      const result = (await exportScssTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR');
      expect(result.error.message).toContain('Invalid color format');
    });

    test('should handle empty colors array', async () => {
      const params = {
        colors: [],
      };

      const result = (await exportScssTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle invalid namespace', async () => {
      const params = {
        colors: ['#FF0000'],
        namespace: '123invalid',
      };

      const result = (await exportScssTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('SCSS syntax validation', () => {
    test('should generate valid SCSS syntax', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        format: 'all' as const,
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;

      // Check for proper SCSS syntax
      expect(scss).toMatch(/\$[\w-]+:\s*#[0-9a-f]{6};/i);
      expect(scss).toMatch(/\$[\w-]+:\s*\(/);
      expect(scss).toMatch(/@function\s+[\w-]+\(/);
      expect(scss).toMatch(/@mixin\s+[\w-]+\(/);
    });

    test('should include proper SCSS comments', async () => {
      const params = {
        colors: ['#FF0000'],
      };

      const result = (await exportScssTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = (result.data as any).scss_output;
      expect(scss).toContain('// Generated SCSS Color Palette');
      expect(scss).toContain('// Color Variables');
      expect(scss).toContain('// Color Map');
    });
  });

  describe('performance', () => {
    test('should handle large color arrays efficiently', async () => {
      const colors = Array(50)
        .fill(0)
        .map((_, i) => `hsl(${i * 7}, 70%, 50%)`);

      const startTime = Date.now();
      const result = (await exportScssTool.handler({ colors })) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
      expect((result.data as any).color_count).toBe(50);
    });

    test('should complete within performance requirements', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
        format: 'all' as const,
        include_variants: true,
        include_functions: true,
      };

      const startTime = Date.now();
      const result = (await exportScssTool.handler(params)) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
    });
  });
});
