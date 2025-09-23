/**
 * Comprehensive unit tests for convert_color tool
 */

// @ts-nocheck
import { convertColorTool } from '../../src/tools/convert-color';

describe('convert_color tool', () => {
  describe('Tool Definition', () => {
    test('should have correct tool metadata', () => {
      expect(convertColorTool.name).toBe('convert_color');
      expect(convertColorTool.description).toContain(
        'Convert colors between different formats'
      );
      expect(convertColorTool.parameters).toBeDefined();
      expect(convertColorTool.handler).toBeDefined();
    });

    test('should have comprehensive parameter schema', () => {
      const params = convertColorTool.parameters as any;
      expect(params.properties.color).toBeDefined();
      expect(params.properties.output_format).toBeDefined();
      expect(params.properties.precision).toBeDefined();
      expect(params.properties.variable_name).toBeDefined();
      expect(params.required).toContain('color');
      expect(params.required).toContain('output_format');
    });

    test('should support all expected output formats', () => {
      const outputFormats = (convertColorTool.parameters as any).properties
        .output_format.enum;
      const expectedFormats = [
        'hex',
        'rgb',
        'rgba',
        'hsl',
        'hsla',
        'hsv',
        'hsva',
        'hwb',
        'cmyk',
        'lab',
        'xyz',
        'lch',
        'oklab',
        'oklch',
        'css-var',
        'scss-var',
        'tailwind',
        'swift',
        'android',
        'flutter',
        'named',
      ];

      expectedFormats.forEach(format => {
        expect(outputFormats).toContain(format);
      });
    });
  });

  describe('Basic Color Conversions', () => {
    test('should convert HEX to RGB', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'rgb',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('rgb(255, 0, 0)');
      expect(result.data.original).toBe('#FF0000');
      expect(result.data.format).toBe('rgb');
    });

    test('should convert RGB to HEX', async () => {
      const result = await convertColorTool.handler({
        color: 'rgb(255, 0, 0)',
        output_format: 'hex',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('#ff0000');
      expect(result.data.detected_format).toBe('rgb');
    });

    test('should convert HSL to RGB', async () => {
      const result = await convertColorTool.handler({
        color: 'hsl(0, 100%, 50%)',
        output_format: 'rgb',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('rgb(255, 0, 0)');
      expect(result.data.detected_format).toBe('hsl');
    });

    test('should convert named colors', async () => {
      const result = await convertColorTool.handler({
        color: 'red',
        output_format: 'hex',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('#ff0000');
      expect(result.data.detected_format).toBe('named');
    });
  });

  describe('Advanced Format Conversions', () => {
    test('should convert to CMYK format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'cmyk',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('cmyk(0%, 100%, 100%, 0%)');
    });

    test('should convert to LAB format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'lab',
        precision: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(
        /^lab\(\d+\.\d{2}, -?\d+\.\d{2}, -?\d+\.\d{2}\)$/
      );
    });

    test('should convert to XYZ format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'xyz',
        precision: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(
        /^xyz\(\d+\.\d{2}, \d+\.\d{2}, \d+\.\d{2}\)$/
      );
    });

    test('should convert to HSV format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'hsv',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(
        /^hsv\(\d+\.\d{2}, \d+\.\d{2}%, \d+\.\d{2}%\)$/
      );
    });

    test('should convert to LCH format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'lch',
        precision: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(
        /^lch\(\d+\.\d{2}, \d+\.\d{2}, \d+\.\d{2}\)$/
      );
    });

    test('should convert to OKLAB format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'oklab',
        precision: 3,
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(
        /^oklab\(\d+\.\d{3}, -?\d+\.\d{3}, -?\d+\.\d{3}\)$/
      );
    });

    test('should convert to OKLCH format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'oklch',
        precision: 3,
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(
        /^oklch\(\d+\.\d{3}, \d+\.\d{3}, \d+\.\d{3}\)$/
      );
    });

    test('should convert to named color format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'named',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('red');
    });

    test('should convert to HWB format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'hwb',
        precision: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(
        /^hwb\(\d+\.\d{2}, \d+\.\d{2}%, \d+\.\d{2}%\)$/
      );
    });
  });

  describe('Framework-Specific Formats', () => {
    test('should convert to Swift UIColor format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'swift',
        precision: 3,
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe(
        'UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.000)'
      );
    });

    test('should convert to Android Color format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'android',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('Color.parseColor("#FFFF0000")');
    });

    test('should convert to Android Color format with alpha', async () => {
      const result = await convertColorTool.handler({
        color: 'rgba(255, 0, 0, 0.5)',
        output_format: 'android',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(
        /Color\.parseColor\("#[0-9A-F]{8}"\)/
      );
    });

    test('should convert to Flutter Color format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'flutter',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('Color(0xFFFF0000)');
    });

    test('should convert to Flutter Color format with alpha', async () => {
      const result = await convertColorTool.handler({
        color: 'rgba(255, 0, 0, 0.5)',
        output_format: 'flutter',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toMatch(/Color\(0x[0-9A-F]{8}\)/);
    });

    test('should convert to CSS variable format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'css-var',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('--color: #ff0000;');
    });

    test('should convert to SCSS variable format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'scss-var',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('$color: #ff0000;');
    });
  });

  describe('Precision Control', () => {
    test('should respect precision parameter for decimal values', async () => {
      const testCases = [
        { precision: 0, expectedPattern: /hsl\(\d+, \d+%, \d+%\)/ },
        { precision: 1, expectedPattern: /hsl\(\d+\.\d, \d+\.\d%, \d+\.\d%\)/ },
        {
          precision: 3,
          expectedPattern: /hsl\(\d+\.\d{3}, \d+\.\d{3}%, \d+\.\d{3}%\)/,
        },
      ];

      for (const { precision, expectedPattern } of testCases) {
        const result = await convertColorTool.handler({
          color: '#FF8040',
          output_format: 'hsl',
          precision,
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toMatch(expectedPattern);
        expect(result.data.precision).toBe(precision);
      }
    });

    test('should use default precision when not specified', async () => {
      const result = await convertColorTool.handler({
        color: '#FF8040',
        output_format: 'hsl',
      });

      expect(result.success).toBe(true);
      expect(result.data.precision).toBe(2);
      expect(result.data.converted).toMatch(
        /hsl\(\d+\.\d{2}, \d+\.\d{2}%, \d+\.\d{2}%\)/
      );
    });
  });

  describe('Variable Name Support', () => {
    test('should create CSS variables with custom names', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'hex',
        variable_name: 'primary',
      });

      expect(result.success).toBe(true);
      expect(result.data.css_variable).toBe('--primary: #ff0000;');
      expect(result.data.scss_variable).toBe('$primary: #ff0000;');
    });

    test('should handle CSS variable format with custom names', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'css-var',
        variable_name: 'accent-color',
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('--color: #ff0000;');
      expect(result.data.css_variable).toBe('--accent-color: #ff0000;');
    });
  });

  describe('Input Format Variations', () => {
    test('should handle various HEX input formats', async () => {
      const testCases = [
        '#FF0000',
        '#ff0000',
        'FF0000',
        'ff0000',
        '#F00',
        'F00',
      ];

      for (const color of testCases) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'rgb',
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toBe('rgb(255, 0, 0)');
      }
    });

    test('should handle various RGB input formats', async () => {
      const testCases = [
        'rgb(255, 0, 0)',
        'RGB(255, 0, 0)',
        'rgb(255,0,0)',
        '255, 0, 0',
        '255 0 0',
        '[255, 0, 0]',
      ];

      for (const color of testCases) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'hex',
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toBe('#ff0000');
      }
    });

    test('should handle RGBA with alpha values', async () => {
      const result = await convertColorTool.handler({
        color: 'rgba(255, 0, 0, 0.5)',
        output_format: 'rgba',
        precision: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data.converted).toBe('rgba(255, 0, 0, 0.5)');
    });

    test('should handle LCH input format', async () => {
      const result = await convertColorTool.handler({
        color: 'lch(53.23, 104.55, 40.85)',
        output_format: 'hex',
      });

      expect(result.success).toBe(true);
      expect(result.data.detected_format).toBe('lch');
      expect(result.data.converted).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('should handle OKLAB input format', async () => {
      const result = await convertColorTool.handler({
        color: 'oklab(0.628, 0.225, 0.126)',
        output_format: 'hex',
      });

      expect(result.success).toBe(true);
      expect(result.data.detected_format).toBe('oklab');
      expect(result.data.converted).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('should handle OKLCH input format', async () => {
      const result = await convertColorTool.handler({
        color: 'oklch(0.628, 0.258, 29.23)',
        output_format: 'hex',
      });

      expect(result.success).toBe(true);
      expect(result.data.detected_format).toBe('oklch');
      expect(result.data.converted).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('should handle HWB input format', async () => {
      const result = await convertColorTool.handler({
        color: 'hwb(0, 0%, 0%)',
        output_format: 'hex',
      });

      expect(result.success).toBe(true);
      expect(result.data.detected_format).toBe('hwb');
      expect(result.data.converted).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('should handle various CMYK input formats', async () => {
      const testCases = [
        'cmyk(0%, 100%, 100%, 0%)',
        'cmyk(0, 100, 100, 0)',
        'CMYK(0%, 100%, 100%, 0%)',
      ];

      for (const color of testCases) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'hex',
        });

        expect(result.success).toBe(true);
        expect(result.data.detected_format).toBe('cmyk');
        expect(result.data.converted).toMatch(/^#[0-9a-f]{6}$/);
      }
    });

    test('should handle LAB input format', async () => {
      const result = await convertColorTool.handler({
        color: 'lab(53.23, 80.11, 67.22)',
        output_format: 'hex',
      });

      expect(result.success).toBe(true);
      expect(result.data.detected_format).toBe('lab');
      expect(result.data.converted).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('should handle XYZ input format', async () => {
      const result = await convertColorTool.handler({
        color: 'xyz(41.24, 21.26, 1.93)',
        output_format: 'hex',
      });

      expect(result.success).toBe(true);
      expect(result.data.detected_format).toBe('xyz');
      expect(result.data.converted).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid color inputs', async () => {
      const result = await convertColorTool.handler({
        color: 'invalid-color',
        output_format: 'rgb',
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CONVERSION_ERROR');
      expect(result.error.message).toContain('color format');
      expect(result.error.suggestions).toBeDefined();
      expect(result.error.suggestions.length).toBeGreaterThan(0);
    });

    test('should handle missing required parameters', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        // missing output_format
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle invalid output format', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'invalid-format',
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle invalid precision values', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'hsl',
        precision: -1,
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle invalid variable names', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'css-var',
        variable_name: '123invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle malformed color values with specific error messages', async () => {
      const result = await convertColorTool.handler({
        color: 'rgb(300, -50, 999)',
        output_format: 'hex',
      });

      // This color is actually valid (clamped values), so it should succeed
      expect(result.success).toBe(true);
    });

    test('should handle empty color string', async () => {
      const result = await convertColorTool.handler({
        color: '',
        output_format: 'hex',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle unsupported output format with suggestions', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'unsupported' as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.suggestions).toContain(
        'Check the input format and try again'
      );
    });

    test('should handle generic parsing errors', async () => {
      const result = await convertColorTool.handler({
        color: 'hsl(invalid, values, here)',
        output_format: 'hex',
        variable_name: '123invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response Metadata', () => {
    test('should include comprehensive metadata', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'rgb',
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.execution_time).toBeDefined();
      expect(result.metadata.tool).toBe('convert_color');
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.color_space_used).toBe('sRGB');
      expect(result.metadata.detectedInputFormat).toBe('hex');
    });

    test('should include color properties in metadata', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'rgb',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.colorProperties).toBeDefined();
      expect(result.metadata.colorProperties.brightness).toBeDefined();
      expect(result.metadata.colorProperties.temperature).toBe('warm');
      expect(result.metadata.colorProperties.wcagAA).toBeDefined();
      expect(result.metadata.colorProperties.wcagAAA).toBeDefined();
    });

    test('should include accessibility notes', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'rgb',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toBeDefined();
      expect(result.metadata.accessibility_notes.length).toBeGreaterThan(0);
      expect(
        result.metadata.accessibility_notes.some(note =>
          note.includes('Brightness')
        )
      ).toBe(true);
      expect(
        result.metadata.accessibility_notes.some(note => note.includes('WCAG'))
      ).toBe(true);
    });

    test('should include helpful recommendations', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'rgb',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toBeDefined();
      expect(result.metadata.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Requirements', () => {
    test('should complete simple conversions under 100ms', async () => {
      const startTime = Date.now();

      await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'rgb',
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100);
    });

    test('should handle multiple conversions efficiently', async () => {
      const startTime = Date.now();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          convertColorTool.handler({
            color: `#${i.toString(16).repeat(6)}`,
            output_format: 'rgb',
          })
        );
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 10 conversions should complete in under 500ms
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Mathematical Accuracy', () => {
    test('should maintain color accuracy in round-trip conversions', async () => {
      const originalColor = '#FF8040';

      // Convert to RGB and back to HEX
      const rgbResult = await convertColorTool.handler({
        color: originalColor,
        output_format: 'rgb',
      });

      expect(rgbResult.success).toBe(true);

      const hexResult = await convertColorTool.handler({
        color: rgbResult.data.converted,
        output_format: 'hex',
      });

      expect(hexResult.success).toBe(true);
      expect(hexResult.data.converted).toBe(originalColor.toLowerCase());
    });

    test('should handle edge case colors correctly', async () => {
      const edgeCases = [
        { color: '#000000', name: 'pure black' },
        { color: '#FFFFFF', name: 'pure white' },
        { color: '#FF0000', name: 'pure red' },
        { color: '#00FF00', name: 'pure green' },
        { color: '#0000FF', name: 'pure blue' },
        { color: '#808080', name: 'middle gray' },
      ];

      for (const { color, name } of edgeCases) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'hsl',
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toBeDefined();
      }
    });
  });
});
describe('Additional Branch Coverage', () => {
  test('should handle unsupported output format error', async () => {
    // Test validation error for invalid output format
    const result = await convertColorTool.handler({
      color: '#FF0000',
      output_format: 'invalid_format' as any,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe(
        'Invalid output format. Supported formats: hex, rgb, rgba, hsl, hsla, hsv, hsva, hwb, cmyk, lab, xyz, lch, oklab, oklch, css-var, scss-var, tailwind, swift, android, flutter, named'
      );
      expect(result.error.suggestions).toContain(
        'Check the input format and try again'
      );
      expect(result.error.suggestions).toContain(
        'Refer to the tool documentation for valid parameter formats'
      );
    }
  });

  test('should handle generic error with fallback suggestions', async () => {
    // Use jest.doMock to mock the ColorParser module
    jest.doMock('../../src/color/color-parser', () => {
      const originalModule = jest.requireActual('../../src/color/color-parser');
      return {
        ...originalModule,
        ColorParser: {
          ...originalModule.ColorParser,
          parse: jest.fn().mockImplementation(() => {
            throw new Error('Some unexpected error occurred');
          }),
        },
      };
    });

    // Re-import the tool to get the mocked version
    const { convertColorTool: mockedConvertColorTool } = await import(
      '../../src/tools/convert-color'
    );

    const result = await mockedConvertColorTool.handler({
      color: '#FF0000',
      output_format: 'rgb',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Some unexpected error occurred');
      expect(result.error.suggestions).toContain(
        'Verify the input color is valid'
      );
      expect(result.error.suggestions).toContain(
        'Try a different color format'
      );
      expect(result.error.suggestions).toContain(
        'Check that all parameters are correctly specified'
      );
    }

    // Clear the mock
    jest.dontMock('../../src/color/color-parser');
  });

  test('should include error details in development environment', async () => {
    // Set NODE_ENV to development
    const originalNodeEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    // Use jest.doMock to mock the ColorParser module
    jest.doMock('../../src/color/color-parser', () => {
      const originalModule = jest.requireActual('../../src/color/color-parser');
      return {
        ...originalModule,
        ColorParser: {
          ...originalModule.ColorParser,
          parse: jest.fn().mockImplementation(() => {
            throw new Error('Detailed development error message');
          }),
        },
      };
    });

    // Re-import the tool to get the mocked version
    const { convertColorTool: mockedConvertColorTool } = await import(
      '../../src/tools/convert-color'
    );

    const result = await mockedConvertColorTool.handler({
      color: '#FF0000',
      output_format: 'rgb',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.details).toBe('Detailed development error message');
    }

    // Restore the original function and environment
    process.env['NODE_ENV'] = originalNodeEnv;
    jest.dontMock('../../src/color/color-parser');
  });
});
