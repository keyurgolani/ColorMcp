/**
 * Joi validation schemas for input validation
 */

import Joi from 'joi';

// Color format validation - flexible to support multiple input variations
export const colorSchema = Joi.string()
  .trim()
  .min(1)
  .required()
  .messages({
    'string.empty': 'Color value cannot be empty',
    'any.required': 'Color value is required',
    'string.base': 'Color value must be a string',
  });

// Output format validation
export const outputFormatSchema = Joi.string()
  .valid(
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
    'named'
  )
  .required()
  .messages({
    'any.only':
      'Invalid output format. Supported formats: hex, rgb, rgba, hsl, hsla, hsv, hsva, hwb, cmyk, lab, xyz, lch, oklab, oklch, css-var, scss-var, tailwind, swift, android, flutter, named',
  });

// Precision validation
export const precisionSchema = Joi.number()
  .integer()
  .min(0)
  .max(10)
  .default(2)
  .messages({
    'number.base': 'Precision must be a number',
    'number.integer': 'Precision must be an integer',
    'number.min': 'Precision must be at least 0',
    'number.max': 'Precision cannot exceed 10',
  });

// Variable name validation for CSS/SCSS variables
export const variableNameSchema = Joi.string()
  .pattern(/^[a-zA-Z][a-zA-Z0-9-_]*$/)
  .messages({
    'string.pattern.base': 'Variable name must start with a letter and contain only letters, numbers, hyphens, and underscores',
  });

// Tool parameter schemas
export const convertColorSchema = Joi.object({
  color: colorSchema,
  output_format: outputFormatSchema,
  precision: precisionSchema,
  variable_name: variableNameSchema.optional(),
}).required();

export const analyzeColorSchema = Joi.object({
  color: colorSchema,
  analysis_types: Joi.array()
    .items(
      Joi.string().valid(
        'brightness',
        'contrast',
        'temperature',
        'accessibility',
        'all'
      )
    )
    .min(1)
    .default(['all'])
    .messages({
      'array.min': 'At least one analysis type must be specified',
    }),
}).required();

// Validation helper functions
export function validateInput<T>(
  schema: Joi.ObjectSchema<T>,
  input: unknown
): {
  isValid: boolean;
  value?: T;
  error?: string;
} {
  const { error, value } = schema.validate(input, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      isValid: false,
      error: error.details.map(detail => detail.message).join('; '),
    };
  }

  return {
    isValid: true,
    value: value as T,
  };
}

export function createValidationError(
  message: string,
  suggestions?: string[]
): {
  code: string;
  message: string;
  suggestions?: string[];
} {
  const error: { code: string; message: string; suggestions?: string[] } = {
    code: 'VALIDATION_ERROR',
    message,
  };

  if (suggestions !== undefined) {
    error.suggestions = suggestions;
  }

  return error;
}

// Color input validation helper
export function validateColorInput(color: string): {
  isValid: boolean;
  error?: string;
} {
  if (!color || typeof color !== 'string') {
    return {
      isValid: false,
      error: 'Color must be a non-empty string',
    };
  }

  const trimmedColor = color.trim();
  if (trimmedColor.length === 0) {
    return {
      isValid: false,
      error: 'Color cannot be empty',
    };
  }

  // Basic format validation - more detailed validation happens in UnifiedColor
  const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/;
  const hslPattern = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/;
  const namedColors = ['red', 'green', 'blue', 'white', 'black', 'yellow', 'cyan', 'magenta', 'orange', 'purple', 'pink', 'brown', 'gray', 'grey'];

  if (hexPattern.test(trimmedColor) || 
      rgbPattern.test(trimmedColor) || 
      hslPattern.test(trimmedColor) ||
      namedColors.includes(trimmedColor.toLowerCase())) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Invalid color format. Supported formats: hex (#FF0000), rgb(255,0,0), hsl(0,100%,50%), or named colors',
  };
}
