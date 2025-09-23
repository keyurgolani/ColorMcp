/**
 * Tests for linear gradient generation tool
 */

import { generateLinearGradientTool } from '../../src/tools/generate-linear-gradient';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('generate_linear_gradient', () => {
  describe('Basic Functionality', () => {
    test('should generate simple linear gradient with two colors', async () => {
      const params = {
        colors: ['#FF0000', '#0000FF'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('css');
      expect(result.data).toHaveProperty('type', 'linear');
      expect(result.data).toHaveProperty('angle', 90);
      expect(result.data).toHaveProperty('colors');

      const data = result.data as any;
      expect(data.css).toContain('linear-gradient(90deg');
      expect(data.css).toContain('#ff0000 0%');
      expect(data.css).toContain('#0000ff 100%');
      expect(data.colors).toHaveLength(2);
    });

    test('should generate gradient with custom angle', async () => {
      const params = {
        colors: ['red', 'blue'],
        angle: 45,
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.css).toContain('linear-gradient(45deg');
      expect(data.angle).toBe(45);
    });

    test('should generate gradient with custom positions', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        positions: [0, 30, 100],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.css).toContain('#ff0000 0%');
      expect(data.css).toContain('#00ff00 30%');
      expect(data.css).toContain('#0000ff 100%');
    });

    test('should generate gradient with multiple colors evenly distributed', async () => {
      const params = {
        colors: ['red', 'yellow', 'green', 'blue'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.colors).toHaveLength(4);
      expect(data.colors[0].position).toBe(0);
      expect(data.colors[1].position).toBeCloseTo(33.33, 1);
      expect(data.colors[2].position).toBeCloseTo(66.67, 1);
      expect(data.colors[3].position).toBe(100);
    });
  });

  describe('Color Format Support', () => {
    test('should support hex colors', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.colors[0].hex).toBe('#ff0000');
      expect(data.colors[1].hex).toBe('#00ff00');
    });

    test('should support RGB colors', async () => {
      const params = {
        colors: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.colors[0].hex).toBe('#ff0000');
      expect(data.colors[1].hex).toBe('#00ff00');
    });

    test('should support HSL colors', async () => {
      const params = {
        colors: ['hsl(0, 100%, 50%)', 'hsl(120, 100%, 50%)'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.colors[0].hex).toBe('#ff0000');
      expect(data.colors[1].hex).toBe('#00ff00');
    });

    test('should support named colors', async () => {
      const params = {
        colors: ['red', 'green', 'blue'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.colors[0].hex).toBe('#ff0000');
      expect(data.colors[1].hex).toBe('#008000');
      expect(data.colors[2].hex).toBe('#0000ff');
    });
  });

  describe('Interpolation Methods', () => {
    test('should apply linear interpolation (default)', async () => {
      const params = {
        colors: ['red', 'blue'],
        interpolation: 'linear',
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.interpolation).toBe('linear');
      expect(data.colors[0].position).toBe(0);
      expect(data.colors[1].position).toBe(100);
    });

    test('should apply ease interpolation', async () => {
      const params = {
        colors: ['red', 'yellow', 'blue'],
        interpolation: 'ease',
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.interpolation).toBe('ease');
      // First and last positions should remain unchanged
      expect(data.colors[0].position).toBe(0);
      expect(data.colors[2].position).toBe(100);
      // Middle position should be modified by easing
      expect(data.colors[1].position).not.toBe(50);
    });

    test('should apply ease_in interpolation', async () => {
      const params = {
        colors: ['red', 'yellow', 'blue'],
        interpolation: 'ease_in',
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.interpolation).toBe('ease_in');
    });

    test('should apply ease_out interpolation', async () => {
      const params = {
        colors: ['red', 'yellow', 'blue'],
        interpolation: 'ease_out',
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.interpolation).toBe('ease_out');
    });

    test('should apply bezier interpolation', async () => {
      const params = {
        colors: ['red', 'yellow', 'blue'],
        interpolation: 'bezier',
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.interpolation).toBe('bezier');
    });
  });

  describe('Stepped Gradients', () => {
    test('should generate stepped gradient', async () => {
      const params = {
        colors: ['red', 'blue'],
        steps: 5,
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.total_stops).toBe(5);
      expect(data.css).toContain('linear-gradient(90deg');
    });

    test('should handle large step counts', async () => {
      const params = {
        colors: ['red', 'blue'],
        steps: 50,
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.total_stops).toBe(50);
      expect(result.metadata.recommendations).toContain(
        'High step counts may impact performance on older devices'
      );
    });
  });

  describe('Export Formats', () => {
    test('should provide CSS export format', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats?.css).toContain('linear-gradient');
    });

    test('should provide SCSS export format', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('scss');
      expect(result.export_formats?.scss).toContain('$gradient:');
    });

    test('should provide JSON export format', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('json');
      const jsonData = result.export_formats?.json as any;
      expect(jsonData).toHaveProperty('type', 'linear');
      expect(jsonData).toHaveProperty('css');
      expect(jsonData).toHaveProperty('colors');
    });
  });

  describe('Error Handling', () => {
    test('should reject empty colors array', async () => {
      const params = {
        colors: [],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
      expect(result.error.message).toContain('colors');
    });

    test('should reject single color', async () => {
      const params = {
        colors: ['red'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject too many colors', async () => {
      const params = {
        colors: Array(25).fill('red'),
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid colors', async () => {
      const params = {
        colors: ['red', 'invalid_color'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('GRADIENT_GENERATION_ERROR');
      expect(result.error.message).toContain('Invalid colors found');
    });

    test('should reject invalid angle', async () => {
      const params = {
        colors: ['red', 'blue'],
        angle: 400,
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject mismatched positions array', async () => {
      const params = {
        colors: ['red', 'blue'],
        positions: [0, 50, 100], // 3 positions for 2 colors
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('GRADIENT_GENERATION_ERROR');
      expect(result.error.message).toContain('Position count');
    });

    test('should reject non-ascending positions', async () => {
      const params = {
        colors: ['red', 'blue'],
        positions: [50, 0], // Non-ascending
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('GRADIENT_GENERATION_ERROR');
      expect(result.error.message).toContain('ascending order');
    });

    test('should reject invalid interpolation method', async () => {
      const params = {
        colors: ['red', 'blue'],
        interpolation: 'invalid_method',
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid color space', async () => {
      const params = {
        colors: ['red', 'blue'],
        color_space: 'invalid_space',
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid step count', async () => {
      const params = {
        colors: ['red', 'blue'],
        steps: 1, // Too few steps
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject excessive step count', async () => {
      const params = {
        colors: ['red', 'blue'],
        steps: 150, // Too many steps
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Performance and Recommendations', () => {
    test('should provide recommendations for many colors', async () => {
      const params = {
        colors: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Consider using fewer colors for better performance'
      );
    });

    test('should provide recommendations for non-standard angles', async () => {
      const params = {
        colors: ['red', 'blue'],
        angle: 37, // Non-multiple of 45
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Consider using multiples of 45° for common gradient angles'
      );
    });

    test('should complete within performance requirements', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const startTime = Date.now();
      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.metadata.execution_time).toBeLessThan(1000);
    });
  });

  describe('Accessibility Features', () => {
    test('should provide accessibility notes', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toBeDefined();
      expect(result.metadata.accessibility_notes?.length).toBeGreaterThan(0);
      expect(result.metadata.accessibility_notes).toContain(
        'Ensure sufficient contrast between gradient colors and any overlaid text'
      );
    });

    test('should include color vision deficiency testing recommendation', async () => {
      const params = {
        colors: ['red', 'green'], // Problematic for colorblind users
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toContain(
        'Test gradient visibility with color vision deficiency simulators'
      );
    });
  });

  describe('Mathematical Accuracy', () => {
    test('should calculate positions with mathematical precision', async () => {
      const params = {
        colors: ['red', 'yellow', 'green', 'blue', 'purple'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;

      // Check that positions are mathematically correct for even distribution
      expect(data.colors[0].position).toBe(0);
      expect(data.colors[1].position).toBe(25);
      expect(data.colors[2].position).toBe(50);
      expect(data.colors[3].position).toBe(75);
      expect(data.colors[4].position).toBe(100);
    });

    test('should preserve exact positions when provided', async () => {
      const params = {
        colors: ['red', 'yellow', 'blue'],
        positions: [10, 60, 90],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;

      expect(data.colors[0].position).toBe(10);
      expect(data.colors[1].position).toBe(60);
      expect(data.colors[2].position).toBe(90);
    });

    test('should handle edge case angles correctly', async () => {
      const testAngles = [0, 90, 180, 270, 360];

      for (const angle of testAngles) {
        const params = {
          colors: ['red', 'blue'],
          angle,
        };

        const result = (await generateLinearGradientTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
        const data = result.data as any;
        expect(data.angle).toBe(angle);
        expect(data.css).toContain(`linear-gradient(${angle}deg`);
      }
    });

    test('should use default angle when not specified', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const result = (await generateLinearGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.angle).toBe(90); // Default angle
      expect(data.css).toContain('linear-gradient(90deg');
    });
  });
});
