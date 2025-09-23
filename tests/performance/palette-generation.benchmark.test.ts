/**
 * Performance benchmarks for palette generation system
 */

import {
  PaletteGenerator,
  HarmonyType,
} from '../../src/color/palette-generator';
import { generateHarmonyPaletteTool } from '../../src/tools/generate-harmony-palette';

describe('Palette Generation Performance Benchmarks', () => {
  const performanceThresholds = {
    singlePalette: 500, // ms - per requirements
    batchGeneration: 2000, // ms for 10 palettes
    complexPalette: 300, // ms for large palette with high variation
  };

  describe('PaletteGenerator Performance', () => {
    test('should generate single harmony palette within 500ms', () => {
      const startTime = performance.now();

      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'triadic',
        count: 8,
        variation: 30,
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(performanceThresholds.singlePalette);
      expect(palette.metadata.generationTime).toBeLessThan(
        performanceThresholds.singlePalette
      );
      expect(palette.colors).toHaveLength(8);
    });

    test('should generate multiple palettes efficiently', () => {
      const startTime = performance.now();
      const palettes = [];

      const harmonyTypes: HarmonyType[] = [
        'monochromatic',
        'analogous',
        'complementary',
        'triadic',
        'tetradic',
        'split_complementary',
        'double_complementary',
      ];

      // Generate 10 palettes with different harmony types
      for (let i = 0; i < 10; i++) {
        const harmonyType = harmonyTypes[i % harmonyTypes.length];
        const hue = (i * 36) % 360; // Distribute hues evenly

        const palette = PaletteGenerator.generateHarmonyPalette({
          baseColor: `hsl(${hue}, 70%, 50%)`,
          harmonyType: harmonyType!,
          count: 5,
          variation: 20,
        });

        palettes.push(palette);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(performanceThresholds.batchGeneration);
      expect(palettes).toHaveLength(10);

      // Each individual palette should also be fast
      palettes.forEach(palette => {
        expect(palette.metadata.generationTime).toBeLessThan(
          performanceThresholds.singlePalette
        );
      });
    });

    test('should handle complex palettes with high variation efficiently', () => {
      const startTime = performance.now();

      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#3366CC',
        harmonyType: 'tetradic',
        count: 10, // Maximum count
        variation: 100, // Maximum variation
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(performanceThresholds.complexPalette);
      expect(palette.colors).toHaveLength(10);
      expect(palette.metadata.diversity).toBeGreaterThan(0);
    });

    test('should maintain performance across different harmony types', () => {
      const harmonyTypes: HarmonyType[] = [
        'monochromatic',
        'analogous',
        'complementary',
        'triadic',
        'tetradic',
        'split_complementary',
        'double_complementary',
      ];

      const results = harmonyTypes.map(harmonyType => {
        const startTime = performance.now();

        const palette = PaletteGenerator.generateHarmonyPalette({
          baseColor: '#FF6600',
          harmonyType,
          count: 6,
          variation: 25,
        });

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        return {
          harmonyType,
          executionTime,
          generationTime: palette.metadata.generationTime,
        };
      });

      // All harmony types should meet performance requirements
      results.forEach(result => {
        expect(result.executionTime).toBeLessThan(
          performanceThresholds.singlePalette
        );
        expect(result.generationTime).toBeLessThan(
          performanceThresholds.singlePalette
        );
      });

      // Log performance results for analysis
      console.log('Harmony Type Performance Results:');
      results.forEach(result => {
        console.log(
          `${result.harmonyType}: ${result.executionTime.toFixed(2)}ms (internal: ${result.generationTime}ms)`
        );
      });
    });

    test('should scale linearly with palette size', () => {
      const counts = [3, 5, 7, 10];
      const results = [];

      for (const count of counts) {
        const startTime = performance.now();

        const palette = PaletteGenerator.generateHarmonyPalette({
          baseColor: '#AA3366',
          harmonyType: 'analogous',
          count,
          variation: 20,
        });

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        results.push({
          count,
          executionTime,
          generationTime: palette.metadata.generationTime,
        });

        // Each size should still meet requirements
        expect(executionTime).toBeLessThan(performanceThresholds.singlePalette);
      }

      // Log scaling results
      console.log('Palette Size Scaling Results:');
      results.forEach(result => {
        console.log(
          `Count ${result.count}: ${result.executionTime.toFixed(2)}ms (internal: ${result.generationTime}ms)`
        );
      });
    });
  });

  describe('MCP Tool Performance', () => {
    test('should handle MCP tool calls within performance requirements', async () => {
      const startTime = performance.now();

      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#FF0000',
        harmony_type: 'triadic',
        count: 8,
        variation: 30,
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(performanceThresholds.singlePalette);
      expect(result.metadata.execution_time).toBeLessThan(
        performanceThresholds.singlePalette
      );
    });

    test('should handle concurrent MCP tool calls efficiently', async () => {
      const startTime = performance.now();

      // Create 5 concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        generateHarmonyPaletteTool.handler({
          base_color: `hsl(${i * 72}, 70%, 50%)`,
          harmony_type: 'complementary',
          count: 5,
          variation: 15,
        })
      );

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Total time should be reasonable for concurrent execution
      expect(totalTime).toBeLessThan(performanceThresholds.batchGeneration);

      console.log(
        `Concurrent execution of 5 requests: ${totalTime.toFixed(2)}ms`
      );
    });

    test('should maintain performance with complex export formats', async () => {
      const startTime = performance.now();

      const result = await generateHarmonyPaletteTool.handler({
        base_color: '#663399',
        harmony_type: 'tetradic',
        count: 10,
        variation: 50,
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(performanceThresholds.singlePalette);

      // Verify all export formats are generated
      if (result.success) {
        expect(result.export_formats).toBeDefined();
        expect(result.export_formats!.css).toBeDefined();
        expect(result.export_formats!.scss).toBeDefined();
        expect(result.export_formats!.tailwind).toBeDefined();
        expect(result.export_formats!.json).toBeDefined();
      }
    });
  });

  describe('Memory Usage', () => {
    test('should not cause memory leaks during repeated generation', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate many palettes to test for memory leaks
      for (let i = 0; i < 100; i++) {
        PaletteGenerator.generateHarmonyPalette({
          baseColor: `hsl(${i * 3.6}, 70%, 50%)`,
          harmonyType: 'complementary',
          count: 5,
          variation: 20,
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 100 palettes)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(
        `Memory increase after 100 palettes: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      );
    });

    test('should handle large palettes without excessive memory usage', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const palette = PaletteGenerator.generateHarmonyPalette({
        baseColor: '#FF0000',
        harmonyType: 'tetradic',
        count: 10,
        variation: 100,
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(palette.colors).toHaveLength(10);

      // Single large palette should use minimal memory (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);

      console.log(
        `Memory for single large palette: ${(memoryIncrease / 1024).toFixed(2)}KB`
      );
    });
  });

  describe('Stress Testing', () => {
    test('should handle rapid successive generations', () => {
      const iterations = 50;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const palette = PaletteGenerator.generateHarmonyPalette({
          baseColor: `hsl(${i * 7.2}, ${50 + (i % 50)}%, ${30 + (i % 40)}%)`,
          harmonyType: ['complementary', 'triadic', 'analogous'][
            i % 3
          ] as HarmonyType,
          count: 3 + (i % 8), // 3-10
          variation: i % 101, // 0-100
        });

        expect(palette.colors.length).toBeGreaterThanOrEqual(3);
        expect(palette.colors.length).toBeLessThanOrEqual(10);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      expect(avgTime).toBeLessThan(performanceThresholds.singlePalette);

      console.log(
        `Stress test: ${iterations} palettes in ${totalTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms)`
      );
    });

    test('should maintain accuracy under stress', () => {
      const iterations = 20;
      let totalHarmonyScore = 0;
      let totalDiversityScore = 0;

      for (let i = 0; i < iterations; i++) {
        const palette = PaletteGenerator.generateHarmonyPalette({
          baseColor: '#FF0000',
          harmonyType: 'triadic',
          count: 5,
          variation: 10,
        });

        totalHarmonyScore += palette.metadata.harmonyScore;
        totalDiversityScore += palette.metadata.diversity;

        // Each palette should maintain quality
        expect(palette.metadata.harmonyScore).toBeGreaterThan(70);
        expect(palette.metadata.diversity).toBeGreaterThan(30);
      }

      const avgHarmonyScore = totalHarmonyScore / iterations;
      const avgDiversityScore = totalDiversityScore / iterations;

      console.log(
        `Stress test quality - Harmony: ${avgHarmonyScore.toFixed(1)}, Diversity: ${avgDiversityScore.toFixed(1)}`
      );

      // Average scores should be high
      expect(avgHarmonyScore).toBeGreaterThanOrEqual(80);
      expect(avgDiversityScore).toBeGreaterThan(30);
    });
  });
});
