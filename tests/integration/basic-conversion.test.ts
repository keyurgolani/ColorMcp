/**
 * Basic integration test for color conversion functionality
 */

import { convertColorTool } from '../../src/tools/convert-color';

describe('Basic Color Conversion Integration', () => {
  test('should convert HEX to RGB successfully', async () => {
    const result = await convertColorTool.handler({
      color: '#FF0000',
      output_format: 'rgb',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('object');
    }
  });

  test('should convert RGB to HEX successfully', async () => {
    const result = await convertColorTool.handler({
      color: 'rgb(255, 0, 0)',
      output_format: 'hex',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
    }
  });

  test('should handle invalid color input gracefully', async () => {
    const result = await convertColorTool.handler({
      color: 'invalid-color',
      output_format: 'rgb',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect('error' in result).toBe(true);
      expect((result as any).error).toBeDefined();
      expect((result as any).error.code).toBeDefined();
      expect((result as any).error.message).toBeDefined();
    }
  });

  test('should handle missing parameters gracefully', async () => {
    const result = await convertColorTool.handler({
      color: '#FF0000',
      // missing output_format
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect('error' in result).toBe(true);
      expect((result as any).error).toBeDefined();
      expect((result as any).error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('should complete conversions within performance requirements', async () => {
    const startTime = Date.now();

    const result = await convertColorTool.handler({
      color: '#FF0000',
      output_format: 'rgb',
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    expect(result.success).toBe(true);
    expect(executionTime).toBeLessThan(100); // Under 100ms requirement
  });

  test('should support precision parameter', async () => {
    const result = await convertColorTool.handler({
      color: '#FF8040',
      output_format: 'hsl',
      precision: 3,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
    }
  });

  test('should support variable name parameter', async () => {
    const result = await convertColorTool.handler({
      color: '#FF0000',
      output_format: 'hex',
      variable_name: 'primary',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
    }
  });
});
