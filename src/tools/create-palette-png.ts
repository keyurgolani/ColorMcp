/**
 * PNG palette visualization generation tool
 */

const sharp = require('sharp');
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import * as Joi from 'joi';

// Extend colord with names plugin
extend([namesPlugin]);
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';

interface PalettePngParams {
  palette: string[];
  layout?: 'horizontal' | 'vertical' | 'grid' | 'circular';
  resolution?: 72 | 150 | 300 | 600;
  dimensions?: [number, number];
  style?: 'flat' | 'gradient' | 'material' | 'glossy' | 'fabric' | 'paper';
  labels?: boolean;
  label_style?: 'minimal' | 'detailed' | 'branded';
  background?: 'transparent' | 'white' | 'black' | 'custom';
  background_color?: string;
  margin?: number;
}

interface PalettePngData {
  palette: string[];
  layout: string;
  dimensions: [number, number];
  resolution: number;
  file_size: number;
  color_count: number;
}

const palettePngSchema = Joi.object({
  palette: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'Palette must contain at least 1 color',
      'array.max': 'Palette cannot contain more than 100 colors',
    }),
  layout: Joi.string()
    .valid('horizontal', 'vertical', 'grid', 'circular')
    .default('horizontal'),
  resolution: Joi.number().valid(72, 150, 300, 600).default(150),
  dimensions: Joi.array()
    .items(Joi.number().integer().min(100).max(20000))
    .length(2)
    .optional(),
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
  background_color: Joi.string().when('background', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  margin: Joi.number().integer().min(0).max(100).default(20),
});

/**
 * Calculate optimal dimensions for palette layout
 */
function calculateDimensions(
  colorCount: number,
  layout: string,
  customDimensions?: [number, number]
): [number, number] {
  if (customDimensions) {
    return customDimensions;
  }

  const baseSize = 120; // Base size for each color swatch
  const margin = 40; // Total margin

  switch (layout) {
    case 'horizontal':
      return [colorCount * baseSize + margin, baseSize + margin];
    case 'vertical':
      return [baseSize + margin, colorCount * baseSize + margin];
    case 'grid': {
      const cols = Math.ceil(Math.sqrt(colorCount));
      const rows = Math.ceil(colorCount / cols);
      return [cols * baseSize + margin, rows * baseSize + margin];
    }
    case 'circular': {
      const radius = Math.max(200, colorCount * 15);
      const diameter = radius * 2;
      return [diameter + margin, diameter + margin];
    }
    default:
      return [colorCount * baseSize + margin, baseSize + margin];
  }
}

/**
 * Generate background based on style and background setting
 */
function getBackgroundColor(
  background: string,
  backgroundColor?: string
): { r: number; g: number; b: number; alpha: number } {
  switch (background) {
    case 'transparent':
      return { r: 255, g: 255, b: 255, alpha: 0 };
    case 'white':
      return { r: 255, g: 255, b: 255, alpha: 1 };
    case 'black':
      return { r: 0, g: 0, b: 0, alpha: 1 };
    case 'custom':
      if (backgroundColor) {
        const color = colord(backgroundColor);
        const rgb = color.toRgb();
        return { r: rgb.r, g: rgb.g, b: rgb.b, alpha: rgb.a || 1 };
      }
      return { r: 255, g: 255, b: 255, alpha: 1 };
    default:
      return { r: 255, g: 255, b: 255, alpha: 1 };
  }
}

/**
 * Create SVG content for the palette
 */
function createPaletteSvg(
  palette: string[],
  layout: string,
  dimensions: [number, number],
  style: string,
  labels: boolean,
  labelStyle: string,
  background: string,
  backgroundColor?: string,
  margin: number = 20
): string {
  const [width, height] = dimensions;
  const bgColor = getBackgroundColor(background, backgroundColor);
  const bgColorStr =
    background === 'transparent'
      ? 'none'
      : `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;

  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Add background
  if (background !== 'transparent') {
    svgContent += `<rect width="100%" height="100%" fill="${bgColorStr}"/>`;
  }

  const swatchSize = Math.min(
    (width - margin * 2) / (layout === 'horizontal' ? palette.length : 1),
    (height - margin * 2) / (layout === 'vertical' ? palette.length : 1),
    120
  );

  palette.forEach((colorStr, index) => {
    try {
      const color = colord(colorStr);
      const rgb = color.toRgb();
      const colorFill = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      let x: number, y: number;

      switch (layout) {
        case 'horizontal':
          x = margin + index * swatchSize;
          y = margin;
          break;
        case 'vertical':
          x = margin;
          y = margin + index * swatchSize;
          break;
        case 'grid': {
          const cols = Math.ceil(Math.sqrt(palette.length));
          const col = index % cols;
          const row = Math.floor(index / cols);
          x = margin + col * swatchSize;
          y = margin + row * swatchSize;
          break;
        }
        case 'circular': {
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(centerX, centerY) - swatchSize / 2 - margin;
          const angle = (index / palette.length) * 2 * Math.PI - Math.PI / 2;
          x = centerX + Math.cos(angle) * radius - swatchSize / 2;
          y = centerY + Math.sin(angle) * radius - swatchSize / 2;
          break;
        }
        default:
          x = margin + index * swatchSize;
          y = margin;
      }

      // Add swatch with style effects
      if (style === 'material') {
        // Material design shadow
        svgContent += `<rect x="${x + 2}" y="${y + 2}" width="${swatchSize - 4}" height="${swatchSize - 4}" fill="rgba(0,0,0,0.2)" rx="4"/>`;
      }

      svgContent += `<rect x="${x}" y="${y}" width="${swatchSize - 4}" height="${swatchSize - 4}" fill="${colorFill}" rx="${style === 'material' ? '4' : '0'}"/>`;

      // Add labels if enabled
      if (labels) {
        const textY = y + swatchSize + 15;
        const textX = x + (swatchSize - 4) / 2;
        // const textColor = color.luminance() > 0.5 ? '#000000' : '#ffffff';

        if (labelStyle === 'detailed') {
          svgContent += `<text x="${textX}" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${bgColor.r + bgColor.g + bgColor.b > 384 ? '#000' : '#fff'}">${color.toHex()}</text>`;
          svgContent += `<text x="${textX}" y="${textY + 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="${bgColor.r + bgColor.g + bgColor.b > 384 ? '#666' : '#ccc'}">RGB(${rgb.r}, ${rgb.g}, ${rgb.b})</text>`;
        } else {
          svgContent += `<text x="${textX}" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${bgColor.r + bgColor.g + bgColor.b > 384 ? '#000' : '#fff'}">${color.toHex()}</text>`;
        }
      }
    } catch (error) {
      logger.warn(`Invalid color in palette: ${colorStr}`, {
        error: error as Error,
      });
    }
  });

  svgContent += '</svg>';
  return svgContent;
}

/**
 * Generate PNG from palette
 */
async function generatePalettePng(params: PalettePngParams): Promise<Buffer> {
  const {
    palette,
    layout = 'horizontal',
    // resolution = 150,
    dimensions,
    style = 'flat',
    labels = true,
    label_style = 'minimal',
    background = 'white',
    background_color,
    margin = 20,
  } = params;

  // Calculate dimensions
  const [width, height] = calculateDimensions(
    palette.length,
    layout,
    dimensions
  );

  // Check for memory constraints
  const totalPixels = width * height;
  if (totalPixels > 100000000) {
    // 100 megapixels
    throw new Error(
      'Image dimensions exceed memory limits. Maximum 100 megapixels allowed.'
    );
  }

  // Create SVG content
  const svgContent = createPaletteSvg(
    palette,
    layout,
    [width, height],
    style,
    labels,
    label_style,
    background,
    background_color,
    margin
  );

  // Convert SVG to PNG using Sharp

  let sharpInstance = sharp(Buffer.from(svgContent)).png({
    quality: 100,
    compressionLevel: 6,
    adaptiveFiltering: true,
  });

  // Apply background if not transparent
  if (background !== 'transparent') {
    const bgColor = getBackgroundColor(background, background_color);
    sharpInstance = sharpInstance.flatten({
      background: {
        r: bgColor.r,
        g: bgColor.g,
        b: bgColor.b,
        alpha: bgColor.alpha,
      },
    });
  }

  const pngBuffer = await sharpInstance.toBuffer();

  // Check file size (should be under 10MB)
  if (pngBuffer.length > 10 * 1024 * 1024) {
    throw new Error('Generated PNG exceeds 10MB size limit');
  }

  return pngBuffer;
}

/**
 * Create palette PNG tool handler
 */
async function createPalettePng(
  params: unknown
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = palettePngSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'create_palette_png',
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

    const validatedParams = value as PalettePngParams;

    // Validate colors
    const invalidColors: string[] = [];
    validatedParams.palette.forEach((colorStr, index) => {
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
        'create_palette_png',
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

    // Generate PNG
    const pngBuffer = await generatePalettePng(validatedParams);
    const base64Png = pngBuffer.toString('base64');

    // Calculate final dimensions
    const [width, height] = calculateDimensions(
      validatedParams.palette.length,
      validatedParams.layout || 'horizontal',
      validatedParams.dimensions
    );

    const data: PalettePngData = {
      palette: validatedParams.palette,
      layout: validatedParams.layout || 'horizontal',
      dimensions: [width, height],
      resolution: validatedParams.resolution || 150,
      file_size: pngBuffer.length,
      color_count: validatedParams.palette.length,
    };

    const executionTime = Date.now() - startTime;

    return createSuccessResponse('create_palette_png', data, executionTime, {
      colorSpaceUsed: 'sRGB',
      accessibilityNotes: [],
      recommendations: [
        'Use high resolution (300+ DPI) for print applications',
        'Consider transparent background for overlay use',
        'Grid layout works best for large palettes',
      ],
      visualizations: {
        png_base64: base64Png,
      },
    });
  } catch (error) {
    logger.error('Error generating palette PNG', { error: error as Error });
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode =
      errorMessage.includes('memory limits') || errorMessage.includes('exceeds')
        ? 'MEMORY_LIMIT_ERROR'
        : 'PNG_GENERATION_ERROR';

    return createErrorResponse(
      'create_palette_png',
      errorCode,
      errorMessage,
      startTime,
      {
        details: {
          error: errorMessage,
        },
        suggestions: [
          'Check image dimensions and color formats',
          'Ensure sufficient memory is available',
          'Try reducing image dimensions or resolution',
        ],
      }
    );
  }
}

export const createPalettePngTool: ToolHandler = {
  name: 'create_palette_png',
  description:
    'Generate high-quality PNG images of color palettes with professional layout and styling options',
  parameters: {
    type: 'object',
    properties: {
      palette: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 100,
        description: 'Array of colors in any supported format',
      },
      layout: {
        type: 'string',
        enum: ['horizontal', 'vertical', 'grid', 'circular'],
        default: 'horizontal',
        description: 'Layout arrangement of color swatches',
      },
      resolution: {
        type: 'number',
        enum: [72, 150, 300, 600],
        default: 150,
        description: 'Image resolution in DPI',
      },
      dimensions: {
        type: 'array',
        items: { type: 'number', minimum: 100, maximum: 20000 },
        minItems: 2,
        maxItems: 2,
        description: 'Custom dimensions [width, height] in pixels',
      },
      style: {
        type: 'string',
        enum: ['flat', 'gradient', 'material', 'glossy', 'fabric', 'paper'],
        default: 'flat',
        description: 'Visual style of color swatches',
      },
      labels: {
        type: 'boolean',
        default: true,
        description: 'Show color values as labels',
      },
      label_style: {
        type: 'string',
        enum: ['minimal', 'detailed', 'branded'],
        default: 'minimal',
        description: 'Style of color labels',
      },
      background: {
        type: 'string',
        enum: ['transparent', 'white', 'black', 'custom'],
        default: 'white',
        description: 'Background color or transparency',
      },
      background_color: {
        type: 'string',
        description:
          'Custom background color (required if background is "custom")',
      },
      margin: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        default: 20,
        description: 'Margin around the palette in pixels',
      },
    },
    required: ['palette'],
  },
  handler: createPalettePng,
};
