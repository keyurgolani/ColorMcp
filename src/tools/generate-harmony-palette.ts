/**
 * MCP tool for generating color harmony palettes based on color theory principles
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import {
  PaletteGenerator,
  HarmonyType,
  HarmonyGenerationOptions,
} from '../color/palette-generator';
import { UnifiedColor } from '../color/unified-color';
import { logger } from '../utils/logger';

interface GenerateHarmonyPaletteParams {
  base_color: string;
  harmony_type: HarmonyType;
  count?: number;
  variation?: number;
}

export const generateHarmonyPaletteTool: ToolHandler = {
  name: 'generate_harmony_palette',
  description:
    'Generate color palettes based on color theory harmony principles including complementary, triadic, analogous, and other harmony types',
  parameters: {
    type: 'object',
    properties: {
      base_color: {
        type: 'string',
        description:
          'Base color for harmony generation (hex, rgb, hsl, or named color)',
      },
      harmony_type: {
        type: 'string',
        enum: [
          'monochromatic',
          'analogous',
          'complementary',
          'triadic',
          'tetradic',
          'split_complementary',
          'double_complementary',
        ],
        description: 'Type of color harmony to generate',
      },
      count: {
        type: 'number',
        minimum: 3,
        maximum: 10,
        description: 'Number of colors to generate (default: 5)',
      },
      variation: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Amount of variation to apply (0-100, default: 20)',
      },
    },
    required: ['base_color', 'harmony_type'],
  },

  async handler(params: unknown): Promise<ToolResponse | ErrorResponse> {
    const startTime = performance.now();

    try {
      // Validate and parse parameters
      const validatedParams = validateParams(params);

      logger.info(
        `Generating harmony palette: ${validatedParams.harmony_type} from ${validatedParams.base_color}`,
        {
          tool: 'generate_harmony_palette',
        }
      );

      // Generate the harmony palette
      const options: HarmonyGenerationOptions = {
        baseColor: validatedParams.base_color,
        harmonyType: validatedParams.harmony_type,
        count: validatedParams.count || 5,
        variation: validatedParams.variation || 20,
      };

      const palette = PaletteGenerator.generateHarmonyPalette(options);

      // Convert colors to response format
      const colorsData = palette.colors.map((color, index) => ({
        index,
        hex: color.hex,
        rgb: color.rgb,
        hsl: color.hsl,
        hsv: color.hsv,
        metadata: color.metadata,
      }));

      // Generate accessibility notes and recommendations
      const accessibilityNotes: string[] = [];
      const recommendations: string[] = [];

      // Check overall palette accessibility
      if (palette.metadata.accessibilityScore < 70) {
        accessibilityNotes.push('This palette may have accessibility concerns');
        recommendations.push(
          'Consider adjusting colors for better contrast ratios'
        );
      }

      if (palette.metadata.diversity < 50) {
        recommendations.push(
          'Consider increasing variation for more diverse palette'
        );
      }

      if (palette.metadata.harmonyScore < 80) {
        recommendations.push(
          'Some colors may not perfectly follow color theory principles'
        );
      }

      // Add harmony-specific recommendations
      switch (validatedParams.harmony_type) {
        case 'complementary':
          recommendations.push(
            'Use the base and complement colors for high contrast elements'
          );
          break;
        case 'triadic':
          recommendations.push(
            'Triadic colors work well for vibrant, balanced designs'
          );
          break;
        case 'analogous':
          recommendations.push(
            'Analogous colors create harmonious, calming effects'
          );
          break;
        case 'monochromatic':
          recommendations.push(
            'Monochromatic palettes are elegant but may need accent colors'
          );
          break;
      }

      const endTime = performance.now();
      const executionTime = Math.round(endTime - startTime);

      // Generate export formats
      const exportFormats = {
        css: generateCSSExport(palette.colors),
        scss: generateSCSSExport(palette.colors),
        tailwind: generateTailwindExport(palette.colors),
        json: {
          colors: colorsData,
          metadata: palette.metadata,
        },
      };

      const response: ToolResponse = {
        success: true,
        data: {
          palette: colorsData,
          metadata: {
            ...palette.metadata,
            color_count: palette.colors.length,
            harmony_description: getHarmonyDescription(
              validatedParams.harmony_type
            ),
          },
          relationships: palette.metadata.relationships,
          scores: {
            diversity: palette.metadata.diversity,
            harmony: palette.metadata.harmonyScore,
            accessibility: palette.metadata.accessibilityScore,
          },
        },
        metadata: {
          execution_time: executionTime,
          tool: 'generate_harmony_palette',
          timestamp: new Date().toISOString(),
          color_space_used: 'HSL',
          accessibility_notes: accessibilityNotes,
          recommendations,
        },
        export_formats: exportFormats,
      };

      logger.info(
        `Harmony palette generated successfully: ${palette.colors.length} colors`,
        {
          tool: 'generate_harmony_palette',
          executionTime,
        }
      );

      return response;
    } catch (error) {
      const endTime = performance.now();
      const executionTime = Math.round(endTime - startTime);

      logger.error('Error generating harmony palette', {
        tool: 'generate_harmony_palette',
        executionTime,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });

      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to generate harmony palette',
          suggestions: [
            'Ensure base_color is a valid color format (hex, rgb, hsl, or named color)',
            'Check that harmony_type is one of the supported types',
            'Verify count is between 3 and 10',
            'Ensure variation is between 0 and 100',
          ],
        },
        metadata: {
          execution_time: executionTime,
          tool: 'generate_harmony_palette',
          timestamp: new Date().toISOString(),
        },
      };

      return errorResponse;
    }
  },
};

/**
 * Validate and parse input parameters
 */
function validateParams(params: unknown): GenerateHarmonyPaletteParams {
  if (!params || typeof params !== 'object') {
    throw new Error('Parameters must be an object');
  }

  const p = params as Record<string, unknown>;

  if (!p['base_color'] || typeof p['base_color'] !== 'string') {
    throw new Error('base_color is required and must be a string');
  }

  if (!p['harmony_type'] || typeof p['harmony_type'] !== 'string') {
    throw new Error('harmony_type is required and must be a string');
  }

  const validHarmonyTypes: HarmonyType[] = [
    'monochromatic',
    'analogous',
    'complementary',
    'triadic',
    'tetradic',
    'split_complementary',
    'double_complementary',
  ];

  if (!validHarmonyTypes.includes(p['harmony_type'] as HarmonyType)) {
    throw new Error(
      `Invalid harmony_type. Must be one of: ${validHarmonyTypes.join(', ')}`
    );
  }

  // Validate base color
  if (!UnifiedColor.isValidColor(p['base_color'])) {
    throw new Error(`Invalid base_color: ${p['base_color']}`);
  }

  const result: GenerateHarmonyPaletteParams = {
    base_color: p['base_color'],
    harmony_type: p['harmony_type'] as HarmonyType,
  };

  if (p['count'] !== undefined) {
    if (typeof p['count'] !== 'number' || p['count'] < 3 || p['count'] > 10) {
      throw new Error('count must be a number between 3 and 10');
    }
    result.count = Math.round(p['count']);
  }

  if (p['variation'] !== undefined) {
    if (
      typeof p['variation'] !== 'number' ||
      p['variation'] < 0 ||
      p['variation'] > 100
    ) {
      throw new Error('variation must be a number between 0 and 100');
    }
    result.variation = p['variation'];
  }

  return result;
}

/**
 * Generate CSS export format
 */
function generateCSSExport(colors: UnifiedColor[]): string {
  const cssVars = colors
    .map((color, index) => `  --color-${index + 1}: ${color.hex};`)
    .join('\n');

  return `:root {\n${cssVars}\n}`;
}

/**
 * Generate SCSS export format
 */
function generateSCSSExport(colors: UnifiedColor[]): string {
  return colors
    .map((color, index) => `$color-${index + 1}: ${color.hex};`)
    .join('\n');
}

/**
 * Generate Tailwind CSS export format
 */
function generateTailwindExport(colors: UnifiedColor[]): string {
  const colorEntries = colors
    .map((color, index) => `    'palette-${index + 1}': '${color.hex}',`)
    .join('\n');

  return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${colorEntries}\n      }\n    }\n  }\n}`;
}

/**
 * Get human-readable description of harmony type
 */
function getHarmonyDescription(harmonyType: HarmonyType): string {
  const descriptions: Record<HarmonyType, string> = {
    monochromatic:
      'Uses variations of a single hue with different saturation and lightness values',
    analogous: 'Uses colors that are adjacent to each other on the color wheel',
    complementary:
      'Uses colors that are opposite each other on the color wheel',
    triadic:
      'Uses three colors evenly spaced around the color wheel (120° apart)',
    tetradic:
      'Uses four colors evenly spaced around the color wheel (90° apart)',
    split_complementary:
      'Uses a base color and two colors adjacent to its complement',
    double_complementary: 'Uses two pairs of complementary colors',
  };

  return descriptions[harmonyType] || 'Unknown harmony type';
}
