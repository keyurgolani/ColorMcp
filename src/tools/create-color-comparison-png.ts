/**
 * PNG color comparison visualization generation tool with dual background support
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

interface ColorComparisonPngParams {
  color_sets: string[][];
  comparison_type?: 'side_by_side' | 'overlay' | 'difference' | 'harmony';
  chart_style?: 'professional' | 'artistic' | 'scientific';
  annotations?: boolean;
  resolution?: 72 | 150 | 300 | 600;
  format_for?: 'web' | 'print' | 'presentation';
  dimensions?: [number, number];
}

interface ColorComparisonPngData {
  comparison_type: string;
  color_sets_count: number;
  total_colors: number;
  dimensions: [number, number];
  resolution: number;
  light_file_size: number;
  dark_file_size: number;
  total_file_size: number;
}

const colorComparisonPngSchema = Joi.object({
  color_sets: Joi.array()
    .items(Joi.array().items(Joi.string()).min(1).max(20))
    .min(2)
    .max(10)
    .required(),
  comparison_type: Joi.string()
    .valid('side_by_side', 'overlay', 'difference', 'harmony')
    .default('side_by_side'),
  chart_style: Joi.string()
    .valid('professional', 'artistic', 'scientific')
    .default('professional'),
  annotations: Joi.boolean().default(true),
  resolution: Joi.number().valid(72, 150, 300, 600).default(150),
  format_for: Joi.string().valid('web', 'print', 'presentation').default('web'),
  dimensions: Joi.array()
    .items(Joi.number().integer().min(400).max(20000))
    .length(2)
    .optional(),
});

/**
 * Calculate optimal dimensions for comparison chart
 */
function calculateComparisonDimensions(
  colorSets: string[][],
  comparisonType: string,
  formatFor: string,
  customDimensions?: [number, number]
): [number, number] {
  if (customDimensions) {
    return customDimensions;
  }

  const maxColors = Math.max(...colorSets.map(set => set.length));
  const setCount = colorSets.length;

  let baseWidth: number, baseHeight: number;

  switch (formatFor) {
    case 'print':
      baseWidth = 2400; // 8" at 300 DPI
      baseHeight = 1800; // 6" at 300 DPI
      break;
    case 'presentation':
      baseWidth = 1920;
      baseHeight = 1080;
      break;
    default: // web
      baseWidth = 1200;
      baseHeight = 800;
  }

  switch (comparisonType) {
    case 'side_by_side':
      return [
        Math.max(baseWidth, setCount * 200),
        Math.max(baseHeight, maxColors * 80 + 200),
      ];
    case 'overlay':
      return [baseWidth, baseHeight];
    case 'difference':
      return [
        Math.max(baseWidth, maxColors * 120),
        Math.max(baseHeight, setCount * 100 + 200),
      ];
    case 'harmony':
      return [Math.max(baseWidth, 800), Math.max(baseHeight, 800)];
    default:
      return [baseWidth, baseHeight];
  }
}

/**
 * Create SVG content for color comparison
 */
function createComparisonSvg(
  colorSets: string[][],
  comparisonType: string,
  chartStyle: string,
  annotations: boolean,
  dimensions: [number, number]
): string {
  const [width, height] = dimensions;
  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Add background
  const bgColor = chartStyle === 'artistic' ? '#f8f9fa' : '#ffffff';
  svgContent += `<rect width="100%" height="100%" fill="${bgColor}"/>`;

  // Add title area
  const titleHeight = 60;
  const contentY = titleHeight + 20;
  const contentHeight = height - contentY - 40;

  if (annotations) {
    svgContent += `<text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#333">Color Comparison</text>`;
    svgContent += `<text x="${width / 2}" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#666">${comparisonType.replace('_', ' ').toUpperCase()} - ${colorSets.length} Color Sets</text>`;
  }

  const margin = 40;
  const availableWidth = width - margin * 2;
  const availableHeight = contentHeight - margin;

  switch (comparisonType) {
    case 'side_by_side':
      svgContent += createSideBySideComparison(
        colorSets,
        margin,
        contentY + margin,
        availableWidth,
        availableHeight,
        annotations,
        chartStyle
      );
      break;
    case 'overlay':
      svgContent += createOverlayComparison(
        colorSets,
        margin,
        contentY + margin,
        availableWidth,
        availableHeight,
        annotations,
        chartStyle
      );
      break;
    case 'difference':
      svgContent += createDifferenceComparison(
        colorSets,
        margin,
        contentY + margin,
        availableWidth,
        availableHeight,
        annotations,
        chartStyle
      );
      break;
    case 'harmony':
      svgContent += createHarmonyComparison(
        colorSets,
        margin,
        contentY + margin,
        availableWidth,
        availableHeight,
        annotations,
        chartStyle
      );
      break;
  }

  svgContent += '</svg>';
  return svgContent;
}

/**
 * Create side-by-side comparison layout
 */
function createSideBySideComparison(
  colorSets: string[][],
  x: number,
  y: number,
  width: number,
  height: number,
  annotations: boolean,
  _style: string
): string {
  let content = '';
  const setWidth = width / colorSets.length;
  const maxColors = Math.max(...colorSets.map(set => set.length));
  const swatchHeight = Math.min(height / maxColors, 80);

  colorSets.forEach((colorSet, setIndex) => {
    const setX = x + setIndex * setWidth;
    const setInnerWidth = setWidth - 20;

    // Set label
    if (annotations) {
      content += `<text x="${setX + setInnerWidth / 2}" y="${y - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">Set ${setIndex + 1}</text>`;
    }

    colorSet.forEach((colorStr, colorIndex) => {
      try {
        const color = colord(colorStr);
        const rgb = color.toRgb();
        const swatchY = y + colorIndex * swatchHeight;

        // Color swatch
        content += `<rect x="${setX}" y="${swatchY}" width="${setInnerWidth}" height="${swatchHeight - 5}" fill="rgb(${rgb.r}, ${rgb.g}, ${rgb.b})" stroke="#ddd" stroke-width="1"/>`;

        // Color label
        if (annotations) {
          const textColor = color.isDark() ? '#fff' : '#000';
          content += `<text x="${setX + 10}" y="${swatchY + swatchHeight / 2 + 5}" font-family="Arial, sans-serif" font-size="12" fill="${textColor}">${color.toHex()}</text>`;
        }
      } catch (error) {
        logger.warn(`Invalid color in comparison: ${colorStr}`, {
          error: error as Error,
        });
      }
    });
  });

  return content;
}

/**
 * Create overlay comparison layout
 */
function createOverlayComparison(
  colorSets: string[][],
  x: number,
  y: number,
  width: number,
  height: number,
  annotations: boolean,
  _style: string
): string {
  let content = '';
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 - 50;

  colorSets.forEach((colorSet, setIndex) => {
    const radius = maxRadius - setIndex * 30;
    const opacity = 0.7 - setIndex * 0.1;

    colorSet.forEach((colorStr, colorIndex) => {
      try {
        const color = colord(colorStr);
        const rgb = color.toRgb();
        const angle = (colorIndex / colorSet.length) * 2 * Math.PI;
        const segmentAngle = (2 * Math.PI) / colorSet.length;

        // Create pie segment
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle + segmentAngle) * radius;
        const y2 = centerY + Math.sin(angle + segmentAngle) * radius;

        const largeArcFlag = segmentAngle > Math.PI ? 1 : 0;

        content += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})" stroke="#fff" stroke-width="2"/>`;
      } catch (error) {
        logger.warn(`Invalid color in overlay: ${colorStr}`, {
          error: error as Error,
        });
      }
    });
  });

  // Add legend
  if (annotations) {
    colorSets.forEach((colorSet, setIndex) => {
      const legendY = y + height - 100 + setIndex * 20;
      content += `<rect x="${x}" y="${legendY}" width="15" height="15" fill="rgba(128, 128, 128, ${0.7 - setIndex * 0.1})"/>`;
      content += `<text x="${x + 25}" y="${legendY + 12}" font-family="Arial, sans-serif" font-size="12" fill="#333">Set ${setIndex + 1} (${colorSet.length} colors)</text>`;
    });
  }

  return content;
}

/**
 * Create difference comparison layout
 */
function createDifferenceComparison(
  colorSets: string[][],
  x: number,
  y: number,
  width: number,
  height: number,
  annotations: boolean,
  _style: string
): string {
  let content = '';
  // This is a simplified difference visualization
  // In a real implementation, you'd calculate color differences using Delta E
  const maxColors = Math.max(...colorSets.map(set => set.length));
  const cellWidth = width / maxColors;
  const cellHeight = height / colorSets.length;

  for (let setIndex = 0; setIndex < colorSets.length; setIndex++) {
    const colorSet = colorSets[setIndex];
    const rowY = y + setIndex * cellHeight;

    for (let colorIndex = 0; colorIndex < maxColors; colorIndex++) {
      const cellX = x + colorIndex * cellWidth;

      if (colorSet && colorIndex < colorSet.length) {
        const colorStr = colorSet[colorIndex];
        if (colorStr) {
          try {
            const color = colord(colorStr);
            const rgb = color.toRgb();

            content += `<rect x="${cellX}" y="${rowY}" width="${cellWidth - 2}" height="${cellHeight - 2}" fill="rgb(${rgb.r}, ${rgb.g}, ${rgb.b})" stroke="#ddd" stroke-width="1"/>`;

            if (annotations) {
              const textColor = color.isDark() ? '#fff' : '#000';
              content += `<text x="${cellX + cellWidth / 2}" y="${rowY + cellHeight / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${textColor}">${color.toHex()}</text>`;
            }
          } catch (error) {
            logger.warn(`Invalid color in difference comparison: ${colorStr}`, {
              error: error as Error,
            });
          }
        }
      }
    }
  }

  return content;
}

/**
 * Create harmony comparison layout
 */
function createHarmonyComparison(
  colorSets: string[][],
  x: number,
  y: number,
  width: number,
  height: number,
  _annotations: boolean,
  style: string
): string {
  let content = '';
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) / 3;

  colorSets.forEach((colorSet, setIndex) => {
    const setRadius = radius + setIndex * 60;

    colorSet.forEach((colorStr, colorIndex) => {
      try {
        const color = colord(colorStr);
        const rgb = color.toRgb();
        const angle = (colorIndex / colorSet.length) * 2 * Math.PI;
        const dotX = centerX + Math.cos(angle) * setRadius;
        const dotY = centerY + Math.sin(angle) * setRadius;

        // Draw color dot
        content += `<circle cx="${dotX}" cy="${dotY}" r="20" fill="rgb(${rgb.r}, ${rgb.g}, ${rgb.b})" stroke="#fff" stroke-width="3"/>`;

        // Draw connection lines to center for harmony visualization
        if (style === 'scientific') {
          content += `<line x1="${centerX}" y1="${centerY}" x2="${dotX}" y2="${dotY}" stroke="#ccc" stroke-width="1" stroke-dasharray="2,2"/>`;
        }
      } catch (error) {
        logger.warn(`Invalid color in harmony comparison: ${colorStr}`, {
          error: error as Error,
        });
      }
    });
  });

  // Center point
  content += `<circle cx="${centerX}" cy="${centerY}" r="5" fill="#333"/>`;

  return content;
}

/**
 * Generate dual background PNG from color comparison
 */
async function generateColorComparisonPng(
  params: ColorComparisonPngParams
): Promise<{
  lightBuffer: Buffer;
  darkBuffer: Buffer;
  dimensions: [number, number];
}> {
  const {
    color_sets,
    comparison_type = 'side_by_side',
    chart_style = 'professional',
    annotations = true,
    format_for = 'web',
    dimensions,
  } = params;

  // Calculate dimensions
  const [width, height] = calculateComparisonDimensions(
    color_sets,
    comparison_type,
    format_for,
    dimensions
  );

  // Create base SVG content (without background)
  const svgContent = createComparisonSvg(
    color_sets,
    comparison_type,
    chart_style,
    annotations,
    [width, height]
  );

  // Generate dual background PNGs
  const result = await dualBackgroundPNGGenerator.generateDualPNG(
    svgContent,
    [width, height],
    {
      lightBackground: '#ffffff',
      darkBackground: '#1a1a1a',
      intelligentTextColor: true,
      quality: 'standard',
    }
  );

  // Validate visual quality
  const qualityCheck = await dualBackgroundPNGGenerator.validateVisualQuality(
    result.lightBuffer,
    result.darkBuffer,
    [width, height]
  );

  if (!qualityCheck.valid) {
    logger.warn('PNG quality validation issues detected', {
      issues: qualityCheck.issues,
    });
  }

  return {
    lightBuffer: result.lightBuffer,
    darkBuffer: result.darkBuffer,
    dimensions: [width, height],
  };
}

/**
 * Create color comparison PNG tool handler with dual background support
 */
async function createColorComparisonPng(
  params: unknown
): Promise<FileBasedToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Initialize file output manager
    await enhancedFileOutputManager.initialize();

    // Validate parameters
    const { error, value } = colorComparisonPngSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'create_color_comparison_png',
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

    const validatedParams = value as ColorComparisonPngParams;

    // Validate colors in all sets
    const invalidColors: string[] = [];
    validatedParams.color_sets.forEach((colorSet, setIndex) => {
      colorSet.forEach((colorStr, colorIndex) => {
        try {
          const color = colord(colorStr);
          if (!color.isValid()) {
            invalidColors.push(
              `${colorStr} in set ${setIndex} at index ${colorIndex}`
            );
          }
        } catch {
          invalidColors.push(
            `${colorStr} in set ${setIndex} at index ${colorIndex}`
          );
        }
      });
    });

    if (invalidColors.length > 0) {
      return createErrorResponse(
        'create_color_comparison_png',
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
    const pngResult = await generateColorComparisonPng(validatedParams);

    const totalColors = validatedParams.color_sets.reduce(
      (sum, set) => sum + set.length,
      0
    );

    // Save files using enhanced file output manager
    const visualizationResult =
      await enhancedFileOutputManager.saveDualPNGVisualization(
        pngResult.lightBuffer,
        pngResult.darkBuffer,
        {
          toolName: 'create_color_comparison_png',
          description: `Color comparison chart with ${validatedParams.color_sets.length} sets and ${totalColors} total colors`,
          customName: `comparison-${validatedParams.comparison_type || 'side-by-side'}`,
          dimensions: pngResult.dimensions,
          resolution: validatedParams.resolution || 150,
          colorSpace: 'sRGB',
          parameters: validatedParams as unknown as Record<string, unknown>,
        }
      );

    const data: ColorComparisonPngData = {
      comparison_type: validatedParams.comparison_type || 'side_by_side',
      color_sets_count: validatedParams.color_sets.length,
      total_colors: totalColors,
      dimensions: pngResult.dimensions,
      resolution: validatedParams.resolution || 150,
      light_file_size: pngResult.lightBuffer.length,
      dark_file_size: pngResult.darkBuffer.length,
      total_file_size:
        pngResult.lightBuffer.length + pngResult.darkBuffer.length,
    };

    const executionTime = Date.now() - startTime;

    return createFileBasedSuccessResponse(
      'create_color_comparison_png',
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
          'Use side-by-side comparison for detailed analysis',
          'Overlay comparison works well for harmony visualization',
          'Scientific style provides the most analytical information',
          'Light variant works best on light backgrounds',
          'Dark variant works best on dark backgrounds',
        ],
      }
    );
  } catch (error) {
    logger.error('Error generating color comparison PNG', {
      error: error as Error,
    });
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode =
      errorMessage.includes('memory limits') || errorMessage.includes('exceeds')
        ? 'MEMORY_LIMIT_ERROR'
        : 'PNG_GENERATION_ERROR';

    return createErrorResponse(
      'create_color_comparison_png',
      errorCode,
      errorMessage,
      startTime,
      {
        details: {
          error: errorMessage,
        },
        suggestions: [
          'Check color formats and comparison parameters',
          'Ensure sufficient memory is available',
          'Try reducing image dimensions or resolution',
        ],
      }
    );
  }
}

export const createColorComparisonPngTool: ToolHandler = {
  name: 'create_color_comparison_png',
  description:
    'Generate PNG images comparing multiple color sets with various visualization styles',
  parameters: {
    type: 'object',
    properties: {
      color_sets: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 20,
        },
        minItems: 2,
        maxItems: 10,
        description: 'Array of color arrays to compare',
      },
      comparison_type: {
        type: 'string',
        enum: ['side_by_side', 'overlay', 'difference', 'harmony'],
        default: 'side_by_side',
        description: 'Type of comparison visualization',
      },
      chart_style: {
        type: 'string',
        enum: ['professional', 'artistic', 'scientific'],
        default: 'professional',
        description: 'Visual style of the comparison chart',
      },
      annotations: {
        type: 'boolean',
        default: true,
        description: 'Show analysis annotations and labels',
      },
      resolution: {
        type: 'number',
        enum: [72, 150, 300, 600],
        default: 150,
        description: 'Image resolution in DPI',
      },
      format_for: {
        type: 'string',
        enum: ['web', 'print', 'presentation'],
        default: 'web',
        description: 'Optimize image for specific use case',
      },
      dimensions: {
        type: 'array',
        items: { type: 'number', minimum: 400, maximum: 20000 },
        minItems: 2,
        maxItems: 2,
        description: 'Custom dimensions [width, height] in pixels',
      },
    },
    required: ['color_sets'],
  },
  handler: createColorComparisonPng,
};
