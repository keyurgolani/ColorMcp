/**
 * Tests for export-json tool
 */

import { exportJsonTool } from '../../src/tools/export-json';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('export-json tool', () => {
  describe('basic functionality', () => {
    test('should export simple JSON format', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        format: 'simple' as const,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('json_output');
      expect(result.data).toHaveProperty('format', 'simple');
      expect(result.data).toHaveProperty('color_count', 3);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toHaveProperty('color-1', '#ff0000');
      expect(parsed).toHaveProperty('color-2', '#00ff00');
      expect(parsed).toHaveProperty('color-3', '#0000ff');
    });

    test('should export detailed JSON format', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        format: 'detailed' as const,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toHaveProperty('palette');
      expect(parsed.palette).toHaveProperty('name');
      expect(parsed.palette).toHaveProperty('color_count', 2);
      expect(parsed).toHaveProperty('colors');
      expect(parsed.colors).toHaveLength(2);

      const firstColor = parsed.colors[0];
      expect(firstColor).toHaveProperty('hex', '#ff0000');
      expect(firstColor).toHaveProperty('rgb');
      expect(firstColor).toHaveProperty('hsl');
      expect(firstColor).toHaveProperty('hsv');
    });

    test('should export API JSON format', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'api' as const,
        group_name: 'Test Palette',
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toHaveProperty('data');
      expect(parsed.data).toHaveProperty('type', 'color_palette');
      expect(parsed.data).toHaveProperty('attributes');
      expect(parsed.data.attributes).toHaveProperty('name', 'Test Palette');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.meta).toHaveProperty('generated_by', 'MCP Color Server');
    });

    test('should export design tokens JSON format', async () => {
      const params = {
        colors: ['#FF0000'],
        format: 'design_tokens' as const,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toHaveProperty('color');
      expect(parsed.color).toHaveProperty('color-1');
      expect(parsed.color['color-1']).toHaveProperty('value', '#ff0000');
      expect(parsed.color['color-1']).toHaveProperty('type', 'color');
      expect(parsed.color['color-1']).toHaveProperty('extensions');
    });
  });

  describe('customization options', () => {
    test('should use semantic names', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
        semantic_names: ['primary', 'secondary'],
        format: 'simple' as const,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed).toHaveProperty('primary', '#ff0000');
      expect(parsed).toHaveProperty('secondary', '#00ff00');
    });

    test('should include metadata when requested', async () => {
      const params = {
        colors: ['#FF0000'],
        include_metadata: true,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      const firstColor = parsed.colors[0];
      expect(firstColor).toHaveProperty('metadata');
      expect(firstColor.metadata).toHaveProperty('brightness');
      expect(firstColor.metadata).toHaveProperty('temperature');
      expect(firstColor.metadata).toHaveProperty('is_light');
      expect(firstColor.metadata).toHaveProperty('is_dark');
    });

    test('should include accessibility info when requested', async () => {
      const params = {
        colors: ['#FF0000'],
        include_accessibility: true,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      const firstColor = parsed.colors[0];
      expect(firstColor).toHaveProperty('accessibility');
      expect(firstColor.accessibility).toHaveProperty('contrast_white');
      expect(firstColor.accessibility).toHaveProperty('contrast_black');
      expect(firstColor.accessibility).toHaveProperty('wcag_aa_normal');
      expect(firstColor.accessibility).toHaveProperty('wcag_aaa_normal');
    });

    test('should include color variations when requested', async () => {
      const params = {
        colors: ['#FF0000'],
        include_variations: true,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      const firstColor = parsed.colors[0];
      expect(firstColor).toHaveProperty('variations');
      expect(firstColor.variations).toHaveProperty('tints');
      expect(firstColor.variations).toHaveProperty('shades');
      expect(firstColor.variations).toHaveProperty('tones');
      expect(firstColor.variations.tints).toHaveLength(5);
      expect(firstColor.variations.shades).toHaveLength(5);
      expect(firstColor.variations.tones).toHaveLength(5);
    });

    test('should use custom group name and version', async () => {
      const params = {
        colors: ['#FF0000'],
        group_name: 'Brand Colors',
        version: '2.1.0',
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed.palette).toHaveProperty('name', 'Brand Colors');
      expect(parsed.palette).toHaveProperty('version', '2.1.0');
    });

    test('should minify JSON when requested', async () => {
      const params = {
        colors: ['#FF0000'],
        pretty_print: false,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      expect(jsonOutput).not.toContain('\n  '); // No indentation
      expect(jsonOutput).not.toContain('  '); // No extra spaces
    });

    test('should pretty print JSON by default', async () => {
      const params = {
        colors: ['#FF0000'],
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      expect(jsonOutput).toContain('\n  '); // Has indentation
    });
  });

  describe('export formats', () => {
    test('should include export formats', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('json');
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats).toHaveProperty('scss');

      const jsonData = result.export_formats!.json;
      expect(jsonData).toHaveProperty('palette');
      expect(jsonData).toHaveProperty('colors');
    });

    test('should generate CSS from JSON', async () => {
      const params = {
        colors: ['#FF0000'],
        semantic_names: ['primary'],
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const css = result.export_formats!.css as string;
      expect(css).toContain(':root');
      expect(css).toContain('--primary: #ff0000;');
    });

    test('should generate SCSS from JSON', async () => {
      const params = {
        colors: ['#FF0000'],
        semantic_names: ['primary'],
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const scss = result.export_formats!.scss as string;
      expect(scss).toContain('$primary: #ff0000;');
    });
  });

  describe('error handling', () => {
    test('should handle invalid color format', async () => {
      const params = {
        colors: ['invalid-color'],
      };

      const result = (await exportJsonTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR');
      expect(result.error.message).toContain('Invalid color format');
    });

    test('should handle empty colors array', async () => {
      const params = {
        colors: [],
      };

      const result = (await exportJsonTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should handle too many colors', async () => {
      const colors = Array(101).fill('#FF0000');
      const params = { colors };

      const result = (await exportJsonTool.handler(params)) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('JSON structure validation', () => {
    test('should generate valid JSON syntax', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;

      // Should be valid JSON
      expect(() => JSON.parse(jsonOutput)).not.toThrow();

      const parsed = JSON.parse(jsonOutput);
      expect(typeof parsed).toBe('object');
    });

    test('should include proper timestamps', async () => {
      const params = {
        colors: ['#FF0000'],
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed.palette).toHaveProperty('created');
      expect(new Date(parsed.palette.created)).toBeInstanceOf(Date);
    });

    test('should sanitize names for JSON keys', async () => {
      const params = {
        colors: ['#FF0000'],
        semantic_names: ['Primary Color!@#'],
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      const firstColor = parsed.colors[0];
      expect(firstColor.id).toMatch(/^[a-z0-9-]+$/);
      expect(firstColor.id).not.toContain('!@#');
    });
  });

  describe('color analysis accuracy', () => {
    test('should calculate brightness correctly', async () => {
      const params = {
        colors: ['#FFFFFF', '#000000'],
        include_metadata: true,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      const whiteColor = parsed.colors[0];
      const blackColor = parsed.colors[1];

      expect(whiteColor.metadata.brightness).toBeCloseTo(1, 1);
      expect(blackColor.metadata.brightness).toBeCloseTo(0, 1);
    });

    test('should classify color temperature correctly', async () => {
      const params = {
        colors: ['#FF0000', '#0000FF'], // Red (warm), Blue (cool)
        include_metadata: true,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      expect(parsed.colors[0].metadata.temperature).toBe('warm');
      expect(parsed.colors[1].metadata.temperature).toBe('cool');
    });

    test('should calculate contrast ratios correctly', async () => {
      const params = {
        colors: ['#FFFFFF'], // White
        include_accessibility: true,
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);

      const jsonOutput = (result.data as any).json_output;
      const parsed = JSON.parse(jsonOutput);

      const whiteColor = parsed.colors[0];
      expect(whiteColor.accessibility.contrast_white).toBeCloseTo(1, 1);
      expect(whiteColor.accessibility.contrast_black).toBeCloseTo(21, 0);
    });
  });

  describe('performance', () => {
    test('should handle large color arrays efficiently', async () => {
      const colors = Array(50)
        .fill(0)
        .map((_, i) => `hsl(${i * 7}, 70%, 50%)`);

      const startTime = Date.now();
      const result = (await exportJsonTool.handler({ colors })) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
      expect((result.data as any).color_count).toBe(50);
    });

    test('should complete within performance requirements', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
        include_metadata: true,
        include_accessibility: true,
        include_variations: true,
      };

      const startTime = Date.now();
      const result = (await exportJsonTool.handler(params)) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
    });

    test('should report file size', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = (await exportJsonTool.handler(params)) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('file_size');
      expect((result.data as any).file_size).toBeGreaterThan(0);
    });
  });
});
