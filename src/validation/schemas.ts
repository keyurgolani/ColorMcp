/**
 * Joi validation schemas for input validation with security enhancements
 */

import Joi from 'joi';

// Enhanced color format validation with security checks
export const colorSchema = Joi.string()
  .trim()
  .min(1)
  .max(100) // Prevent excessively long color strings
  .pattern(/^[a-zA-Z0-9#(),%.\s:[\]-]+$/) // Only allow safe characters
  .required()
  .messages({
    'string.empty': 'Color value cannot be empty',
    'any.required': 'Color value is required',
    'string.base': 'Color value must be a string',
    'string.max': 'Color value is too long (max 100 characters)',
    'string.pattern.base': 'Color value contains invalid characters',
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

// Variable name validation for CSS/SCSS variables with security
export const variableNameSchema = Joi.string()
  .min(1)
  .max(50) // Prevent excessively long variable names
  .pattern(/^[a-zA-Z][a-zA-Z0-9-_]*$/)
  .messages({
    'string.pattern.base':
      'Variable name must start with a letter and contain only letters, numbers, hyphens, and underscores',
    'string.max': 'Variable name is too long (max 50 characters)',
  });

// URL validation with security checks
export const urlSchema = Joi.string()
  .uri({ scheme: ['http', 'https'] }) // Only allow HTTP/HTTPS
  .max(2000) // Reasonable URL length limit
  .messages({
    'string.uri': 'Must be a valid HTTP or HTTPS URL',
    'string.max': 'URL is too long (max 2000 characters)',
  });

// Array validation with size limits
export const colorArraySchema = Joi.array()
  .items(colorSchema)
  .min(1)
  .max(100) // Prevent excessive array sizes
  .messages({
    'array.min': 'At least one color is required',
    'array.max': 'Too many colors (max 100)',
  });

// Numeric validation with security bounds
export const safeNumberSchema = Joi.number()
  .min(0)
  .max(10000) // Reasonable upper bound
  .messages({
    'number.min': 'Value must be non-negative',
    'number.max': 'Value is too large (max 10000)',
  });

// Dimension validation for images
export const dimensionSchema = Joi.array()
  .items(
    Joi.number().integer().min(1).max(10000) // Max 10k pixels per dimension
  )
  .length(2)
  .messages({
    'array.length': 'Dimensions must be [width, height]',
    'number.max': 'Dimension too large (max 10000 pixels)',
  });

// String validation with length limits
export const safeStringSchema = Joi.string()
  .max(1000) // Reasonable string length limit
  .pattern(/^[^<>]*$/) // Prevent HTML injection
  .messages({
    'string.max': 'String is too long (max 1000 characters)',
    'string.pattern.base': 'String contains invalid characters',
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
    .max(10) // Prevent excessive analysis types
    .default(['all'])
    .messages({
      'array.min': 'At least one analysis type must be specified',
      'array.max': 'Too many analysis types (max 10)',
    }),
  compare_color: colorSchema.optional(),
  include_recommendations: Joi.boolean().default(true),
}).required();

// Enhanced palette generation schemas
export const generateHarmonyPaletteSchema = Joi.object({
  base_color: colorSchema,
  harmony_type: Joi.string()
    .valid(
      'monochromatic',
      'analogous',
      'complementary',
      'triadic',
      'tetradic',
      'split_complementary',
      'double_complementary'
    )
    .required(),
  count: Joi.number().integer().min(3).max(20).default(5),
  variation: Joi.number().min(0).max(100).default(20),
}).required();

export const extractPaletteFromImageSchema = Joi.object({
  image_url: urlSchema.required(),
  method: Joi.string()
    .valid('dominant', 'kmeans', 'median_cut', 'octree', 'histogram')
    .default('kmeans'),
  color_count: Joi.number().integer().min(3).max(20).default(5),
  quality: Joi.string()
    .valid('low', 'medium', 'high', 'ultra')
    .default('medium'),
  ignore_background: Joi.boolean().default(false),
}).required();

// Visualization schemas with security limits
export const createPaletteHtmlSchema = Joi.object({
  palette: colorArraySchema.required(),
  layout: Joi.string()
    .valid('horizontal', 'vertical', 'grid', 'circular', 'wave')
    .default('horizontal'),
  style: Joi.string()
    .valid('swatches', 'gradient', 'cards', 'minimal', 'detailed')
    .default('swatches'),
  size: Joi.string()
    .valid('small', 'medium', 'large', 'custom')
    .default('medium'),
  custom_dimensions: dimensionSchema.when('size', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  show_values: Joi.boolean().default(true),
  show_names: Joi.boolean().default(false),
  interactive: Joi.boolean().default(true),
  export_formats: Joi.array()
    .items(Joi.string().valid('hex', 'rgb', 'hsl', 'css', 'json'))
    .max(10)
    .default(['hex', 'rgb', 'hsl']),
  accessibility_info: Joi.boolean().default(false),
  theme: Joi.string().valid('light', 'dark', 'auto').default('light'),
}).required();

export const createPalettePngSchema = Joi.object({
  palette: colorArraySchema.required(),
  layout: Joi.string()
    .valid('horizontal', 'vertical', 'grid', 'circular')
    .default('horizontal'),
  resolution: Joi.number().valid(72, 150, 300, 600).default(150),
  dimensions: dimensionSchema.optional(),
  style: Joi.string()
    .valid('flat', 'gradient', 'material', 'glossy', 'fabric', 'paper')
    .default('flat'),
  labels: Joi.boolean().default(true),
  label_style: Joi.string()
    .valid('minimal', 'detailed', 'branded')
    .default('minimal'),
  background: Joi.string()
    .valid('transparent', 'white', 'black', 'custom')
    .default('white'),
  background_color: colorSchema.when('background', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  margin: Joi.number().min(0).max(100).default(20),
}).required();

// Accessibility schemas
export const checkContrastSchema = Joi.object({
  foreground: colorSchema.required(),
  background: colorSchema.required(),
  text_size: Joi.string().valid('normal', 'large').default('normal'),
  standard: Joi.string()
    .valid('WCAG_AA', 'WCAG_AAA', 'APCA')
    .default('WCAG_AA'),
}).required();

export const simulateColorblindnessSchema = Joi.object({
  colors: colorArraySchema.required(),
  type: Joi.string()
    .valid(
      'protanopia',
      'deuteranopia',
      'tritanopia',
      'protanomaly',
      'deuteranomaly',
      'tritanomaly',
      'monochromacy'
    )
    .required(),
  severity: Joi.number().min(0).max(100).default(100),
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
  const hslPattern =
    /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/;
  const namedColors = [
    'red',
    'green',
    'blue',
    'white',
    'black',
    'yellow',
    'cyan',
    'magenta',
    'orange',
    'purple',
    'pink',
    'brown',
    'gray',
    'grey',
  ];

  if (
    hexPattern.test(trimmedColor) ||
    rgbPattern.test(trimmedColor) ||
    hslPattern.test(trimmedColor) ||
    namedColors.includes(trimmedColor.toLowerCase())
  ) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error:
      'Invalid color format. Supported formats: hex (#FF0000), rgb(255,0,0), hsl(0,100%,50%), or named colors',
  };
}
