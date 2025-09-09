/**
 * Tests for simulate-colorblindness tool
 */

import { simulateColorblindness, SimulateColorblindnessParams, SimulateColorblindnessResponse } from '../../src/tools/simulate-colorblindness';

describe('simulateColorblindness', () => {
  describe('Parameter Validation', () => {
    test('should require colors array', async () => {
      const params = {
        type: 'protanopia' as const,
      } as SimulateColorblindnessParams;

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_COLORS');
      }
    });

    test('should require non-empty colors array', async () => {
      const params: SimulateColorblindnessParams = {
        colors: [],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_COLORS');
      }
    });

    test('should require deficiency type', async () => {
      const params = {
        colors: ['#FF0000'],
      } as SimulateColorblindnessParams;

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_TYPE');
      }
    });

    test('should validate deficiency type', async () => {
      const params = {
        colors: ['#FF0000'],
        type: 'invalid_type' as any,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_DEFICIENCY_TYPE');
      }
    });

    test('should validate severity range', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000'],
        type: 'protanopia',
        severity: 150,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_SEVERITY');
      }
    });

    test('should validate color formats', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['invalid_color'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_COLOR_FORMAT');
      }
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
      
      if (result.success) {
        const data = result.data as SimulateColorblindnessResponse;
        expect(data.deficiency_type).toBe('protanopia');
        expect(data.results).toHaveLength(3);
        expect(data.summary.total_colors).toBe(3);
        
        // Red and green should be more affected than blue for protanopia
        const redResult = data.results[0];
        const greenResult = data.results[1];
        const blueResult = data.results[2];
        
        expect(redResult.difference_score).toBeGreaterThan(0);
        expect(greenResult.difference_score).toBeGreaterThan(0);
        expect(blueResult.difference_score).toBeGreaterThanOrEqual(0);
      }
    });

    test('should simulate deuteranopia correctly', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00'],
        type: 'deuteranopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.deficiency_type).toBe('deuteranopia');
        expect(result.data.results).toHaveLength(2);
        
        // Both red and green should be affected
        result.data.results.forEach(colorResult => {
          expect(colorResult.difference_score).toBeGreaterThanOrEqual(0);
          expect(colorResult.accessibility_impact).toMatch(/none|minimal|moderate|severe/);
        });
      }
    });

    test('should simulate tritanopia correctly', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#0000FF', '#FFFF00'],
        type: 'tritanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.deficiency_type).toBe('tritanopia');
        expect(result.data.results).toHaveLength(2);
        
        // Blue and yellow should be affected
        result.data.results.forEach(colorResult => {
          expect(colorResult.difference_score).toBeGreaterThanOrEqual(0);
        });
      }
    });

    test('should simulate monochromacy correctly', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        type: 'monochromacy',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.deficiency_type).toBe('monochromacy');
        
        // All colors should be converted to grayscale
        result.data.results.forEach(colorResult => {
          expect(colorResult.difference_score).toBeGreaterThan(0);
          expect(colorResult.accessibility_impact).toMatch(/minimal|moderate|severe/);
        });
      }
    });

    test('should handle severity parameter', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000'],
        type: 'protanopia',
        severity: 50,
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.severity).toBe(50);
        
        // With 50% severity, the effect should be less pronounced
        const colorResult = result.data.results[0];
        expect(colorResult.difference_score).toBeGreaterThanOrEqual(0);
      }
    });

    test('should provide accessibility impact assessment', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#FFFFFF', '#000000'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        result.data.results.forEach(colorResult => {
          expect(['none', 'minimal', 'moderate', 'severe']).toContain(colorResult.accessibility_impact);
        });
      }
    });

    test('should generate appropriate recommendations', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', '#00FF00'],
        type: 'protanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.recommendations).toBeInstanceOf(Array);
        expect(result.data.recommendations.length).toBeGreaterThan(0);
        
        // Should include protanopia-specific recommendations
        const recommendationText = result.data.recommendations.join(' ');
        expect(recommendationText.toLowerCase()).toMatch(/red|green|blue|yellow/);
      }
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
      
      if (result.success) {
        expect(result.data.results).toHaveLength(2);
      }
    });

    test('should handle extreme colors', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#000000', '#FFFFFF'],
        type: 'deuteranopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.results).toHaveLength(2);
        
        // Black and white should have minimal impact from colorblindness
        result.data.results.forEach(colorResult => {
          expect(colorResult.accessibility_impact).toMatch(/none|minimal/);
        });
      }
    });

    test('should handle various color formats', async () => {
      const params: SimulateColorblindnessParams = {
        colors: ['#FF0000', 'rgb(0, 255, 0)', 'hsl(240, 100%, 50%)'],
        type: 'tritanopia',
      };

      const result = await simulateColorblindness(params);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.results).toHaveLength(3);
        
        // All should have valid hex output
        result.data.results.forEach(colorResult => {
          expect(colorResult.simulated_color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      }
    });
  });

  describe('Performance', () => {
    test('should complete simulation within reasonable time', async () => {
      const colors = Array(20).fill(0).map((_, i) => `hsl(${i * 18}, 70%, 50%)`);
      
      const params: SimulateColorblindnessParams = {
        colors,
        type: 'protanopia',
      };

      const startTime = Date.now();
      const result = await simulateColorblindness(params);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      if (result.success) {
        expect(result.data.results).toHaveLength(20);
      }
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
      
      if (result.success) {
        // Check response structure
        expect(result.data).toHaveProperty('deficiency_type');
        expect(result.data).toHaveProperty('severity');
        expect(result.data).toHaveProperty('results');
        expect(result.data).toHaveProperty('summary');
        expect(result.data).toHaveProperty('recommendations');
        
        // Check metadata
        expect(result.metadata).toHaveProperty('execution_time');
        expect(result.metadata).toHaveProperty('colorSpaceUsed');
        expect(result.metadata).toHaveProperty('accessibilityNotes');
        expect(result.metadata).toHaveProperty('recommendations');
      }
    });
  });
});