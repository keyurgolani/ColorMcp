/**
 * Tests for sort-colors tool
 */

import { sortColorsTool } from '../../src/tools/sort-colors';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('sort-colors tool', () => {
  describe('parameter validation', () => {
    test('should require colors parameter', async () => {
      const result = (await sortColorsTool.handler({
        sort_by: 'hue',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('colors');
    });

    test('should require sort_by parameter', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('sort_by');
    });

    test('should require at least 2 colors', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000'],
        sort_by: 'hue',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('At least 2 colors');
    });

    test('should limit maximum colors to 100', async () => {
      const colors = Array(101).fill('#FF0000');
      const result = (await sortColorsTool.handler({
        colors,
        sort_by: 'hue',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('Maximum 100 colors');
    });

    test('should validate sort_by values', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        sort_by: 'invalid',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain(
        'hue, saturation, lightness, brightness, temperature, frequency'
      );
    });
  });

  describe('hue sorting', () => {
    test('should sort colors by hue in ascending order', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#0000FF', '#FF0000', '#00FF00'], // Blue, Red, Green
        sort_by: 'hue',
        direction: 'ascending',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const sortedColors = (result.data as any).sorted_colors;

      // Should be sorted: Red (0°), Green (120°), Blue (240°)
      expect(sortedColors[0].metrics.hue).toBeLessThan(
        sortedColors[1].metrics.hue
      );
      expect(sortedColors[1].metrics.hue).toBeLessThan(
        sortedColors[2].metrics.hue
      );
    });

    test('should sort colors by hue in descending order', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00', '#0000FF'], // Red, Green, Blue
        sort_by: 'hue',
        direction: 'descending',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const sortedColors = (result.data as any).sorted_colors;

      // Should be sorted: Blue (240°), Green (120°), Red (0°)
      expect(sortedColors[0].metrics.hue).toBeGreaterThan(
        sortedColors[1].metrics.hue
      );
      expect(sortedColors[1].metrics.hue).toBeGreaterThan(
        sortedColors[2].metrics.hue
      );
    });
  });

  describe('saturation sorting', () => {
    test('should sort colors by saturation', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#FF8080', '#808080'], // Full red, Light red, Gray
        sort_by: 'saturation',
        direction: 'ascending',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const sortedColors = (result.data as any).sorted_colors;

      // Should be sorted by saturation in ascending order
      expect(sortedColors[0].metrics.saturation).toBeLessThanOrEqual(
        sortedColors[1].metrics.saturation
      );
      expect(sortedColors[1].metrics.saturation).toBeLessThanOrEqual(
        sortedColors[2].metrics.saturation
      );
    });
  });

  describe('lightness sorting', () => {
    test('should sort colors by lightness', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#000000', '#808080', '#FFFFFF'], // Black, Gray, White
        sort_by: 'lightness',
        direction: 'ascending',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const sortedColors = (result.data as any).sorted_colors;

      // Should be sorted: Black, Gray, White
      expect(sortedColors[0].metrics.lightness).toBeLessThan(
        sortedColors[1].metrics.lightness
      );
      expect(sortedColors[1].metrics.lightness).toBeLessThan(
        sortedColors[2].metrics.lightness
      );
    });
  });

  describe('brightness sorting', () => {
    test('should sort colors by perceived brightness', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00', '#0000FF'], // Red, Green, Blue
        sort_by: 'brightness',
        direction: 'ascending',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const sortedColors = (result.data as any).sorted_colors;

      // Green should be brightest due to higher weight in brightness formula
      expect(sortedColors[0].metrics.brightness).toBeLessThan(
        sortedColors[2].metrics.brightness
      );
    });
  });

  describe('temperature sorting', () => {
    test('should sort colors by temperature', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FFFF', '#FFFF00'], // Red (warm), Cyan (cool), Yellow (warm)
        sort_by: 'temperature',
        direction: 'ascending',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const sortedColors = (result.data as any).sorted_colors;

      // Should have temperature values calculated
      expect(sortedColors[0].metrics.temperature).toBeDefined();
      expect(typeof sortedColors[0].metrics.temperature).toBe('number');
    });
  });

  describe('frequency sorting', () => {
    test('should sort colors by frequency', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#FF0000', '#00FF00'], // Red appears twice
        sort_by: 'frequency',
        direction: 'descending',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const sortedColors = (result.data as any).sorted_colors;

      // Red should appear first (higher frequency)
      expect(sortedColors[0].metrics.frequency).toBeGreaterThan(
        sortedColors[2].metrics.frequency
      );
    });
  });

  describe('grouping similar colors', () => {
    test('should group similar colors when requested', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#FF1010', '#00FF00', '#10FF10'],
        sort_by: 'hue',
        group_similar: true,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).groups).toBeDefined();
      expect((result.data as any).total_groups).toBeDefined();
      expect((result.data as any).groups.length).toBeGreaterThan(0);
    });

    test('should include group analysis', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#FF2020', '#00FF00'],
        sort_by: 'hue',
        group_similar: true,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const groups = (result.data as any).groups;

      groups.forEach((group: any) => {
        expect(group).toHaveProperty('group_id');
        expect(group).toHaveProperty('colors');
        expect(group).toHaveProperty('group_size');
        expect(group).toHaveProperty('average_metrics');
      });
    });
  });

  describe('error handling', () => {
    test('should handle invalid color format', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['invalid', '#00FF00'],
        sort_by: 'hue',
      })) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COLOR');
      expect(result.error.message).toContain('Invalid color at index 0');
    });

    test('should provide helpful error suggestions', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['invalid', '#00FF00'],
        sort_by: 'hue',
      })) as ErrorResponse;

      expect(result.error.suggestions).toBeDefined();
      expect(result.error.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('analysis features', () => {
    test('should include color distribution analysis', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        sort_by: 'hue',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).analysis).toBeDefined();
      expect((result.data as any).analysis.color_distribution).toBeDefined();
      expect(
        (result.data as any).analysis.dominant_characteristics
      ).toBeDefined();
    });

    test('should identify most common hue range', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#FF4040', '#FF8080'], // All reds
        sort_by: 'hue',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const analysis = (result.data as any).analysis;
      expect(analysis.dominant_characteristics.most_common_hue_range).toBe(
        'red'
      );
    });
  });

  describe('performance', () => {
    test('should complete sorting in under 500ms', async () => {
      const colors = Array(50)
        .fill(0)
        .map((_, i) => `hsl(${i * 7}, 70%, 50%)`);

      const startTime = Date.now();

      const result = (await sortColorsTool.handler({
        colors,
        sort_by: 'hue',
      })) as ToolResponse;

      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('export formats', () => {
    test('should include CSS export format', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        sort_by: 'hue',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats!.css).toContain('--color-');
    });

    test('should include SCSS export format', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        sort_by: 'lightness',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('scss');
      expect(result.export_formats!.scss).toContain('$color-');
    });

    test('should include JSON export format', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        sort_by: 'saturation',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('json');
      expect((result.export_formats!.json as any).sort_criteria).toBe(
        'saturation'
      );
    });
  });

  describe('accessibility features', () => {
    test('should include accessibility notes', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#000000', '#FFFFFF', '#808080'],
        sort_by: 'lightness',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toBeDefined();
      expect(result.metadata.accessibility_notes!.length).toBeGreaterThan(0);
    });

    test('should provide recommendations', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#FF0000', '#00FF00'],
        sort_by: 'hue',
        group_similar: true,
      })) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toBeDefined();
      expect(result.metadata.recommendations!.length).toBeGreaterThan(0);
    });
  });

  describe('original index tracking', () => {
    test('should track original indices after sorting', async () => {
      const result = (await sortColorsTool.handler({
        colors: ['#0000FF', '#FF0000', '#00FF00'], // Blue, Red, Green
        sort_by: 'hue',
      })) as ToolResponse;

      expect(result.success).toBe(true);
      const sortedColors = (result.data as any).sorted_colors;

      // Each color should have its original index
      sortedColors.forEach((color: any) => {
        expect(color.original_index).toBeDefined();
        expect(typeof color.original_index).toBe('number');
        expect(color.original_index).toBeGreaterThanOrEqual(0);
        expect(color.original_index).toBeLessThan(3);
      });
    });
  });
});
