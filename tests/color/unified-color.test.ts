/**
 * Comprehensive unit tests for UnifiedColor class
 */

import { UnifiedColor } from '../../src/color/unified-color';

describe('UnifiedColor', () => {
  describe('Constructor and Input Parsing', () => {
    test('should create color from HEX string', () => {
      const color = new UnifiedColor('#FF0000');
      expect(color.hex).toBe('#ff0000');
      expect(color.rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    test('should create color from short HEX', () => {
      const color = new UnifiedColor('#F00');
      expect(color.hex).toBe('#ff0000');
      expect(color.rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    test('should create color from RGB object', () => {
      const color = UnifiedColor.fromRgb(255, 0, 0);
      expect(color.hex).toBe('#ff0000');
      expect(color.rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    test('should create color from HSL object', () => {
      const color = UnifiedColor.fromHsl(0, 100, 50);
      expect(color.hex).toBe('#ff0000');
      expect(color.hsl.h).toBeCloseTo(0, 1);
      expect(color.hsl.s).toBeCloseTo(100, 1);
      expect(color.hsl.l).toBeCloseTo(50, 1);
    });

    test('should create color from HSV object', () => {
      const color = UnifiedColor.fromHsv(0, 100, 100);
      expect(color.hex).toBe('#ff0000');
      expect(color.hsv.h).toBeCloseTo(0, 1);
      expect(color.hsv.s).toBeCloseTo(100, 1);
      expect(color.hsv.v).toBeCloseTo(100, 1);
    });

    test('should handle alpha values', () => {
      const color = UnifiedColor.fromRgb(255, 0, 0, 0.5);
      expect(color.rgb.a).toBe(0.5);
    });

    test('should create color from HWB values', () => {
      const color = UnifiedColor.fromHwb(0, 0, 0);
      expect(color.hex).toBe('#ff0000');
      expect(color.hwb.h).toBeCloseTo(0, 1);
      expect(color.hwb.w).toBeCloseTo(0, 1);
      expect(color.hwb.b).toBeCloseTo(0, 1);
    });

    test('should create color from CMYK values', () => {
      const color = UnifiedColor.fromCmyk(0, 100, 100, 0);
      expect(color.hex).toBe('#ff0000');
      expect(color.cmyk.c).toBeCloseTo(0, 1);
      expect(color.cmyk.m).toBeCloseTo(100, 1);
      expect(color.cmyk.y).toBeCloseTo(100, 1);
      expect(color.cmyk.k).toBeCloseTo(0, 1);
    });

    test('should create color from LAB values', () => {
      const color = UnifiedColor.fromLab(53.23, 80.11, 67.22);
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
      const lab = color.lab;
      expect(lab.l).toBeCloseTo(53.23, 0);
      expect(lab.a).toBeCloseTo(80.11, 0);
      expect(lab.b).toBeCloseTo(67.22, 0);
    });

    test('should create color from XYZ values', () => {
      const color = UnifiedColor.fromXyz(41.24, 21.26, 1.93);
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
      const xyz = color.xyz;
      expect(xyz.x).toBeCloseTo(41.24, 1);
      expect(xyz.y).toBeCloseTo(21.26, 1);
      expect(xyz.z).toBeCloseTo(1.93, 1);
    });

    test('should create color from LCH values', () => {
      const color = UnifiedColor.fromLch(53.23, 104.55, 40.85);
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
      const lch = color.lch;
      expect(lch.l).toBeCloseTo(53.23, 1);
      expect(lch.c).toBeCloseTo(104.55, 1);
      expect(lch.h).toBeCloseTo(40.85, 1);
    });

    test('should throw error for invalid input', () => {
      expect(() => new UnifiedColor('invalid')).toThrow();
      expect(() => new UnifiedColor('')).toThrow();
    });
  });

  describe('Format Conversions', () => {
    let redColor: UnifiedColor;
    let blueColor: UnifiedColor;
    let greenColor: UnifiedColor;

    beforeEach(() => {
      redColor = new UnifiedColor('#FF0000');
      blueColor = new UnifiedColor('#0000FF');
      greenColor = new UnifiedColor('#00FF00');
    });

    test('should convert to HEX format', () => {
      expect(redColor.toFormat('hex')).toBe('#ff0000');
      expect(blueColor.toFormat('hex')).toBe('#0000ff');
      expect(greenColor.toFormat('hex')).toBe('#00ff00');
    });

    test('should convert to RGB format', () => {
      expect(redColor.toFormat('rgb')).toBe('rgb(255, 0, 0)');
      expect(blueColor.toFormat('rgb')).toBe('rgb(0, 0, 255)');
      expect(greenColor.toFormat('rgb')).toBe('rgb(0, 255, 0)');
    });

    test('should convert to RGBA format with precision', () => {
      const colorWithAlpha = UnifiedColor.fromRgb(255, 0, 0, 0.75);
      expect(colorWithAlpha.toFormat('rgba', 2)).toBe('rgba(255, 0, 0, 0.75)');
      expect(colorWithAlpha.toFormat('rgba', 1)).toBe('rgba(255, 0, 0, 0.8)');
    });

    test('should convert to HSL format', () => {
      expect(redColor.toFormat('hsl', 0)).toBe('hsl(0, 100%, 50%)');
      expect(blueColor.toFormat('hsl', 0)).toBe('hsl(240, 100%, 50%)');
      expect(greenColor.toFormat('hsl', 0)).toBe('hsl(120, 100%, 50%)');
    });

    test('should convert to HSV format', () => {
      expect(redColor.toFormat('hsv', 0)).toBe('hsv(0, 100%, 100%)');
      expect(blueColor.toFormat('hsv', 0)).toBe('hsv(240, 100%, 100%)');
      expect(greenColor.toFormat('hsv', 0)).toBe('hsv(120, 100%, 100%)');
    });

    test('should convert to CMYK format', () => {
      expect(redColor.toFormat('cmyk')).toBe('cmyk(0%, 100%, 100%, 0%)');
      expect(blueColor.toFormat('cmyk')).toBe('cmyk(100%, 100%, 0%, 0%)');
      expect(greenColor.toFormat('cmyk')).toBe('cmyk(100%, 0%, 100%, 0%)');
    });

    test('should convert to LAB format', () => {
      const labResult = redColor.toFormat('lab', 2);
      expect(labResult).toMatch(
        /^lab\(\d+\.\d{2}, -?\d+\.\d{2}, -?\d+\.\d{2}\)$/
      );
    });

    test('should convert to XYZ format', () => {
      const xyzResult = redColor.toFormat('xyz', 2);
      expect(xyzResult).toMatch(/^xyz\(\d+\.\d{2}, \d+\.\d{2}, \d+\.\d{2}\)$/);
    });

    test('should convert to CSS variable format', () => {
      expect(redColor.toFormat('css-var')).toBe('--color: #ff0000;');
    });

    test('should convert to SCSS variable format', () => {
      expect(redColor.toFormat('scss-var')).toBe('$color: #ff0000;');
    });

    test('should convert to Swift format', () => {
      expect(redColor.toFormat('swift', 3)).toBe(
        'UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.000)'
      );
    });

    test('should convert to Android format', () => {
      expect(redColor.toFormat('android')).toBe(
        'Color.parseColor("#FFFF0000")'
      );
    });

    test('should convert to Android format with alpha', () => {
      const colorWithAlpha = UnifiedColor.fromRgb(255, 0, 0, 0.5);
      expect(colorWithAlpha.toFormat('android')).toBe(
        'Color.parseColor("#80FF0000")'
      );
    });

    test('should convert to Flutter format', () => {
      expect(redColor.toFormat('flutter')).toBe('Color(0xFFFF0000)');
    });

    test('should convert to Flutter format with alpha', () => {
      const colorWithAlpha = UnifiedColor.fromRgb(255, 0, 0, 0.5);
      expect(colorWithAlpha.toFormat('flutter')).toBe('Color(0x80FF0000)');
    });

    test('should convert to LCH format', () => {
      const lchResult = redColor.toFormat('lch', 2);
      expect(lchResult).toMatch(/^lch\(\d+\.\d{2}, \d+\.\d{2}, \d+\.\d{2}\)$/);
    });

    test('should convert to OKLAB format', () => {
      const oklabResult = redColor.toFormat('oklab', 3);
      expect(oklabResult).toMatch(
        /^oklab\(\d+\.\d{3}, -?\d+\.\d{3}, -?\d+\.\d{3}\)$/
      );
    });

    test('should convert to OKLCH format', () => {
      const oklchResult = redColor.toFormat('oklch', 3);
      expect(oklchResult).toMatch(
        /^oklch\(\d+\.\d{3}, \d+\.\d{3}, \d+\.\d{3}\)$/
      );
    });

    test('should convert to named color format', () => {
      expect(redColor.toFormat('named')).toBe('red');
      expect(blueColor.toFormat('named')).toBe('blue');
      expect(greenColor.toFormat('named')).toBe('lime');
    });

    test('should generate Tailwind classes', () => {
      const tailwindClass = redColor.toFormat('tailwind');
      expect(tailwindClass).toMatch(/^[a-z]+-\d+$/);
      expect(tailwindClass).toContain('red');
    });

    test('should convert to HWB format', () => {
      expect(redColor.toFormat('hwb', 0)).toBe('hwb(0, 0%, 0%)');
      expect(blueColor.toFormat('hwb', 0)).toMatch(/^hwb\(\d+, \d+%, \d+%\)$/);
      expect(greenColor.toFormat('hwb', 0)).toMatch(/^hwb\(\d+, \d+%, \d+%\)$/);
    });

    test('should handle precision parameter', () => {
      const color = new UnifiedColor('#FF8080');
      const hsl0 = color.toFormat('hsl', 0);
      const hsl2 = color.toFormat('hsl', 2);
      const hsl4 = color.toFormat('hsl', 4);

      expect(hsl0).toMatch(/hsl\(\d+, \d+%, \d+%\)/);
      expect(hsl2).toMatch(/hsl\(\d+\.\d{2}, \d+\.\d{2}%, \d+\.\d{2}%\)/);
      expect(hsl4).toMatch(/hsl\(\d+\.\d{4}, \d+\.\d{4}%, \d+\.\d{4}%\)/);
    });

    test('should throw error for unsupported format', () => {
      expect(() => redColor.toFormat('unsupported' as any)).toThrow(
        'Unsupported output format'
      );
    });
  });

  describe('CSS and SCSS Variable Methods', () => {
    test('should create CSS variables with custom names', () => {
      const color = new UnifiedColor('#FF0000');
      expect(color.toCSSVariable('primary')).toBe('--primary: #ff0000;');
      expect(color.toCSSVariable('accent-color')).toBe(
        '--accent-color: #ff0000;'
      );
    });

    test('should create SCSS variables with custom names', () => {
      const color = new UnifiedColor('#FF0000');
      expect(color.toSCSSVariable('primary')).toBe('$primary: #ff0000;');
      expect(color.toSCSSVariable('accent_color')).toBe(
        '$accent_color: #ff0000;'
      );
    });
  });

  describe('Color Properties and Metadata', () => {
    test('should calculate brightness correctly', () => {
      const white = new UnifiedColor('#FFFFFF');
      const black = new UnifiedColor('#000000');
      const red = new UnifiedColor('#FF0000');

      expect(white.metadata?.brightness).toBe(255);
      expect(black.metadata?.brightness).toBe(0);
      expect(red.metadata?.brightness).toBeCloseTo(76, 0); // 0.299 * 255
    });

    test('should determine color temperature', () => {
      const red = new UnifiedColor('#FF0000');
      const blue = new UnifiedColor('#0000FF');
      const green = new UnifiedColor('#00FF00');
      const yellow = new UnifiedColor('#FFFF00');

      expect(red.metadata?.temperature).toBe('warm'); // Red is at 0°
      expect(blue.metadata?.temperature).toBe('cool'); // Blue is at 240°
      expect(green.metadata?.temperature).toBe('neutral'); // Green is at 120°
      expect(yellow.metadata?.temperature).toBe('warm'); // Yellow is at 60°, which is warm
    });

    test('should calculate accessibility information', () => {
      const white = new UnifiedColor('#FFFFFF');
      const black = new UnifiedColor('#000000');

      expect(white.metadata?.accessibility.wcagAA).toBe(true);
      expect(white.metadata?.accessibility.wcagAAA).toBe(true);
      expect(black.metadata?.accessibility.wcagAA).toBe(true);
      expect(black.metadata?.accessibility.wcagAAA).toBe(true);
    });
  });

  describe('Static Validation Method', () => {
    test('should validate valid colors', () => {
      expect(UnifiedColor.isValidColor('#FF0000')).toBe(true);
      expect(UnifiedColor.isValidColor('rgb(255, 0, 0)')).toBe(true);
      expect(UnifiedColor.isValidColor('hsl(0, 100%, 50%)')).toBe(true);
      // Note: Named colors may not be supported without additional plugins
    });

    test('should reject invalid colors', () => {
      expect(UnifiedColor.isValidColor('invalid')).toBe(false);
      expect(UnifiedColor.isValidColor('')).toBe(false);
      expect(UnifiedColor.isValidColor('#GG0000')).toBe(false);
      // Note: colord may be more lenient with some invalid values
    });
  });

  describe('Mathematical Accuracy', () => {
    test('should maintain precision in conversions', () => {
      const originalHex = '#FF8040';
      const color = new UnifiedColor(originalHex);

      // Convert through multiple formats and back
      const rgb = color.rgb;
      const backToHex = UnifiedColor.fromRgb(rgb.r, rgb.g, rgb.b).hex;

      expect(backToHex).toBe(originalHex.toLowerCase());
    });

    test('should handle edge cases correctly', () => {
      // Test pure colors
      const pureRed = new UnifiedColor('#FF0000');
      const pureGreen = new UnifiedColor('#00FF00');
      const pureBlue = new UnifiedColor('#0000FF');

      expect(pureRed.hsl.h).toBeCloseTo(0, 1);
      expect(pureGreen.hsl.h).toBeCloseTo(120, 1);
      expect(pureBlue.hsl.h).toBeCloseTo(240, 1);
    });

    test('should handle grayscale colors correctly', () => {
      const gray = new UnifiedColor('#808080');
      const cmyk = gray.cmyk;

      // Grayscale should have equal CMY values
      expect(cmyk.c).toBeCloseTo(cmyk.m, 1);
      expect(cmyk.m).toBeCloseTo(cmyk.y, 1);
    });
  });
});
