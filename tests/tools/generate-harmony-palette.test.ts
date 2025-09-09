/**
 * Tests for the generate_harmony_palette MCP tool
 */

import { generateHarmonyPaletteTool } from '../../src/tools/generate-harmony-palette';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('generateHarmonyPaletteTool', () => {
  test('should have correct tool definition', () => {
    expect(generateHarmonyPaletteTool.name).toBe('generate_harmony_palette');
    expect(generateHarmonyPaletteTool.description).toContain(
      'color theory harmony'
    );
    expect(generateHarmonyPaletteTool.parameters).toBeDefined();
    expect(generateHarmonyPaletteTool.handler).toBeDefined();
  });

  test('should generate complementary palette successfully', async () => {
    const params = {
      base_color: '#FF0000',
      harmony_type: 'complementary',
      count: 3,
      variation: 20,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.export_formats).toBeDefined();

    // Check palette data
    const paletteData = result.data as any;
    expect(paletteData.palette).toHaveLength(3);
    expect(paletteData.metadata.harmonyType).toBe('complementary');
    expect(paletteData.metadata.baseColor).toBe('#FF0000');
    expect(paletteData.metadata.color_count).toBe(3);

    // Check scores
    expect(paletteData.scores.diversity).toBeGreaterThanOrEqual(0);
    expect(paletteData.scores.diversity).toBeLessThanOrEqual(100);
    expect(paletteData.scores.harmony).toBeGreaterThanOrEqual(0);
    expect(paletteData.scores.harmony).toBeLessThanOrEqual(100);
    expect(paletteData.scores.accessibility).toBeGreaterThanOrEqual(0);
    expect(paletteData.scores.accessibility).toBeLessThanOrEqual(100);

    // Check relationships
    expect(paletteData.relationships).toBeDefined();
    expect(Array.isArray(paletteData.relationships)).toBe(true);

    // Check metadata
    expect(result.metadata.execution_time).toBeGreaterThan(0);
    expect(result.metadata.tool).toBe('generate_harmony_palette');
    expect(result.metadata.color_space_used).toBe('HSL');
    expect(result.metadata.timestamp).toBeDefined();
  });

  test('should generate triadic palette successfully', async () => {
    const params = {
      base_color: '#0066CC',
      harmony_type: 'triadic',
      count: 5,
      variation: 15,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);

    const paletteData = result.data as any;
    expect(paletteData.palette).toHaveLength(5);
    expect(paletteData.metadata.harmonyType).toBe('triadic');
    expect(paletteData.metadata.baseColor).toBe('#0066CC');
  });

  test('should generate monochromatic palette successfully', async () => {
    const params = {
      base_color: 'hsl(240, 100%, 50%)',
      harmony_type: 'monochromatic',
      count: 4,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);

    const paletteData = result.data as any;
    expect(paletteData.palette).toHaveLength(4);
    expect(paletteData.metadata.harmonyType).toBe('monochromatic');
  });

  test('should generate analogous palette successfully', async () => {
    const params = {
      base_color: 'rgb(255, 100, 50)',
      harmony_type: 'analogous',
      count: 6,
      variation: 25,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);

    const paletteData = result.data as any;
    expect(paletteData.palette).toHaveLength(6);
    expect(paletteData.metadata.harmonyType).toBe('analogous');
  });

  test('should generate tetradic palette successfully', async () => {
    const params = {
      base_color: 'red',
      harmony_type: 'tetradic',
      count: 4,
      variation: 10,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);

    const paletteData = result.data as any;
    expect(paletteData.palette).toHaveLength(4);
    expect(paletteData.metadata.harmonyType).toBe('tetradic');
  });

  test('should generate split-complementary palette successfully', async () => {
    const params = {
      base_color: '#33AA66',
      harmony_type: 'split_complementary',
      count: 3,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);

    const paletteData = result.data as any;
    expect(paletteData.palette).toHaveLength(3);
    expect(paletteData.metadata.harmonyType).toBe('split_complementary');
  });

  test('should generate double-complementary palette successfully', async () => {
    const params = {
      base_color: '#FF6600',
      harmony_type: 'double_complementary',
      count: 5,
      variation: 30,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);

    const paletteData = result.data as any;
    expect(paletteData.palette).toHaveLength(5);
    expect(paletteData.metadata.harmonyType).toBe('double_complementary');
  });

  test('should use default values when optional parameters not provided', async () => {
    const params = {
      base_color: '#FF0000',
      harmony_type: 'complementary',
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);

    const paletteData = result.data as any;
    expect(paletteData.palette).toHaveLength(5); // Default count
  });

  test('should include proper export formats', async () => {
    const params = {
      base_color: '#FF0000',
      harmony_type: 'complementary',
      count: 3,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);
    expect(result.export_formats).toBeDefined();

    const exportFormats = result.export_formats!;
    expect(exportFormats.css).toBeDefined();
    expect(exportFormats.scss).toBeDefined();
    expect(exportFormats.tailwind).toBeDefined();
    expect(exportFormats.json).toBeDefined();

    // Check CSS format
    expect(exportFormats.css).toContain(':root');
    expect(exportFormats.css).toContain('--color-1');

    // Check SCSS format
    expect(exportFormats.scss).toContain('$color-1');

    // Check Tailwind format
    expect(exportFormats.tailwind).toContain('module.exports');
    expect(exportFormats.tailwind).toContain('palette-1');

    // Check JSON format
    expect(exportFormats.json).toHaveProperty('colors');
    expect(exportFormats.json).toHaveProperty('metadata');
  });

  test('should include accessibility notes and recommendations', async () => {
    const params = {
      base_color: '#FFFF00', // Yellow - potentially problematic for accessibility
      harmony_type: 'monochromatic',
      count: 5,
      variation: 10,
    };

    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;

    expect(result.success).toBe(true);
    expect(result.metadata.accessibility_notes).toBeDefined();
    expect(result.metadata.recommendations).toBeDefined();
    expect(Array.isArray(result.metadata.accessibility_notes)).toBe(true);
    expect(Array.isArray(result.metadata.recommendations)).toBe(true);
  });

  test('should include harmony-specific recommendations', async () => {
    const harmonyTypes = [
      'complementary',
      'triadic',
      'analogous',
      'monochromatic',
    ];

    for (const harmonyType of harmonyTypes) {
      const params = {
        base_color: '#FF0000',
        harmony_type: harmonyType,
        count: 3,
      };

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toBeDefined();
      expect(result.metadata.recommendations!.length).toBeGreaterThan(0);
    }
  });

  test('should meet performance requirements', async () => {
    const params = {
      base_color: '#FF0000',
      harmony_type: 'triadic',
      count: 8,
      variation: 30,
    };

    const startTime = performance.now();
    const result = (await generateHarmonyPaletteTool.handler(
      params
    )) as ToolResponse;
    const endTime = performance.now();

    expect(result.success).toBe(true);

    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(500); // Should be under 500ms
    expect(result.metadata.execution_time).toBeLessThan(500);
  });

  describe('error handling', () => {
    test('should return error for missing base_color', async () => {
      const params = {
        harmony_type: 'complementary',
      };

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toContain('base_color is required');
      expect(result.error.suggestions).toBeDefined();
    });

    test('should return error for missing harmony_type', async () => {
      const params = {
        base_color: '#FF0000',
      };

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toContain('harmony_type is required');
    });

    test('should return error for invalid base_color', async () => {
      const params = {
        base_color: 'invalid-color',
        harmony_type: 'complementary',
      };

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toContain('Invalid base_color');
    });

    test('should return error for invalid harmony_type', async () => {
      const params = {
        base_color: '#FF0000',
        harmony_type: 'invalid-harmony',
      };

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toContain('Invalid harmony_type');
    });

    test('should return error for count out of range', async () => {
      const params = {
        base_color: '#FF0000',
        harmony_type: 'complementary',
        count: 2, // Too low
      };

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toContain(
        'count must be a number between 3 and 10'
      );
    });

    test('should return error for variation out of range', async () => {
      const params = {
        base_color: '#FF0000',
        harmony_type: 'complementary',
        variation: 150, // Too high
      };

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toContain(
        'variation must be a number between 0 and 100'
      );
    });

    test('should return error for non-object parameters', async () => {
      const params = 'invalid-params';

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toContain('Parameters must be an object');
    });

    test('should return error for null parameters', async () => {
      const params = null;

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_INPUT');
      expect(result.error.message).toContain('Parameters must be an object');
    });

    test('should include execution time in error response', async () => {
      const params = {
        base_color: 'invalid-color',
        harmony_type: 'complementary',
      };

      const result = (await generateHarmonyPaletteTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.metadata.execution_time).toBeGreaterThanOrEqual(0);
      expect(result.metadata.tool).toBe('generate_harmony_palette');
      expect(result.metadata.timestamp).toBeDefined();
    });
  });

  describe('parameter validation', () => {
    test('should validate all harmony types', async () => {
      const validHarmonyTypes = [
        'monochromatic',
        'analogous',
        'complementary',
        'triadic',
        'tetradic',
        'split_complementary',
        'double_complementary',
      ];

      for (const harmonyType of validHarmonyTypes) {
        const params = {
          base_color: '#FF0000',
          harmony_type: harmonyType,
        };

        const result = (await generateHarmonyPaletteTool.handler(
          params
        )) as ToolResponse;
        expect(result.success).toBe(true);
      }
    });

    test('should validate count boundaries', async () => {
      // Test minimum valid count
      const minParams = {
        base_color: '#FF0000',
        harmony_type: 'complementary',
        count: 3,
      };

      const minResult = (await generateHarmonyPaletteTool.handler(
        minParams
      )) as ToolResponse;
      expect(minResult.success).toBe(true);

      // Test maximum valid count
      const maxParams = {
        base_color: '#FF0000',
        harmony_type: 'complementary',
        count: 10,
      };

      const maxResult = (await generateHarmonyPaletteTool.handler(
        maxParams
      )) as ToolResponse;
      expect(maxResult.success).toBe(true);
    });

    test('should validate variation boundaries', async () => {
      // Test minimum valid variation
      const minParams = {
        base_color: '#FF0000',
        harmony_type: 'complementary',
        variation: 0,
      };

      const minResult = (await generateHarmonyPaletteTool.handler(
        minParams
      )) as ToolResponse;
      expect(minResult.success).toBe(true);

      // Test maximum valid variation
      const maxParams = {
        base_color: '#FF0000',
        harmony_type: 'complementary',
        variation: 100,
      };

      const maxResult = (await generateHarmonyPaletteTool.handler(
        maxParams
      )) as ToolResponse;
      expect(maxResult.success).toBe(true);
    });

    test('should handle different color input formats', async () => {
      const colorFormats = [
        '#FF0000',
        '#F00',
        'rgb(255, 0, 0)',
        'hsl(0, 100%, 50%)',
        'red',
      ];

      for (const color of colorFormats) {
        const params = {
          base_color: color,
          harmony_type: 'complementary',
        };

        const result = (await generateHarmonyPaletteTool.handler(
          params
        )) as ToolResponse;
        expect(result.success).toBe(true);
      }
    });
  });
});
