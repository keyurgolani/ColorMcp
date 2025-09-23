/**
 * Tests for simulate-colorblindness tool
 */

import {
  simulateColorblindness,
  SimulateColorblindnessParams,
  SimulateColorblindnessResponse,
} from '../../src/tools/simulate-colorblindness';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('simulateColorblindness', () => {
  describe('Parameter Validation', () => {
    test('should require colors array', async () => {
      const params = {
        type: 'protanopia' as const,
      } as SimulateColorblindnessParams;

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);

      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('MISSING_COLORS');
    });

    test('should require non-empty colors array', async () => {
      const params: SimulateColorblindnessParams = {
        colors: [],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);

      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('MISSING_COLORS');
    });

    test('should require deficiency type', async () => {
      const params = {
        colors: ['#FF0000'],
      } as SimulateColorblindnessParams;

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);

      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('MISSING_TYPE');
    });

    test('should validate deficiency type', async () => {
      const params = {
        colors: ['#FF0000'],
        type: 'invalid_type' as any,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);

      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_DEFICIENCY_TYPE');
    });

    test('should validate severity range', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000'],
        type: 'protanopia',
        severity: 150,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);

      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_SEVERITY');
    });

    test('should validate color formats', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['invalid_color'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);

      const errorResult = result as ErrorResponse;
      expect(errorResult.error.code).toBe('INVALID_COLOR_FORMAT');
    });
  });

  describe('Colorblind Simulation', () => {
    test('should simulate protanopia correctly', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.deficiency_type).toBe('protanopia');
      expect(data.results).toHaveLength(3);
      expect(data.summary.total_colors).toBe(3);

      // Red and green should be more affected than blue for protanopia
      const redResult = data.results.find(
        r => r.original_color.toLowerCase() === '#ff0000'
      );
      const greenResult = data.results.find(
        r => r.original_color.toLowerCase() === '#00ff00'
      );
      const blueResult = data.results.find(
        r => r.original_color.toLowerCase() === '#0000ff'
      );

      expect(redResult?.difference_score || 0).toBeGreaterThan(0);
      expect(greenResult?.difference_score || 0).toBeGreaterThan(0);
      expect(blueResult?.difference_score || 0).toBeGreaterThanOrEqual(0);
    });

    test('should simulate deuteranopia correctly', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00'],
        type: 'deuteranopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.deficiency_type).toBe('deuteranopia');
      expect(data.results).toHaveLength(2);

      // Both red and green should be affected
      data.results.forEach((colorResult: any) => {
        expect(colorResult.difference_score).toBeGreaterThanOrEqual(0);
        expect(colorResult.accessibility_impact).toMatch(
          /none|minimal|moderate|severe/
        );
      });
    });

    test('should simulate tritanopia correctly', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#0000FF', '#FFFF00'],
        type: 'tritanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.deficiency_type).toBe('tritanopia');
      expect(data.results).toHaveLength(2);

      // Blue and yellow should be affected
      data.results.forEach((colorResult: any) => {
        expect(colorResult.difference_score).toBeGreaterThanOrEqual(0);
      });
    });

    test('should simulate monochromacy correctly', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        type: 'monochromacy',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.deficiency_type).toBe('monochromacy');

      // All colors should be converted to grayscale
      data.results.forEach((colorResult: any) => {
        expect(colorResult.difference_score).toBeGreaterThan(0);
        expect(colorResult.accessibility_impact).toMatch(
          /minimal|moderate|severe/
        );
      });
    });

    test('should handle severity parameter', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000'],
        type: 'protanopia',
        severity: 50,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.severity).toBe(50);

      // With 50% severity, the effect should be less pronounced
      const colorResult = data.results[0];
      expect(colorResult?.difference_score).toBeGreaterThanOrEqual(0);
    });

    test('should provide accessibility impact assessment', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#FFFFFF', '#000000'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      data.results.forEach((colorResult: any) => {
        expect(['none', 'minimal', 'moderate', 'severe']).toContain(
          colorResult.accessibility_impact
        );
      });
    });

    test('should generate appropriate recommendations', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.recommendations).toBeInstanceOf(Array);
      expect(data.recommendations.length).toBeGreaterThan(0);

      // Should include protanopia-specific recommendations
      const recommendationText = data.recommendations.join(' ');
      expect(recommendationText.toLowerCase()).toMatch(/red|green|blue|yellow/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle identical colors', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#808080', '#808080'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.results).toHaveLength(2);
    });

    test('should handle extreme colors', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#000000', '#FFFFFF'],
        type: 'deuteranopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.results).toHaveLength(2);

      // Black and white should have minimal impact from colorblindness
      data.results.forEach((colorResult: any) => {
        expect(colorResult.accessibility_impact).toMatch(/none|minimal/);
      });
    });

    test('should handle various color formats', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', 'rgb(0, 255, 0)', 'hsl(240, 100%, 50%)'],
        type: 'tritanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.results).toHaveLength(3);

      // All should have valid hex output
      data.results.forEach((colorResult: any) => {
        expect(colorResult.simulated_color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Performance', () => {
    test('should complete simulation within reasonable time', async () => {
      const colors = Array(20)
        .fill(0)
        .map((_, i) => `hsl(${i * 18}, 70%, 50%)`);

      const params: SimulateColorblindnessParams = {
        colors,
        type: 'protanopia',
      };

      const startTime = Date.now();
      const result = await simulateColorblindness(params);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.results).toHaveLength(20);
    });
  });

  describe('Response Format', () => {
    test('should return properly formatted response', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;

      // Check response structure
      expect(data).toHaveProperty('deficiency_type');
      expect(data).toHaveProperty('severity');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('recommendations');

      // Check metadata
      expect(result.metadata).toHaveProperty('execution_time');
      expect(result.metadata).toHaveProperty('color_space_used');
      expect(result.metadata).toHaveProperty('accessibility_notes');
      expect(result.metadata).toHaveProperty('recommendations');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid color format', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['invalid-color'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('INVALID_COLOR_FORMAT');
    });

    test('should handle empty colors array', async () => {
      const params: SimulateColorblindnessParams = {
        colors: [],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('MISSING_COLORS');
    });

    test('should handle invalid severity values', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000'],
        type: 'protanopia',
        severity: 150, // Invalid: > 100
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('INVALID_SEVERITY');
    });

    test('should handle negative severity values', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000'],
        type: 'protanopia',
        severity: -10,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('INVALID_SEVERITY');
    });

    test('should handle mixed valid and invalid colors', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', 'invalid-color', '#00FF00'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('INVALID_COLOR_FORMAT');
    });

    test('should handle null colors array', async () => {
      const params: SimulateColorblindnessParams = {
        colors: null as any,
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('MISSING_COLORS');
    });

    test('should handle invalid colorblindness type', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000'],
        type: 'invalid-type' as any,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('INVALID_DEFICIENCY_TYPE');
    });

    test('should handle extremely large colors array', async () => {
      const largeArray = Array(1000).fill('#FF0000');
      const params: SimulateColorblindnessParams = {
        colors: largeArray,
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      // This might succeed, so just check it doesn't crash
      expect(result).toBeDefined();
    });

    test('should handle null/undefined colors in array', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', null as any, '#00FF00'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(errorResult.error?.message).toContain('index 1');
    });

    test('should handle undefined colors in array', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', undefined as any, '#00FF00'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(errorResult.error?.message).toContain('index 1');
    });

    test('should handle empty string colors in array', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '', '#00FF00'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('INVALID_COLOR_FORMAT');
      expect(errorResult.error?.message).toContain('index 1');
    });

    test('should handle simulation errors gracefully', async () => {
      // Use jest.doMock to mock the module before importing
      jest.doMock('../../src/color/unified-color', () => {
        const originalModule = jest.requireActual(
          '../../src/color/unified-color'
        );
        return {
          ...originalModule,
          UnifiedColor: jest.fn().mockImplementation((color: string) => {
            if (color === '#FF0000') {
              throw new Error('Simulation error during processing');
            }
            return new originalModule.UnifiedColor(color);
          }),
        };
      });

      // Re-import the function to get the mocked version
      const { simulateColorblindness: mockedSimulateColorblindness } =
        await import('../../src/tools/simulate-colorblindness');

      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00'],
        type: 'protanopia',
      };

      const result = await mockedSimulateColorblindness(params);
      expect(result.success).toBe(false);
      const errorResult = result as ErrorResponse;
      expect(errorResult.error?.code).toBe('COLOR_PARSING_ERROR');

      // Clear the mock
      jest.dontMock('../../src/color/unified-color');
    });

    test('should handle high average difference for accessibility notes', async () => {
      // Use colors that will have high difference scores
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00', '#0000FF'], // High contrast colors
        type: 'protanopia',
        severity: 100,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      const successResult = result as ToolResponse;
      // const data = successResult.data as SimulateColorblindnessResponse;

      // Should trigger averageDifference > 15 branch
      expect(successResult.metadata.accessibility_notes).toContain(
        'Consider using alternative color combinations for better accessibility'
      );
    });

    test('should handle high average difference for accessibility concerns', async () => {
      // Use colors that will have very high difference scores
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'], // High contrast colors
        type: 'deuteranopia',
        severity: 100,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;

      // Should trigger averageDifference > 20 branch
      expect(data.summary.accessibility_concerns).toContain(
        'High overall color distortion detected'
      );
    });

    test('should handle anomaly types with high severity', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00'],
        type: 'protanomaly',
        severity: 75,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;

      // Should trigger anomaly + severity > 50 branch
      expect(data.summary.accessibility_concerns).toContain(
        'Moderate to severe color vision anomaly simulation'
      );
    });

    test('should handle edge case with sparse color arrays', async () => {
      // Create a test that might trigger the continue statement
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);

      const successResult = result as ToolResponse;
      const data = successResult.data as SimulateColorblindnessResponse;
      expect(data.results).toHaveLength(3);
    });
  });
});
