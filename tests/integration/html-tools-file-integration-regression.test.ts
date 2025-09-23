/**
 * Regression test for HTML visualization tools file output integration
 * Ensures all HTML tools return file paths instead of HTML content
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createPaletteHtmlTool } from '../../src/tools/create-palette-html';
import { createColorWheelHtmlTool } from '../../src/tools/create-color-wheel-html';
import { createGradientHtmlTool } from '../../src/tools/create-gradient-html';
import { createThemePreviewHtmlTool } from '../../src/tools/create-theme-preview-html';
import { fileOutputManager } from '../../src/utils/file-output-manager';

describe('HTML Tools File Integration Regression Tests', () => {
  let testDir: string;
  let originalEnvVar: string | undefined;

  beforeAll(async () => {
    // Set up test directory
    testDir = join(__dirname, '../../test-output/regression');
    await fs.mkdir(testDir, { recursive: true });

    // Set environment variable for testing
    originalEnvVar = process.env['COLOR_MCP_VISUALIZATIONS_DIR'];
    process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = testDir;

    // Force file creation in test environment
    process.env['MCP_FORCE_FILE_CREATION'] = 'true';

    // Initialize file output manager
    await fileOutputManager.initialize();
  });

  afterAll(async () => {
    // Restore original environment variable
    if (originalEnvVar !== undefined) {
      process.env['COLOR_MCP_VISUALIZATIONS_DIR'] = originalEnvVar;
    } else {
      delete process.env['COLOR_MCP_VISUALIZATIONS_DIR'];
    }

    // Clean up force file creation flag
    delete process.env['MCP_FORCE_FILE_CREATION'];

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error);
    }

    // Destroy file output manager
    fileOutputManager.destroy();
  });

  test('all HTML tools should return file paths instead of HTML content', async () => {
    const testCases = [
      {
        name: 'create_palette_html',
        tool: createPaletteHtmlTool,
        params: {
          palette: ['#FF0000', '#00FF00', '#0000FF'],
          enable_background_controls: true,
        },
      },
      {
        name: 'create_color_wheel_html',
        tool: createColorWheelHtmlTool,
        params: {
          type: 'hsl',
          size: 400,
          enable_background_controls: true,
        },
      },
      {
        name: 'create_gradient_html',
        tool: createGradientHtmlTool,
        params: {
          gradient_css: 'linear-gradient(45deg, #FF0000, #0000FF)',
          enable_background_controls: true,
        },
      },
      {
        name: 'create_theme_preview_html',
        tool: createThemePreviewHtmlTool,
        params: {
          theme_colors: {
            primary: '#2563eb',
            background: '#ffffff',
            text: '#1e293b',
          },
          enable_background_controls: true,
        },
      },
    ];

    for (const testCase of testCases) {
      const result = await testCase.tool.handler(testCase.params);

      // Should succeed
      expect(result.success).toBe(true);

      if (result.success) {
        const data = result.data as any;

        // Should return file metadata in data
        expect(data).toHaveProperty('file_path');
        expect(data).toHaveProperty('file_name');
        expect(data).toHaveProperty('file_size');
        expect(data).toHaveProperty('background_controls_enabled');
        expect(data).toHaveProperty('accessibility_features');

        // File path should be a string
        expect(typeof data.file_path).toBe('string');
        expect(data.file_path).toMatch(/\.html$/);

        // Background controls should be enabled
        expect(data.background_controls_enabled).toBe(true);

        // Accessibility features should be an array
        expect(Array.isArray(data.accessibility_features)).toBe(true);
        expect(data.accessibility_features.length).toBeGreaterThan(0);

        // Visualizations should contain file path message, not HTML content
        expect(result.visualizations).toHaveProperty('html');
        const visualizationHtml = result.visualizations as any;
        expect(visualizationHtml.html).toContain('File saved:');
        expect(visualizationHtml.html).toContain(data.file_path);
        expect(visualizationHtml.html).not.toContain('<!DOCTYPE html>');

        // File should actually exist
        const fileExists = await fs
          .access(data.file_path)
          .then(() => true)
          .catch(() => false);
        expect(fileExists).toBe(true);

        // File should contain valid HTML with background controls
        const fileContent = await fs.readFile(data.file_path, 'utf8');
        expect(fileContent).toContain('<!DOCTYPE html>');
        expect(fileContent).toContain('background-controls');
        expect(fileContent).toContain('accessibility-features');
        expect(fileContent).toContain('keyboard-shortcuts');

        console.log(`✅ ${testCase.name}: File saved to ${data.file_path}`);
      }
    }
  });

  test('HTML files should be self-contained with embedded CSS and JavaScript', async () => {
    const result = await createPaletteHtmlTool.handler({
      palette: ['#FF0000'],
      interactive: true,
      enable_background_controls: true,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      const data = result.data as any;
      const fileContent = await fs.readFile(data.file_path, 'utf8');

      // Should contain embedded CSS
      expect(fileContent).toContain('<style>');
      expect(fileContent).toContain('</style>');
      expect(fileContent).toContain('background-controls');

      // Should contain embedded JavaScript
      expect(fileContent).toContain('<script>');
      expect(fileContent).toContain('</script>');
      expect(fileContent).toContain('BackgroundController');

      // Should not contain external references
      expect(fileContent).not.toContain('<link rel="stylesheet"');
      expect(fileContent).not.toContain('<script src=');
    }
  });

  test('error handling should work correctly with file output system', async () => {
    // Test with invalid parameters
    const result = await createPaletteHtmlTool.handler({
      palette: ['invalid-color'],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      expect(result.error.suggestions).toBeDefined();
      expect(result.error.suggestions!.length).toBeGreaterThan(0);
    }
  });

  test('concurrent file generation should produce unique filenames', async () => {
    const promises = Array(3)
      .fill(null)
      .map(async (_, i) => {
        return createPaletteHtmlTool.handler({
          palette: [`#${i.toString().padStart(6, '0')}`],
        });
      });

    const results = await Promise.all(promises);

    // All should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // All file paths should be unique
    const filePaths = results
      .filter(r => r.success)
      .map(r => (r.success ? (r.data as any).file_path : null))
      .filter(Boolean) as string[];

    const uniquePaths = new Set(filePaths);
    expect(uniquePaths.size).toBe(filePaths.length);

    // All files should exist
    for (const filePath of filePaths) {
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    }
  });
});
