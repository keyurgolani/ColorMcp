/**
 * Tests for radial gradient generation tool
 */

import { generateRadialGradientTool } from '../../src/tools/generate-radial-gradient';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('generate_radial_gradient', () => {
  describe('Basic Functionality', () => {
    test('should generate simple radial gradient with two colors', async () => {
      const params = {
        colors: ['#FF0000', '#0000FF'],
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('css');
      expect(result.data).toHaveProperty('type', 'radial');
      expect(result.data).toHaveProperty('center', [50, 50]);
      expect(result.data).toHaveProperty('shape', 'circle');
      expect(result.data).toHaveProperty('colors');

      const data = result.data as any;
      expect(data.css).toContain('radial-gradient(');
      expect(data.css).toContain('#ff0000 0%');
      expect(data.css).toContain('#0000ff 100%');
      expect(data.colors).toHaveLength(2);
    });

    test('should generate gradient with custom center', async () => {
      const params = {
        colors: ['red', 'blue'],
        center: [25, 75],
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.css).toContain('25% 75%');
      expect(data.center).toEqual([25, 75]);
    });

    test('should generate ellipse gradient', async () => {
      const params = {
        colors: ['red', 'blue'],
        shape: 'ellipse',
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.css).toContain('ellipse');
      expect(data.shape).toBe('ellipse');
    });

    test('should generate gradient with custom size', async () => {
      const params = {
        colors: ['red', 'blue'],
        size: 'closest_side',
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.css).toContain('closest-side');
      expect(data.size).toBe('closest_side');
    });

    test('should generate gradient with explicit dimensions', async () => {
      const params = {
        colors: ['red', 'blue'],
        size: 'explicit',
        dimensions: [200, 100],
        shape: 'ellipse',
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.css).toContain('100px 50px'); // Half of dimensions for ellipse
      expect(data.size).toBe('explicit');
    });

    test('should generate circle with explicit dimensions', async () => {
      const params = {
        colors: ['red', 'blue'],
        size: 'explicit',
        dimensions: [200, 300],
        shape: 'circle',
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.css).toContain('100px'); // Smaller dimension / 2 for circle
    });

    test('should generate gradient with custom positions', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        positions: [0, 30, 100],
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.css).toContain('#ff0000 0%');
      expect(data.css).toContain('#00ff00 30%');
      expect(data.css).toContain('#0000ff 100%');
    });
  });

  describe('Size Options', () => {
    const sizeOptions = [
      'closest_side',
      'closest_corner',
      'farthest_side',
      'farthest_corner',
    ];

    sizeOptions.forEach(size => {
      test(`should generate gradient with ${size} size`, async () => {
        const params = {
          colors: ['red', 'blue'],
          size,
        };

        const result = (await generateRadialGradientTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
        const data = result.data as any;
        expect(data.css).toContain(size.replace('_', '-'));
        expect(data.size).toBe(size);
      });
    });
  });

  describe('Color Format Support', () => {
    test('should support hex colors', async () => {
      const params = {
        colors: ['#FF0000', '#00FF00'],
      };

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.total_stops).toBe(5);
      expect(data.css).toContain('radial-gradient(');
    });

    test('should handle large step counts', async () => {
      const params = {
        colors: ['red', 'blue'],
        steps: 50,
      };

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats?.css).toContain('radial-gradient');
    });

    test('should provide SCSS export format', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('json');
      const jsonData = result.export_formats?.json as any;
      expect(jsonData).toHaveProperty('type', 'radial');
      expect(jsonData).toHaveProperty('css');
      expect(jsonData).toHaveProperty('colors');
    });
  });

  describe('Error Handling', () => {
    test('should reject empty colors array', async () => {
      const params = {
        colors: [],
      };

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject too many colors', async () => {
      const params = {
        colors: Array(25).fill('red'),
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid colors', async () => {
      const params = {
        colors: ['red', 'invalid_color'],
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('GRADIENT_GENERATION_ERROR');
      expect(result.error.message).toContain('Invalid colors found');
    });

    test('should reject invalid center coordinates', async () => {
      const params = {
        colors: ['red', 'blue'],
        center: [150, 50], // Out of range
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid shape', async () => {
      const params = {
        colors: ['red', 'blue'],
        shape: 'invalid_shape',
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid size', async () => {
      const params = {
        colors: ['red', 'blue'],
        size: 'invalid_size',
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should require dimensions when size is explicit', async () => {
      const params = {
        colors: ['red', 'blue'],
        size: 'explicit',
        // Missing dimensions
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject invalid dimensions', async () => {
      const params = {
        colors: ['red', 'blue'],
        size: 'explicit',
        dimensions: [0, 100], // Invalid dimension
      };

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Consider using fewer colors for better performance'
      );
    });

    test('should provide recommendations for off-center gradients', async () => {
      const params = {
        colors: ['red', 'blue'],
        center: [25, 75],
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Off-center gradients can create interesting visual effects'
      );
    });

    test('should provide recommendations for elliptical gradients with explicit dimensions', async () => {
      const params = {
        colors: ['red', 'blue'],
        shape: 'ellipse',
        size: 'explicit',
        dimensions: [200, 100],
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Elliptical gradients with explicit dimensions work well for specific aspect ratios'
      );
    });

    test('should complete within performance requirements', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const startTime = Date.now();
      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toBeDefined();
      expect(result.metadata.accessibility_notes?.length).toBeGreaterThan(0);
      expect(result.metadata.accessibility_notes).toContain(
        'Ensure sufficient contrast between gradient colors and any overlaid text'
      );
    });

    test('should include radial gradient specific accessibility note', async () => {
      const params = {
        colors: ['red', 'blue'],
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toContain(
        'Radial gradients can create focus points - use carefully for accessibility'
      );
    });

    test('should include color vision deficiency testing recommendation', async () => {
      const params = {
        colors: ['red', 'green'], // Problematic for colorblind users
      };

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
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

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;

      expect(data.colors[0].position).toBe(10);
      expect(data.colors[1].position).toBe(60);
      expect(data.colors[2].position).toBe(90);
    });

    test('should handle edge case center positions correctly', async () => {
      const testCenters = [
        [0, 0],
        [50, 50],
        [100, 100],
        [0, 100],
        [100, 0],
      ];

      for (const center of testCenters) {
        const params = {
          colors: ['red', 'blue'],
          center,
        };

        const result = (await generateRadialGradientTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
        const data = result.data as any;
        expect(data.center).toEqual(center);
        expect(data.css).toContain(`${center[0]}% ${center[1]}%`);
      }
    });

    test('should calculate explicit dimensions correctly for circles', async () => {
      const params = {
        colors: ['red', 'blue'],
        size: 'explicit',
        dimensions: [400, 200],
        shape: 'circle',
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      // Should use smaller dimension / 2 = 200 / 2 = 100px
      expect(data.css).toContain('100px');
    });

    test('should calculate explicit dimensions correctly for ellipses', async () => {
      const params = {
        colors: ['red', 'blue'],
        size: 'explicit',
        dimensions: [400, 200],
        shape: 'ellipse',
      };

      const result = (await generateRadialGradientTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const data = result.data as any;
      // Should use width/2 height/2 = 200px 100px
      expect(data.css).toContain('200px 100px');
    });
  });
});
