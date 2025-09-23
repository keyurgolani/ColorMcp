/**
 * Comprehensive tests to improve branch coverage across all tools
 */

import { convertColorTool } from '../../src/tools/convert-color';
import { analyzeColorTool } from '../../src/tools/analyze-color';
import { generateHarmonyPaletteTool } from '../../src/tools/generate-harmony-palette';
import { checkContrastTool } from '../../src/tools/check-contrast';
import { simulateColorblindnessTool } from '../../src/tools/simulate-colorblindness';
import { optimizeForAccessibilityTool } from '../../src/tools/optimize-for-accessibility';
import { createPaletteHtmlTool } from '../../src/tools/create-palette-html';
import { createColorWheelHtmlTool } from '../../src/tools/create-color-wheel-html';
import { createGradientHtmlTool } from '../../src/tools/create-gradient-html';
import { createPalettePngTool } from '../../src/tools/create-palette-png';
import { createGradientPngTool } from '../../src/tools/create-gradient-png';
import { createColorComparisonPngTool } from '../../src/tools/create-color-comparison-png';

describe('Comprehensive Branch Coverage Tests', () => {
  describe('Convert Color Tool - Edge Cases', () => {
    it('should handle CSS variable with custom name', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'css-var',
        variable_name: 'primary-color',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.css_variable).toContain('primary-color');
      }
    });

    it('should handle SCSS variable with custom name', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'scss-var',
        variable_name: 'primary-color',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.scss_variable).toContain('primary-color');
      }
    });

    it('should handle maximum precision', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'hsl',
        precision: 10,
      });

      expect(result.success).toBe(true);
    });

    it('should handle zero precision', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'hsl',
        precision: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should handle all named colors', async () => {
      const namedColors = [
        'red',
        'blue',
        'green',
        'yellow',
        'purple',
        'orange',
        'pink',
        'brown',
        'gray',
        'black',
        'white',
      ];

      for (const color of namedColors) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'hex',
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle short hex format', async () => {
      const result = await convertColorTool.handler({
        color: '#F00',
        output_format: 'rgb',
      });

      expect(result.success).toBe(true);
    });

    it('should handle RGBA format', async () => {
      const result = await convertColorTool.handler({
        color: 'rgba(255, 0, 0, 0.5)',
        output_format: 'hsla',
      });

      expect(result.success).toBe(true);
    });

    it('should handle HSLA format', async () => {
      const result = await convertColorTool.handler({
        color: 'hsla(0, 100%, 50%, 0.8)',
        output_format: 'rgba',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Analyze Color Tool - Edge Cases', () => {
    it('should handle pure black', async () => {
      const result = await analyzeColorTool.handler({
        color: '#000000',
        analysis_types: ['brightness', 'temperature'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.analysis?.brightness).toBeDefined();
      }
    });

    it('should handle pure white', async () => {
      const result = await analyzeColorTool.handler({
        color: '#FFFFFF',
        analysis_types: ['brightness', 'temperature'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.analysis?.brightness).toBeDefined();
      }
    });

    it('should handle mid-gray', async () => {
      const result = await analyzeColorTool.handler({
        color: '#808080',
        analysis_types: ['brightness', 'temperature'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.analysis?.brightness).toBeDefined();
      }
    });

    it('should handle highly saturated colors', async () => {
      const colors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFFF00',
        '#FF00FF',
        '#00FFFF',
      ];

      for (const color of colors) {
        const result = await analyzeColorTool.handler({
          color,
          analysis_types: ['brightness', 'temperature'],
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle desaturated colors', async () => {
      const colors = ['#808080', '#A0A0A0', '#606060', '#C0C0C0'];

      for (const color of colors) {
        const result = await analyzeColorTool.handler({
          color,
          analysis_types: ['brightness', 'temperature'],
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Harmony Palette Tool - Edge Cases', () => {
    it('should handle minimum color count', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'complementary',
        count: 3,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.palette).toHaveLength(3);
      }
    });

    it('should handle maximum color count', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'complementary',
        count: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.palette).toHaveLength(10);
      }
    });

    it('should handle zero variation', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'monochromatic',
        variation: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should handle maximum variation', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'analogous',
        variation: 100,
      });

      expect(result.success).toBe(true);
    });

    it('should handle all harmony types with edge colors', async () => {
      const harmonyTypes = [
        'monochromatic',
        'analogous',
        'complementary',
        'triadic',
        'tetradic',
        'split_complementary',
        'double_complementary',
      ];
      const edgeColors = ['#000000', '#FFFFFF', '#808080'];

      for (const harmonyType of harmonyTypes) {
        for (const color of edgeColors) {
          const result = await generateHarmonyPaletteTool.handler({
            base_color: color,
            harmony_type: harmonyType,
          });

          expect(result.success).toBe(true);
        }
      }
    });
  });

  describe('Contrast Tool - Edge Cases', () => {
    it('should handle identical colors', async () => {
      const result = await checkContrastTool.handler({
        foreground: '#FF0000',
        background: '#FF0000',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.contrast_ratio).toBe(1);
      }
    });

    it('should handle maximum contrast', async () => {
      const result = await checkContrastTool.handler({
        foreground: '#000000',
        background: '#FFFFFF',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.contrast_ratio).toBeGreaterThan(20);
      }
    });

    it('should handle large text size', async () => {
      const result = await checkContrastTool.handler({
        foreground: '#666666',
        background: '#FFFFFF',
        text_size: 'large',
      });

      expect(result.success).toBe(true);
    });

    it('should handle AAA standard', async () => {
      const result = await checkContrastTool.handler({
        foreground: '#000000',
        background: '#FFFFFF',
        standard: 'WCAG_AAA',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.compliance?.wcag_aaa).toBe(true);
      }
    });

    it('should handle APCA standard', async () => {
      const result = await checkContrastTool.handler({
        foreground: '#000000',
        background: '#FFFFFF',
        standard: 'APCA',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Colorblindness Simulation - Edge Cases', () => {
    it('should handle all deficiency types', async () => {
      const types = [
        'protanopia',
        'deuteranopia',
        'tritanopia',
        'protanomaly',
        'deuteranomaly',
        'tritanomaly',
        'monochromacy',
      ];

      for (const type of types) {
        const result = await simulateColorblindnessTool.handler({
          colors: ['#FF0000', '#00FF00', '#0000FF'],
          type,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle different severity levels', async () => {
      const severities = [0, 25, 50, 75, 100];

      for (const severity of severities) {
        const result = await simulateColorblindnessTool.handler({
          colors: ['#FF0000'],
          type: 'protanopia',
          severity,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle single color', async () => {
      const result = await simulateColorblindnessTool.handler({
        colors: ['#FF0000'],
        type: 'deuteranopia',
      });

      expect(result.success).toBe(true);
    });

    it('should handle many colors', async () => {
      const colors = Array.from(
        { length: 20 },
        (_, i) => `hsl(${i * 18}, 70%, 50%)`
      );
      const result = await simulateColorblindnessTool.handler({
        colors,
        type: 'tritanopia',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Accessibility Optimization - Edge Cases', () => {
    it('should handle text use case', async () => {
      const result = await optimizeForAccessibilityTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        use_cases: ['text'],
      });

      expect(result.success).toBe(true);
    });

    it('should handle background use case', async () => {
      const result = await optimizeForAccessibilityTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        use_cases: ['background'],
      });

      expect(result.success).toBe(true);
    });

    it('should handle interactive use case', async () => {
      const result = await optimizeForAccessibilityTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        use_cases: ['interactive'],
      });

      expect(result.success).toBe(true);
    });

    it('should handle AAA target standard', async () => {
      const result = await optimizeForAccessibilityTool.handler({
        palette: ['#FF0000'],
        use_cases: ['text'],
        target_standard: 'WCAG_AAA',
      });

      expect(result.success).toBe(true);
    });

    it('should handle preserve hue disabled', async () => {
      const result = await optimizeForAccessibilityTool.handler({
        palette: ['#FF0000'],
        use_cases: ['text'],
        preserve_hue: false,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('HTML Visualization Tools - Edge Cases', () => {
    it('should handle palette HTML with all layout options', async () => {
      const layouts = ['horizontal', 'vertical', 'grid', 'circular', 'wave'];

      for (const layout of layouts) {
        const result = await createPaletteHtmlTool.handler({
          palette: ['#FF0000', '#00FF00', '#0000FF'],
          layout,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle palette HTML with all style options', async () => {
      const styles = ['swatches', 'gradient', 'cards', 'minimal', 'detailed'];

      for (const style of styles) {
        const result = await createPaletteHtmlTool.handler({
          palette: ['#FF0000', '#00FF00'],
          style,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle color wheel with all types', async () => {
      const types = ['hsl', 'hsv', 'rgb', 'ryw', 'ryb'];

      for (const type of types) {
        const result = await createColorWheelHtmlTool.handler({
          type,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle color wheel with harmony', async () => {
      const harmonyTypes = [
        'complementary',
        'triadic',
        'analogous',
        'split_complementary',
        'tetradic',
      ];

      for (const harmonyType of harmonyTypes) {
        const result = await createColorWheelHtmlTool.handler({
          show_harmony: true,
          harmony_type: harmonyType,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle gradient HTML with all preview shapes', async () => {
      const shapes = ['rectangle', 'circle', 'text', 'button', 'card'];

      for (const shape of shapes) {
        const result = await createGradientHtmlTool.handler({
          gradient_css: 'linear-gradient(45deg, #FF0000, #0000FF)',
          preview_shapes: [shape],
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('PNG Generation Tools - Edge Cases', () => {
    it('should handle minimum dimensions', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000'],
        dimensions: [100, 100],
      });

      expect(result.success).toBe(true);
    });

    it('should handle all label styles', async () => {
      const labelStyles = ['minimal', 'detailed', 'branded'];

      for (const labelStyle of labelStyles) {
        const result = await createPalettePngTool.handler({
          palette: ['#FF0000'],
          label_style: labelStyle,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle all PNG styles', async () => {
      const styles = [
        'flat',
        'gradient',
        'material',
        'glossy',
        'fabric',
        'paper',
      ];

      for (const style of styles) {
        const result = await createPalettePngTool.handler({
          palette: ['#FF0000'],
          style,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle gradient PNG with all types', async () => {
      const types = ['linear', 'radial', 'conic'];

      for (const type of types) {
        const result = await createGradientPngTool.handler({
          gradient: {
            type,
            colors: ['#FF0000', '#0000FF'],
          },
          dimensions: [200, 200],
        });

        expect(result.success).toBe(true);
      }
    });

    it('should handle color comparison with all types', async () => {
      const comparisonTypes = [
        'side_by_side',
        'overlay',
        'difference',
        'harmony',
      ];

      for (const comparisonType of comparisonTypes) {
        const result = await createColorComparisonPngTool.handler({
          color_sets: [['#FF0000'], ['#00FF00']],
          comparison_type: comparisonType,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle empty palette arrays', async () => {
      const result = await createPaletteHtmlTool.handler({
        palette: [],
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid harmony types', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'invalid_type' as any,
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid color formats in palette', async () => {
      const result = await createPaletteHtmlTool.handler({
        palette: ['#FF0000', 'invalid-color'],
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid dimensions', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000'],
        dimensions: [50, 50], // Below minimum
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid precision values', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'rgb',
        precision: -1,
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid count values', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'complementary',
        count: 2, // Below minimum
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid variation values', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'complementary',
        variation: -1, // Below minimum
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid severity values', async () => {
      const result = await simulateColorblindnessTool.handler({
        colors: ['#FF0000'],
        type: 'protanopia',
        severity: 150, // Above maximum
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Parameter Combinations', () => {
    it('should handle all parameters together for convert color', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'css-var',
        precision: 3,
        variable_name: 'primary-color',
      });

      expect(result.success).toBe(true);
    });

    it('should handle all parameters together for harmony palette', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'complementary',
        count: 7,
        variation: 30,
      });

      expect(result.success).toBe(true);
    });

    it('should handle all parameters together for palette HTML', async () => {
      const result = await createPaletteHtmlTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        layout: 'grid',
        style: 'cards',
        size: 'large',
        show_values: true,
        show_names: true,
        interactive: true,
        export_formats: ['hex', 'rgb', 'hsl'],
        accessibility_info: true,
        theme: 'dark',
      });

      expect(result.success).toBe(true);
    });

    it('should handle all parameters together for PNG generation', async () => {
      const result = await createPalettePngTool.handler({
        palette: ['#FF0000', '#00FF00'],
        layout: 'horizontal',
        resolution: 300,
        dimensions: [800, 600],
        style: 'material',
        labels: true,
        label_style: 'detailed',
        background: 'white',
        margin: 30,
      });

      expect(result.success).toBe(true);
    });
  });
});
