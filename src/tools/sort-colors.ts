/**
 * Sort colors by various properties (hue, saturation, lightness, brightness, temperature)
 */

import Joi from 'joi';
import { UnifiedColor } from '../color/unified-color';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';

interface SortColorsParams {
  colors: string[];
  sort_by:
    | 'hue'
    | 'saturation'
    | 'lightness'
    | 'brightness'
    | 'temperature'
    | 'frequency';
  direction: 'ascending' | 'descending';
  group_similar: boolean;
}

interface ColorMetrics {
  hue: number;
  saturation: number;
  lightness: number;
  brightness: number;
  temperature: number;
  frequency?: number;
}

interface SortedColor {
  original: string;
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
  metrics: ColorMetrics;
}

interface SortResult {
  sorted_colors: SortedColor[];
  sort_criteria: string;
  direction: string;
  total_colors: number;
  total_groups?: number;
  groups?: Array<{
    group_id: number;
    colors: SortedColor[];
    group_size: number;
    average_metrics: ColorMetrics;
  }>;
}

const sortColorsSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string().required())
    .min(2)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least 2 colors are required for sorting',
      'array.max': 'Maximum 100 colors can be sorted at once',
    }),
  sort_by: Joi.string()
    .valid(
      'hue',
      'saturation',
      'lightness',
      'brightness',
      'temperature',
      'frequency'
    )
    .required()
    .messages({
      'any.only':
        'Sort criteria must be one of: hue, saturation, lightness, brightness, temperature, frequency',
    }),
  direction: Joi.string().valid('ascending', 'descending').default('ascending'),
  group_similar: Joi.boolean().default(false),
});

interface ColorWithMetrics {
  original: string;
  color: UnifiedColor;
  index: number;
  hue: number;
  saturation: number;
  lightness: number;
  brightness: number;
  temperature: number;
  frequency: number;
}

function calculateTemperatureValue(hue: number): number {
  // Convert hue to temperature value (0 = cool, 100 = warm)
  if (hue >= 0 && hue <= 90) {
    return 50 + (hue / 90) * 50; // Red to yellow: warm
  } else if (hue > 90 && hue <= 180) {
    return 50 - ((hue - 90) / 90) * 50; // Yellow to cyan: cooling
  } else if (hue > 180 && hue <= 270) {
    return ((hue - 180) / 90) * 50; // Cyan to blue to magenta: cool to warm
  } else {
    return 50 + ((hue - 270) / 90) * 50; // Magenta to red: warm
  }
}

function calculateColorFrequency(colors: UnifiedColor[]): Map<string, number> {
  const frequency = new Map<string, number>();

  colors.forEach(color => {
    const hex = color.hex.toLowerCase();
    frequency.set(hex, (frequency.get(hex) || 0) + 1);
  });

  return frequency;
}

function groupSimilarColors(
  colors: ColorWithMetrics[],
  threshold: number = 30
): ColorWithMetrics[][] {
  const groups: ColorWithMetrics[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < colors.length; i++) {
    if (used.has(i)) continue;

    const baseColor = colors[i];
    if (!baseColor) continue;

    const group: ColorWithMetrics[] = [baseColor];
    used.add(i);

    for (let j = i + 1; j < colors.length; j++) {
      if (used.has(j)) continue;

      const compareColor = colors[j];
      if (!compareColor) continue;

      // Calculate color distance in HSL space
      const color1 = baseColor.color.hsl;
      const color2 = compareColor.color.hsl;

      const hueDiff = Math.min(
        Math.abs(color1.h - color2.h),
        360 - Math.abs(color1.h - color2.h)
      );
      const satDiff = Math.abs(color1.s - color2.s);
      const lightDiff = Math.abs(color1.l - color2.l);

      const distance = Math.sqrt(
        Math.pow((hueDiff / 360) * 100, 2) +
          Math.pow(satDiff, 2) +
          Math.pow(lightDiff, 2)
      );

      if (distance < threshold) {
        group.push(compareColor);
        used.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

async function sortColorsHandler(
  params: unknown
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = sortColorsSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'sort_colors',
        'INVALID_PARAMETERS',
        `Invalid parameters: ${error.details.map(d => d.message).join(', ')}`,
        Date.now() - startTime,
        {
          details: error.details,
        }
      );
    }

    const {
      colors: colorStrings,
      sort_by,
      direction,
      group_similar,
    } = value as SortColorsParams;

    // Parse colors and calculate metrics
    const colorsWithMetrics: ColorWithMetrics[] = [];
    const parsedColors: UnifiedColor[] = [];

    for (let i = 0; i < colorStrings.length; i++) {
      const colorString = colorStrings[i];
      if (!colorString) continue;

      try {
        const color = new UnifiedColor(colorString);
        parsedColors.push(color);

        const hsl = color.hsl;
        const rgb = color.rgb;

        // Calculate brightness using perceived brightness formula
        const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;

        colorsWithMetrics.push({
          original: colorString,
          color,
          index: i,
          hue: hsl.h,
          saturation: hsl.s,
          lightness: hsl.l,
          brightness,
          temperature: calculateTemperatureValue(hsl.h),
          frequency: 0, // Will be calculated below
        });
      } catch (error) {
        return createErrorResponse(
          'sort_colors',
          'INVALID_COLOR',
          `Invalid color at index ${i}: ${colorString}`,
          Date.now() - startTime,
          {
            details: {
              colorIndex: i,
              providedColor: colorString,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            suggestions: [
              'Ensure all colors are in valid format (hex, rgb, hsl, etc.)',
              'Check color syntax and values',
            ],
          }
        );
      }
    }

    // Calculate frequency if needed
    if (sort_by === 'frequency') {
      const frequencyMap = calculateColorFrequency(parsedColors);
      colorsWithMetrics.forEach(item => {
        item.frequency = frequencyMap.get(item.color.hex.toLowerCase()) || 0;
      });
    }

    // Sort colors
    const sortedColors = [...colorsWithMetrics].sort((a, b) => {
      let valueA: number, valueB: number;

      switch (sort_by) {
        case 'hue':
          valueA = a.hue;
          valueB = b.hue;
          break;
        case 'saturation':
          valueA = a.saturation;
          valueB = b.saturation;
          break;
        case 'lightness':
          valueA = a.lightness;
          valueB = b.lightness;
          break;
        case 'brightness':
          valueA = a.brightness;
          valueB = b.brightness;
          break;
        case 'temperature':
          valueA = a.temperature;
          valueB = b.temperature;
          break;
        case 'frequency':
          valueA = a.frequency;
          valueB = b.frequency;
          break;
        default:
          valueA = a.hue;
          valueB = b.hue;
      }

      const comparison = valueA - valueB;
      return direction === 'ascending' ? comparison : -comparison;
    });

    // Group similar colors if requested
    const result: SortResult = {
      sorted_colors: sortedColors.map(item => ({
        original: item.original,
        hex: item.color.hex,
        rgb: `rgb(${item.color.rgb.r}, ${item.color.rgb.g}, ${item.color.rgb.b})`,
        hsl: `hsl(${item.color.hsl.h}, ${item.color.hsl.s}%, ${item.color.hsl.l}%)`,
        hsv: `hsv(${item.color.hsv.h}, ${item.color.hsv.s}%, ${item.color.hsv.v}%)`,
        metrics: {
          hue: Math.round(item.hue * 10) / 10,
          saturation: Math.round(item.saturation * 10) / 10,
          lightness: Math.round(item.lightness * 10) / 10,
          brightness: Math.round(item.brightness * 10) / 10,
          temperature: Math.round(item.temperature * 10) / 10,
          frequency: item.frequency,
        },
        original_index: item.index,
      })),
      sort_criteria: sort_by,
      direction,
      total_colors: colorStrings.length,
    };

    if (group_similar) {
      const groups = groupSimilarColors(sortedColors);
      result.groups = groups.map((group, groupIndex) => ({
        group_id: groupIndex + 1,
        colors: group.map(item => ({
          original: item.original,
          hex: item.color.hex,
          rgb: `rgb(${item.color.rgb.r}, ${item.color.rgb.g}, ${item.color.rgb.b})`,
          hsl: `hsl(${item.color.hsl.h}, ${item.color.hsl.s}%, ${item.color.hsl.l}%)`,
          hsv: `hsv(${item.color.hsv.h}, ${item.color.hsv.s}%, ${item.color.hsv.v}%)`,
          metrics: {
            hue: Math.round(item.hue * 10) / 10,
            saturation: Math.round(item.saturation * 10) / 10,
            lightness: Math.round(item.lightness * 10) / 10,
            brightness: Math.round(item.brightness * 10) / 10,
            temperature: Math.round(item.temperature * 10) / 10,
            frequency: item.frequency,
          },
          original_index: item.index,
        })),
        group_size: group.length,
        average_metrics: {
          hue:
            Math.round(
              (group.reduce((sum, item) => sum + item.hue, 0) / group.length) *
                10
            ) / 10,
          saturation:
            Math.round(
              (group.reduce((sum, item) => sum + item.saturation, 0) /
                group.length) *
                10
            ) / 10,
          lightness:
            Math.round(
              (group.reduce((sum, item) => sum + item.lightness, 0) /
                group.length) *
                10
            ) / 10,
          brightness:
            Math.round(
              (group.reduce((sum, item) => sum + item.brightness, 0) /
                group.length) *
                10
            ) / 10,
          temperature:
            Math.round(
              (group.reduce((sum, item) => sum + item.temperature, 0) /
                group.length) *
                10
            ) / 10,
        },
      }));
      result.total_groups = groups.length;
    }

    const executionTime = Date.now() - startTime;

    // Generate analysis
    const analysis = {
      color_distribution: {
        hue_range: {
          min: Math.min(...colorsWithMetrics.map(c => c.hue)),
          max: Math.max(...colorsWithMetrics.map(c => c.hue)),
        },
        saturation_range: {
          min: Math.min(...colorsWithMetrics.map(c => c.saturation)),
          max: Math.max(...colorsWithMetrics.map(c => c.saturation)),
        },
        lightness_range: {
          min: Math.min(...colorsWithMetrics.map(c => c.lightness)),
          max: Math.max(...colorsWithMetrics.map(c => c.lightness)),
        },
        brightness_range: {
          min: Math.min(...colorsWithMetrics.map(c => c.brightness)),
          max: Math.max(...colorsWithMetrics.map(c => c.brightness)),
        },
      },
      dominant_characteristics: {
        most_common_hue_range: getMostCommonHueRange(colorsWithMetrics),
        average_saturation:
          Math.round(
            (colorsWithMetrics.reduce((sum, c) => sum + c.saturation, 0) /
              colorsWithMetrics.length) *
              10
          ) / 10,
        average_lightness:
          Math.round(
            (colorsWithMetrics.reduce((sum, c) => sum + c.lightness, 0) /
              colorsWithMetrics.length) *
              10
          ) / 10,
      },
    };

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    const darkColors = colorsWithMetrics.filter(c => c.lightness < 30).length;
    const lightColors = colorsWithMetrics.filter(c => c.lightness > 70).length;
    const midColors = colorsWithMetrics.length - darkColors - lightColors;

    accessibilityNotes.push(
      `Color distribution: ${darkColors} dark, ${midColors} medium, ${lightColors} light colors`
    );

    if (darkColors > lightColors * 2) {
      accessibilityNotes.push(
        'Palette is dark-heavy - ensure sufficient light colors for contrast'
      );
    } else if (lightColors > darkColors * 2) {
      accessibilityNotes.push(
        'Palette is light-heavy - ensure sufficient dark colors for contrast'
      );
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (sort_by === 'hue') {
      recommendations.push(
        'Hue sorting creates rainbow-like color progressions'
      );
    } else if (sort_by === 'lightness') {
      recommendations.push(
        'Lightness sorting helps identify contrast relationships'
      );
    } else if (sort_by === 'saturation') {
      recommendations.push('Saturation sorting groups vivid and muted colors');
    }

    if (group_similar) {
      recommendations.push(
        'Similar color grouping helps identify redundant colors in palettes'
      );
    }

    // Add export formats
    const exportFormats = {
      css: result.sorted_colors
        .map((c, i: number) => `--color-${i + 1}: ${c.hex};`)
        .join('\n'),

      scss: result.sorted_colors
        .map((c, i: number) => `$color-${i + 1}: ${c.hex};`)
        .join('\n'),

      json: {
        sort_criteria: sort_by,
        direction,
        colors: result.sorted_colors.map(c => ({
          hex: c.hex,
          metrics: c.metrics,
        })),
      },
    };

    return createSuccessResponse(
      'sort_colors',
      {
        ...result,
        analysis,
      },
      executionTime,
      {
        colorSpaceUsed: 'hsl',
        accessibilityNotes: accessibilityNotes,
        recommendations,
        exportFormats,
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Error in sort_colors tool', { error: error as Error });

    return createErrorResponse(
      'sort_colors',
      'PROCESSING_ERROR',
      'An error occurred while sorting colors',
      executionTime,
      {
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        suggestions: [
          'Check that all input colors are valid',
          'Verify sort criteria and direction parameters',
          'Try with fewer colors if processing large sets',
        ],
      }
    );
  }
}

function getMostCommonHueRange(colors: ColorWithMetrics[]): string {
  const ranges = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    cyan: 0,
    blue: 0,
    purple: 0,
    pink: 0,
  };

  colors.forEach(color => {
    const hue = color.hue;
    if ((hue >= 0 && hue < 15) || hue >= 345) ranges.red++;
    else if (hue >= 15 && hue < 45) ranges.orange++;
    else if (hue >= 45 && hue < 75) ranges.yellow++;
    else if (hue >= 75 && hue < 165) ranges.green++;
    else if (hue >= 165 && hue < 195) ranges.cyan++;
    else if (hue >= 195 && hue < 255) ranges.blue++;
    else if (hue >= 255 && hue < 315) ranges.purple++;
    else if (hue >= 315 && hue < 345) ranges.pink++;
  });

  return Object.entries(ranges).reduce((a, b) =>
    ranges[a[0] as keyof typeof ranges] > ranges[b[0] as keyof typeof ranges]
      ? a
      : b
  )[0];
}

export const sortColorsTool: ToolHandler = {
  name: 'sort_colors',
  description:
    'Sort colors by various properties including hue, saturation, lightness, brightness, temperature, or frequency. Optionally group similar colors together.',
  parameters: {
    type: 'object',
    properties: {
      colors: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 100,
        description: 'Array of colors to sort (2-100 colors)',
      },
      sort_by: {
        type: 'string',
        enum: [
          'hue',
          'saturation',
          'lightness',
          'brightness',
          'temperature',
          'frequency',
        ],
        description: 'Property to sort by',
      },
      direction: {
        type: 'string',
        enum: ['ascending', 'descending'],
        default: 'ascending',
        description: 'Sort direction',
      },
      group_similar: {
        type: 'boolean',
        default: false,
        description: 'Group similar colors together',
      },
    },
    required: ['colors', 'sort_by'],
  },
  handler: sortColorsHandler,
};
