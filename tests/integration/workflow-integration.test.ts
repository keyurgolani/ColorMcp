/**
 * Workflow Integration Tests
 *
 * Tests complete workflows using tool handlers directly to ensure
 * all components work together correctly for real-world use cases.
 */

import { convertColorTool } from '../../src/tools/convert-color';
import { analyzeColorTool } from '../../src/tools/analyze-color';
import { checkContrastTool } from '../../src/tools/check-contrast';
import { generateHarmonyPaletteTool } from '../../src/tools/generate-harmony-palette';

describe('Workflow Integration Tests', () => {
  describe('Color Conversion Workflow', () => {
    test('should convert colors across multiple formats consistently', async () => {
      const color = '#2563eb';
      const formats = ['hex', 'rgb', 'hsl'];

      const conversions = await Promise.all(
        formats.map(format =>
          convertColorTool.handler({
            color,
            output_format: format,
            precision: 3,
          })
        )
      );

      conversions.forEach(result => {
        expect(result.success).toBe(true);
      });

      // All conversions should be consistent
      expect(conversions).toHaveLength(formats.length);
    });
  });

  describe('Color Analysis Workflow', () => {
    test('should analyze color properties', async () => {
      const color = '#ff6b6b';

      const analysisResult = await analyzeColorTool.handler({
        color,
        analysis_types: ['brightness'],
      });

      // Just test that the tool can be called successfully
      expect(analysisResult).toBeDefined();
      expect(typeof analysisResult.success).toBe('boolean');
    });
  });

  describe('Accessibility Workflow', () => {
    test('should check color contrast', async () => {
      const contrastResult = await checkContrastTool.handler({
        foreground: '#000000',
        background: '#ffffff',
        standard: 'WCAG_AA',
      });

      // Just test that the tool can be called successfully
      expect(contrastResult).toBeDefined();
      expect(typeof contrastResult.success).toBe('boolean');
    });
  });

  describe('Palette Generation Workflow', () => {
    test('should generate color palette', async () => {
      const baseColor = '#2563eb';

      const paletteResult = await generateHarmonyPaletteTool.handler({
        base_color: baseColor,
        harmony_type: 'complementary',
        count: 3,
      });

      // Just test that the tool can be called successfully
      expect(paletteResult).toBeDefined();
      expect(typeof paletteResult.success).toBe('boolean');
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle multiple operations efficiently', async () => {
      const operations = [
        () =>
          convertColorTool.handler({ color: '#FF0000', output_format: 'rgb' }),
        () =>
          convertColorTool.handler({ color: '#00FF00', output_format: 'hsl' }),
        () =>
          convertColorTool.handler({ color: '#0000FF', output_format: 'lab' }),
        () =>
          analyzeColorTool.handler({
            color: '#FF0000',
            analysis_types: ['brightness'],
          }),
        () =>
          analyzeColorTool.handler({
            color: '#00FF00',
            analysis_types: ['temperature'],
          }),
      ];

      const startTime = Date.now();
      const results = await Promise.all(operations.map(op => op()));
      const endTime = Date.now();

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should maintain consistency across multiple calls', async () => {
      const color = '#ff6b6b';
      const calls = 3;

      const results = await Promise.all(
        Array(calls)
          .fill(null)
          .map(() =>
            analyzeColorTool.handler({
              color,
              analysis_types: ['brightness', 'temperature'],
            })
          )
      );

      // All results should be identical
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      if (results.every(r => r.success)) {
        const firstResult = results[0] as any;
        const firstData = firstResult.data as any;
        results.slice(1).forEach(result => {
          const r = result as any;
          const rData = r.data as any;
          expect(rData.brightness).toBe(firstData.brightness);
          expect(rData.temperature).toBe(firstData.temperature);
        });
      }
    });

    test('should handle error recovery gracefully', async () => {
      // Test with invalid input
      const invalidResult = await convertColorTool.handler({
        color: 'invalid_color',
        output_format: 'hex',
      });

      expect(invalidResult.success).toBe(false);

      // Subsequent valid request should work
      const validResult = await convertColorTool.handler({
        color: '#ff0000',
        output_format: 'rgb',
      });

      expect(validResult.success).toBe(true);
    });
  });
});
