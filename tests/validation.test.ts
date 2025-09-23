/**
 * Tests for input validation schemas
 */

import {
  validateInput,
  convertColorSchema,
  analyzeColorSchema,
  colorSchema,
  outputFormatSchema,
  precisionSchema,
  createValidationError,
} from '../src/validation/schemas';

describe('Input Validation', () => {
  describe('colorSchema', () => {
    it('should validate HEX colors', () => {
      const validHexColors = [
        '#FF0000',
        '#ff0000',
        '#F00',
        '#f00',
        'FF0000',
        'F00',
      ];

      validHexColors.forEach(color => {
        const { error } = colorSchema.validate(color);
        expect(error).toBeUndefined();
      });
    });

    it('should validate RGB colors', () => {
      const validRgbColors = [
        'rgb(255, 0, 0)',
        'rgb(0,255,0)',
        'rgb( 0 , 0 , 255 )',
      ];

      validRgbColors.forEach(color => {
        const { error } = colorSchema.validate(color);
        expect(error).toBeUndefined();
      });
    });

    it('should validate HSL colors', () => {
      const validHslColors = [
        'hsl(0, 100%, 50%)',
        'hsl(120,100%,50%)',
        'hsl( 240 , 100% , 50% )',
      ];

      validHslColors.forEach(color => {
        const { error } = colorSchema.validate(color);
        expect(error).toBeUndefined();
      });
    });

    it('should validate named colors', () => {
      const validNamedColors = [
        'red',
        'green',
        'blue',
        'yellow',
        'orange',
        'purple',
        'black',
        'white',
        'gray',
        'cyan',
        'magenta',
      ];

      validNamedColors.forEach(color => {
        const { error } = colorSchema.validate(color);
        expect(error).toBeUndefined();
      });
    });

    it('should reject empty colors', () => {
      const invalidInputs = [
        '',
        '   ', // whitespace only
      ];

      invalidInputs.forEach(color => {
        const { error } = colorSchema.validate(color);
        expect(error).toBeDefined();
      });
    });

    it('should accept non-empty strings (format validation happens in parser)', () => {
      const inputs = [
        '#GG0000', // Invalid hex - but schema allows it
        'invalid-color', // Invalid format - but schema allows it
        '#FF0000', // Valid hex
        'rgb(255,0,0)', // Valid rgb
      ];

      inputs.forEach(color => {
        const { error } = colorSchema.validate(color);
        expect(error).toBeUndefined(); // Schema only checks for non-empty string
      });
    });
  });

  describe('outputFormatSchema', () => {
    it('should validate supported output formats', () => {
      const validFormats = [
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
        'css-var',
        'scss-var',
        'tailwind',
        'swift',
        'android',
        'flutter',
      ];

      validFormats.forEach(format => {
        const { error } = outputFormatSchema.validate(format);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid output formats', () => {
      const invalidFormats = ['invalid', 'RGB', 'HEX', '', 123];

      invalidFormats.forEach(format => {
        const { error } = outputFormatSchema.validate(format);
        expect(error).toBeDefined();
      });
    });
  });

  describe('precisionSchema', () => {
    it('should validate precision values', () => {
      const validPrecisions = [0, 1, 2, 5, 10];

      validPrecisions.forEach(precision => {
        const { error } = precisionSchema.validate(precision);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid precision values', () => {
      const invalidPrecisions = [-1, 11, 1.5, 'invalid'];

      invalidPrecisions.forEach(precision => {
        const { error } = precisionSchema.validate(precision);
        expect(error).toBeDefined();
      });
    });

    it('should use default precision', () => {
      const { value } = precisionSchema.validate(undefined);
      expect(value).toBe(2);
    });
  });

  describe('convertColorSchema', () => {
    it('should validate complete convert color parameters', () => {
      const validParams = {
        color: '#FF0000',
        output_format: 'rgb',
        precision: 2,
      };

      const validation = validateInput(convertColorSchema, validParams);
      expect(validation.isValid).toBe(true);
      expect(validation.value).toEqual(validParams);
    });

    it('should validate without optional precision', () => {
      const validParams = {
        color: '#FF0000',
        output_format: 'rgb',
      };

      const validation = validateInput(convertColorSchema, validParams);
      expect(validation.isValid).toBe(true);
      expect(validation.value?.precision).toBe(2); // Default value
    });

    it('should reject invalid parameters', () => {
      const invalidParams = {
        color: 'invalid-color',
        output_format: 'invalid-format',
      };

      const validation = validateInput(convertColorSchema, invalidParams);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });
  });

  describe('analyzeColorSchema', () => {
    it('should validate analyze color parameters', () => {
      const validParams = {
        color: '#FF0000',
        analysis_types: ['brightness', 'contrast'],
      };

      const validation = validateInput(analyzeColorSchema, validParams);
      expect(validation.isValid).toBe(true);
      expect(validation.value).toEqual({
        ...validParams,
        include_recommendations: true, // Default value added by schema
      });
    });

    it('should use default analysis types', () => {
      const validParams = {
        color: '#FF0000',
      };

      const validation = validateInput(analyzeColorSchema, validParams);
      expect(validation.isValid).toBe(true);
      expect(validation.value?.analysis_types).toEqual(['all']);
    });
  });

  describe('validation helpers', () => {
    it('should create validation errors', () => {
      const error = createValidationError('Test error', [
        'suggestion1',
        'suggestion2',
      ]);

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.suggestions).toEqual(['suggestion1', 'suggestion2']);
    });
  });
});
