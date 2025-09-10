/**
 * Tests for create-theme-preview-html tool
 */

import { describe, it, expect } from '@jest/globals';
import { createThemePreviewHtmlTool } from '../../src/tools/create-theme-preview-html';

describe('create-theme-preview-html', () => {
  it('should generate website theme preview with valid theme colors', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        accent: '#10b981',
      },
      preview_type: 'website' as const,
      components: ['header', 'content', 'buttons'],
      interactive: true,
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).preview_type).toBe('website');
      expect((result.data as any).color_count).toBe(6);
      expect((result.data as any).interactive).toBe(true);
      expect(result.visualizations?.html).toContain('<!DOCTYPE html>');
      expect(result.visualizations?.html).toContain('website-mockup');
      expect(result.export_formats?.css).toContain(':root');
      expect(result.export_formats?.scss).toContain('$color-primary');
    }
  });

  it('should generate mobile app theme preview', async () => {
    const params = {
      theme_colors: {
        primary: '#007AFF',
        background: '#ffffff',
        surface: '#f2f2f7',
        text: '#000000',
        accent: '#ff3b30',
      },
      preview_type: 'mobile_app' as const,
      components: ['header', 'cards', 'buttons'],
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).preview_type).toBe('mobile_app');
      expect(result.visualizations?.html).toContain('mobile-mockup');
      expect(result.visualizations?.html).toContain('mobile-frame');
    }
  });

  it('should generate dashboard theme preview', async () => {
    const params = {
      theme_colors: {
        primary: '#1f2937',
        secondary: '#6b7280',
        background: '#f9fafb',
        surface: '#ffffff',
        text: '#111827',
        sidebar: '#374151',
        accent: '#3b82f6',
      },
      preview_type: 'dashboard' as const,
      components: ['sidebar', 'header', 'cards'],
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).preview_type).toBe('dashboard');
      expect(result.visualizations?.html).toContain('dashboard-mockup');
      expect(result.visualizations?.html).toContain('dashboard-sidebar');
    }
  });

  it('should generate components showcase', async () => {
    const params = {
      theme_colors: {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        background: '#ffffff',
        surface: '#faf5ff',
        text: '#1f2937',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      preview_type: 'components' as const,
      components: ['buttons', 'cards', 'forms'],
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).preview_type).toBe('components');
      expect(result.visualizations?.html).toContain('components-showcase');
      expect(result.visualizations?.html).toContain('button-samples');
    }
  });

  it('should handle invalid color formats', async () => {
    const params = {
      theme_colors: {
        primary: 'invalid-color',
        background: '#ffffff',
      },
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error.message).toContain('Invalid color format');
    }
  });

  it('should handle missing theme colors object', async () => {
    const params = {};

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    }
  });

  it('should handle empty theme colors', async () => {
    const params = {
      theme_colors: {},
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).color_count).toBe(0);
    }
  });

  it('should calculate accessibility information for text colors', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
        text: '#000000', // High contrast against white
        'text-secondary': '#888888', // Lower contrast
      },
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      // Should have accessibility notes for low contrast colors
      expect(result.metadata.accessibility_notes).toBeDefined();
    }
  });

  it('should provide recommendations for mobile apps without accent color', async () => {
    const params = {
      theme_colors: {
        primary: '#007AFF',
        background: '#ffffff',
        text: '#000000',
      },
      preview_type: 'mobile_app' as const,
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.metadata.recommendations).toContain(
        'Mobile apps typically benefit from an accent color for interactive elements'
      );
    }
  });

  it('should recommend essential colors when missing', async () => {
    const params = {
      theme_colors: {
        accent: '#10b981', // Only accent color, missing essentials
      },
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        result.metadata.recommendations?.some(rec =>
          rec.includes('essential colors')
        )
      ).toBe(true);
    }
  });

  it('should generate proper export formats', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        background: '#ffffff',
      },
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      // CSS export
      expect(result.export_formats?.css).toContain('--color-primary: #2563eb');
      expect(result.export_formats?.css).toContain(
        '--color-secondary: #64748b'
      );

      // SCSS export
      expect(result.export_formats?.scss).toContain('$color-primary: #2563eb');
      expect(result.export_formats?.scss).toContain('$theme-colors: (');

      // JSON export
      const jsonExport = result.export_formats?.json as any;
      expect(jsonExport.theme.primary.hex).toBe('#2563eb');
    }
  });

  it('should handle responsive and interactive options', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
        background: '#ffffff',
      },
      responsive: false,
      interactive: false,
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).responsive).toBe(false);
      expect((result.data as any).interactive).toBe(false);
    }
  });

  it('should validate preview type parameter', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
      },
      preview_type: 'invalid_type' as any,
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    }
  });

  it('should validate components parameter', async () => {
    const params = {
      theme_colors: {
        primary: '#2563eb',
      },
      components: ['invalid_component'] as any,
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    }
  });

  it('should handle null color values', async () => {
    const params = {
      theme_colors: {
        primary: null as any,
        background: '#ffffff',
      },
    };

    const result = await createThemePreviewHtmlTool.handler(params);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Joi validation catches this as invalid parameters first
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    }
  });
});
