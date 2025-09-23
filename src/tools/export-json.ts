/**
 * Export JSON tool - Generate JSON format for programmatic use and API integration
 */

import Joi from 'joi';
import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { UnifiedColor } from '../color/unified-color';
import { getVersion } from '../version';

const exportJsonSchema = Joi.object({
  colors: Joi.array()
    .items(Joi.string())
    .min(1)
    .max(100)
    .required()
    .description('Array of colors to export'),

  format: Joi.string()
    .valid('simple', 'detailed', 'api', 'design_tokens')
    .default('detailed')
    .description('JSON format structure'),

  include_metadata: Joi.boolean()
    .default(true)
    .description('Include color analysis metadata'),

  include_accessibility: Joi.boolean()
    .default(true)
    .description('Include accessibility information'),

  include_variations: Joi.boolean()
    .default(false)
    .description('Include color variations (tints, shades)'),

  semantic_names: Joi.array()
    .items(Joi.string())
    .description('Optional semantic names for colors'),

  group_name: Joi.string().description('Name for the color group/palette'),

  version: Joi.string()
    .default('1.0.0')
    .description('Version number for the palette'),

  pretty_print: Joi.boolean()
    .default(true)
    .description('Format JSON with indentation'),
});

interface ExportJsonParams {
  colors: string[];
  format?: 'simple' | 'detailed' | 'api' | 'design_tokens';
  include_metadata?: boolean;
  include_accessibility?: boolean;
  include_variations?: boolean;
  semantic_names?: string[];
  group_name?: string;
  version?: string;
  pretty_print?: boolean;
}

interface ColorData {
  id: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsv: { h: number; s: number; v: number };
  metadata?: {
    brightness: number;
    temperature: string;
    is_light: boolean;
    is_dark: boolean;
  };
  accessibility?: {
    contrast_white: number;
    contrast_black: number;
    wcag_aa_normal: boolean;
    wcag_aaa_normal: boolean;
  };
  variations?: {
    tints: Array<{ level: number; hex: string; lightness: number }>;
    shades: Array<{ level: number; hex: string; lightness: number }>;
    tones: Array<{ level: number; hex: string; saturation: number }>;
  };
}

interface DetailedJsonResult {
  palette: {
    name: string;
    version: string;
    created: string;
    color_count: number;
  };
  colors: ColorData[];
}

async function exportJson(
  params: ExportJsonParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value: validatedParams } = exportJsonSchema.validate(params);
    if (error) {
      return createErrorResponse(
        'export_json',
        'INVALID_PARAMETERS',
        `Invalid parameters: ${error.details.map(d => d.message).join(', ')}`,
        Date.now() - startTime
      );
    }

    // Parse colors
    const colors: UnifiedColor[] = [];
    for (const colorStr of validatedParams.colors) {
      try {
        const color = new UnifiedColor(colorStr);
        colors.push(color);
      } catch {
        return createErrorResponse(
          'export_json',
          'INVALID_COLOR',
          `Invalid color format: ${colorStr}`,
          Date.now() - startTime,
          {
            details: { provided: colorStr },
            suggestions: [
              'Use hex format like #FF0000',
              'Use RGB format like rgb(255, 0, 0)',
              'Use HSL format like hsl(0, 100%, 50%)',
            ],
          }
        );
      }
    }

    // Generate JSON based on format
    const jsonData = generateJSON(colors, validatedParams);
    const jsonString = validatedParams.pretty_print
      ? JSON.stringify(jsonData, null, 2)
      : JSON.stringify(jsonData);

    // Generate additional export formats
    const exportFormats = {
      json: jsonData,
      css: generateCSSFromJSON(jsonData),
      scss: generateSCSSFromJSON(jsonData),
    };

    const executionTime = Date.now() - startTime;

    return createSuccessResponse(
      'export_json',
      {
        json_output: jsonString,
        format: validatedParams.format,
        color_count: colors.length,
        includes_metadata: validatedParams.include_metadata,
        includes_accessibility: validatedParams.include_accessibility,
        includes_variations: validatedParams.include_variations,
        file_size: jsonString.length,
      },
      executionTime,
      {
        recommendations: [
          'Use the detailed format for comprehensive color information',
          'Consider the API format for web service integration',
          'Use design tokens format for design system integration',
        ],
        exportFormats,
      }
    );
  } catch (error) {
    return createErrorResponse(
      'export_json',
      'PROCESSING_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      Date.now() - startTime
    );
  }
}

/**
 * Generate JSON data based on format
 */
function generateJSON(
  colors: UnifiedColor[],
  params: ExportJsonParams
): Record<string, unknown> | DetailedJsonResult {
  const { format } = params;

  switch (format) {
    case 'simple':
      return generateSimpleJSON(colors, params.semantic_names);

    case 'detailed':
      return generateDetailedJSON(colors, params);

    case 'api':
      return generateAPIJSON(colors, params);

    case 'design_tokens':
      return generateDesignTokensJSON(colors, params);

    default:
      return generateDetailedJSON(colors, params);
  }
}

/**
 * Generate simple JSON format (just color values)
 */
function generateSimpleJSON(
  colors: UnifiedColor[],
  semantic_names?: string[]
): Record<string, string> {
  const result: Record<string, string> = {};

  colors.forEach((color, index) => {
    const name = semantic_names?.[index] || `color-${index + 1}`;
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    result[safeName] = color.hex;
  });

  return result;
}

/**
 * Generate detailed JSON format
 */
function generateDetailedJSON(
  colors: UnifiedColor[],
  params: ExportJsonParams
): DetailedJsonResult {
  const {
    include_metadata,
    include_accessibility,
    include_variations,
    semantic_names,
    group_name,
    version,
  } = params;

  const result: DetailedJsonResult = {
    palette: {
      name: group_name || 'Custom Palette',
      version: version || getVersion(),
      created: new Date().toISOString(),
      color_count: colors.length,
    },
    colors: [],
  };

  colors.forEach((color, index) => {
    const name = semantic_names?.[index] || `color-${index + 1}`;
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const colorData: ColorData = {
      id: safeName,
      name: name,
      hex: color.hex,
      rgb: {
        r: color.rgb.r,
        g: color.rgb.g,
        b: color.rgb.b,
      },
      hsl: {
        h: Math.round(color.hsl.h),
        s: Math.round(color.hsl.s),
        l: Math.round(color.hsl.l),
      },
      hsv: {
        h: Math.round(color.hsv.h),
        s: Math.round(color.hsv.s),
        v: Math.round(color.hsv.v),
      },
    };

    if (include_metadata) {
      colorData.metadata = {
        brightness: Math.round(getBrightness(color) * 100) / 100,
        temperature: getColorTemperature(color),
        is_light: color.hsl.l > 50,
        is_dark: color.hsl.l <= 50,
      };
    }

    if (include_accessibility) {
      colorData.accessibility = {
        contrast_white:
          Math.round(
            getContrastRatio(color, new UnifiedColor('#FFFFFF')) * 100
          ) / 100,
        contrast_black:
          Math.round(
            getContrastRatio(color, new UnifiedColor('#000000')) * 100
          ) / 100,
        wcag_aa_normal:
          getContrastRatio(color, new UnifiedColor('#FFFFFF')) >= 4.5 ||
          getContrastRatio(color, new UnifiedColor('#000000')) >= 4.5,
        wcag_aaa_normal:
          getContrastRatio(color, new UnifiedColor('#FFFFFF')) >= 7 ||
          getContrastRatio(color, new UnifiedColor('#000000')) >= 7,
      };
    }

    if (include_variations) {
      colorData.variations = generateColorVariations(color);
    }

    result.colors.push(colorData);
  });

  return result;
}

/**
 * Generate API-friendly JSON format
 */
function generateAPIJSON(
  colors: UnifiedColor[],
  params: ExportJsonParams
): Record<string, unknown> {
  const { semantic_names, group_name, version } = params;

  return {
    data: {
      type: 'color_palette',
      id:
        group_name?.toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
        'custom-palette',
      attributes: {
        name: group_name || 'Custom Palette',
        version: version || getVersion(),
        created_at: new Date().toISOString(),
        color_count: colors.length,
        colors: colors.map((color, index) => {
          const name = semantic_names?.[index] || `color-${index + 1}`;
          return {
            id: `${index + 1}`,
            name: name,
            hex: color.hex,
            rgb: `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
            hsl: `hsl(${Math.round(color.hsl.h)}, ${Math.round(color.hsl.s)}%, ${Math.round(color.hsl.l)}%)`,
          };
        }),
      },
    },
    meta: {
      generated_by: 'MCP Color Server',
      generated_at: new Date().toISOString(),
      format_version: '1.0',
    },
  };
}

/**
 * Generate design tokens JSON format
 */
function generateDesignTokensJSON(
  colors: UnifiedColor[],
  params: ExportJsonParams
): Record<string, unknown> {
  const { semantic_names } = params;

  const tokens = {
    color: {} as Record<string, Record<string, unknown>>,
  };

  colors.forEach((color, index) => {
    const name = semantic_names?.[index] || `color-${index + 1}`;
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    tokens.color[safeName] = {
      value: color.hex,
      type: 'color',
      description: `Color ${name}`,
      extensions: {
        'com.mcp-color-server': {
          rgb: color.rgb,
          hsl: color.hsl,
          hsv: color.hsv,
        },
      },
    };
  });

  return tokens;
}

/**
 * Generate color variations (tints, shades, tones)
 */
function generateColorVariations(color: UnifiedColor): {
  tints: Array<{ level: number; hex: string; lightness: number }>;
  shades: Array<{ level: number; hex: string; lightness: number }>;
  tones: Array<{ level: number; hex: string; saturation: number }>;
} {
  const variations = {
    tints: [] as Array<{ level: number; hex: string; lightness: number }>,
    shades: [] as Array<{ level: number; hex: string; lightness: number }>,
    tones: [] as Array<{ level: number; hex: string; saturation: number }>,
  };

  // Generate tints (lighter versions)
  for (let i = 1; i <= 5; i++) {
    const lightness = Math.min(100, color.hsl.l + i * 10);
    const tint = new UnifiedColor(
      `hsl(${color.hsl.h}, ${color.hsl.s}%, ${lightness}%)`
    );
    variations.tints.push({
      level: i,
      hex: tint.hex,
      lightness: Math.round(lightness),
    });
  }

  // Generate shades (darker versions)
  for (let i = 1; i <= 5; i++) {
    const lightness = Math.max(0, color.hsl.l - i * 10);
    const shade = new UnifiedColor(
      `hsl(${color.hsl.h}, ${color.hsl.s}%, ${lightness}%)`
    );
    variations.shades.push({
      level: i,
      hex: shade.hex,
      lightness: Math.round(lightness),
    });
  }

  // Generate tones (desaturated versions)
  for (let i = 1; i <= 5; i++) {
    const saturation = Math.max(0, color.hsl.s - i * 15);
    const tone = new UnifiedColor(
      `hsl(${color.hsl.h}, ${saturation}%, ${color.hsl.l}%)`
    );
    variations.tones.push({
      level: i,
      hex: tone.hex,
      saturation: Math.round(saturation),
    });
  }

  return variations;
}

/**
 * Generate CSS from JSON data
 */
function generateCSSFromJSON(
  jsonData: DetailedJsonResult | Record<string, unknown>
): string {
  if ('colors' in jsonData && Array.isArray(jsonData.colors)) {
    let css = ':root {\n';
    jsonData.colors.forEach(color => {
      css += `  --${color.id}: ${color.hex};\n`;
    });
    css += '}';
    return css;
  }
  return '';
}

/**
 * Generate SCSS from JSON data
 */
function generateSCSSFromJSON(
  jsonData: DetailedJsonResult | Record<string, unknown>
): string {
  if ('colors' in jsonData && Array.isArray(jsonData.colors)) {
    let scss = '';
    jsonData.colors.forEach(color => {
      scss += `$${color.id}: ${color.hex};\n`;
    });
    return scss;
  }
  return '';
}

/**
 * Calculate perceived brightness
 */
function getBrightness(color: UnifiedColor): number {
  const { r, g, b } = color.rgb;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Get color temperature classification
 */
function getColorTemperature(color: UnifiedColor): string {
  const hue = color.hsl.h;

  if (hue >= 0 && hue < 60) return 'warm'; // Red to yellow
  if (hue >= 60 && hue < 120) return 'warm'; // Yellow to green
  if (hue >= 120 && hue < 180) return 'cool'; // Green to cyan
  if (hue >= 180 && hue < 240) return 'cool'; // Cyan to blue
  if (hue >= 240 && hue < 300) return 'cool'; // Blue to magenta
  if (hue >= 300 && hue <= 360) return 'warm'; // Magenta to red

  return 'neutral';
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: UnifiedColor, color2: UnifiedColor): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance
 */
function getRelativeLuminance(color: UnifiedColor): number {
  const { r, g, b } = color.rgb;

  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

export const exportJsonTool: ToolHandler = {
  name: 'export_json',
  description:
    'Generate JSON format for programmatic use and API integration with multiple structure options',
  parameters: exportJsonSchema.describe(),
  handler: async (params: unknown) => exportJson(params as ExportJsonParams),
};
