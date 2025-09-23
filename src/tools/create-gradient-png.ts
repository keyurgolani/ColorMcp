/**
 * PNG gradient visualization generation tool with dual background support
 */

import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import Joi from 'joi';

// Extend colord with names plugin
extend([namesPlugin]);
import {
  ToolHandler,
  ErrorResponse,
  FileBasedToolResponse,
} from '../types/index';
import {
  createFileBasedSuccessResponse,
  createErrorResponse,
} from '../utils/response';
import { logger } from '../utils/logger';
import { dualBackgroundPNGGenerator } from '../visualization/dual-background-png-generator';
import { enhancedFileOutputManager } from '../utils/enhanced-file-output-manager';

interface GradientPngParams {
  gradient: {
    type: 'linear' | 'radial' | 'conic';
    colors: string[];
    positions?: number[];
    angle?: number;
    center?: [number, number];
    shape?: 'circle' | 'ellipse';
  };
  dimensions: [number, number];
  resolution?: 72 | 150 | 300 | 600;
  format?: 'png' | 'png24' | 'png32';
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
  effects?: ('noise' | 'texture' | 'border' | 'shadow')[];
}

interface GradientPngData {
  gradient_type: string;
  dimensions: [number, number];
  resolution: number;
  light_file_size: number;
  dark_file_size: number;
  total_file_size: number;
  color_count: number;
}

const gradientPngSchema = Joi.object({
  gradient: Joi.object({
    type: Joi.string().valid('linear', 'radial', 'conic').required(),
    colors: Joi.array().items(Joi.string()).min(2).max(20).required(),
    positions: Joi.array().items(Joi.number().min(0).max(100)).optional(),
    angle: Joi.number().min(0).max(360).default(90),
    center: Joi.array()
      .items(Joi.number().min(0).max(100))
      .length(2)
      .default([50, 50]),
    shape: Joi.string().valid('circle', 'ellipse').default('circle'),
  }).required(),
  dimensions: Joi.array()
    .items(Joi.number().integer().min(100).max(20000))
    .length(2)
    .required(),
  resolution: Joi.number().valid(72, 150, 300, 600).default(150),
  format: Joi.string().valid('png', 'png24', 'png32').default('png32'),
  quality: Joi.string()
    .valid('draft', 'standard', 'high', 'ultra')
    .default('standard'),
  effects: Joi.array()
    .items(Joi.string().valid('noise', 'texture', 'border', 'shadow'))
    .default([]),
});

/**
 * Create SVG gradient definition
 */
function createGradientSvg(
  gradient: GradientPngParams['gradient'],
  dimensions: [number, number],
  effects: string[]
): string {
  const [width, height] = dimensions;
  const { type, colors, positions, angle = 90, center = [50, 50] } = gradient;

  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Add definitions for gradients and effects
  svgContent += '<defs>';

  // Create gradient definition
  const gradientId = 'gradient';
  let gradientDef = '';

  if (type === 'linear') {
    // Convert angle to SVG coordinates
    const radians = (angle - 90) * (Math.PI / 180);
    const x1 = 50 + Math.cos(radians) * 50;
    const y1 = 50 + Math.sin(radians) * 50;
    const x2 = 50 - Math.cos(radians) * 50;
    const y2 = 50 - Math.sin(radians) * 50;

    gradientDef = `<linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">`;
  } else if (type === 'radial') {
    gradientDef = `<radialGradient id="${gradientId}" cx="${center[0]}%" cy="${center[1]}%" r="50%">`;
  } else if (type === 'conic') {
    // SVG doesn't natively support conic gradients, so we'll create a radial approximation
    gradientDef = `<radialGradient id="${gradientId}" cx="${center[0]}%" cy="${center[1]}%" r="50%">`;
  }

  // Add color stops
  colors.forEach((colorStr, index) => {
    try {
      const color = colord(colorStr);
      const position = positions
        ? positions[index]
        : (index / (colors.length - 1)) * 100;
      gradientDef += `<stop offset="${position}%" stop-color="${color.toHex()}"/>`;
    } catch (error) {
      logger.warn(`Invalid color in gradient: ${colorStr}`, {
        error: error as Error,
      });
    }
  });

  gradientDef += type === 'linear' ? '</linearGradient>' : '</radialGradient>';
  svgContent += gradientDef;

  // Add effects definitions
  if (effects.includes('shadow')) {
    svgContent += `
      <filter id="shadow">
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    `;
  }

  if (effects.includes('noise')) {
    svgContent += `
      <filter id="noise">
        <feTurbulence baseFrequency="0.9" numOctaves="4" result="noise"/>
        <feColorMatrix in="noise" type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="0.5 0.6 0.7 0.8"/>
        </feComponentTransfer>
        <feComposite operator="multiply" in2="SourceGraphic"/>
      </filter>
    `;
  }

  svgContent += '</defs>';

  // Create the main gradient rectangle
  let filterAttribute = '';
  if (effects.includes('shadow') && !effects.includes('noise')) {
    filterAttribute = ' filter="url(#shadow)"';
  } else if (effects.includes('noise') && !effects.includes('shadow')) {
    filterAttribute = ' filter="url(#noise)"';
  }

  svgContent += `<rect width="100%" height="100%" fill="url(#${gradientId})"${filterAttribute}/>`;

  // Add border if requested
  if (effects.includes('border')) {
    svgContent += `<rect width="100%" height="100%" fill="none" stroke="#000" stroke-width="2"/>`;
  }

  svgContent += '</svg>';
  return svgContent;
}

/**
 * Generate dual background PNG from gradient
 */
async function generateGradientPng(params: GradientPngParams): Promise<{
  lightBuffer: Buffer;
  darkBuffer: Buffer;
  dimensions: [number, number];
}> {
  const { gradient, dimensions, quality = 'standard', effects = [] } = params;

  // Create base SVG content (gradients don't need background modification)
  const svgContent = createGradientSvg(gradient, dimensions, effects);

  // Generate dual background PNGs
  const result = await dualBackgroundPNGGenerator.generateDualPNG(
    svgContent,
    dimensions,
    {
      lightBackground: '#ffffff',
      darkBackground: '#1a1a1a',
      intelligentTextColor: true,
      quality,
    }
  );

  // Validate visual quality
  const qualityCheck = await dualBackgroundPNGGenerator.validateVisualQuality(
    result.lightBuffer,
    result.darkBuffer,
    dimensions
  );

  if (!qualityCheck.valid) {
    logger.warn('PNG quality validation issues detected', {
      issues: qualityCheck.issues,
    });
  }

  return {
    lightBuffer: result.lightBuffer,
    darkBuffer: result.darkBuffer,
    dimensions,
  };
}

/**
 * Create gradient PNG tool handler with dual background support
 */
async function createGradientPng(
  params: unknown
): Promise<FileBasedToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Initialize file output manager
    await enhancedFileOutputManager.initialize();

    // Validate parameters
    const { error, value } = gradientPngSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'create_gradient_png',
        'INVALID_PARAMETERS',
        `Invalid parameters: ${error.details.map(d => d.message).join(', ')}`,
        startTime,
        {
          details: error.details,
          suggestions: [
            'Check the parameter format',
            'Ensure all required fields are provided',
          ],
        }
      );
    }

    const validatedParams = value as GradientPngParams;

    // Validate colors
    const invalidColors: string[] = [];
    validatedParams.gradient.colors.forEach((colorStr, index) => {
      try {
        const color = colord(colorStr);
        if (!color.isValid()) {
          invalidColors.push(`${colorStr} at index ${index}`);
        }
      } catch {
        invalidColors.push(`${colorStr} at index ${index}`);
      }
    });

    if (invalidColors.length > 0) {
      return createErrorResponse(
        'create_gradient_png',
        'INVALID_COLOR_FORMAT',
        `Invalid colors found: ${invalidColors.join(', ')}`,
        startTime,
        {
          details: { invalidColors },
          suggestions: [
            'Use valid color formats like #FF0000, rgb(255,0,0), or hsl(0,100%,50%)',
          ],
        }
      );
    }

    // Generate dual background PNGs
    const pngResult = await generateGradientPng(validatedParams);

    // Save files using enhanced file output manager
    const visualizationResult =
      await enhancedFileOutputManager.saveDualPNGVisualization(
        pngResult.lightBuffer,
        pngResult.darkBuffer,
        {
          toolName: 'create_gradient_png',
          description: `${validatedParams.gradient.type} gradient with ${validatedParams.gradient.colors.length} colors`,
          customName: `gradient-${validatedParams.gradient.type}`,
          dimensions: pngResult.dimensions,
          resolution: validatedParams.resolution || 150,
          colorSpace: 'sRGB',
          parameters: validatedParams as unknown as Record<string, unknown>,
        }
      );

    const data: GradientPngData = {
      gradient_type: validatedParams.gradient.type,
      dimensions: validatedParams.dimensions,
      resolution: validatedParams.resolution || 150,
      light_file_size: pngResult.lightBuffer.length,
      dark_file_size: pngResult.darkBuffer.length,
      total_file_size:
        pngResult.lightBuffer.length + pngResult.darkBuffer.length,
      color_count: validatedParams.gradient.colors.length,
    };

    const executionTime = Date.now() - startTime;

    return createFileBasedSuccessResponse(
      'create_gradient_png',
      data,
      executionTime,
      visualizationResult,
      {
        colorSpaceUsed: 'sRGB',
        accessibilityNotes: [
          'Light background variant optimized for light themes',
          'Dark background variant optimized for dark themes',
        ],
        recommendations: [
          'Use high resolution (300+ DPI) for print applications',
          'Linear gradients work best for backgrounds',
          'Light variant works best on light backgrounds',
          'Dark variant works best on dark backgrounds',
          'Consider adding subtle effects for enhanced visual appeal',
        ],
      }
    );
  } catch (error) {
    logger.error('Error generating gradient PNG', { error: error as Error });
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode =
      errorMessage.includes('memory limits') || errorMessage.includes('exceeds')
        ? 'MEMORY_LIMIT_ERROR'
        : 'PNG_GENERATION_ERROR';

    return createErrorResponse(
      'create_gradient_png',
      errorCode,
      errorMessage,
      startTime,
      {
        details: {
          error: errorMessage,
        },
        suggestions: [
          'Check gradient parameters and dimensions',
          'Ensure sufficient memory is available',
          'Try reducing image dimensions or resolution',
        ],
      }
    );
  }
}

export const createGradientPngTool: ToolHandler = {
  name: 'create_gradient_png',
  description:
    'Generate high-quality PNG images of gradients with various styles and effects',
  parameters: {
    type: 'object',
    properties: {
      gradient: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['linear', 'radial', 'conic'],
            description: 'Type of gradient',
          },
          colors: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 20,
            description: 'Array of colors for the gradient',
          },
          positions: {
            type: 'array',
            items: { type: 'number', minimum: 0, maximum: 100 },
            description: 'Optional positions for color stops (0-100)',
          },
          angle: {
            type: 'number',
            minimum: 0,
            maximum: 360,
            default: 90,
            description: 'Angle for linear gradients (degrees)',
          },
          center: {
            type: 'array',
            items: { type: 'number', minimum: 0, maximum: 100 },
            minItems: 2,
            maxItems: 2,
            default: [50, 50],
            description: 'Center point for radial/conic gradients [x, y]',
          },
          shape: {
            type: 'string',
            enum: ['circle', 'ellipse'],
            default: 'circle',
            description: 'Shape for radial gradients',
          },
        },
        required: ['type', 'colors'],
      },
      dimensions: {
        type: 'array',
        items: { type: 'number', minimum: 100, maximum: 20000 },
        minItems: 2,
        maxItems: 2,
        description: 'Image dimensions [width, height] in pixels',
      },
      resolution: {
        type: 'number',
        enum: [72, 150, 300, 600],
        default: 150,
        description: 'Image resolution in DPI',
      },
      format: {
        type: 'string',
        enum: ['png', 'png24', 'png32'],
        default: 'png32',
        description: 'PNG format type',
      },
      quality: {
        type: 'string',
        enum: ['draft', 'standard', 'high', 'ultra'],
        default: 'standard',
        description: 'Image quality level',
      },
      effects: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['noise', 'texture', 'border', 'shadow'],
        },
        default: [],
        description: 'Visual effects to apply',
      },
    },
    required: ['gradient', 'dimensions'],
  },
  handler: createGradientPng,
};
