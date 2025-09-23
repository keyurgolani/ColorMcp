/**
 * Tests for create-color-wheel-html tool
 */

import { createColorWheelHtmlTool } from '../../src/tools/create-color-wheel-html';

describe('create-color-wheel-html tool', () => {
  test('should have correct tool definition', () => {
    expect(createColorWheelHtmlTool.name).toBe('create_color_wheel_html');
    expect(createColorWheelHtmlTool.description).toContain(
      'interactive HTML color wheel'
    );
    expect(createColorWheelHtmlTool.parameters).toBeDefined();
    expect(typeof createColorWheelHtmlTool.handler).toBe('function');
  });

  test('should generate basic HSL color wheel', async () => {
    const params = {
      type: 'hsl',
      size: 400,
      interactive: true,
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).wheel_type).toBe('hsl');
      expect((result.data as any).size).toBe(400);
      expect((result.data as any).interactive).toBe(true);
      expect(result.visualizations?.html).toContain('<!DOCTYPE html>');
      expect(result.visualizations?.html).toContain('color-wheel-svg');
      expect(result.metadata.execution_time).toBeGreaterThan(0);
    }
  });

  test('should generate color wheel with highlight colors', async () => {
    const params = {
      type: 'hsl',
      size: 300,
      highlight_colors: ['#FF0000', '#00FF00', '#0000FF'],
      interactive: true,
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).highlight_colors).toHaveLength(3);
      expect((result.data as any).highlight_colors).toContain('#ff0000');
      expect(result.visualizations?.html).toContain('highlight-color');
      expect(result.export_formats?.css).toContain('--wheel-color-1');
    }
  });

  test('should generate color wheel with harmony visualization', async () => {
    const params = {
      type: 'hsl',
      size: 400,
      show_harmony: true,
      harmony_type: 'complementary',
      highlight_colors: ['#FF0000'],
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).harmony_type).toBe('complementary');
      expect(result.visualizations?.html).toContain('harmony-info');
      expect(result.visualizations?.html).toContain('harmony-lines');
    }
  });

  test('should support different wheel types', async () => {
    const wheelTypes = ['hsl', 'hsv', 'rgb', 'ryw', 'ryb'];

    for (const type of wheelTypes) {
      const params = {
        type: type as any,
        size: 300,
      };

      const result = await createColorWheelHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).wheel_type).toBe(type);
        expect(result.metadata.color_space_used).toBe(type.toUpperCase());
      }
    }
  });

  test('should validate size constraints', async () => {
    const params = {
      type: 'hsl',
      size: 150, // Below minimum
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('Invalid parameters');
    }
  });

  test('should validate harmony type when show_harmony is true', async () => {
    const params = {
      type: 'hsl',
      size: 400,
      show_harmony: true,
      // Missing harmony_type
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    }
  });

  test('should handle invalid highlight colors', async () => {
    const params = {
      type: 'hsl',
      size: 400,
      highlight_colors: ['invalid-color', '#FF0000'],
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error.message).toContain('invalid-color');
    }
  });

  test('should generate accessible HTML', async () => {
    const params = {
      type: 'hsl',
      size: 400,
      highlight_colors: ['#FF0000'],
      interactive: true,
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      const html = result.visualizations?.html;
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label');
      expect(html).toContain('tabindex="0"');
      expect(html).toContain('<meta name="viewport"');
    }
  });

  test('should include copy functionality in JavaScript', async () => {
    const params = {
      type: 'hsl',
      size: 400,
      interactive: true,
      highlight_colors: ['#FF0000'],
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      const html = result.visualizations?.html;
      expect(html).toContain('copyToClipboard');
      expect(html).toContain('showNotification');
      expect(html).toContain('initializeColorWheel');
    }
  });

  test('should support different themes', async () => {
    const themes = ['light', 'dark', 'auto'];

    for (const theme of themes) {
      const params = {
        type: 'hsl',
        size: 300,
        theme: theme as any,
      };

      const result = await createColorWheelHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.visualizations?.html).toContain(`theme-${theme}`);
      }
    }
  });

  test('should provide performance recommendations', async () => {
    const params = {
      type: 'hsl',
      size: 800, // Large size
      highlight_colors: Array(8).fill('#FF0000'), // Many colors
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.metadata.recommendations?.length).toBeGreaterThan(0);
      expect(
        result.metadata.recommendations?.some(
          r => r.includes('performance') || r.includes('visual clarity')
        )
      ).toBe(true);
    }
  });

  test('should export CSS and JSON formats', async () => {
    const params = {
      type: 'hsl',
      size: 400,
      highlight_colors: ['#FF0000', '#00FF00'],
    };

    const result = await createColorWheelHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.export_formats?.css).toContain(':root');
      expect(result.export_formats?.css).toContain('--wheel-color-1');
      expect(result.export_formats?.json).toBeDefined();

      const jsonData = result.export_formats?.json as any;
      expect(jsonData.wheel_type).toBe('hsl');
      expect(jsonData.highlight_colors).toHaveLength(2);
    }
  });
});
