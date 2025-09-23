# Complete Color Format Support Guide

This document provides comprehensive information about all color formats supported by the MCP Color Server, including usage examples, precision handling, and best practices.

## Overview

The MCP Color Server supports 22+ color formats across multiple color spaces, from basic web formats to advanced scientific color spaces and framework-specific outputs.

## Input Format Categories

### 1. Web Standard Formats

#### HEX (Hexadecimal)

- **Formats**: `#RRGGBB`, `#RGB`, `#RRGGBBAA`, `#RGBA`
- **Examples**:
  - `#FF0000` (red)
  - `#F00` (red, short form)
  - `#FF000080` (red with 50% alpha)
  - `FF0000` (without # prefix)
- **Use Cases**: Web development, CSS, design tools
- **Precision**: Fixed (no decimal precision)

#### RGB (Red, Green, Blue)

- **Formats**: `rgb(r, g, b)`, `r, g, b`, `r g b`, `[r, g, b]`
- **Range**: 0-255 for each channel
- **Examples**:
  - `rgb(255, 0, 0)` (red)
  - `255, 0, 0` (comma-separated)
  - `255 0 0` (space-separated)
  - `[255, 0, 0]` (array format)
- **Use Cases**: Programming, image processing, digital displays
- **Precision**: Integer values (0-255)

#### RGBA (RGB with Alpha)

- **Format**: `rgba(r, g, b, a)`
- **Range**: RGB: 0-255, Alpha: 0.0-1.0
- **Examples**:
  - `rgba(255, 0, 0, 0.5)` (50% transparent red)
  - `rgba(128, 128, 128, 0.8)` (80% opaque gray)
- **Use Cases**: Web development with transparency
- **Precision**: RGB integer, Alpha decimal

#### HSL (Hue, Saturation, Lightness)

- **Formats**: `hsl(h, s%, l%)`, `h, s%, l%`
- **Range**: H: 0-360°, S: 0-100%, L: 0-100%
- **Examples**:
  - `hsl(0, 100%, 50%)` (red)
  - `hsl(120, 100%, 50%)` (green)
  - `0, 100%, 50%` (red, comma-separated)
- **Use Cases**: Design, color theory, intuitive color manipulation
- **Precision**: Configurable decimal places

#### HSLA (HSL with Alpha)

- **Format**: `hsla(h, s%, l%, a)`
- **Range**: HSL ranges + Alpha: 0.0-1.0
- **Examples**:
  - `hsla(0, 100%, 50%, 0.7)` (70% opaque red)
- **Use Cases**: Design with transparency control
- **Precision**: Configurable decimal places

#### HSV/HSB (Hue, Saturation, Value/Brightness)

- **Formats**: `hsv(h, s%, v%)`, `hsb(h, s%, b%)`
- **Range**: H: 0-360°, S: 0-100%, V: 0-100%
- **Examples**:
  - `hsv(0, 100%, 100%)` (red)
  - `hsb(240, 100%, 100%)` (blue)
- **Use Cases**: Color pickers, image editing, computer graphics
- **Precision**: Configurable decimal places

#### HSVA (HSV with Alpha)

- **Format**: `hsva(h, s%, v%, a)`
- **Examples**:
  - `hsva(0, 100%, 100%, 0.6)` (60% opaque red)
- **Use Cases**: Advanced color manipulation with transparency
- **Precision**: Configurable decimal places

### 2. Advanced Color Spaces

#### HWB (Hue, Whiteness, Blackness)

- **Format**: `hwb(h, w%, b%)`
- **Range**: H: 0-360°, W: 0-100%, B: 0-100%
- **Examples**:
  - `hwb(0, 0%, 0%)` (pure red)
  - `hwb(0, 50%, 50%)` (gray)
- **Use Cases**: Intuitive color mixing, CSS Level 4
- **Precision**: Configurable decimal places
- **Note**: More intuitive than HSL for color mixing

#### CMYK (Cyan, Magenta, Yellow, Key/Black)

- **Format**: `cmyk(c%, m%, y%, k%)`
- **Range**: 0-100% for each channel
- **Examples**:
  - `cmyk(0%, 100%, 100%, 0%)` (red)
  - `cmyk(100%, 100%, 0%, 0%)` (blue)
- **Use Cases**: Print design, offset printing, professional graphics
- **Precision**: Percentage values
- **Note**: Subtractive color model for printing

#### LAB (CIE L*a*b\*)

- **Format**: `lab(l, a, b)`
- **Range**: L: 0-100, a: -128 to +127, b: -128 to +127
- **Examples**:
  - `lab(53.23, 80.11, 67.22)` (red)
  - `lab(87.73, -86.18, 83.18)` (green)
- **Use Cases**: Color science, perceptual uniformity, color matching
- **Precision**: High precision decimal values
- **Note**: Perceptually uniform color space

#### XYZ (CIE XYZ)

- **Format**: `xyz(x, y, z)`
- **Range**: Typically 0-100 for each channel
- **Examples**:
  - `xyz(41.24, 21.26, 1.93)` (red)
  - `xyz(35.76, 71.52, 11.92)` (green)
- **Use Cases**: Color science, color space conversions, calibration
- **Precision**: High precision decimal values
- **Note**: Foundation for other color spaces

#### LCH (CIE L*C*h\*)

- **Format**: `lch(l, c, h)`
- **Range**: L: 0-100, C: 0-150+, H: 0-360°
- **Examples**:
  - `lch(53.23, 104.55, 40.85)` (red)
  - `lch(87.73, 119.78, 136.02)` (green)
- **Use Cases**: Color design, perceptual color manipulation
- **Precision**: High precision decimal values
- **Note**: Cylindrical representation of LAB

#### OKLAB (OK L*a*b\*)

- **Format**: `oklab(l, a, b)`
- **Range**: L: 0-1, a: -0.4 to +0.4, b: -0.4 to +0.4
- **Examples**:
  - `oklab(0.628, 0.225, 0.126)` (red)
  - `oklab(0.519, -0.140, 0.108)` (green)
- **Use Cases**: Modern color workflows, perceptual uniformity, HDR
- **Precision**: High precision decimal values
- **Note**: Improved perceptual uniformity over LAB

#### OKLCH (OK L*C*h\*)

- **Format**: `oklch(l, c, h)`
- **Range**: L: 0-1, C: 0-0.4+, H: 0-360°
- **Examples**:
  - `oklch(0.628, 0.258, 29.23)` (red)
  - `oklch(0.519, 0.177, 142.50)` (green)
- **Use Cases**: Modern design tools, CSS Color Level 4, HDR workflows
- **Precision**: High precision decimal values
- **Note**: Cylindrical representation of OKLAB

### 3. Named Colors

#### CSS Named Colors

- **Format**: Color name strings
- **Examples**: `red`, `blue`, `forestgreen`, `lightsteelblue`, `rebeccapurple`
- **Supported Colors**: All 147 CSS named colors
- **Use Cases**: Quick prototyping, semantic color references
- **Precision**: Fixed values (mapped to specific HEX values)

## Output Format Categories

### 1. Development Frameworks

#### CSS Variables

- **Format**: `--variable-name: value;`
- **Examples**:
  - `--primary-color: #ff0000;`
  - `--accent-hue: 240;`
- **Use Cases**: CSS custom properties, design systems
- **Configuration**: Custom variable names supported

#### SCSS Variables

- **Format**: `$variable-name: value;`
- **Examples**:
  - `$primary_color: #ff0000;`
  - `$brand_accent: hsl(240, 100%, 50%);`
- **Use Cases**: Sass/SCSS preprocessing, design tokens
- **Configuration**: Custom variable names supported

#### Tailwind CSS Classes

- **Format**: `color-shade`
- **Examples**:
  - `red-500`
  - `blue-600`
  - `emerald-400`
- **Use Cases**: Tailwind CSS framework, utility-first CSS
- **Algorithm**: Intelligent mapping to closest Tailwind color

### 2. Mobile Development

#### Swift UIColor

- **Format**: `UIColor(red: r, green: g, blue: b, alpha: a)`
- **Range**: 0.0-1.0 for each channel
- **Examples**:
  - `UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.000)`
  - `UIColor(red: 0.502, green: 0.502, blue: 0.502, alpha: 0.800)`
- **Use Cases**: iOS development, SwiftUI, UIKit
- **Precision**: Configurable decimal places

#### Android Color

- **Format**: `Color.parseColor("#AARRGGBB")`
- **Examples**:
  - `Color.parseColor("#FFFF0000")` (opaque red)
  - `Color.parseColor("#80FF0000")` (50% transparent red)
- **Use Cases**: Android development, Java/Kotlin
- **Note**: Includes alpha channel in hex format

#### Flutter Color

- **Format**: `Color(0xAARRGGBB)`
- **Examples**:
  - `Color(0xFFFF0000)` (opaque red)
  - `Color(0x80FF0000)` (50% transparent red)
- **Use Cases**: Flutter development, Dart
- **Note**: Hexadecimal format with alpha

## Precision and Accuracy

### Precision Levels

#### Standard Precision (2 decimal places)

```json
{
  "color": "#FF8040",
  "output_format": "hsl",
  "precision": 2
}
// Result: "hsl(20.00, 100.00%, 62.50%)"
```

#### High Precision (6 decimal places)

```json
{
  "color": "#FF8040",
  "output_format": "lab",
  "precision": 6
}
// Result: "lab(69.471582, 23.895672, 57.101562)"
```

#### Scientific Precision (10 decimal places)

```json
{
  "color": "#FF8040",
  "output_format": "oklab",
  "precision": 10
}
// Result: "oklab(0.7417558594, 0.1234567890, 0.0987654321)"
```

### Accuracy Considerations

#### Round-Trip Accuracy

- **HEX ↔ RGB**: Perfect accuracy (no precision loss)
- **RGB ↔ HSL**: High accuracy with proper rounding
- **LAB ↔ XYZ**: Scientific accuracy with configurable precision
- **OKLAB ↔ OKLCH**: Modern color space accuracy

#### Color Space Limitations

- **sRGB Gamut**: Standard web colors are limited to sRGB gamut
- **Print Colors**: CMYK conversion approximates screen colors
- **Perceptual Spaces**: LAB/OKLAB provide perceptual uniformity
- **HDR Support**: OKLAB/OKLCH support extended gamuts

## Best Practices

### Format Selection Guidelines

#### For Web Development

- **Primary**: HEX for simplicity, RGB for programmatic use
- **Advanced**: HSL for intuitive manipulation, OKLCH for modern workflows
- **Variables**: CSS custom properties for design systems

#### For Print Design

- **Primary**: CMYK for print-accurate colors
- **Proofing**: LAB for device-independent color matching
- **Conversion**: Always proof CMYK conversions

#### For Mobile Development

- **iOS**: Swift UIColor format with appropriate precision
- **Android**: Android Color format with alpha support
- **Cross-platform**: Flutter Color format for consistency

#### For Color Science

- **Perceptual**: LAB or OKLAB for uniform color differences
- **Calibration**: XYZ for device calibration and profiling
- **Modern**: OKLCH for contemporary color workflows

### Performance Optimization

#### Caching Strategy

- Frequently converted colors are cached automatically
- Cache keys include input color, output format, and precision
- LRU eviction prevents memory bloat

#### Batch Operations

- Use concurrent requests for multiple conversions
- Batch similar operations for better performance
- Monitor memory usage for large datasets

#### Precision Guidelines

- Use minimum required precision for better performance
- Scientific applications: 6-10 decimal places
- Design applications: 2-4 decimal places
- Web development: 0-2 decimal places

## Error Handling

### Common Input Errors

#### Invalid Color Values

```json
// Invalid HEX
{
  "color": "#GG0000",
  "output_format": "rgb"
}
// Error: Invalid color format

// Out of range RGB
{
  "color": "rgb(300, 0, 0)",
  "output_format": "hsl"
}
// Error: RGB values must be 0-255
```

#### Unsupported Formats

```json
{
  "color": "#FF0000",
  "output_format": "invalid_format"
}
// Error: Unsupported output format
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_COLOR_FORMAT",
    "message": "The provided color format is not supported",
    "suggestions": [
      "Try using a hex format like #FF0000",
      "Use RGB format like rgb(255, 0, 0)",
      "Check the color format documentation"
    ]
  }
}
```

## Advanced Usage Examples

### Color Space Conversions

```javascript
// Convert to perceptually uniform space
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF0000",
    "output_format": "oklab",
    "precision": 6
  }
}

// Convert for print production
{
  "tool": "convert_color",
  "parameters": {
    "color": "rgb(255, 128, 64)",
    "output_format": "cmyk"
  }
}
```

### Framework Integration

```javascript
// Generate design tokens
{
  "tool": "convert_color",
  "parameters": {
    "color": "#2563eb",
    "output_format": "css-var",
    "variable_name": "primary-600"
  }
}

// Mobile color constants
{
  "tool": "convert_color",
  "parameters": {
    "color": "#ef4444",
    "output_format": "swift",
    "precision": 3
  }
}
```

### High-Precision Scientific Use

```javascript
// Color matching applications
{
  "tool": "convert_color",
  "parameters": {
    "color": "lab(76.069, 52.259, 38.422)",
    "output_format": "xyz",
    "precision": 8
  }
}

// Modern color workflows
{
  "tool": "convert_color",
  "parameters": {
    "color": "oklch(0.7, 0.15, 180)",
    "output_format": "hex"
  }
}
```

## Migration Guide

### From Basic to Advanced Formats

#### Upgrading from HEX/RGB

1. **Start with HSL**: More intuitive for design work
2. **Add OKLCH**: For modern, perceptually uniform colors
3. **Use LAB**: For scientific accuracy and color matching

#### Framework Migration

1. **CSS Variables**: Replace hardcoded colors with custom properties
2. **Design Tokens**: Use SCSS variables for systematic color management
3. **Mobile Constants**: Generate platform-specific color definitions

### Performance Migration

1. **Identify Bottlenecks**: Profile color conversion usage
2. **Batch Operations**: Group similar conversions
3. **Cache Strategy**: Leverage automatic caching for repeated conversions
4. **Precision Optimization**: Use appropriate precision levels

This comprehensive guide covers all aspects of color format support in the MCP Color Server. For specific implementation details, refer to the API documentation and example code.
