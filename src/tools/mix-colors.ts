/**
 * Color mixing tool with configurable ratios and blend modes
 */

import Joi from 'joi';
import { UnifiedColor } from '../color/unified-color';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from '../utils/logger';

interface MixColorsParams {
  colors: string[];
  ratios?: number[];
  blend_mode?:
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'color_burn'
    | 'color_dodge'
    | 'darken'
    | 'lighten'
    | 'difference'
    | 'exclusion';
  color_space?: 'rgb' | 'hsl' | 'lab' | 'lch';
}

const mixColorsSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string().required())
    .min(2)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least 2 colors are required for mixing',
      'array.max': 'Maximum 10 colors can be mixed at once',
    }),
  ratios: Joi.array()
    .items(Joi.number().min(0).max(1))
    .optional()
    .custom((value, helpers) => {
      const colors = helpers.state.ancestors[0].colors;
      if (value && value.length !== colors.length) {
        return helpers.error('array.length');
      }
      const sum = value ? value.reduce((a: number, b: number) => a + b, 0) : 0;
      if (value && Math.abs(sum - 1) > 0.001) {
        return helpers.error('array.sum');
      }
      return value;
    })
    .messages({
      'array.length': 'Number of ratios must match number of colors',
      'array.sum': 'Ratios must sum to 1.0',
    }),
  blend_mode: Joi.string()
    .valid(
      'normal',
      'multiply',
      'screen',
      'overlay',
      'color_burn',
      'color_dodge',
      'darken',
      'lighten',
      'difference',
      'exclusion'
    )
    .default('normal'),
  color_space: Joi.string().valid('rgb', 'hsl', 'lab', 'lch').default('rgb'),
});

function mixColorsInRGB(
  colors: UnifiedColor[],
  ratios: number[]
): UnifiedColor {
  let r = 0,
    g = 0,
    b = 0,
    a = 0;

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const ratio = ratios[i];
    if (!color || ratio === undefined) continue;

    const rgb = color.rgb;
    r += rgb.r * ratio;
    g += rgb.g * ratio;
    b += rgb.b * ratio;
    a += (rgb.a || 1) * ratio;
  }

  return UnifiedColor.fromRgb(
    Math.round(Math.max(0, Math.min(255, r))),
    Math.round(Math.max(0, Math.min(255, g))),
    Math.round(Math.max(0, Math.min(255, b))),
    Math.max(0, Math.min(1, a))
  );
}

function mixColorsInHSL(
  colors: UnifiedColor[],
  ratios: number[]
): UnifiedColor {
  let h = 0,
    s = 0,
    l = 0,
    a = 0;
  let totalWeight = 0;

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const ratio = ratios[i];
    if (!color || ratio === undefined) continue;

    const hsl = color.hsl;
    // Handle hue mixing (circular average)
    const hueRad = (hsl.h * Math.PI) / 180;
    h += Math.cos(hueRad) * ratio;
    s += hsl.s * ratio;
    l += hsl.l * ratio;
    a += (hsl.a || 1) * ratio;
    totalWeight += ratio;
  }

  // Convert back to degrees
  const finalHue = (Math.atan2(0, h / totalWeight) * 180) / Math.PI;

  return UnifiedColor.fromHsl(
    finalHue < 0 ? finalHue + 360 : finalHue,
    Math.max(0, Math.min(100, s)),
    Math.max(0, Math.min(100, l)),
    Math.max(0, Math.min(1, a))
  );
}

function mixColorsInLAB(
  colors: UnifiedColor[],
  ratios: number[]
): UnifiedColor {
  let l = 0,
    a = 0,
    b = 0;

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const ratio = ratios[i];
    if (!color || ratio === undefined) continue;

    const lab = color.lab;
    l += lab.l * ratio;
    a += lab.a * ratio;
    b += lab.b * ratio;
  }

  return UnifiedColor.fromLab(l, a, b);
}

function mixColorsInLCH(
  colors: UnifiedColor[],
  ratios: number[]
): UnifiedColor {
  let l = 0,
    c = 0,
    h = 0;

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const ratio = ratios[i];
    if (!color || ratio === undefined) continue;

    const lch = color.lch;
    l += lch.l * ratio;
    c += lch.c * ratio;

    // Handle hue mixing (circular average)
    const hueRad = (lch.h * Math.PI) / 180;
    h += Math.cos(hueRad) * ratio;
  }

  // Convert back to degrees
  const finalHue = (Math.atan2(0, h) * 180) / Math.PI;

  return UnifiedColor.fromLch(l, c, finalHue < 0 ? finalHue + 360 : finalHue);
}

function applyBlendMode(
  baseColor: UnifiedColor,
  overlayColor: UnifiedColor,
  mode: string
): UnifiedColor {
  const base = baseColor.rgb;
  const overlay = overlayColor.rgb;

  let r: number, g: number, b: number;

  switch (mode) {
    case 'multiply':
      r = (base.r * overlay.r) / 255;
      g = (base.g * overlay.g) / 255;
      b = (base.b * overlay.b) / 255;
      break;

    case 'screen':
      r = 255 - ((255 - base.r) * (255 - overlay.r)) / 255;
      g = 255 - ((255 - base.g) * (255 - overlay.g)) / 255;
      b = 255 - ((255 - base.b) * (255 - overlay.b)) / 255;
      break;

    case 'overlay':
      r =
        base.r < 128
          ? (2 * base.r * overlay.r) / 255
          : 255 - (2 * (255 - base.r) * (255 - overlay.r)) / 255;
      g =
        base.g < 128
          ? (2 * base.g * overlay.g) / 255
          : 255 - (2 * (255 - base.g) * (255 - overlay.g)) / 255;
      b =
        base.b < 128
          ? (2 * base.b * overlay.b) / 255
          : 255 - (2 * (255 - base.b) * (255 - overlay.b)) / 255;
      break;

    case 'darken':
      r = Math.min(base.r, overlay.r);
      g = Math.min(base.g, overlay.g);
      b = Math.min(base.b, overlay.b);
      break;

    case 'lighten':
      r = Math.max(base.r, overlay.r);
      g = Math.max(base.g, overlay.g);
      b = Math.max(base.b, overlay.b);
      break;

    case 'difference':
      r = Math.abs(base.r - overlay.r);
      g = Math.abs(base.g - overlay.g);
      b = Math.abs(base.b - overlay.b);
      break;

    case 'exclusion':
      r = base.r + overlay.r - (2 * base.r * overlay.r) / 255;
      g = base.g + overlay.g - (2 * base.g * overlay.g) / 255;
      b = base.b + overlay.b - (2 * base.b * overlay.b) / 255;
      break;

    case 'color_burn':
      r =
        overlay.r === 0
          ? 0
          : Math.max(0, 255 - ((255 - base.r) * 255) / overlay.r);
      g =
        overlay.g === 0
          ? 0
          : Math.max(0, 255 - ((255 - base.g) * 255) / overlay.g);
      b =
        overlay.b === 0
          ? 0
          : Math.max(0, 255 - ((255 - base.b) * 255) / overlay.b);
      break;

    case 'color_dodge':
      r =
        overlay.r === 255
          ? 255
          : Math.min(255, (base.r * 255) / (255 - overlay.r));
      g =
        overlay.g === 255
          ? 255
          : Math.min(255, (base.g * 255) / (255 - overlay.g));
      b =
        overlay.b === 255
          ? 255
          : Math.min(255, (base.b * 255) / (255 - overlay.b));
      break;

    default: // normal
      r = overlay.r;
      g = overlay.g;
      b = overlay.b;
  }

  return UnifiedColor.fromRgb(
    Math.round(Math.max(0, Math.min(255, r))),
    Math.round(Math.max(0, Math.min(255, g))),
    Math.round(Math.max(0, Math.min(255, b)))
  );
}

async function mixColorsHandler(
  params: unknown
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = mixColorsSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'mix_colors',
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
      ratios,
      blend_mode,
      color_space,
    } = value as MixColorsParams;

    // Parse colors
    const colors: UnifiedColor[] = [];
    for (let i = 0; i < colorStrings.length; i++) {
      const colorString = colorStrings[i];
      if (!colorString) continue;

      try {
        colors.push(new UnifiedColor(colorString));
      } catch (error) {
        return createErrorResponse(
          'mix_colors',
          'INVALID_COLOR',
          `Invalid color at index ${i}: ${colorStrings[i]}`,
          Date.now() - startTime,
          {
            details: {
              colorIndex: i,
              providedColor: colorStrings[i],
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

    // Calculate ratios if not provided
    const finalRatios = ratios || colors.map(() => 1 / colors.length);

    // Mix colors based on color space
    let mixedColor: UnifiedColor;

    if (blend_mode === 'normal') {
      // Use color space mixing for normal blend mode
      switch (color_space) {
        case 'hsl':
          mixedColor = mixColorsInHSL(colors, finalRatios);
          break;
        case 'lab':
          mixedColor = mixColorsInLAB(colors, finalRatios);
          break;
        case 'lch':
          mixedColor = mixColorsInLCH(colors, finalRatios);
          break;
        default: // rgb
          mixedColor = mixColorsInRGB(colors, finalRatios);
      }
    } else {
      // Apply blend modes sequentially for non-normal modes
      if (colors.length === 0) {
        throw new Error('No colors provided for mixing');
      }
      mixedColor = colors[0]!;
      for (let i = 1; i < colors.length; i++) {
        const nextColor = colors[i];
        if (nextColor && blend_mode) {
          mixedColor = applyBlendMode(mixedColor, nextColor, blend_mode);
        }
      }
    }

    const executionTime = Date.now() - startTime;

    // Generate accessibility notes
    const accessibilityNotes: string[] = [];
    const contrastWhite = mixedColor.getContrastRatio('#ffffff');
    const contrastBlack = mixedColor.getContrastRatio('#000000');

    if (contrastWhite >= 4.5) {
      accessibilityNotes.push(
        'Mixed color has good contrast against white backgrounds'
      );
    }
    if (contrastBlack >= 4.5) {
      accessibilityNotes.push(
        'Mixed color has good contrast against black backgrounds'
      );
    }
    if (contrastWhite < 3 && contrastBlack < 3) {
      accessibilityNotes.push(
        'Mixed color may have poor contrast - consider adjusting for accessibility'
      );
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (blend_mode !== 'normal' && colors.length > 2) {
      recommendations.push(
        'For complex blending with multiple colors, consider mixing pairs sequentially'
      );
    }
    if (color_space === 'lab' || color_space === 'lch') {
      recommendations.push(
        'LAB/LCH color space provides perceptually uniform mixing'
      );
    }

    return createSuccessResponse(
      'mix_colors',
      {
        mixed_color: {
          hex: mixedColor.hex,
          rgb: mixedColor.rgb,
          hsl: mixedColor.hsl,
          hsv: mixedColor.hsv,
        },
        input_colors: colorStrings,
        ratios: finalRatios,
        blend_mode,
        color_space,
        mixing_details: {
          total_colors: colors.length,
          effective_ratios: finalRatios,
          color_space_used: color_space,
          blend_mode_used: blend_mode,
        },
      },
      executionTime,
      {
        colorSpaceUsed: color_space || 'rgb',
        accessibilityNotes: accessibilityNotes,
        recommendations,
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Error in mix_colors tool', { error: error as Error });

    return createErrorResponse(
      'mix_colors',
      'PROCESSING_ERROR',
      'An error occurred while mixing colors',
      executionTime,
      {
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        suggestions: [
          'Check that all input colors are valid',
          'Verify ratios sum to 1.0 if provided',
          'Try with fewer colors or simpler blend modes',
        ],
      }
    );
  }
}

export const mixColorsTool: ToolHandler = {
  name: 'mix_colors',
  description:
    'Mix multiple colors with specified ratios and blend modes. Supports various color spaces and blend modes for different mixing effects.',
  parameters: {
    type: 'object',
    properties: {
      colors: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 10,
        description: 'Array of colors to mix (2-10 colors)',
      },
      ratios: {
        type: 'array',
        items: { type: 'number', minimum: 0, maximum: 1 },
        description: 'Optional mixing ratios for each color (must sum to 1.0)',
      },
      blend_mode: {
        type: 'string',
        enum: [
          'normal',
          'multiply',
          'screen',
          'overlay',
          'color_burn',
          'color_dodge',
          'darken',
          'lighten',
          'difference',
          'exclusion',
        ],
        default: 'normal',
        description: 'Blend mode for color mixing',
      },
      color_space: {
        type: 'string',
        enum: ['rgb', 'hsl', 'lab', 'lch'],
        default: 'rgb',
        description: 'Color space for mixing calculations',
      },
    },
    required: ['colors'],
  },
  handler: mixColorsHandler,
};
