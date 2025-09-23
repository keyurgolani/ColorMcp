/**
 * Tests for export-tailwind tool
 */

import { exportTailwindTool } from '../../src/tools/export-tailwind';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('export-tailwind tool', () => {
  describe('basic functionality', () => {
    test('should export Tailwind config format', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        format: 'config' as const,
        include_shades: false,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('tailwind_output');
      expect(result.data).toHaveProperty('format', 'config');
      expect(result.data).toHaveProperty('color_count', 3);

      const config = (result.data as any).tailwind_output;
      expect(config).toContain('module.exports = {');
      expect(config).toContain('theme: {');
      expect(config).toContain('colors: {');
      expect(config).toContain("'custom-1': '#ff0000'");
      expect(config).toContain("'custom-2': '#00ff00'");
      expect(config).toContain("'custom-3': '#0000ff'");
    });

    test('should export Tailwind plugin format', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        format: 'plugin' as const,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const plugin = (result.data as any).tailwind_output;
      expect(plugin).toContain("const plugin = require('tailwindcss/plugin');");
      expect(plugin).toContain(
        'module.exports = plugin(function({ addUtilities, theme }) {'
      );
      expect(plugin).toContain('addUtilities(backgroundUtilities);');
      expect(plugin).toContain('addUtilities(textUtilities);');
    });

    test('should export Tailwind CSS format', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'css' as const,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).tailwind_output;
      expect(css).toContain('/* Generated Tailwind CSS Utilities */');
      expect(css).toContain('.bg-custom-1 {');
      expect(css).toContain('background-color: #ff0000;');
      expect(css).toContain('.text-custom-1 {');
      expect(css).toContain('color: #ff0000;');
    });

    test('should export all formats', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'all' as const,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const output = (result.data as any).tailwind_output;
      expect(output).toContain('// Tailwind Config');
      expect(output).toContain('// Tailwind Plugin');
      expect(output).toContain('// Generated CSS');
      expect(output).toContain('module.exports = {');
      expect(output).toContain("const plugin = require('tailwindcss/plugin');");
    });
  });

  describe('customization options', () => {
    test('should use custom prefix', async () => {
      const params = {
        colors: ['#FF0000'],
        prefix: 'brand',
        include_shades: false,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;
      expect(config).toContain("'brand-1': '#ff0000'");
    });

    test('should use semantic names', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        semantic_names: ['primary', 'secondary'],
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;
      expect(config).toContain("'primary':");
      expect(config).toContain("'secondary':");
    });

    test('should include shade variations', async () => {
      const params = {
        colors: ['#FF0000'],
        include_shades: true,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;
      expect(config).toContain("'custom-1': {");
      expect(config).toContain("'50':");
      expect(config).toContain("'100':");
      expect(config).toContain("'500':");
      expect(config).toContain("'900':");
      expect(config).toContain("'950':");
    });

    test('should extend default colors', async () => {
      const params = {
        colors: ['#FF0000'],
        extend_default: true,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;
      expect(config).toContain('extend: {');
    });

    test('should replace default colors', async () => {
      const params = {
        colors: ['#FF0000'],
        extend_default: false,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;
      expect(config).not.toContain('extend: {');
    });

    test('should generate specific utilities', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'css' as const,
        generate_utilities: ['background', 'text'],
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = (result.data as any).tailwind_output;
      expect(css).toContain('.bg-custom-1');
      expect(css).toContain('.text-custom-1');
      expect(css).not.toContain('.border-custom-1');
      expect(css).not.toContain('.ring-custom-1');
    });
  });

  describe('export formats', () => {
    test('should include all export formats', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('tailwind');
      expect(result.export_formats).toHaveProperty('config');
      expect(result.export_formats).toHaveProperty('plugin');
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats).toHaveProperty('json');

      const jsonData = result.export_formats!.json as any;
      expect(jsonData.colors).toHaveLength(2);
      expect(jsonData.colors[0]).toHaveProperty('tailwind_name', 'custom-1');
    });
  });

  describe('error handling', () => {
    test('should handle invalid color format', async () => {
      const params = {
        colors: ['invalid-color'],
      };

      const result = (await exportTailwindTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR');
      expect(result.error.message).toContain('Invalid color format');
    });

    test('should handle empty colors array', async () => {
      const params = {
        colors: [],
      };

      const result = (await exportTailwindTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle invalid prefix', async () => {
      const params = {
        colors: ['#FF0000'],
        prefix: '123invalid',
      };

      const result = (await exportTailwindTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle invalid utility type', async () => {
      const params = {
        colors: ['#FF0000'],
        generate_utilities: ['invalid-utility'],
      };

      const result = (await exportTailwindTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Tailwind syntax validation', () => {
    test('should generate valid Tailwind config syntax', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        format: 'config' as const,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;

      // Check for proper Tailwind config syntax
      expect(config).toMatch(/module\.exports\s*=\s*\{/);
      expect(config).toMatch(/theme:\s*\{/);
      expect(config).toMatch(/colors:\s*\{/);
      expect(config).toMatch(/'[\w-]+'\s*:\s*'#[0-9a-f]{6}'/i);
    });

    test('should generate valid plugin syntax', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'plugin' as const,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const plugin = (result.data as any).tailwind_output;
      expect(plugin).toMatch(
        /const plugin = require\('tailwindcss\/plugin'\);/
      );
      expect(plugin).toMatch(/module\.exports = plugin\(function\(/);
      expect(plugin).toMatch(/addUtilities\(/);
    });

    test('should sanitize color names', async () => {
      const params = {
        colors: ['#FF0000'],
        semantic_names: ['Primary Color!@#'],
        include_shades: false,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;
      expect(config).toContain("'primary-color---': '#ff0000'");
      expect(config).not.toContain('!@#');
    });
  });

  describe('shade generation', () => {
    test('should generate proper shade scale', async () => {
      const params = {
        colors: ['#3B82F6'], // Blue-500
        include_shades: true,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;

      // Should contain all standard Tailwind shades
      [
        '50',
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
        '950',
      ].forEach(shade => {
        expect(config).toContain(`'${shade}':`);
      });
    });

    test('should use original color for closest shade', async () => {
      const params = {
        colors: ['#3B82F6'], // This should be close to 500 shade
        include_shades: true,
      };

      const result = (await exportTailwindTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const config = (result.data as any).tailwind_output;
      expect(config).toContain("'400': '#3b82f6'");
    });
  });

  describe('performance', () => {
    test('should handle large color arrays efficiently', async () => {
      const colors = Array(50)
        .fill(0)
        .map((_, i) => `hsl(${i * 7}, 70%, 50%)`);

      const startTime = Date.now();
      const result = (await exportTailwindTool.handler({
        colors,
      })) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
      expect((result.data as any).color_count).toBe(50);
    });

    test('should complete within performance requirements', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
        format: 'all' as const,
        include_shades: true,
        generate_utilities: ['all'],
      };

      const startTime = Date.now();
      const result = (await exportTailwindTool.handler(params)) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
    });
  });
});
