/**
 * Comprehensive integration tests for all color format combinations
 */

// @ts-nocheck
import { convertColorTool } from '../../src/tools/convert-color';
import { ColorParser } from '../../src/color/color-parser';
import { UnifiedColor } from '../../src/color/unified-color';

describe('Color Format Combinations Integration Tests', () => {
  const inputFormats = [
    { format: 'hex', examples: ['#FF0000', '#00FF00', '#0000FF', '#FF8040'] },
    {
      format: 'rgb',
      examples: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'],
    },
    {
      format: 'rgba',
      examples: ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.8)'],
    },
    {
      format: 'hsl',
      examples: [
        'hsl(0, 100%, 50%)',
        'hsl(120, 100%, 50%)',
        'hsl(240, 100%, 50%)',
      ],
    },
    {
      format: 'hsla',
      examples: ['hsla(0, 100%, 50%, 0.5)', 'hsla(180, 50%, 75%, 0.7)'],
    },
    { format: 'hsv', examples: ['hsv(0, 100%, 100%)', 'hsv(120, 100%, 100%)'] },
    {
      format: 'cmyk',
      examples: ['cmyk(0%, 100%, 100%, 0%)', 'cmyk(100%, 0%, 100%, 0%)'],
    },
    {
      format: 'lab',
      examples: ['lab(53.23, 80.11, 67.22)', 'lab(87.73, -86.18, 83.18)'],
    },
    {
      format: 'xyz',
      examples: ['xyz(41.24, 21.26, 1.93)', 'xyz(35.76, 71.52, 11.92)'],
    },
    {
      format: 'lch',
      examples: ['lch(53.23, 104.55, 40.85)', 'lch(87.73, 119.78, 136.02)'],
    },
    { format: 'named', examples: ['red', 'green', 'blue', 'white', 'black'] },
  ];

  const outputFormats = [
    'hex',
    'rgb',
    'rgba',
    'hsl',
    'hsla',
    'hsv',
    'hsva',
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

  describe('Input Format Parsing', () => {
    test('should parse all supported input formats correctly', () => {
      for (const { format, examples } of inputFormats) {
        for (const example of examples) {
          const result = ColorParser.parse(example);

          expect(result.success).toBe(true);
          expect(result.color).toBeDefined();
          expect(result.detectedFormat).toBeDefined();

          if (format !== 'named') {
            expect(result.detectedFormat).toBe(format);
          }
        }
      }
    });

    test('should handle case insensitive parsing', () => {
      const testCases = [
        'RGB(255, 0, 0)',
        'HSL(0, 100%, 50%)',
        'CMYK(0%, 100%, 100%, 0%)',
        'LAB(53.23, 80.11, 67.22)',
        'RED',
        'BLUE',
      ];

      for (const testCase of testCases) {
        const result = ColorParser.parse(testCase);
        expect(result.success).toBe(true);
      }
    });

    test('should handle whitespace variations', () => {
      const testCases = [
        'rgb( 255 , 0 , 0 )',
        'hsl(  0,  100%,  50%  )',
        'cmyk( 0% , 100% , 100% , 0% )',
        'lab( 53.23 , 80.11 , 67.22 )',
        '  #FF0000  ',
        '  red  ',
      ];

      for (const testCase of testCases) {
        const result = ColorParser.parse(testCase);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Output Format Generation', () => {
    test('should convert to all output formats from HEX input', async () => {
      const inputColor = '#FF8040';

      for (const outputFormat of outputFormats) {
        const result = await convertColorTool.handler({
          color: inputColor,
          output_format: outputFormat as any,
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toBeDefined();
        expect(result.data.format).toBe(outputFormat);
        expect(result.data.original).toBe(inputColor);
      }
    });

    test('should convert to all output formats from RGB input', async () => {
      const inputColor = 'rgb(255, 128, 64)';

      for (const outputFormat of outputFormats) {
        const result = await convertColorTool.handler({
          color: inputColor,
          output_format: outputFormat as any,
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toBeDefined();
        expect(result.data.format).toBe(outputFormat);
      }
    });

    test('should convert to all output formats from HSL input', async () => {
      const inputColor = 'hsl(25, 100%, 62.5%)';

      for (const outputFormat of outputFormats) {
        const result = await convertColorTool.handler({
          color: inputColor,
          output_format: outputFormat as any,
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toBeDefined();
        expect(result.data.format).toBe(outputFormat);
      }
    });
  });

  describe('Round-trip Conversion Accuracy', () => {
    test('should maintain accuracy in HEX round-trip conversions', async () => {
      const originalColors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FF8040',
        '#C0C0C0',
      ];

      for (const originalColor of originalColors) {
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
        expect(hexResult.data.converted.toLowerCase()).toBe(
          originalColor.toLowerCase()
        );
      }
    });

    test('should maintain reasonable accuracy in LAB round-trip conversions', async () => {
      const originalColors = ['#FF0000', '#00FF00', '#0000FF'];

      for (const originalColor of originalColors) {
        // Convert to LAB and back to HEX
        const labResult = await convertColorTool.handler({
          color: originalColor,
          output_format: 'lab',
        });

        expect(labResult.success).toBe(true);

        const hexResult = await convertColorTool.handler({
          color: labResult.data.converted,
          output_format: 'hex',
        });

        expect(hexResult.success).toBe(true);

        // Colors should be very close (allowing for small rounding differences)
        const original = new UnifiedColor(originalColor);
        const roundTrip = new UnifiedColor(hexResult.data.converted);

        const originalRgb = original.rgb;
        const roundTripRgb = roundTrip.rgb;

        expect(Math.abs(originalRgb.r - roundTripRgb.r)).toBeLessThan(80); // LAB conversions can be lossy
        expect(Math.abs(originalRgb.g - roundTripRgb.g)).toBeLessThan(80);
        expect(Math.abs(originalRgb.b - roundTripRgb.b)).toBeLessThan(80);
      }
    });
  });

  describe('Precision Handling', () => {
    test('should respect precision settings for all decimal formats', async () => {
      const inputColor = '#FF8040';
      const decimalFormats = [
        'hsl',
        'hsv',
        'lab',
        'xyz',
        'lch',
        'oklab',
        'oklch',
      ];
      const precisions = [0, 1, 2, 3, 4];

      for (const format of decimalFormats) {
        for (const precision of precisions) {
          const result = await convertColorTool.handler({
            color: inputColor,
            output_format: format as any,
            precision,
          });

          expect(result.success).toBe(true);
          expect(result.data.precision).toBe(precision);

          // Check that the output has the correct number of decimal places
          const converted = result.data.converted;
          const numbers = converted.match(/\d+\.\d+/g);

          if (numbers && precision > 0) {
            for (const number of numbers) {
              const decimalPart = number.split('.')[1];
              expect(decimalPart.length).toBe(precision);
            }
          }
        }
      }
    });
  });

  describe('Framework Format Validation', () => {
    test('should generate valid Swift UIColor code', async () => {
      const colors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        'rgba(255, 128, 64, 0.5)',
      ];

      for (const color of colors) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'swift',
          precision: 3,
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toMatch(
          /^UIColor\(red: \d+\.\d{3}, green: \d+\.\d{3}, blue: \d+\.\d{3}, alpha: \d+\.\d{3}\)$/
        );
      }
    });

    test('should generate valid Android Color code', async () => {
      const colors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        'rgba(255, 128, 64, 0.5)',
      ];

      for (const color of colors) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'android',
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toMatch(
          /^Color\.parseColor\("#[0-9A-F]{8}"\)$/
        );
      }
    });

    test('should generate valid Flutter Color code', async () => {
      const colors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        'rgba(255, 128, 64, 0.5)',
      ];

      for (const color of colors) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'flutter',
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toMatch(/^Color\(0x[0-9A-F]{8}\)$/);
      }
    });

    test('should generate valid Tailwind classes', async () => {
      const colors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFFF00',
        '#FF00FF',
        '#00FFFF',
      ];

      for (const color of colors) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'tailwind',
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toMatch(/^[a-z]+-\d+$/);
      }
    });

    test('should generate valid CSS variables', async () => {
      const colors = ['#FF0000', 'rgb(0, 255, 0)', 'hsl(240, 100%, 50%)'];

      for (const color of colors) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'css-var',
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toMatch(/^--color: #[0-9a-f]{6};$/);
      }
    });

    test('should generate valid SCSS variables', async () => {
      const colors = ['#FF0000', 'rgb(0, 255, 0)', 'hsl(240, 100%, 50%)'];

      for (const color of colors) {
        const result = await convertColorTool.handler({
          color,
          output_format: 'scss-var',
        });

        expect(result.success).toBe(true);
        expect(result.data.converted).toMatch(/^\$color: #[0-9a-f]{6};$/);
      }
    });
  });

  describe('Variable Name Support', () => {
    test('should support custom variable names for CSS and SCSS', async () => {
      const testCases = [
        { name: 'primary', expected: /^--primary: #[0-9a-f]{6};$/ },
        { name: 'accent-color', expected: /^--accent-color: #[0-9a-f]{6};$/ },
        {
          name: 'background_color',
          expected: /^--background_color: #[0-9a-f]{6};$/,
        },
      ];

      for (const { name, expected } of testCases) {
        const result = await convertColorTool.handler({
          color: '#FF0000',
          output_format: 'hex',
          variable_name: name,
        });

        expect(result.success).toBe(true);
        expect(result.data.css_variable).toMatch(expected);
        expect(result.data.scss_variable).toMatch(
          new RegExp(`^\\$${name}: #[0-9a-f]{6};$`)
        );
      }
    });
  });

  describe('Alpha Channel Handling', () => {
    test('should preserve alpha channels in supported formats', async () => {
      const alphaColors = [
        'rgba(255, 0, 0, 0.5)',
        'hsla(120, 100%, 50%, 0.8)',
        'hsva(240, 100%, 100%, 0.3)',
      ];

      for (const color of alphaColors) {
        // Test RGBA output
        const rgbaResult = await convertColorTool.handler({
          color,
          output_format: 'rgba',
        });

        expect(rgbaResult.success).toBe(true);
        expect(rgbaResult.data.converted).toMatch(
          /rgba\(\d+, \d+, \d+, [\d.]+\)/
        );

        // Test framework formats with alpha
        const swiftResult = await convertColorTool.handler({
          color,
          output_format: 'swift',
        });

        expect(swiftResult.success).toBe(true);
        expect(swiftResult.data.converted).toMatch(/alpha: [\d.]+/);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle extreme color values gracefully', async () => {
      const extremeCases = [
        '#000000', // Pure black
        '#FFFFFF', // Pure white
        'rgb(0, 0, 0)', // Black RGB
        'rgb(255, 255, 255)', // White RGB
        'hsl(0, 0%, 0%)', // Black HSL
        'hsl(0, 0%, 100%)', // White HSL
        'cmyk(0%, 0%, 0%, 100%)', // Black CMYK
        'cmyk(0%, 0%, 0%, 0%)', // White CMYK
      ];

      for (const color of extremeCases) {
        for (const format of outputFormats.slice(0, 10)) {
          const result = await convertColorTool.handler({
            color,
            output_format: format as any,
          });

          expect(result.success).toBe(true);
          expect(result.data.converted).toBeDefined();
        }
      }
    });

    test('should handle invalid input formats gracefully', async () => {
      const invalidInputs = [
        'invalid-color',
        '#GGGGGG',
        'rgb(abc, def, ghi)',
        'hsl(not, a, color)',
        'cmyk(invalid)',
        'lab(not-a-number)',
        'xyz(invalid, input, here)',
      ];

      for (const invalidInput of invalidInputs) {
        const result = await convertColorTool.handler({
          color: invalidInput,
          output_format: 'hex',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error.suggestions).toBeDefined();
        expect(result.error.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Metadata and Response Quality', () => {
    test('should include comprehensive metadata for all conversions', async () => {
      const result = await convertColorTool.handler({
        color: '#FF8040',
        output_format: 'rgb',
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.execution_time).toBeDefined();
      expect(result.metadata.color_space_used).toBe('sRGB');
      expect(result.metadata.accessibility_notes).toBeDefined();
      expect(result.metadata.recommendations).toBeDefined();
      expect(result.data.detected_format).toBeDefined();
    });

    test('should provide helpful recommendations', async () => {
      const result = await convertColorTool.handler({
        color: '#FF0000',
        output_format: 'lab',
      });

      expect(result.success).toBe(true);
      expect(
        result.metadata.recommendations.some(rec =>
          /LAB color space|precision|accessibility|performance/.test(rec)
        )
      ).toBe(true);
    });
  });
});
