/**
 * Tests for create-theme-preview-html tool
 */

import { createThemePreviewHtmlTool } from '../../src/tools/create-theme-preview-html';

describe('create-theme-preview-html tool', () => {
  test('should have correct tool definition', () => {
    expect(createThemePreviewHtmlTool.name).toBe('create_theme_preview_html');
    expect(createThemePreviewHtmlTool.description).toContain(
      'HTML theme preview mockups'
    );
    expect(createThemePreviewHtmlTool.parameters).toBeDefined();
    expect(typeof createThemePreviewHtmlTool.handler).toBe('function');
  });

  test('should generate basic website theme preview', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
        text: '#1f2937',
        surface: '#f8fafc',
      },
      preview_type: 'website',
      components: ['header', 'content', 'buttons'],
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).theme_colors.primary).toBe('#2563eb');
      expect((result.data as any).preview_type).toBe('website');
      expect((result.data as any).color_count).toBe(4);
      expect(result.visualizations?.html).toContain('<!DOCTYPE html>');
      expect(result.visualizations?.html).toContain('website-preview');
      expect(result.visualizations?.html).toContain('preview-header');
    }
  });

  test('should generate mobile app theme preview', async () => {
    const params = {
      theme_colors: {
        primary: '#10b981',
        background: '#ffffff',
        text: '#111827',
        surface: '#f9fafb',
        accent: '#f59e0b',
      },
      preview_type: 'mobile_app',
      components: ['header', 'content', 'buttons', 'cards'],
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).preview_type).toBe('mobile_app');
      const html = result.visualizations?.html;
      expect(html).toContain('theme-preview-frame mobile_app');
      expect(html).toContain('theme-preview-container');
      expect(html).toContain('theme-controls');
    }
  });

  test('should generate dashboard theme preview', async () => {
    const params = {
      theme_colors: {
        primary: '#3b82f6',
        background: '#ffffff',
        text: '#1f2937',
        surface: '#f8fafc',
        sidebar: '#1e293b',
        accent: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      preview_type: 'dashboard',
      components: ['header', 'sidebar', 'content', 'cards'],
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).preview_type).toBe('dashboard');
      const html = result.visualizations?.html;
      expect(html).toContain('dashboard-preview');
      expect(html).toContain('preview-sidebar');
      expect(html).toContain('dashboard-main');
      expect(html).toContain('metric-card');
    }
  });

  test('should generate components showcase', async () => {
    const params = {
      theme_colors: {
        primary: '#8b5cf6',
        secondary: '#06b6d4',
        background: '#ffffff',
        text: '#1f2937',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      preview_type: 'components',
      components: ['buttons', 'cards', 'forms'],
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).preview_type).toBe('components');
      const html = result.visualizations?.html;
      expect(html).toContain('components-preview');
      expect(html).toContain('component-section');
      expect(html).toContain('button-group');
      expect(html).toContain('preview-form');
    }
  });

  test('should validate required theme colors object', async () => {
    const params = {
      // Missing theme_colors
      preview_type: 'website',
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    }
  });

  test('should validate color format in theme colors', async () => {
    const params = {
      theme_colors: {
        primary: 'invalid-color',
        background: '#ffffff',
      },
      preview_type: 'website',
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error.message).toContain('invalid-color');
    }
  });

  test('should handle null or undefined color values', async () => {
    const params = {
      theme_colors: {
        primary: null,
        background: '#ffffff',
      },
      preview_type: 'website',
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('Invalid parameters');
    }
  });

  test('should calculate accessibility information', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
        text: '#1f2937',
        surface: '#f8fafc',
      },
      preview_type: 'website',
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).accessibility_compliant).toBeDefined();
      expect(result.metadata.accessibility_notes).toBeDefined();
    }
  });

  test('should provide recommendations for missing colors', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
        // Missing text color for website preview
      },
      preview_type: 'website',
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.metadata.recommendations?.length).toBeGreaterThan(0);
      expect(
        result.metadata.recommendations?.some(r =>
          r.includes('semantic colors')
        )
      ).toBe(true);
    }
  });

  test('should support interactive features', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
        text: '#1f2937',
      },
      preview_type: 'website',
      interactive: true,
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      const html = result.visualizations?.html;
      expect(html).toContain('theme-controls');
      expect(html).toContain('theme-color-swatch');
      expect(html).toContain('copyToClipboard');
      expect(html).toContain('initializeThemePreview');
    }
  });

  test('should support responsive design', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
        text: '#1f2937',
      },
      preview_type: 'website',
      responsive: true,
      interactive: true,
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      const html = result.visualizations?.html;
      expect(html).toContain('viewport-controls');
      expect(html).toContain('viewport-btn');
    }
  });

  test('should export CSS and SCSS formats', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        secondary: '#10b981',
        background: '#ffffff',
        text: '#1f2937',
      },
      preview_type: 'website',
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.export_formats?.css).toContain(':root');
      expect(result.export_formats?.css).toContain('--color-primary');
      expect(result.export_formats?.css).toContain('.bg-primary');

      expect(result.export_formats?.scss).toContain('$color-primary');
      expect(result.export_formats?.scss).toContain('$theme-colors');
      expect(result.export_formats?.scss).toContain('@mixin');

      const jsonData = result.export_formats?.json as any;
      expect(jsonData.theme_colors.primary.hex).toBe('#2563eb');
      expect(jsonData.preview_type).toBe('website');
    }
  });

  test('should support different themes', async () => {
    const themes = ['light', 'dark', 'auto'];

    for (const theme of themes) {
      const params = {
        theme_colors: {
          primary: '#2563eb',
          background: theme === 'dark' ? '#1f2937' : '#ffffff',
          text: theme === 'dark' ? '#ffffff' : '#1f2937',
        },
        preview_type: 'website',
        theme: theme as any,
      };

      const result = await createThemePreviewHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.visualizations?.html).toContain(`theme-${theme}`);
      }
    }
  });

  test('should handle complex color formats', async () => {
    const params = {
      theme_colors: {
        primary: 'rgb(37, 99, 235)',
        secondary: 'hsl(162, 73%, 46%)',
        background: '#ffffff',
        text: 'rgba(31, 41, 55, 1)',
      },
      preview_type: 'website',
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).theme_colors.primary).toBe('#2563eb'); // Converted to hex
      expect((result.data as any).theme_colors.secondary).toBe('#20cb98'); // Converted to hex (correct conversion)
    }
  });

  test('should generate accessible HTML structure', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
        text: '#1f2937',
      },
      preview_type: 'website',
      interactive: true,
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      const html = result.visualizations?.html;
      expect(html).toContain('role="group"');
      expect(html).toContain('aria-label');
      expect(html).toContain('tabindex="0"');
      expect(html).toContain('<meta name="viewport"');
    }
  });

  test('should provide dashboard-specific recommendations', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
        text: '#1f2937',
        // Missing sidebar color for dashboard
      },
      preview_type: 'dashboard',
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        result.metadata.recommendations?.some(r => r.includes('sidebar'))
      ).toBe(true);
    }
  });
});
