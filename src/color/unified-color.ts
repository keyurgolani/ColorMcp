/**
 * UnifiedColor class for comprehensive color representation and conversion
 */

import { colord, Colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import labPlugin from 'colord/plugins/lab';
import lchPlugin from 'colord/plugins/lch';
import xyzPlugin from 'colord/plugins/xyz';
import cmykPlugin from 'colord/plugins/cmyk';
import hwbPlugin from 'colord/plugins/hwb';
import chroma from 'chroma-js';
import { ColorMetadata } from '../types/index';

// Extend colord with all available plugins for comprehensive format support
extend([namesPlugin, labPlugin, lchPlugin, xyzPlugin, cmykPlugin, hwbPlugin]);

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
  a?: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface LAB {
  l: number;
  a: number;
  b: number;
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

export interface LCH {
  l: number;
  c: number;
  h: number;
}

export interface OKLAB {
  l: number;
  a: number;
  b: number;
}

export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

export interface HWB {
  h: number;
  w: number;
  b: number;
}

export type SupportedFormat =
  | 'hex'
  | 'rgb'
  | 'rgba'
  | 'hsl'
  | 'hsla'
  | 'hsv'
  | 'hsva'
  | 'hwb'
  | 'cmyk'
  | 'lab'
  | 'xyz'
  | 'lch'
  | 'oklab'
  | 'oklch'
  | 'css-var'
  | 'scss-var'
  | 'tailwind'
  | 'swift'
  | 'android'
  | 'flutter'
  | 'named';

export class UnifiedColor {
  private _colord: Colord;
  private _chroma: chroma.Color;
  private _metadata?: ColorMetadata;

  constructor(input: string | RGB | HSL | HSV | HWB | CMYK | LAB | XYZ | LCH) {
    try {
      // Parse input using colord for primary operations
      if (typeof input === 'string') {
        this._colord = colord(input);
      } else if ('r' in input) {
        this._colord = colord(input);
      } else if ('h' in input && 's' in input && 'l' in input) {
        this._colord = colord(input);
      } else if ('h' in input && 's' in input && 'v' in input) {
        this._colord = colord(input);
      } else if ('h' in input && 'w' in input && 'b' in input) {
        this._colord = colord(input as HWB);
      } else if ('c' in input && 'm' in input && 'y' in input && 'k' in input) {
        this._colord = colord(input as CMYK);
      } else if ('l' in input && 'a' in input && 'b' in input) {
        this._colord = colord(input as LAB);
      } else if ('x' in input && 'y' in input && 'z' in input) {
        this._colord = colord(input as XYZ);
      } else if ('l' in input && 'c' in input && 'h' in input) {
        this._colord = colord(input as LCH);
      } else {
        throw new Error('Unsupported color input format');
      }

      // Create chroma instance for additional operations
      this._chroma = chroma(this._colord.toHex());

      // Validate the color
      if (!this._colord.isValid()) {
        throw new Error('Invalid color input');
      }

      this.generateMetadata();
    } catch (error) {
      throw new Error(
        `Failed to parse color: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private generateMetadata(): void {
    const rgb = this._colord.toRgb();
    const hsl = this._colord.toHsl();

    // Calculate perceived brightness using standard formula
    const brightness = Math.round(
      0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
    );

    // Determine color temperature based on hue
    let temperature: 'warm' | 'cool' | 'neutral';
    if ((hsl.h >= 0 && hsl.h <= 90) || (hsl.h >= 270 && hsl.h <= 360)) {
      temperature = 'warm';
    } else if (hsl.h >= 150 && hsl.h <= 270) {
      temperature = 'cool';
    } else {
      temperature = 'neutral';
    }

    // Calculate contrast ratios against white and black using manual calculation
    const luminance = this.calculateLuminance(rgb);
    const whiteLuminance = 1.0; // White has luminance of 1
    const blackLuminance = 0.0; // Black has luminance of 0

    const contrastWhite = (whiteLuminance + 0.05) / (luminance + 0.05);
    const contrastBlack = (luminance + 0.05) / (blackLuminance + 0.05);
    const contrastRatio = Math.max(contrastWhite, contrastBlack);

    this._metadata = {
      brightness,
      temperature,
      accessibility: {
        contrastRatio,
        wcagAA: contrastRatio >= 4.5,
        wcagAAA: contrastRatio >= 7.0,
        colorBlindSafe: this.isColorBlindSafe(),
      },
    };
  }

  private calculateLuminance(rgb: { r: number; g: number; b: number }): number {
    // Calculate relative luminance according to WCAG formula
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r =
      rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g =
      gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b =
      bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private isColorBlindSafe(): boolean {
    // Basic check for color blind safety
    // A color is generally safer if it has good contrast and isn't purely red/green
    const hsl = this._colord.toHsl();
    const isProblematicHue =
      (hsl.h >= 0 && hsl.h <= 60) || (hsl.h >= 120 && hsl.h <= 180);
    return !isProblematicHue || hsl.s < 50 || hsl.l < 30 || hsl.l > 70;
  }

  // Format getters
  get hex(): string {
    return this._colord.toHex();
  }

  get rgb(): RGB {
    return this._colord.toRgb();
  }

  get hsl(): HSL {
    return this._colord.toHsl();
  }

  get hsv(): HSV {
    return this._colord.toHsv();
  }

  get hwb(): HWB {
    return this._colord.toHwb();
  }

  get cmyk(): CMYK {
    return this._colord.toCmyk();
  }

  get lab(): LAB {
    return this._colord.toLab();
  }

  get xyz(): XYZ {
    return this._colord.toXyz();
  }

  get lch(): LCH {
    return this._colord.toLch();
  }

  get oklab(): OKLAB {
    // Convert to OKLab using chroma-js if available, otherwise approximate
    try {
      const [l, a, b] = this._chroma.oklab();
      return { l, a, b };
    } catch {
      // Fallback: convert through LAB (approximation)
      const lab = this.lab;
      return {
        l: lab.l / 100, // OKLab L is 0-1 range
        a: lab.a / 100,
        b: lab.b / 100,
      };
    }
  }

  get oklch(): OKLCH {
    // Convert to OKLCh using chroma-js if available, otherwise approximate
    try {
      const [l, c, h] = this._chroma.oklch();
      return { l, c, h: h || 0 };
    } catch {
      // Fallback: convert through LCH (approximation)
      const lch = this.lch;
      return {
        l: lch.l / 100, // OKLCh L is 0-1 range
        c: lch.c / 100,
        h: lch.h,
      };
    }
  }

  get metadata(): ColorMetadata | undefined {
    return this._metadata;
  }

  // Conversion methods with precision control
  toFormat(format: SupportedFormat, precision: number = 2): string {
    switch (format) {
      case 'hex':
        return this.hex;

      case 'rgb':
        const rgb = this.rgb;
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

      case 'rgba':
        const rgba = this.rgb;
        const alpha = rgba.a !== undefined ? rgba.a : 1;
        return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha.toFixed(precision)})`;

      case 'hsl':
        const hsl = this.hsl;
        return precision === 0
          ? `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
          : `hsl(${hsl.h.toFixed(precision)}, ${hsl.s.toFixed(precision)}%, ${hsl.l.toFixed(precision)}%)`;

      case 'hsla':
        const hsla = this.hsl;
        const alphaHsl = hsla.a !== undefined ? hsla.a : 1;
        return precision === 0
          ? `hsla(${Math.round(hsla.h)}, ${Math.round(hsla.s)}%, ${Math.round(hsla.l)}%, ${alphaHsl.toFixed(1)})`
          : `hsla(${hsla.h.toFixed(precision)}, ${hsla.s.toFixed(precision)}%, ${hsla.l.toFixed(precision)}%, ${alphaHsl.toFixed(precision)})`;

      case 'hsv':
        const hsv = this.hsv;
        return precision === 0
          ? `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%)`
          : `hsv(${hsv.h.toFixed(precision)}, ${hsv.s.toFixed(precision)}%, ${hsv.v.toFixed(precision)}%)`;

      case 'hsva':
        const hsva = this.hsv;
        const alphaHsv = hsva.a !== undefined ? hsva.a : 1;
        return precision === 0
          ? `hsva(${Math.round(hsva.h)}, ${Math.round(hsva.s)}%, ${Math.round(hsva.v)}%, ${alphaHsv.toFixed(1)})`
          : `hsva(${hsva.h.toFixed(precision)}, ${hsva.s.toFixed(precision)}%, ${hsva.v.toFixed(precision)}%, ${alphaHsv.toFixed(precision)})`;

      case 'hwb':
        const hwb = this.hwb;
        return precision === 0
          ? `hwb(${Math.round(hwb.h)}, ${Math.round(hwb.w)}%, ${Math.round(hwb.b)}%)`
          : `hwb(${hwb.h.toFixed(precision)}, ${hwb.w.toFixed(precision)}%, ${hwb.b.toFixed(precision)}%)`;

      case 'cmyk':
        const cmyk = this.cmyk;
        return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

      case 'lab':
        const lab = this.lab;
        return precision === 0
          ? `lab(${Math.round(lab.l)}, ${Math.round(lab.a)}, ${Math.round(lab.b)})`
          : `lab(${lab.l.toFixed(precision)}, ${lab.a.toFixed(precision)}, ${lab.b.toFixed(precision)})`;

      case 'xyz':
        const xyz = this.xyz;
        return precision === 0
          ? `xyz(${Math.round(xyz.x)}, ${Math.round(xyz.y)}, ${Math.round(xyz.z)})`
          : `xyz(${xyz.x.toFixed(precision)}, ${xyz.y.toFixed(precision)}, ${xyz.z.toFixed(precision)})`;

      case 'lch':
        const lch = this.lch;
        return precision === 0
          ? `lch(${Math.round(lch.l)}, ${Math.round(lch.c)}, ${Math.round(lch.h)})`
          : `lch(${lch.l.toFixed(precision)}, ${lch.c.toFixed(precision)}, ${lch.h.toFixed(precision)})`;

      case 'oklab':
        const oklab = this.oklab;
        return precision === 0
          ? `oklab(${Math.round(oklab.l)}, ${Math.round(oklab.a)}, ${Math.round(oklab.b)})`
          : `oklab(${oklab.l.toFixed(precision)}, ${oklab.a.toFixed(precision)}, ${oklab.b.toFixed(precision)})`;

      case 'oklch':
        const oklch = this.oklch;
        return precision === 0
          ? `oklch(${Math.round(oklch.l)}, ${Math.round(oklch.c)}, ${Math.round(oklch.h)})`
          : `oklch(${oklch.l.toFixed(precision)}, ${oklch.c.toFixed(precision)}, ${oklch.h.toFixed(precision)})`;

      case 'named':
        // Return the closest named color (simplified implementation)
        return this.getClosestNamedColor();

      case 'css-var':
        return `--color: ${this.hex};`;

      case 'scss-var':
        return `$color: ${this.hex};`;

      case 'tailwind':
        // Generate a more sophisticated Tailwind class name
        return this.generateTailwindClass();

      case 'swift':
        const rgbSwift = this.rgb;
        const alphaSwift = rgbSwift.a !== undefined ? rgbSwift.a : 1;
        return `UIColor(red: ${(rgbSwift.r / 255).toFixed(precision)}, green: ${(rgbSwift.g / 255).toFixed(precision)}, blue: ${(rgbSwift.b / 255).toFixed(precision)}, alpha: ${alphaSwift.toFixed(precision)})`;

      case 'android':
        const alphaAndroid =
          this.rgb.a !== undefined
            ? Math.round(this.rgb.a * 255)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase()
            : 'FF';
        const rgbAndroid = this.rgb;
        const hexAndroid =
          `${rgbAndroid.r.toString(16).padStart(2, '0')}${rgbAndroid.g.toString(16).padStart(2, '0')}${rgbAndroid.b.toString(16).padStart(2, '0')}`.toUpperCase();
        return `Color.parseColor("#${alphaAndroid}${hexAndroid}")`;

      case 'flutter':
        const alphaFlutter =
          this.rgb.a !== undefined
            ? Math.round(this.rgb.a * 255)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase()
            : 'FF';
        const rgbFlutter = this.rgb;
        const hexFlutter =
          `${rgbFlutter.r.toString(16).padStart(2, '0')}${rgbFlutter.g.toString(16).padStart(2, '0')}${rgbFlutter.b.toString(16).padStart(2, '0')}`.toUpperCase();
        return `Color(0x${alphaFlutter}${hexFlutter})`;

      default:
        throw new Error(`Unsupported output format: ${format}`);
    }
  }

  toCSSVariable(name: string): string {
    return `--${name}: ${this.hex};`;
  }

  toSCSSVariable(name: string): string {
    return `$${name}: ${this.hex};`;
  }

  private getClosestNamedColor(): string {
    // Simplified implementation - return the hex if no close match
    // In a full implementation, this would calculate distance to all named colors
    const namedColors: Record<string, string> = {
      '#000000': 'black',
      '#ffffff': 'white',
      '#ff0000': 'red',
      '#00ff00': 'lime',
      '#0000ff': 'blue',
      '#ffff00': 'yellow',
      '#ff00ff': 'magenta',
      '#00ffff': 'cyan',
      '#800000': 'maroon',
      '#008000': 'green',
      '#000080': 'navy',
      '#808000': 'olive',
      '#800080': 'purple',
      '#008080': 'teal',
      '#c0c0c0': 'silver',
      '#808080': 'gray',
      '#ffa500': 'orange',
      '#ffc0cb': 'pink',
      '#a52a2a': 'brown',
    };

    const currentHex = this.hex.toLowerCase();
    if (namedColors[currentHex]) {
      return namedColors[currentHex];
    }

    // Find closest color by RGB distance
    let closestColor = 'black';
    let minDistance = Infinity;
    const currentRgb = this.rgb;

    for (const [hex, name] of Object.entries(namedColors)) {
      const namedColor = new UnifiedColor(hex);
      const namedRgb = namedColor.rgb;

      const distance = Math.sqrt(
        Math.pow(currentRgb.r - namedRgb.r, 2) +
          Math.pow(currentRgb.g - namedRgb.g, 2) +
          Math.pow(currentRgb.b - namedRgb.b, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = name;
      }
    }

    return closestColor;
  }

  private generateTailwindClass(): string {
    const hsl = this.hsl;

    // Determine base color family based on hue
    let colorFamily = 'gray';
    if (hsl.s < 10) {
      colorFamily = 'gray';
    } else if (hsl.h >= 0 && hsl.h < 15) {
      colorFamily = 'red';
    } else if (hsl.h >= 15 && hsl.h < 45) {
      colorFamily = 'orange';
    } else if (hsl.h >= 45 && hsl.h < 75) {
      colorFamily = 'yellow';
    } else if (hsl.h >= 75 && hsl.h < 105) {
      colorFamily = 'lime';
    } else if (hsl.h >= 105 && hsl.h < 135) {
      colorFamily = 'green';
    } else if (hsl.h >= 135 && hsl.h < 165) {
      colorFamily = 'emerald';
    } else if (hsl.h >= 165 && hsl.h < 195) {
      colorFamily = 'cyan';
    } else if (hsl.h >= 195 && hsl.h < 225) {
      colorFamily = 'sky';
    } else if (hsl.h >= 225 && hsl.h < 255) {
      colorFamily = 'blue';
    } else if (hsl.h >= 255 && hsl.h < 285) {
      colorFamily = 'indigo';
    } else if (hsl.h >= 285 && hsl.h < 315) {
      colorFamily = 'purple';
    } else if (hsl.h >= 315 && hsl.h < 345) {
      colorFamily = 'pink';
    } else {
      colorFamily = 'rose';
    }

    // Determine shade based on lightness
    let shade = 500; // Default middle shade
    if (hsl.l < 5) shade = 950;
    else if (hsl.l < 15) shade = 900;
    else if (hsl.l < 25) shade = 800;
    else if (hsl.l < 35) shade = 700;
    else if (hsl.l < 45) shade = 600;
    else if (hsl.l < 55) shade = 500;
    else if (hsl.l < 65) shade = 400;
    else if (hsl.l < 75) shade = 300;
    else if (hsl.l < 85) shade = 200;
    else if (hsl.l < 95) shade = 100;
    else shade = 50;

    return `${colorFamily}-${shade}`;
  }

  // Static factory methods for different input formats
  static fromHex(hex: string): UnifiedColor {
    return new UnifiedColor(hex);
  }

  static fromRgb(r: number, g: number, b: number, a?: number): UnifiedColor {
    const rgbObj: RGB = { r, g, b };
    if (a !== undefined) rgbObj.a = a;
    return new UnifiedColor(rgbObj);
  }

  static fromHsl(h: number, s: number, l: number, a?: number): UnifiedColor {
    const hslObj: HSL = { h, s, l };
    if (a !== undefined) hslObj.a = a;
    return new UnifiedColor(hslObj);
  }

  static fromHsv(h: number, s: number, v: number, a?: number): UnifiedColor {
    const hsvObj: HSV = { h, s, v };
    if (a !== undefined) hsvObj.a = a;
    return new UnifiedColor(hsvObj);
  }

  static fromHwb(h: number, w: number, b: number): UnifiedColor {
    const hwbObj: HWB = { h, w, b };
    return new UnifiedColor(hwbObj);
  }

  static fromCmyk(c: number, m: number, y: number, k: number): UnifiedColor {
    const cmykObj: CMYK = { c, m, y, k };
    return new UnifiedColor(cmykObj);
  }

  static fromLab(l: number, a: number, b: number): UnifiedColor {
    const labObj: LAB = { l, a, b };
    return new UnifiedColor(labObj);
  }

  static fromXyz(x: number, y: number, z: number): UnifiedColor {
    const xyzObj: XYZ = { x, y, z };
    return new UnifiedColor(xyzObj);
  }

  static fromLch(l: number, c: number, h: number): UnifiedColor {
    const lchObj: LCH = { l, c, h };
    return new UnifiedColor(lchObj);
  }

  // Additional utility methods
  getName(): string | undefined {
    // Try to get the closest named color
    try {
      return this.getClosestNamedColor();
    } catch {
      return undefined;
    }
  }

  getContrastRatio(otherColor: string | UnifiedColor): number {
    try {
      const other =
        typeof otherColor === 'string'
          ? new UnifiedColor(otherColor)
          : otherColor;
      const thisLuminance = this.calculateLuminance(this.rgb);
      const otherLuminance = other.calculateLuminance(other.rgb);

      const lighter = Math.max(thisLuminance, otherLuminance);
      const darker = Math.min(thisLuminance, otherLuminance);

      return (lighter + 0.05) / (darker + 0.05);
    } catch {
      return 1; // Return 1 if calculation fails
    }
  }

  // Validation method
  static isValidColor(input: string): boolean {
    try {
      const color = colord(input);
      return color.isValid();
    } catch {
      return false;
    }
  }
}
