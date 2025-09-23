/**
 * Flexible color input parsing supporting multiple format variations
 */

import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import chroma from 'chroma-js';
import { UnifiedColor } from './unified-color';

// Extend colord with names plugin
extend([namesPlugin]);

export interface ParseResult {
  success: boolean;
  color?: UnifiedColor;
  error?: string;
  detectedFormat?: string;
}

export class ColorParser {
  private static readonly HEX_PATTERNS = [
    /^#([0-9A-Fa-f]{6})$/, // #RRGGBB
    /^#([0-9A-Fa-f]{3})$/, // #RGB
    /^#([0-9A-Fa-f]{8})$/, // #RRGGBBAA
    /^#([0-9A-Fa-f]{4})$/, // #RGBA
    /^([0-9A-Fa-f]{6})$/, // RRGGBB (no #)
    /^([0-9A-Fa-f]{3})$/, // RGB (no #)
  ];

  private static readonly RGB_PATTERNS = [
    /^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i,
    /^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i,
    /^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/, // 255,0,0
    /^(\d+)\s+(\d+)\s+(\d+)$/, // 255 0 0
    /^\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]$/, // [255,0,0]
  ];

  private static readonly HSL_PATTERNS = [
    /^hsl\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i,
    /^hsla\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)\s*\)$/i,
    /^([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?$/, // 0,100%,50%
  ];

  private static readonly HSV_PATTERNS = [
    /^hsv\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i,
    /^hsb\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i,
    /^hsva\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)\s*\)$/i,
  ];

  private static readonly CMYK_PATTERNS = [
    /^cmyk\s*\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i,
  ];

  private static readonly LAB_PATTERNS = [
    /^lab\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)$/i,
  ];

  private static readonly XYZ_PATTERNS = [
    /^xyz\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i,
  ];

  private static readonly LCH_PATTERNS = [
    /^lch\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)$/i,
  ];

  private static readonly OKLAB_PATTERNS = [
    /^oklab\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)$/i,
  ];

  private static readonly OKLCH_PATTERNS = [
    /^oklch\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)$/i,
  ];

  private static readonly HWB_PATTERNS = [
    /^hwb\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i,
  ];

  // CSS named colors (subset for validation)
  private static readonly NAMED_COLORS = new Set([
    'aliceblue',
    'antiquewhite',
    'aqua',
    'aquamarine',
    'azure',
    'beige',
    'bisque',
    'black',
    'blanchedalmond',
    'blue',
    'blueviolet',
    'brown',
    'burlywood',
    'cadetblue',
    'chartreuse',
    'chocolate',
    'coral',
    'cornflowerblue',
    'cornsilk',
    'crimson',
    'cyan',
    'darkblue',
    'darkcyan',
    'darkgoldenrod',
    'darkgray',
    'darkgreen',
    'darkkhaki',
    'darkmagenta',
    'darkolivegreen',
    'darkorange',
    'darkorchid',
    'darkred',
    'darksalmon',
    'darkseagreen',
    'darkslateblue',
    'darkslategray',
    'darkturquoise',
    'darkviolet',
    'deeppink',
    'deepskyblue',
    'dimgray',
    'dodgerblue',
    'firebrick',
    'floralwhite',
    'forestgreen',
    'fuchsia',
    'gainsboro',
    'ghostwhite',
    'gold',
    'goldenrod',
    'gray',
    'green',
    'greenyellow',
    'honeydew',
    'hotpink',
    'indianred',
    'indigo',
    'ivory',
    'khaki',
    'lavender',
    'lavenderblush',
    'lawngreen',
    'lemonchiffon',
    'lightblue',
    'lightcoral',
    'lightcyan',
    'lightgoldenrodyellow',
    'lightgray',
    'lightgreen',
    'lightpink',
    'lightsalmon',
    'lightseagreen',
    'lightskyblue',
    'lightslategray',
    'lightsteelblue',
    'lightyellow',
    'lime',
    'limegreen',
    'linen',
    'magenta',
    'maroon',
    'mediumaquamarine',
    'mediumblue',
    'mediumorchid',
    'mediumpurple',
    'mediumseagreen',
    'mediumslateblue',
    'mediumspringgreen',
    'mediumturquoise',
    'mediumvioletred',
    'midnightblue',
    'mintcream',
    'mistyrose',
    'moccasin',
    'navajowhite',
    'navy',
    'oldlace',
    'olive',
    'olivedrab',
    'orange',
    'orangered',
    'orchid',
    'palegoldenrod',
    'palegreen',
    'paleturquoise',
    'palevioletred',
    'papayawhip',
    'peachpuff',
    'peru',
    'pink',
    'plum',
    'powderblue',
    'purple',
    'red',
    'rosybrown',
    'royalblue',
    'saddlebrown',
    'salmon',
    'sandybrown',
    'seagreen',
    'seashell',
    'sienna',
    'silver',
    'skyblue',
    'slateblue',
    'slategray',
    'snow',
    'springgreen',
    'steelblue',
    'tan',
    'teal',
    'thistle',
    'tomato',
    'turquoise',
    'violet',
    'wheat',
    'white',
    'whitesmoke',
    'yellow',
    'yellowgreen',
  ]);

  static parse(input: string): ParseResult {
    if (!input || typeof input !== 'string') {
      return {
        success: false,
        error: 'Input must be a non-empty string',
      };
    }

    const trimmedInput = input.trim();

    // Try different parsing strategies
    const strategies = [
      () => this.parseHex(trimmedInput),
      () => this.parseRgb(trimmedInput),
      () => this.parseHsl(trimmedInput),
      () => this.parseHsv(trimmedInput),
      () => this.parseHwb(trimmedInput),
      () => this.parseCmyk(trimmedInput),
      () => this.parseLab(trimmedInput),
      () => this.parseXyz(trimmedInput),
      () => this.parseLch(trimmedInput),
      () => this.parseOklab(trimmedInput),
      () => this.parseOklch(trimmedInput),
      () => this.parseNamedColor(trimmedInput),
      () => this.parseWithColord(trimmedInput), // Fallback to colord
    ];

    for (const strategy of strategies) {
      const result = strategy();
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      error: `Unrecognized color format: "${input}". Supported formats include HEX (#FF0000), RGB (rgb(255,0,0)), HSL (hsl(0,100%,50%)), HSV, CMYK, LAB, XYZ, and named colors.`,
    };
  }

  private static parseHex(input: string): ParseResult {
    for (const pattern of this.HEX_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const hexValue = input.startsWith('#') ? input : `#${input}`;
          const color = new UnifiedColor(hexValue);
          return {
            success: true,
            color,
            detectedFormat: 'hex',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseRgb(input: string): ParseResult {
    for (const pattern of this.RGB_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const r = parseInt(match[1]!, 10);
          const g = parseInt(match[2]!, 10);
          const b = parseInt(match[3]!, 10);
          const a = match[4] ? parseFloat(match[4]) : undefined;

          if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
            continue;
          }
          if (a !== undefined && (a < 0 || a > 1)) {
            continue;
          }

          const color = UnifiedColor.fromRgb(r, g, b, a);
          return {
            success: true,
            color,
            detectedFormat: a !== undefined ? 'rgba' : 'rgb',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseHsl(input: string): ParseResult {
    for (const pattern of this.HSL_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const h = parseFloat(match[1]!);
          const s = parseFloat(match[2]!);
          const l = parseFloat(match[3]!);
          const a = match[4] ? parseFloat(match[4]) : undefined;

          if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) {
            continue;
          }
          if (a !== undefined && (a < 0 || a > 1)) {
            continue;
          }

          const color = UnifiedColor.fromHsl(h, s, l, a);
          return {
            success: true,
            color,
            detectedFormat: a !== undefined ? 'hsla' : 'hsl',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseHsv(input: string): ParseResult {
    for (const pattern of this.HSV_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const h = parseFloat(match[1]!);
          const s = parseFloat(match[2]!);
          const v = parseFloat(match[3]!);
          const a = match[4] ? parseFloat(match[4]) : undefined;

          if (h < 0 || h > 360 || s < 0 || s > 100 || v < 0 || v > 100) {
            continue;
          }
          if (a !== undefined && (a < 0 || a > 1)) {
            continue;
          }

          const color = UnifiedColor.fromHsv(h, s, v, a);
          return {
            success: true,
            color,
            detectedFormat: a !== undefined ? 'hsva' : 'hsv',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseCmyk(input: string): ParseResult {
    for (const pattern of this.CMYK_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const c = parseFloat(match[1]!);
          const m = parseFloat(match[2]!);
          const y = parseFloat(match[3]!);
          const k = parseFloat(match[4]!);

          if (
            c < 0 ||
            c > 100 ||
            m < 0 ||
            m > 100 ||
            y < 0 ||
            y > 100 ||
            k < 0 ||
            k > 100
          ) {
            continue;
          }

          // Convert CMYK to RGB
          const r = Math.round(255 * (1 - c / 100) * (1 - k / 100));
          const g = Math.round(255 * (1 - m / 100) * (1 - k / 100));
          const b = Math.round(255 * (1 - y / 100) * (1 - k / 100));

          const color = UnifiedColor.fromRgb(r, g, b);
          return {
            success: true,
            color,
            detectedFormat: 'cmyk',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseLab(input: string): ParseResult {
    for (const pattern of this.LAB_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const l = parseFloat(match[1]!);
          const a = parseFloat(match[2]!);
          const b = parseFloat(match[3]!);

          if (l < 0 || l > 100) {
            continue;
          }

          // Use chroma-js to convert LAB to RGB
          const rgb = chroma.lab(l, a, b).rgb();
          const color = UnifiedColor.fromRgb(rgb[0], rgb[1], rgb[2]);

          return {
            success: true,
            color,
            detectedFormat: 'lab',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseXyz(input: string): ParseResult {
    for (const pattern of this.XYZ_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const x = parseFloat(match[1]!) / 100; // Normalize to 0-1
          const y = parseFloat(match[2]!) / 100;
          const z = parseFloat(match[3]!) / 100;

          // Convert XYZ to RGB using standard transformation
          let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
          let g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
          let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

          // Apply gamma correction
          r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
          g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
          b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

          // Clamp to 0-255 range
          const rInt = Math.max(0, Math.min(255, Math.round(r * 255)));
          const gInt = Math.max(0, Math.min(255, Math.round(g * 255)));
          const bInt = Math.max(0, Math.min(255, Math.round(b * 255)));

          const color = UnifiedColor.fromRgb(rInt, gInt, bInt);
          return {
            success: true,
            color,
            detectedFormat: 'xyz',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseLch(input: string): ParseResult {
    for (const pattern of this.LCH_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const l = parseFloat(match[1]!);
          const c = parseFloat(match[2]!);
          const h = parseFloat(match[3]!);

          if (l < 0 || l > 100 || c < 0 || h < 0 || h > 360) {
            continue;
          }

          // Use chroma-js to convert LCH to RGB
          const rgb = chroma.lch(l, c, h).rgb();
          const color = UnifiedColor.fromRgb(rgb[0], rgb[1], rgb[2]);

          return {
            success: true,
            color,
            detectedFormat: 'lch',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseOklab(input: string): ParseResult {
    for (const pattern of this.OKLAB_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const l = parseFloat(match[1]!);
          const a = parseFloat(match[2]!);
          const b = parseFloat(match[3]!);

          if (l < 0 || l > 1) {
            continue;
          }

          // Use chroma-js to convert OKLAB to RGB if available
          try {
            const rgb = chroma.oklab(l, a, b).rgb();
            const color = UnifiedColor.fromRgb(rgb[0], rgb[1], rgb[2]);

            return {
              success: true,
              color,
              detectedFormat: 'oklab',
            };
          } catch {
            // Fallback: approximate conversion through LAB
            const labL = l * 100;
            const labA = a * 100;
            const labB = b * 100;
            const rgb = chroma.lab(labL, labA, labB).rgb();
            const color = UnifiedColor.fromRgb(rgb[0], rgb[1], rgb[2]);

            return {
              success: true,
              color,
              detectedFormat: 'oklab',
            };
          }
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseOklch(input: string): ParseResult {
    for (const pattern of this.OKLCH_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const l = parseFloat(match[1]!);
          const c = parseFloat(match[2]!);
          const h = parseFloat(match[3]!);

          if (l < 0 || l > 1 || c < 0 || h < 0 || h > 360) {
            continue;
          }

          // Use chroma-js to convert OKLCH to RGB if available
          try {
            const rgb = chroma.oklch(l, c, h).rgb();
            const color = UnifiedColor.fromRgb(rgb[0], rgb[1], rgb[2]);

            return {
              success: true,
              color,
              detectedFormat: 'oklch',
            };
          } catch {
            // Fallback: approximate conversion through LCH
            const lchL = l * 100;
            const lchC = c * 100;
            const lchH = h;
            const rgb = chroma.lch(lchL, lchC, lchH).rgb();
            const color = UnifiedColor.fromRgb(rgb[0], rgb[1], rgb[2]);

            return {
              success: true,
              color,
              detectedFormat: 'oklch',
            };
          }
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseHwb(input: string): ParseResult {
    for (const pattern of this.HWB_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        try {
          const h = parseFloat(match[1]!);
          const w = parseFloat(match[2]!);
          const b = parseFloat(match[3]!);

          if (h < 0 || h > 360 || w < 0 || w > 100 || b < 0 || b > 100) {
            continue;
          }

          const color = UnifiedColor.fromHwb(h, w, b);
          return {
            success: true,
            color,
            detectedFormat: 'hwb',
          };
        } catch {
          continue;
        }
      }
    }
    return { success: false };
  }

  private static parseNamedColor(input: string): ParseResult {
    const lowerInput = input.toLowerCase();
    if (this.NAMED_COLORS.has(lowerInput)) {
      try {
        const color = new UnifiedColor(lowerInput);
        return {
          success: true,
          color,
          detectedFormat: 'named',
        };
      } catch {
        // Fall through to failure
      }
    }
    return { success: false };
  }

  private static parseWithColord(input: string): ParseResult {
    try {
      const colordInstance = colord(input);
      if (colordInstance.isValid()) {
        const color = new UnifiedColor(input);
        return {
          success: true,
          color,
          detectedFormat: 'auto-detected',
        };
      }
    } catch {
      // Fall through to failure
    }
    return { success: false };
  }

  static getSupportedFormats(): string[] {
    return [
      'HEX (#FF0000, #F00, FF0000)',
      'RGB (rgb(255,0,0), 255,0,0, [255,0,0])',
      'RGBA (rgba(255,0,0,0.5))',
      'HSL (hsl(0,100%,50%), 0,100%,50%)',
      'HSLA (hsla(0,100%,50%,0.5))',
      'HSV/HSB (hsv(0,100%,100%))',
      'HWB (hwb(0,0%,0%))',
      'CMYK (cmyk(0%,100%,100%,0%))',
      'LAB (lab(53.23,80.11,67.22))',
      'XYZ (xyz(41.24,21.26,1.93))',
      'LCH (lch(53.23,104.55,40.85))',
      'OKLAB (oklab(0.628,0.225,0.126))',
      'OKLCH (oklch(0.628,0.258,29.23))',
      'Named colors (red, blue, forestgreen, etc.)',
    ];
  }
}
