/**
 * Additional tests to push branch coverage above 81%
 * Targeting specific uncovered branches in the codebase
 */

import { analyzeColorTool } from '../../src/tools/analyze-color';
import { convertColorTool } from '../../src/tools/convert-color';
import { generateHarmonyPaletteTool } from '../../src/tools/generate-harmony-palette';
import { createPaletteHtmlTool } from '../../src/tools/create-palette-html';
import { createColorWheelHtmlTool } from '../../src/tools/create-color-wheel-html';
import { createGradientHtmlTool } from '../../src/tools/create-gradient-html';
import { checkContrastTool } from '../../src/tools/check-contrast';
import { simulateColorblindnessTool } from '../../src/tools/simulate-colorblindness';
import { optimizeForAccessibilityTool } from '../../src/tools/optimize-for-accessibility';

describe('Additional Branch Coverage Tests', () => {
  describe('Analyze Color - Edge Cases', () => {
    it('should handle compare_color parameter', async () => {
      const result = await analyzeColorTool.handler({
        color: '#FF0000',
        compare_color: '#00FF00',
        analysis_types: ['all'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.comparison).toBeDefined();
      }
    });

    it('should handle invalid compare_color', async () => {
      const result = await analyzeColorTool.handler({
        color: '#FF0000',
        compare_color: 'invalid-color',
        analysis_types: ['all'],
      });
      expect(result.success).toBe(false);
    });

    it('should handle include_recommendations parameter', async () => {
      const result = await analyzeColorTool.handler({
        color: '#FF0000',
        include_recommendations: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Convert Color - Additional Formats', () => {
    it('should handle hwb format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'hwb',
      });
      expect(result.success).toBe(true);
    });

    it('should handle named color output', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'named',
      });
      expect(result.success).toBe(true);
    });

    it('should handle precision parameter', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'hsl',
        precision: 3,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.converted).toMatch(/\d+\.\d{3}/);
      }
    });
  });

  describe('Harmony Palette - Edge Cases', () => {
    it('should handle variation parameter', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'complementary',
        variation: 50,
      });
      expect(result.success).toBe(true);
    });

    it('should handle different harmony types', async () => {
      const harmonyTypes = [
        'monochromatic',
        'analogous',
        'triadic',
        'tetradic',
        'split_complementary',
        'double_complementary',
      ];

      for (const harmonyType of harmonyTypes) {
        const result = await generateHarmonyPaletteTool.handler({
          base_color: '#FF0000',
          harmony_type: harmonyType as any,
          count: 5,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('HTML Tools - Additional Options', () => {
    it('should handle palette HTML with different themes', async () => {
      const result = await createPaletteHtmlTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        theme: 'dark',
        show_names: true,
        accessibility_info: true,
      });
      expect(result.success).toBe(true);
    });

    it('should handle color wheel with harmony', async () => {
      const result = await createColorWheelHtmlTool.handler({
        show_harmony: true,
        harmony_type: 'complementary',
        highlight_colors: ['#FF0000'],
      });
      expect(result.success).toBe(true);
    });

    it('should handle gradient HTML with variations', async () => {
      const result = await createGradientHtmlTool.handler({
        gradient_css: 'linear-gradient(45deg, #FF0000, #0000FF)',
        variations: true,
        interactive_controls: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Contrast Tool - Additional Standards', () => {
    it('should handle APCA standard', async () => {
      const result = await checkContrastTool.handler({
        foreground: '#000000',
        background: '#FFFFFF',
        standard: 'APCA',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any)?.apca_score).toBeDefined();
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
  });

  describe('Colorblindness Simulation - All Types', () => {
    it('should handle all colorblindness types', async () => {
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
          type: type as any,
          severity: 75,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Accessibility Optimization - Edge Cases', () => {
    it('should handle preserve_brand_colors', async () => {
      const result = await optimizeForAccessibilityTool.handler({
        palette: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        use_cases: ['text', 'background'],
        preserve_brand_colors: ['#FF0000'],
        target_standard: 'WCAG_AAA',
      });
      expect(result.success).toBe(true);
    });

    it('should handle preserve_hue false', async () => {
      const result = await optimizeForAccessibilityTool.handler({
        palette: ['#FF0000', '#00FF00'],
        use_cases: ['text', 'background'],
        preserve_hue: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling - Additional Cases', () => {
    it('should handle missing required parameters', async () => {
      const result = await analyzeColorTool.handler({} as any);
      expect(result.success).toBe(false);
    });

    it('should handle invalid output format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'invalid-format' as any,
      });
      expect(result.success).toBe(false);
    });

    it('should handle invalid harmony type', async () => {
      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'invalid-harmony' as any,
      });
      expect(result.success).toBe(false);
    });
  });
});
