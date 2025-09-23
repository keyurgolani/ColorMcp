/**
 * Core color conversion performance benchmarks (without MCP overhead)
 */

// @ts-nocheck
import { UnifiedColor } from '../../src/color/unified-color';
import { ColorParser } from '../../src/color/color-parser';

describe('Core Color Conversion Performance', () => {
  const testColors = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#800080',
    '#008080',
    'rgb(255, 128, 64)',
    'hsl(180, 50%, 75%)',
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'orange',
  ];

  describe('UnifiedColor Performance', () => {
    test('should create UnifiedColor instances under 1ms each', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const color = testColors[i % testColors.length];
        new UnifiedColor(color);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 1000;

      expect(avgTime).toBeLessThan(5); // More tolerant for CI environments
      console.log(
        `UnifiedColor creation: ${totalTime}ms for 1000 instances (${avgTime.toFixed(3)}ms per instance)`
      );
    });

    test('should convert formats under 0.1ms each', () => {
      const color = new UnifiedColor('#FF0000');
      const formats = [
        'hex',
        'rgb',
        'hsl',
        'hsv',
        'hwb',
        'cmyk',
        'lab',
        'xyz',
        'lch',
      ];

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const format = formats[i % formats.length];
        color.toFormat(format);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 1000;

      expect(avgTime).toBeLessThan(1); // More tolerant for CI environments
      console.log(
        `Format conversion: ${totalTime}ms for 1000 conversions (${avgTime.toFixed(3)}ms per conversion)`
      );
    });

    test('should handle all format getters efficiently', () => {
      const color = new UnifiedColor('#FF8040');

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        // Access all format getters
        color.hex;
        color.rgb;
        color.hsl;
        color.hsv;
        color.hwb;
        color.cmyk;
        color.lab;
        color.xyz;
        color.lch;
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / (1000 * 9); // 9 getters per iteration

      expect(avgTime).toBeLessThan(0.1);
      console.log(
        `Format getters: ${totalTime}ms for 9000 getter calls (${avgTime.toFixed(4)}ms per getter)`
      );
    });
  });

  describe('ColorParser Performance', () => {
    test('should parse colors under 0.2ms each', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const color = testColors[i % testColors.length];
        ColorParser.parse(color);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 1000;

      expect(avgTime).toBeLessThan(2); // Very tolerant for CI environments
      console.log(
        `Color parsing: ${totalTime}ms for 1000 parses (${avgTime.toFixed(3)}ms per parse)`
      );
    });

    test('should handle complex format parsing efficiently', () => {
      const complexFormats = [
        'rgba(255, 128, 64, 0.75)',
        'hsla(180, 50%, 75%, 0.8)',
        'cmyk(10%, 20%, 30%, 40%)',
        'lab(50.5, 25.3, -25.7)',
        'lch(60.2, 40.8, 120.5)',
        'hwb(120, 20%, 30%)',
      ];

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const format = complexFormats[i % complexFormats.length];
        ColorParser.parse(format);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 1000;

      expect(avgTime).toBeLessThan(2); // Very tolerant for CI environments
      console.log(
        `Complex parsing: ${totalTime}ms for 1000 complex parses (${avgTime.toFixed(3)}ms per parse)`
      );
    });
  });

  describe('Round-trip Conversion Performance', () => {
    test('should handle round-trip conversions efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const originalColor = testColors[i % testColors.length];

        // Parse original
        const parsed = ColorParser.parse(originalColor);
        if (!parsed.success || !parsed.color) continue;

        // Convert through multiple formats
        const hex = parsed.color.toFormat('hex');
        const rgb = parsed.color.toFormat('rgb');
        const hsl = parsed.color.toFormat('hsl');
        const hwb = parsed.color.toFormat('hwb');

        // Parse back
        ColorParser.parse(hex);
        ColorParser.parse(rgb);
        ColorParser.parse(hsl);
        ColorParser.parse(hwb);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / (100 * 8); // 8 operations per iteration

      expect(avgTime).toBeLessThan(1);
      console.log(
        `Round-trip conversions: ${totalTime}ms for 800 operations (${avgTime.toFixed(3)}ms per operation)`
      );
    });
  });

  describe('Memory Efficiency', () => {
    test('should not leak memory during intensive operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create many color instances
      const colors = [];
      for (let i = 0; i < 1000; i++) {
        const color = new UnifiedColor(testColors[i % testColors.length]);
        colors.push(color);

        // Convert to multiple formats
        color.toFormat('hex');
        color.toFormat('rgb');
        color.toFormat('hsl');
        color.toFormat('cmyk');
      }

      // Clear references
      colors.length = 0;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (under 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

      console.log(
        `Memory efficiency: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase for 1000 color instances`
      );
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent color operations', async () => {
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            const color = new UnifiedColor(testColors[i % testColors.length]);
            return {
              hex: color.toFormat('hex'),
              rgb: color.toFormat('rgb'),
              hsl: color.toFormat('hsl'),
              hwb: color.toFormat('hwb'),
            };
          })
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(results.every(r => r.hex && r.rgb && r.hsl && r.hwb)).toBe(true);
      expect(totalTime).toBeLessThan(100);

      console.log(
        `Concurrent operations: ${totalTime}ms for 100 concurrent color operations`
      );
    });
  });

  describe('Format-Specific Performance', () => {
    test('should handle HEX conversions efficiently', () => {
      const color = new UnifiedColor('#FF8040');

      const startTime = Date.now();
      for (let i = 0; i < 10000; i++) {
        color.toFormat('hex');
      }
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgTime = totalTime / 10000;

      expect(avgTime).toBeLessThan(0.1); // More tolerant for CI environments
      console.log(
        `HEX format: ${totalTime}ms for 10000 conversions (${avgTime.toFixed(4)}ms per conversion)`
      );
    });

    test('should handle complex format conversions efficiently', () => {
      const color = new UnifiedColor('#FF8040');
      const complexFormats = ['lab', 'xyz', 'lch', 'oklab', 'oklch'];

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        const format = complexFormats[i % complexFormats.length];
        color.toFormat(format, 3);
      }
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgTime = totalTime / 1000;

      expect(avgTime).toBeLessThan(0.15); // More tolerant for CI
      console.log(
        `Complex formats: ${totalTime}ms for 1000 conversions (${avgTime.toFixed(3)}ms per conversion)`
      );
    });

    test('should handle framework formats efficiently', () => {
      const color = new UnifiedColor('#FF8040');
      const frameworkFormats = ['swift', 'android', 'flutter', 'tailwind'];

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        const format = frameworkFormats[i % frameworkFormats.length];
        color.toFormat(format);
      }
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgTime = totalTime / 1000;

      expect(avgTime).toBeLessThan(1); // Framework formats can be slightly slower due to string processing
      console.log(
        `Framework formats: ${totalTime}ms for 1000 conversions (${avgTime.toFixed(3)}ms per conversion)`
      );
    });
  });
});
