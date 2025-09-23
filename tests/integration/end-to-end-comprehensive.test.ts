/**
 * Comprehensive End-to-End Integration Tests
 * Tests complete workflows and tool interactions
 */

// import { jest } from '@jest/globals';
import { createColorComparisonPngTool } from '../../src/tools/create-color-comparison-png';
import { createColorWheelHtmlTool } from '../../src/tools/create-color-wheel-html';
import { createGradientHtmlTool } from '../../src/tools/create-gradient-html';
import { createPaletteHtmlTool } from '../../src/tools/create-palette-html';
import { createPalettePngTool } from '../../src/tools/create-palette-png';
import { createThemePreviewHtmlTool } from '../../src/tools/create-theme-preview-html';
import { convertColorTool } from '../../src/tools/convert-color';
import { generateHarmonyPaletteTool } from '../../src/tools/generate-harmony-palette';
import { generateLinearGradientTool } from '../../src/tools/generate-linear-gradient';
import { generateThemeTool } from '../../src/tools/generate-theme';
import { checkContrastTool } from '../../src/tools/check-contrast';
import { analyzeColorTool } from '../../src/tools/analyze-color';
import { exportCssTool } from '../../src/tools/export-css';
import { exportScssTool } from '../../src/tools/export-scss';
import { exportTailwindTool } from '../../src/tools/export-tailwind';
import { exportJsonTool } from '../../src/tools/export-json';
import { fileOutputManager } from '../../src/utils/file-output-manager';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

// Helper function for color comparison
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result && result[1] && result[2] && result[3]
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

describe('End-to-End Integration Tests', () => {
  beforeAll(async () => {
    await fileOutputManager.initialize();
  });

  describe('Complete Design System Workflow', () => {
    it('should create a complete design system from brand color', async () => {
      const brandColor = '#2563eb';

      // Step 1: Analyze the brand color
      const colorAnalysis = await analyzeColorTool.handler({
        color: brandColor,
        analysis_types: ['brightness', 'temperature', 'accessibility'],
      });

      expect(colorAnalysis.success).toBe(true);
      expect((colorAnalysis as any).data).toHaveProperty('analysis');
      expect((colorAnalysis as any).data.analysis).toHaveProperty('brightness');
      expect((colorAnalysis as any).data.analysis).toHaveProperty(
        'temperature'
      );

      // Step 2: Generate a theme from the brand color
      const theme = await generateThemeTool.handler({
        theme_type: 'light',
        primary_color: brandColor,
        style: 'material',
        accessibility_level: 'AA',
      });

      expect(theme.success).toBe(true);
      if (theme.success) {
        const themeData = (theme as any).data;
        const colors =
          themeData.variants.light?.colors || themeData.variants.dark?.colors;
        expect(colors).toHaveProperty('primary');
        expect(colors).toHaveProperty('background');
        expect(colors).toHaveProperty('surface');
      }

      // Step 3: Generate harmony palette
      const palette = await generateHarmonyPaletteTool.handler({
        base_color: brandColor,
        harmony_type: 'complementary',
        count: 5,
      });

      expect(palette.success).toBe(true);
      if (palette.success) {
        expect((palette.data as any).palette).toHaveLength(5);
      }

      // Step 4: Check accessibility compliance
      if (theme.success) {
        const themeData = (theme as any).data;
        const colors =
          themeData.variants.light?.colors || themeData.variants.dark?.colors;
        const contrastCheck = await checkContrastTool.handler({
          foreground: colors.primary,
          background: colors.background,
          standard: 'WCAG_AA',
        });

        expect(contrastCheck.success).toBe(true);
        expect((contrastCheck as any).data.compliance.passes).toBe(true);
      }

      // Step 5: Create visualizations
      if (theme.success) {
        const themeData = (theme as any).data;
        const colors =
          themeData.variants.light?.colors || themeData.variants.dark?.colors;
        const themePreview = await createThemePreviewHtmlTool.handler({
          theme_colors: colors,
          preview_type: 'dashboard',
          interactive: true,
        });

        expect(themePreview.success).toBe(true);
      }

      // Step 6: Export formats
      if (palette.success) {
        const paletteColors = (palette.data as any).palette.map(
          (color: any) => color.hex
        );
        const cssExport = await exportCssTool.handler({
          colors: paletteColors,
          format: 'both',
          include_rgb_hsl: true,
        });

        expect(cssExport.success).toBe(true);
        if (cssExport.success) {
          expect(cssExport.export_formats?.css).toContain('--color-');
        }

        const scssExport = await exportScssTool.handler({
          colors: paletteColors,
          format: 'all',
          include_functions: true,
        });

        expect(scssExport.success).toBe(true);
        if (scssExport.success) {
          expect(scssExport.export_formats?.scss).toContain('$color-');
        }

        const tailwindExport = await exportTailwindTool.handler({
          colors: paletteColors,
          include_shades: true,
        });

        expect(tailwindExport.success).toBe(true);
        if (tailwindExport.success) {
          expect(tailwindExport.export_formats?.tailwind).toContain('colors:');
        }
      }
    }, 30000);
  });

  describe('Color Conversion Workflow', () => {
    it('should convert colors through multiple formats maintaining accuracy', async () => {
      const originalColor = '#ff6b35';

      // Convert to RGB
      const rgbResult = await convertColorTool.handler({
        color: originalColor,
        output_format: 'rgb',
        precision: 0,
      });

      expect(rgbResult.success).toBe(true);
      if (rgbResult.success) {
        const rgbColor = (rgbResult.data as any).converted;

        // Convert RGB to HSL
        const hslResult = await convertColorTool.handler({
          color: rgbColor,
          output_format: 'hsl',
          precision: 1,
        });

        expect(hslResult.success).toBe(true);
        if (hslResult.success) {
          const hslColor = (hslResult.data as any).converted;

          // Convert HSL back to HEX
          const hexResult = await convertColorTool.handler({
            color: hslColor,
            output_format: 'hex',
          });

          expect(hexResult.success).toBe(true);

          // Should be close to original (allowing for rounding)
          if (hexResult.success) {
            const convertedColor = (
              hexResult.data as any
            ).converted.toLowerCase();
            const originalLower = originalColor.toLowerCase();

            // Allow for small rounding differences in color conversion
            // Extract RGB values and compare with tolerance
            const originalRgb = hexToRgb(originalLower);
            const convertedRgb = hexToRgb(convertedColor);

            if (originalRgb && convertedRgb) {
              const tolerance = 3; // Allow up to 3 units difference per channel
              expect(
                Math.abs(originalRgb.r - convertedRgb.r)
              ).toBeLessThanOrEqual(tolerance);
              expect(
                Math.abs(originalRgb.g - convertedRgb.g)
              ).toBeLessThanOrEqual(tolerance);
              expect(
                Math.abs(originalRgb.b - convertedRgb.b)
              ).toBeLessThanOrEqual(tolerance);
            } else {
              // Fallback to exact match if RGB parsing fails
              expect(convertedColor).toBe(originalLower);
            }
          }
        }
      }
    });
  });

  describe('Palette Generation and Visualization Workflow', () => {
    it('should generate palette and create multiple visualizations', async () => {
      // Generate palette
      const palette = await generateHarmonyPaletteTool.handler({
        base_color: '#e74c3c',
        harmony_type: 'triadic',
        count: 3,
      });

      expect(palette.success).toBe(true);
      if (palette.success) {
        const colors = (palette.data as any).palette.map(
          (color: any) => color.hex
        );

        // Create HTML visualization
        const htmlViz = await createPaletteHtmlTool.handler({
          palette: colors,
          layout: 'grid',
          show_values: true,
          interactive: true,
        });

        expect(htmlViz.success).toBe(true);

        // Create PNG visualization
        const pngViz = await createPalettePngTool.handler({
          palette: colors,
          layout: 'horizontal',
          resolution: 150,
          labels: true,
        });

        expect(pngViz.success).toBe(true);

        // Create color wheel
        const wheelViz = await createColorWheelHtmlTool.handler({
          highlight_colors: colors,
          show_harmony: true,
          harmony_type: 'triadic',
        });

        expect(wheelViz.success).toBe(true);

        // Create comparison chart
        const comparisonViz = await createColorComparisonPngTool.handler({
          color_sets: [colors, ['#ffffff', '#000000', '#808080']],
          comparison_type: 'side_by_side',
          annotations: true,
        });

        expect(comparisonViz.success).toBe(true);
      }
    }, 30000);
  });

  describe('Gradient Creation Workflow', () => {
    it('should create gradients and visualizations', async () => {
      // Generate linear gradient
      const gradient = await generateLinearGradientTool.handler({
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        angle: 45,
        interpolation: 'linear',
      });

      expect(gradient.success).toBe(true);
      if (gradient.success) {
        expect((gradient.data as any).css).toContain('linear-gradient');

        // Create gradient visualization
        const gradientViz = await createGradientHtmlTool.handler({
          gradient_css: (gradient.data as any).css,
          preview_shapes: ['rectangle', 'circle'],
          show_css_code: true,
        });

        expect(gradientViz.success).toBe(true);
      }
    });
  });

  describe('File Output Integration', () => {
    it('should save files and maintain file system integrity', async () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff'];

      // Create HTML visualization
      const htmlResult = await createPaletteHtmlTool.handler({
        palette: colors,
        layout: 'horizontal',
      });

      expect(htmlResult.success).toBe(true);

      // Check if file was created (file-based output)
      if (
        htmlResult.success &&
        htmlResult.data &&
        typeof htmlResult.data === 'object' &&
        'html_file' in htmlResult.data
      ) {
        const fileInfo = (htmlResult.data as any).html_file;
        expect(existsSync(fileInfo.file_path)).toBe(true);

        // Verify file content
        const content = await readFile(fileInfo.file_path, 'utf8');
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('#ff0000');
      }

      // Create PNG visualization
      const pngResult = await createPalettePngTool.handler({
        palette: colors,
        layout: 'grid',
      });

      expect(pngResult.success).toBe(true);

      // Check PNG files (dual background)
      if (
        pngResult.success &&
        pngResult.data &&
        typeof pngResult.data === 'object' &&
        'png_files' in pngResult.data
      ) {
        const pngFiles = (pngResult.data as any).png_files;
        expect(pngFiles).toHaveLength(2); // Light and dark variants

        const lightFile = pngFiles.find((f: any) =>
          f.filename.includes('light')
        );
        const darkFile = pngFiles.find((f: any) => f.filename.includes('dark'));

        expect(lightFile).toBeDefined();
        expect(darkFile).toBeDefined();
        expect(existsSync(lightFile.file_path)).toBe(true);
        expect(existsSync(darkFile.file_path)).toBe(true);
      }
    }, 30000);
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid inputs gracefully', async () => {
      // Invalid color format
      const invalidColorResult = await convertColorTool.handler({
        color: 'invalid-color',
        output_format: 'rgb',
      });

      expect(invalidColorResult.success).toBe(false);
      if (!invalidColorResult.success) {
        expect(invalidColorResult.error).toBeDefined();
        expect(invalidColorResult.error?.suggestions).toBeDefined();
      }

      // Invalid palette generation
      const invalidPaletteResult = await generateHarmonyPaletteTool.handler({
        base_color: 'not-a-color',
        harmony_type: 'complementary',
        count: 5,
      });

      expect(invalidPaletteResult.success).toBe(false);
      if (!invalidPaletteResult.success) {
        expect(invalidPaletteResult.error).toBeDefined();
      }
    });

    it('should handle edge cases in visualizations', async () => {
      // Empty palette
      const emptyPaletteResult = await createPaletteHtmlTool.handler({
        palette: [],
      });

      expect(emptyPaletteResult.success).toBe(false);

      // Single color palette
      const singleColorResult = await createPaletteHtmlTool.handler({
        palette: ['#ff0000'],
      });

      expect(singleColorResult.success).toBe(true);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle multiple concurrent operations', async () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

      // Create multiple operations concurrently
      const operations = [
        convertColorTool.handler({ color: colors[0], output_format: 'hsl' }),
        convertColorTool.handler({ color: colors[1], output_format: 'rgb' }),
        generateHarmonyPaletteTool.handler({
          base_color: colors[2],
          harmony_type: 'analogous',
          count: 3,
        }),
        analyzeColorTool.handler({
          color: colors[3]!,
          analysis_types: ['brightness'],
        }),
        checkContrastTool.handler({
          foreground: colors[4]!,
          background: '#ffffff',
        }),
      ];

      const results = await Promise.all(operations);

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should complete operations within performance requirements', async () => {
      const startTime = Date.now();

      // Simple color conversion should be under 100ms
      const conversionResult = await convertColorTool.handler({
        color: '#ff0000',
        output_format: 'hsl',
      });

      const conversionTime = Date.now() - startTime;
      expect(conversionTime).toBeLessThan(100);
      expect(conversionResult.success).toBe(true);

      // Palette generation should be under 500ms
      const paletteStartTime = Date.now();
      const paletteResult = await generateHarmonyPaletteTool.handler({
        base_color: '#2563eb',
        harmony_type: 'complementary',
        count: 5,
      });

      const paletteTime = Date.now() - paletteStartTime;
      expect(paletteTime).toBeLessThan(500);
      expect(paletteResult.success).toBe(true);
    });
  });

  describe('Export Format Integration', () => {
    it('should generate consistent exports across formats', async () => {
      const colors = ['#2563eb', '#ef4444', '#10b981'];
      const semanticNames = ['primary', 'error', 'success'];

      // Generate all export formats
      const [cssResult, scssResult, tailwindResult, jsonResult] =
        await Promise.all([
          exportCssTool.handler({
            colors,
            semantic_names: semanticNames,
            format: 'both',
          }),
          exportScssTool.handler({
            colors,
            semantic_names: semanticNames,
            format: 'all',
          }),
          exportTailwindTool.handler({
            colors,
            semantic_names: semanticNames,
            include_shades: true,
          }),
          exportJsonTool.handler({
            colors,
            semantic_names: semanticNames,
            format: 'detailed',
          }),
        ]);

      // All exports should succeed
      expect(cssResult.success).toBe(true);
      expect(scssResult.success).toBe(true);
      expect(tailwindResult.success).toBe(true);
      expect(jsonResult.success).toBe(true);

      // Check format consistency
      if (cssResult.success) {
        expect(cssResult.export_formats?.css).toContain('--primary');
      }
      if (scssResult.success) {
        expect(scssResult.export_formats?.scss).toContain('$primary');
      }
      if (tailwindResult.success) {
        expect(tailwindResult.export_formats?.tailwind).toContain('primary');
      }
      if (jsonResult.success) {
        expect(jsonResult.export_formats?.json).toHaveProperty('colors');
      }
    });
  });
});
