/**
 * Comprehensive color conversion tool implementation
 */

import { ToolHandler } from './index';
import { validateInput, convertColorSchema } from '../validation/schemas';
import {
  createSuccessResponse,
  createValidationErrorResponse,
} from '../utils/response';
import { logger } from '../utils/logger';
import { ColorParser } from '../color/color-parser';
import { SupportedFormat } from '../color/unified-color';

interface ConvertColorParams {
  color: string;
  output_format: SupportedFormat;
  precision?: number;
  variable_name?: string;
}

interface ConversionResult {
  original: string;
  converted: string;
  format: string;
  precision: number;
  detected_format: string | undefined;
  css_variable?: string;
  scss_variable?: string;
}

function convertColor(
  color: string,
  outputFormat: SupportedFormat,
  precision: number = 2,
  variableName?: string
): ConversionResult {
  // Parse the input color
  const parseResult = ColorParser.parse(color);

  if (!parseResult.success || !parseResult.color) {
    throw new Error(parseResult.error || 'Failed to parse color');
  }

  const unifiedColor = parseResult.color;

  // Convert to the requested format
  const converted = unifiedColor.toFormat(outputFormat, precision);

  // Prepare result
  const result: ConversionResult = {
    original: color,
    converted,
    format: outputFormat,
    precision,
    detected_format: parseResult.detectedFormat || 'unknown',
  };

  // Add CSS/SCSS variables if requested or if format requires it
  if (variableName) {
    result.css_variable = unifiedColor.toCSSVariable(variableName);
    result.scss_variable = unifiedColor.toSCSSVariable(variableName);
  } else if (outputFormat === 'css-var') {
    result.css_variable = unifiedColor.toCSSVariable('color');
  } else if (outputFormat === 'scss-var') {
    result.scss_variable = unifiedColor.toSCSSVariable('color');
  }

  return result;
}

export const convertColorTool: ToolHandler = {
  name: 'convert_color',
  description:
    'Convert colors between different formats with high precision and comprehensive format support',
  parameters: {
    type: 'object',
    properties: {
      color: {
        type: 'string',
        description:
          'Input color in any supported format (HEX, RGB, HSL, HSV, CMYK, LAB, XYZ, named colors, etc.)',
        examples: [
          '#FF0000',
          'rgb(255, 0, 0)',
          'hsl(0, 100%, 50%)',
          'hsv(0, 100%, 100%)',
          'cmyk(0%, 100%, 100%, 0%)',
          'lab(53.23, 80.11, 67.22)',
          'red',
          '255, 0, 0',
        ],
      },
      output_format: {
        type: 'string',
        enum: [
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
        ],
        description: 'Desired output format',
      },
      precision: {
        type: 'number',
        minimum: 0,
        maximum: 10,
        default: 2,
        description: 'Number of decimal places for numeric values',
      },
      variable_name: {
        type: 'string',
        description: 'Variable name for CSS/SCSS variable formats (optional)',
        pattern: '^[a-zA-Z][a-zA-Z0-9-_]*$',
      },
    },
    required: ['color', 'output_format'],
  },

  handler: async (params: unknown) => {
    const startTime = Date.now();

    try {
      // Validate input parameters
      const validation = validateInput(convertColorSchema, params);
      if (!validation.isValid) {
        logger.warn('Color conversion validation failed', {
          tool: 'convert_color',
          executionTime: Date.now() - startTime,
        });
        return createValidationErrorResponse(
          'convert_color',
          validation.error!,
          Date.now() - startTime
        );
      }

      const { color, output_format, precision, variable_name } =
        validation.value as ConvertColorParams;

      logger.debug(`Converting color "${color}" to ${output_format}`, {
        tool: 'convert_color',
      });

      // Perform color conversion
      const result = convertColor(
        color,
        output_format,
        precision !== undefined ? precision : 2,
        variable_name
      );

      const executionTime = Date.now() - startTime;

      // Get color metadata for additional insights
      const parseResult = ColorParser.parse(color);
      const colorMetadata = parseResult.color?.metadata;

      logger.info(
        `Successfully converted color "${color}" to ${output_format}`,
        {
          tool: 'convert_color',
          executionTime,
        }
      );

      return createSuccessResponse('convert_color', result, executionTime, {
        colorSpaceUsed: 'sRGB',
        detectedInputFormat: parseResult.detectedFormat || 'unknown',
        ...(colorMetadata
          ? {
              colorProperties: {
                brightness: colorMetadata.brightness,
                temperature: colorMetadata.temperature,
                wcagAA: colorMetadata.accessibility.wcagAA,
                wcagAAA: colorMetadata.accessibility.wcagAAA,
              },
            }
          : {}),
        accessibilityNotes: colorMetadata
          ? [
              `Brightness: ${colorMetadata.brightness}/255`,
              `Color temperature: ${colorMetadata.temperature}`,
              `WCAG AA compliant: ${colorMetadata.accessibility.wcagAA ? 'Yes' : 'No'}`,
              `WCAG AAA compliant: ${colorMetadata.accessibility.wcagAAA ? 'Yes' : 'No'}`,
            ]
          : [],
        recommendations: [
          'For better color accuracy in professional applications, consider using LAB color space',
          'Use higher precision (3-4 decimal places) for color matching applications',
          'Test color accessibility with the check_contrast tool',
          executionTime > 50
            ? 'Consider caching frequently converted colors for better performance'
            : 'Conversion completed within optimal time',
        ],
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Color conversion failed', {
        tool: 'convert_color',
        executionTime,
        error: error as Error,
      });

      // Provide helpful error messages based on error type
      let errorMessage = 'Color conversion failed';
      let suggestions: string[] = [];

      if (error instanceof Error) {
        if (
          error.message.includes('parse') ||
          error.message.includes('Unrecognized color format')
        ) {
          errorMessage = 'Invalid color format provided';
          suggestions = [
            'Supported formats: ' +
              ColorParser.getSupportedFormats().join(', '),
            'Check the color value spelling and format',
            'Use quotes around color values in JSON',
          ];
        } else if (error.message.includes('Unsupported output format')) {
          errorMessage = 'Unsupported output format';
          suggestions = [
            'Use one of the supported output formats listed in the tool parameters',
            'Check the output_format parameter spelling',
          ];
        } else {
          // For generic errors, use the error message directly
          errorMessage = error.message;
          suggestions = [
            'Verify the input color is valid',
            'Try a different color format',
            'Check that all parameters are correctly specified',
          ];
        }
      }

      return {
        success: false,
        error: {
          code: 'CONVERSION_ERROR',
          message: errorMessage,
          details:
            process.env['NODE_ENV'] === 'development'
              ? (error as Error).message
              : undefined,
          suggestions,
        },
        metadata: {
          execution_time: executionTime,
          tool: 'convert_color',
          timestamp: new Date().toISOString(),
        },
      };
    }
  },
};
