/**
 * Integration tests for HTML visualization tools with file output system
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createPaletteHtmlTool } from '../../src/tools/create-palette-html';
import { createColorWheelHtmlTool } from '../../src/tools/create-color-wheel-html';
import { createGradientHtmlTool } from '../../src/tools/create-gradient-html';
import { createThemePreviewHtmlTool } from '../../src/tools/create-theme-preview-html';
import { fileOutputManager } from '../../src/utils/file-output-manager';
import { environmentConfig } from '../../src/utils/environment-config';
import { ToolResponse } from '../../src/types/index';

// Helper type for file-based visualization responses
interface FileBasedVisualizationResponse extends ToolResponse {
  visualizations: any; // Use any to avoid type conflicts with union types
  data: {
    file_path?: string;
    file_name?: string;
    file_size?: number;
    background_controls_enabled?: boolean;
    accessibility_features?: string[];
    color_count?: number;
    [key: string]: unknown;
  };
}

describe('HTML File Output Integration Tests', () => {
  let testDir: string;
  let originalEnvVar: string | undefined;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = join(tmpdir(), `mcp-color-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Set environment variable for testing
    originalEnvVar = process.env['COLOR_MCP_VISUALIZATIONS_DIR'];
    process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = testDir;

    // Reload configuration
    environmentConfig.reloadConfiguration();

    // Initialize file output manager
    await fileOutputManager.initialize();
  });

  afterEach(async () => {
    // Restore original environment variable
    if (originalEnvVar !== undefined) {
      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = originalEnvVar;
    } else {
      delete process.env['COLOR_MCP_VISUALIZATIONS_DIR'];
    }

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }

    // Destroy file output manager
    fileOutputManager.destroy();
  });

  describe('create_palette_html with file output', () => {
    test('should save HTML file and return file path', async () => {
      const params = {
        palette: ['#ff0000', '#00ff00', '#0000ff'],
        layout: 'horizontal',
        show_values: true,
        interactive: true,
        enable_background_controls: true,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as FileBasedVisualizationResponse;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('file_path');
        expect(result.data).toHaveProperty('file_name');
        expect(result.data).toHaveProperty('file_size');
        expect(result.data).toHaveProperty('background_controls_enabled', true);
        expect(result.data).toHaveProperty('accessibility_features');

        // Check that visualizations contains both HTML content and file info
        expect(result.visualizations).toHaveProperty('html');
        expect(result.visualizations).toHaveProperty('html_file');

        if (result.success) {
          const viz = (result as any).visualizations;
          if (viz?.html_file) {
            const filePath = viz.html_file.file_path;

            // Verify file exists
            const fileExists = await fs
              .access(filePath)
              .then(() => true)
              .catch(() => false);
            expect(fileExists).toBe(true);

            // Verify file content
            const content = await fs.readFile(filePath, 'utf8');
            expect(content).toContain('<!DOCTYPE html>');
            expect(content).toContain('background-controls');
            expect(content).toContain('#ff0000');
            expect(content).toContain('#00ff00');
            expect(content).toContain('#0000ff');
            expect(content).toContain('BackgroundController');
          }
        }
      }
    });

    test('should handle file saving errors gracefully', async () => {
      const params = {
        palette: ['#ff0000', '#00ff00'],
        layout: 'grid',
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as FileBasedVisualizationResponse;

      expect(result.success).toBe(true);
      if (result.success) {
        // Should either have html_file (successful save) or html (fallback)
        const hasHtmlFile = Object.prototype.hasOwnProperty.call(
          result.visualizations,
          'html_file'
        );
        const hasHtml = Object.prototype.hasOwnProperty.call(
          result.visualizations,
          'html'
        );

        expect(hasHtmlFile || hasHtml).toBe(true);

        if (hasHtmlFile) {
          // File was saved successfully
          expect(result.visualizations).toHaveProperty('html_file');
        } else {
          // Fallback to HTML content
          expect(result.visualizations).toHaveProperty('html');
          expect(result.visualizations?.html).toContain('<!DOCTYPE html>');
          expect(result.visualizations?.html).toContain('#ff0000');
        }
      }
    });

    test('should include all accessibility features', async () => {
      const params = {
        palette: ['#2563eb', '#dc2626', '#059669'],
        accessibility_info: true,
        enable_accessibility_testing: true,
        include_keyboard_help: true,
      };

      const result = (await createPaletteHtmlTool.handler(
        params
      )) as FileBasedVisualizationResponse;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accessibility_features).toContain(
          'Background theme toggle'
        );
        expect(result.data.accessibility_features).toContain(
          'Custom background color picker'
        );
        expect(result.data.accessibility_features).toContain(
          'Keyboard navigation'
        );
        expect(result.data.accessibility_features).toContain(
          'Screen reader support'
        );

        if (result.success) {
          const viz = (result as any).visualizations;
          if (viz?.html_file) {
            const content = await fs.readFile(viz.html_file.file_path, 'utf8');
            expect(content).toContain('accessibility-features');
            expect(content).toContain('keyboard-shortcuts');
            expect(content).toContain('Alt+T');
            expect(content).toContain('Alt+C');
          }
        }
      }
    });
  });

  describe('create_color_wheel_html with file output', () => {
    test('should save color wheel HTML file', async () => {
      const params = {
        type: 'hsl',
        size: 400,
        interactive: true,
        highlight_colors: ['#ff0000', '#00ff00'],
        enable_background_controls: true,
      };

      const result = await createColorWheelHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.visualizations).toHaveProperty('html_file');

        if (result.success) {
          const viz = (result as any).visualizations;
          if (viz?.html_file) {
            const content = await fs.readFile(viz.html_file.file_path, 'utf8');
            expect(content).toContain('color-wheel');
            expect(content).toContain('background-controls');
            expect(content).toContain('BackgroundController');
          }
        }
      }
    });

    test('should handle harmony visualization', async () => {
      const params = {
        type: 'hsv',
        show_harmony: true,
        harmony_type: 'complementary',
        highlight_colors: ['#2563eb'],
      };

      const result = await createColorWheelHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const viz = (result as any).visualizations;
        if (viz?.html_file) {
          const content = await fs.readFile(viz.html_file.file_path, 'utf8');
          expect(content).toContain('harmony');
          expect(content).toContain('#2563eb');
        }
      }
    });
  });

  describe('create_gradient_html with file output', () => {
    test('should save gradient HTML file', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        preview_shapes: ['rectangle', 'circle'],
        show_css_code: true,
        enable_background_controls: true,
      };

      const result = await createGradientHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.visualizations).toHaveProperty('html_file');

        const viz = (result as any).visualizations;
        if (viz?.html_file) {
          const content = await fs.readFile(viz.html_file.file_path, 'utf8');
          expect(content).toContain('gradient-preview');
          expect(content).toContain('linear-gradient(45deg, #ff0000, #0000ff)');
          expect(content).toContain('background-controls');
        }
      }
    });

    test('should validate gradient CSS syntax', async () => {
      const params = {
        gradient_css: 'invalid-gradient-syntax',
      };

      const result = await createGradientHtmlTool.handler(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_GRADIENT_CSS');
      }
    });
  });

  describe('create_theme_preview_html with file output', () => {
    test('should save theme preview HTML file', async () => {
      const params = {
        theme_colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          background: '#ffffff',
          text: '#1e293b',
          success: '#059669',
          warning: '#d97706',
          error: '#dc2626',
        },
        preview_type: 'website',
        components: ['header', 'content', 'buttons'],
        enable_background_controls: true,
      };

      const result = await createThemePreviewHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.visualizations).toHaveProperty('html_file');
        expect((result.data as any).color_count).toBe(7);

        const viz = (result as any).visualizations;
        if (viz?.html_file) {
          const content = await fs.readFile(viz.html_file.file_path, 'utf8');
          expect(content).toContain('theme-preview');
          expect(content).toContain('#2563eb');
          expect(content).toContain('background-controls');
        }
      }
    });

    test('should validate theme colors', async () => {
      const params = {
        theme_colors: {
          primary: 'invalid-color',
        },
        preview_type: 'dashboard',
      };

      const result = await createThemePreviewHtmlTool.handler(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      }
    });
  });

  describe('File system operations', () => {
    test('should create files with proper naming convention', async () => {
      const params = {
        palette: ['#ff0000'],
      };

      const result = await createPaletteHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const viz = (result as any).visualizations;
        if (viz?.html_file) {
          const fileName = viz.html_file.filename;
          expect(fileName).toMatch(
            /mcp-color-html-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-f0-9]{8}\.html/
          );
          expect(fileName).toContain('.html');
        }
      }
    });

    test('should handle concurrent file operations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        createPaletteHtmlTool.handler({
          palette: [`#${i.toString(16).padStart(6, '0')}`],
        })
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all files have unique names
      const fileNames = results
        .filter(r => r.success && (r as any).visualizations?.html_file)
        .map(r => (r as any).visualizations.html_file.filename);

      const uniqueNames = new Set(fileNames);
      expect(uniqueNames.size).toBe(fileNames.length);
    });

    test('should include proper file metadata', async () => {
      const params = {
        palette: ['#ff0000', '#00ff00', '#0000ff'],
      };

      const result = await createPaletteHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const viz = (result as any).visualizations;
        if (viz?.html_file) {
          const fileInfo = viz.html_file;

          expect(fileInfo.type).toBe('html');
          expect(fileInfo.size).toBeGreaterThan(0);
          expect(fileInfo.created_at).toBeDefined();
          expect(fileInfo.description).toContain(
            'Enhanced palette visualization'
          );
          expect(fileInfo.description).toContain('3 colors');
        }
      }
    });
  });

  describe('Background controls integration', () => {
    test('should include background controls in all HTML files', async () => {
      const testCases = [
        {
          tool: createPaletteHtmlTool,
          params: { palette: ['#ff0000'] },
        },
        {
          tool: createColorWheelHtmlTool,
          params: { type: 'hsl' },
        },
        {
          tool: createGradientHtmlTool,
          params: { gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)' },
        },
        {
          tool: createThemePreviewHtmlTool,
          params: { theme_colors: { primary: '#2563eb' } },
        },
      ];

      for (const testCase of testCases) {
        const result = await testCase.tool.handler(testCase.params);

        expect(result.success).toBe(true);
        if (result.success) {
          const viz = (result as any).visualizations;
          if (viz?.html_file) {
            const content = await fs.readFile(viz.html_file.file_path, 'utf8');

            // Check for background controls elements
            expect(content).toContain('background-controls');
            expect(content).toContain('background-toggle-btn');
            expect(content).toContain('color-picker-toggle');
            expect(content).toContain('BackgroundController');

            // Check for accessibility features
            expect(content).toContain('<kbd>Alt</kbd> + <kbd>T</kbd>');
            expect(content).toContain('<kbd>Alt</kbd> + <kbd>C</kbd>');
            expect(content).toContain('aria-label');
            expect(content).toContain('role=');
          }
        }
      }
    });

    test('should allow disabling background controls', async () => {
      const params = {
        palette: ['#ff0000'],
        enable_background_controls: false,
      };

      const result = await createPaletteHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).background_controls_enabled).toBe(false);
      }
    });
  });

  describe('Error handling and recovery', () => {
    test('should handle invalid file paths gracefully', async () => {
      // Mock file output manager to simulate failure
      const originalSaveFile = fileOutputManager.saveFile;
      fileOutputManager.saveFile = jest
        .fn()
        .mockRejectedValue(new Error('File system error'));

      const params = {
        palette: ['#ff0000'],
      };

      const result = await createPaletteHtmlTool.handler(params);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should fall back to HTML content
        expect(result.visualizations).toHaveProperty('html');
        expect(result.visualizations?.html).toContain('<!DOCTYPE html>');
      }

      // Restore original method
      fileOutputManager.saveFile = originalSaveFile;
    });

    test('should validate file permissions', async () => {
      // Create read-only directory
      const readOnlyDir = join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);
      await fs.chmod(readOnlyDir, 0o444);

      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = readOnlyDir;
      environmentConfig.reloadConfiguration();

      const params = {
        palette: ['#ff0000'],
      };

      const result = await createPaletteHtmlTool.handler(params);

      // Should still succeed with fallback
      expect(result.success).toBe(true);
    });
  });
});
