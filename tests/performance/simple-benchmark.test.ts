/**
 * Simple performance benchmark for color conversion
 */

import { convertColorTool } from '../../src/tools/convert-color';

describe('Simple Performance Benchmark', () => {
  test('should complete simple conversions under 100ms', async () => {
    const testCases = [
      { color: '#FF0000', output_format: 'rgb' },
      { color: 'rgb(255, 0, 0)', output_format: 'hex' },
      { color: 'hsl(0, 100%, 50%)', output_format: 'hsv' },
      { color: '#00FF00', output_format: 'cmyk' },
    ];

    for (const testCase of testCases) {
      const startTime = performance.now();

      const result = await convertColorTool.handler(testCase);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(100); // Under 100ms requirement
    }
  });

  test('should handle 10 concurrent conversions efficiently', async () => {
    const startTime = performance.now();

    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        convertColorTool.handler({
          color: '#FF0000',
          output_format: 'rgb',
        })
      );
    }

    const results = await Promise.all(promises);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    expect(results.every(r => r.success)).toBe(true);
    expect(totalTime).toBeLessThan(500); // Under 500ms for 10 conversions
  });

  test('should convert between all major formats quickly', async () => {
    const formats = ['hex', 'rgb', 'hsl', 'hsv', 'cmyk'];
    const baseColor = '#FF8040';

    const startTime = performance.now();

    for (const format of formats) {
      const result = await convertColorTool.handler({
        color: baseColor,
        output_format: format as any,
      });
      expect(result.success).toBe(true);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // 5 conversions should complete in under 250ms
    expect(totalTime).toBeLessThan(250);
  });
});
