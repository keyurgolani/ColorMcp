/**
 * Generate color variations (tints, shades, tones) with mathematical precision
 */

import Joi from 'joi';
import { UnifiedColor } from '../color/unified-color';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';

interface GenerateVariationsParams {
  base_color: string;
  variation_type: 'tints' | 'shades' | 'tones' | 'all';
  steps: number;
  intensity: number;
}

interface ColorVariation {
  hex: string;
  rgb: string;
  hsl: string;
  step: number;
  factor: number;
}

interface VariationAnalysis {
  count: number;
  lightness_range: {
    min: number;
    max: number;
  };
  saturation_range: {
    min: number;
    max: number;
  };
  accessibility_compliant: number;
}

interface VariationResult {
  base_color?: {
    hex: string;
    rgb: string;
    hsl: string;
    hsv: string;
  };
  variation_type?: string;
  variations: ColorVariation[];
  analysis?: VariationAnalysis;
  total_variations: number;
}

interface AllVariationsAnalysis {
  tints: VariationAnalysis;
  shades: VariationAnalysis;
  tones: VariationAnalysis;
}

interface AllVariationsResult {
  base_color?: {
    hex: string;
    rgb: string;
    hsl: string;
    hsv: string;
  };
  variations: {
    tints: Array<{
      hex: string;
      rgb: string;
      hsl: string;
      hsv: string;
    }>;
    shades: Array<{
      hex: string;
      rgb: string;
      hsl: string;
      hsv: string;
    }>;
    tones: Array<{
      hex: string;
      rgb: string;
      hsl: string;
      hsv: string;
    }>;
  };
  total_variations: number;
  analysis?: AllVariationsAnalysis;
}

interface ExportFormats {
  css?: string;
  scss?: string;
  json?: {
    base_color: string;
    variation_type: string;
    variations: string[];
  };
}

const generateVariationsSchema = Joi.object({
  base_color: Joi.string().required().messages({
    'string.empty': 'Base color is required',
  }),
  variation_type: Joi.string()
    .valid('tints', 'shades', 'tones', 'all')
    .required()
    .messages({
      'any.only': 'Variation type must be one of: tints, shades, tones, all',
    }),
  steps: Joi.number().integer().min(3).max(20).default(10).messages({
    'number.min': 'Minimum 3 steps required',
    'number.max': 'Maximum 20 steps allowed',
  }),
  intensity: Joi.number().min(0).max(100).default(50).messages({
    'number.min': 'Intensity must be between 0 and 100',
    'number.max': 'Intensity must be between 0 and 100',
  }),
});

function generateTints(
  baseColor: UnifiedColor,
  steps: number,
  intensity: number
): UnifiedColor[] {
  const tints: UnifiedColor[] = [];
  const hsl = baseColor.hsl;

  // Generate tints by increasing lightness towards white
  for (let i = 0; i < steps; i++) {
    const factor = (i / (steps - 1)) * (intensity / 100);
    const newLightness = hsl.l + (100 - hsl.l) * factor;

    try {
      const tint = UnifiedColor.fromHsl(
        hsl.h,
        hsl.s,
        Math.min(100, Math.max(0, newLightness)),
        hsl.a
      );
      tints.push(tint);
    } catch {
      // Skip invalid colors
      continue;
    }
  }

  return tints;
}

function generateShades(
  baseColor: UnifiedColor,
  steps: number,
  intensity: number
): UnifiedColor[] {
  const shades: UnifiedColor[] = [];
  const hsl = baseColor.hsl;

  // Generate shades by decreasing lightness towards black
  for (let i = 0; i < steps; i++) {
    const factor = (i / (steps - 1)) * (intensity / 100);
    const newLightness = hsl.l * (1 - factor);

    try {
      const shade = UnifiedColor.fromHsl(
        hsl.h,
        hsl.s,
        Math.min(100, Math.max(0, newLightness)),
        hsl.a
      );
      shades.push(shade);
    } catch {
      // Skip invalid colors
      continue;
    }
  }

  return shades;
}

function generateTones(
  baseColor: UnifiedColor,
  steps: number,
  intensity: number
): UnifiedColor[] {
  const tones: UnifiedColor[] = [];
  const hsl = baseColor.hsl;

  // Generate tones by decreasing saturation towards gray
  for (let i = 0; i < steps; i++) {
    const factor = (i / (steps - 1)) * (intensity / 100);
    const newSaturation = hsl.s * (1 - factor);

    try {
      const tone = UnifiedColor.fromHsl(
        hsl.h,
        Math.min(100, Math.max(0, newSaturation)),
        hsl.l,
        hsl.a
      );
      tones.push(tone);
    } catch {
      // Skip invalid colors
      continue;
    }
  }

  return tones;
}

function generateAllVariations(
  baseColor: UnifiedColor,
  steps: number,
  intensity: number
) {
  return {
    tints: generateTints(baseColor, steps, intensity),
    shades: generateShades(baseColor, steps, intensity),
    tones: generateTones(baseColor, steps, intensity),
  };
}

function analyzeVariations(
  variations: UnifiedColor[],
  _type: string
): VariationAnalysis {
  if (variations.length === 0) {
    return {
      count: 0,
      lightness_range: { min: 0, max: 0 },
      saturation_range: { min: 0, max: 0 },
      accessibility_compliant: 0,
    };
  }

  const analysis: VariationAnalysis = {
    count: variations.length,
    lightness_range: {
      min: Math.min(...variations.map(c => c.hsl.l)),
      max: Math.max(...variations.map(c => c.hsl.l)),
    },
    saturation_range: {
      min: Math.min(...variations.map(c => c.hsl.s)),
      max: Math.max(...variations.map(c => c.hsl.s)),
    },
    accessibility_compliant: variations.filter(c => {
      const contrastWhite = c.getContrastRatio('#ffffff');
      const contrastBlack = c.getContrastRatio('#000000');
      return Math.max(contrastWhite, contrastBlack) >= 4.5;
    }).length,
  };

  return analysis;
}

async function generateVariationsHandler(
  params: unknown
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = generateVariationsSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'generate_color_variations',
        'INVALID_PARAMETERS',
        `Invalid parameters: ${error.details.map(d => d.message).join(', ')}`,
        Date.now() - startTime,
        {
          details: error.details,
        }
      );
    }

    const { base_color, variation_type, steps, intensity } =
      value as GenerateVariationsParams;

    // Parse base color
    let baseColor: UnifiedColor;
    try {
      baseColor = new UnifiedColor(base_color);
    } catch (error) {
      return createErrorResponse(
        'generate_color_variations',
        'INVALID_COLOR',
        `Invalid base color: ${base_color}`,
        Date.now() - startTime,
        {
          details: {
            providedColor: base_color,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          suggestions: [
            'Ensure the base color is in valid format (hex, rgb, hsl, etc.)',
            'Check color syntax and values',
          ],
        }
      );
    }

    // Generate variations based on type
    let result: VariationResult | AllVariationsResult;
    let totalVariations = 0;

    if (variation_type === 'all') {
      const allVariations = generateAllVariations(baseColor, steps, intensity);
      result = {
        base_color: {
          hex: baseColor.hex,
          rgb: `rgb(${baseColor.rgb.r}, ${baseColor.rgb.g}, ${baseColor.rgb.b})`,
          hsl: `hsl(${baseColor.hsl.h}, ${baseColor.hsl.s}%, ${baseColor.hsl.l}%)`,
          hsv: `hsv(${baseColor.hsv.h}, ${baseColor.hsv.s}%, ${baseColor.hsv.v}%)`,
        },
        variations: {
          tints: allVariations.tints.map(c => ({
            hex: c.hex,
            rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
            hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
            hsv: `hsv(${c.hsv.h}, ${c.hsv.s}%, ${c.hsv.v}%)`,
          })),
          shades: allVariations.shades.map(c => ({
            hex: c.hex,
            rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
            hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
            hsv: `hsv(${c.hsv.h}, ${c.hsv.s}%, ${c.hsv.v}%)`,
          })),
          tones: allVariations.tones.map(c => ({
            hex: c.hex,
            rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
            hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
            hsv: `hsv(${c.hsv.h}, ${c.hsv.s}%, ${c.hsv.v}%)`,
          })),
        },
        total_variations:
          allVariations.tints.length +
          allVariations.shades.length +
          allVariations.tones.length,
        analysis: {
          tints: analyzeVariations(allVariations.tints, 'tints'),
          shades: analyzeVariations(allVariations.shades, 'shades'),
          tones: analyzeVariations(allVariations.tones, 'tones'),
        },
      };
      totalVariations =
        allVariations.tints.length +
        allVariations.shades.length +
        allVariations.tones.length;
    } else {
      let variations: UnifiedColor[] = [];

      switch (variation_type) {
        case 'tints':
          variations = generateTints(baseColor, steps, intensity);
          break;
        case 'shades':
          variations = generateShades(baseColor, steps, intensity);
          break;
        case 'tones':
          variations = generateTones(baseColor, steps, intensity);
          break;
      }

      result = {
        base_color: {
          hex: baseColor.hex,
          rgb: `rgb(${baseColor.rgb.r}, ${baseColor.rgb.g}, ${baseColor.rgb.b})`,
          hsl: `hsl(${baseColor.hsl.h}, ${baseColor.hsl.s}%, ${baseColor.hsl.l}%)`,
          hsv: `hsv(${baseColor.hsv.h}, ${baseColor.hsv.s}%, ${baseColor.hsv.v}%)`,
        },
        variation_type,
        variations: variations.map((c, index) => ({
          hex: c.hex,
          rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
          hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
          hsv: `hsv(${c.hsv.h}, ${c.hsv.s}%, ${c.hsv.v}%)`,
          step: index + 1,
          factor: (index / (variations.length - 1)) * (intensity / 100),
        })),
        total_variations: variations.length,
        analysis: analyzeVariations(variations, variation_type),
      };
      totalVariations = variations.length;
    }

    const executionTime = Date.now() - startTime;

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    const baseHsl = baseColor.hsl;

    if (variation_type === 'tints' || variation_type === 'all') {
      accessibilityNotes.push(
        'Tints (lighter variations) are good for backgrounds and subtle accents'
      );
    }
    if (variation_type === 'shades' || variation_type === 'all') {
      accessibilityNotes.push(
        'Shades (darker variations) work well for text and emphasis'
      );
    }
    if (variation_type === 'tones' || variation_type === 'all') {
      accessibilityNotes.push(
        'Tones (desaturated variations) provide subtle color variations'
      );
    }

    if (baseHsl.s < 20) {
      accessibilityNotes.push(
        'Low saturation base color may produce subtle variations'
      );
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (intensity < 30) {
      recommendations.push(
        'Low intensity creates subtle variations - increase for more dramatic effects'
      );
    }
    if (intensity > 80) {
      recommendations.push(
        'High intensity creates strong variations - reduce for more subtle effects'
      );
    }
    if (steps < 5) {
      recommendations.push(
        'Consider more steps for smoother color transitions'
      );
    }
    recommendations.push(
      'Use tints for backgrounds, shades for text, and tones for subtle variations'
    );

    // Add export formats
    const exportFormats: ExportFormats = {};

    if (
      variation_type !== 'all' &&
      Array.isArray((result as VariationResult).variations)
    ) {
      const variations = (result as VariationResult).variations;
      exportFormats.css = variations
        .map((c, i: number) => `--color-${variation_type}-${i + 1}: ${c.hex};`)
        .join('\n');

      exportFormats.scss = variations
        .map((c, i: number) => `$color-${variation_type}-${i + 1}: ${c.hex};`)
        .join('\n');

      exportFormats.json = {
        base_color: base_color,
        variation_type,
        variations: variations.map(c => c.hex),
      };
    }

    return createSuccessResponse(
      'generate_color_variations',
      {
        ...result,
        generation_details: {
          steps,
          intensity,
          total_variations: totalVariations,
          variation_type,
        },
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
    logger.error('Error in generate_color_variations tool', {
      error: error as Error,
    });

    return createErrorResponse(
      'generate_color_variations',
      'PROCESSING_ERROR',
      'An error occurred while generating color variations',
      executionTime,
      {
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        suggestions: [
          'Check that the base color is valid',
          'Verify parameters are within valid ranges',
          'Try with different intensity or step values',
        ],
      }
    );
  }
}

export const generateColorVariationsTool: ToolHandler = {
  name: 'generate_color_variations',
  description:
    'Generate tints, shades, and tones of a base color with mathematical precision. Tints add white, shades add black, and tones add gray.',
  parameters: {
    type: 'object',
    properties: {
      base_color: {
        type: 'string',
        description: 'Base color for generating variations',
      },
      variation_type: {
        type: 'string',
        enum: ['tints', 'shades', 'tones', 'all'],
        description: 'Type of variations to generate',
      },
      steps: {
        type: 'number',
        minimum: 3,
        maximum: 20,
        default: 10,
        description: 'Number of variation steps (3-20)',
      },
      intensity: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        default: 50,
        description: 'Variation intensity percentage (0-100)',
      },
    },
    required: ['base_color', 'variation_type'],
  },
  handler: generateVariationsHandler,
};
