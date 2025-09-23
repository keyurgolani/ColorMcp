# Extended Color Format Support

The MCP Color Server now supports a comprehensive range of color formats for both input and output, making it one of the most complete color conversion systems available.

## Supported Input Formats

### Basic Formats

- **HEX**: `#FF0000`, `#F00`, `FF0000`, `F00`
- **RGB**: `rgb(255, 0, 0)`, `255, 0, 0`, `255 0 0`, `[255, 0, 0]`
- **RGBA**: `rgba(255, 0, 0, 0.5)`
- **HSL**: `hsl(0, 100%, 50%)`, `0, 100%, 50%`
- **HSLA**: `hsla(0, 100%, 50%, 0.8)`
- **HSV/HSB**: `hsv(0, 100%, 100%)`, `hsb(0, 100%, 100%)`
- **HSVA**: `hsva(0, 100%, 100%, 0.7)`

### Advanced Formats

- **HWB**: `hwb(0, 0%, 0%)` - Hue, Whiteness, Blackness
- **CMYK**: `cmyk(0%, 100%, 100%, 0%)` - Cyan, Magenta, Yellow, Key (Black)
- **LAB**: `lab(53.23, 80.11, 67.22)` - CIE L*a*b\* color space
- **XYZ**: `xyz(41.24, 21.26, 1.93)` - CIE XYZ color space
- **LCH**: `lch(53.23, 104.55, 40.85)` - CIE LCH color space
- **OKLAB**: `oklab(0.628, 0.225, 0.126)` - OKLab perceptual color space
- **OKLCH**: `oklch(0.628, 0.258, 29.23)` - OKLCH perceptual color space

### Named Colors

- Standard CSS named colors: `red`, `blue`, `green`, `white`, `black`, etc.
- Case-insensitive: `RED`, `Blue`, `GREEN`

## Supported Output Formats

### Standard Web Formats

- **hex**: `#ff0000`
- **rgb**: `rgb(255, 0, 0)`
- **rgba**: `rgba(255, 0, 0, 1.00)`
- **hsl**: `hsl(0.00, 100.00%, 50.00%)`
- **hsla**: `hsla(0.00, 100.00%, 50.00%, 1.00)`
- **hsv**: `hsv(0.00, 100.00%, 100.00%)`
- **hsva**: `hsva(0.00, 100.00%, 100.00%, 1.00)`

### Advanced Color Spaces

- **hwb**: `hwb(0.00, 0.00%, 0.00%)`
- **cmyk**: `cmyk(0%, 100%, 100%, 0%)`
- **lab**: `lab(53.23, 80.11, 67.22)`
- **xyz**: `xyz(41.24, 21.26, 1.93)`
- **lch**: `lch(53.23, 104.55, 40.85)`
- **oklab**: `oklab(0.628, 0.225, 0.126)`
- **oklch**: `oklch(0.628, 0.258, 29.23)`

### Development Formats

- **css-var**: `--color: #ff0000;`
- **scss-var**: `$color: #ff0000;`
- **tailwind**: `red-500` (intelligent class generation)

### Mobile Framework Formats

- **swift**: `UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.000)`
- **android**: `Color.parseColor("#FFFF0000")`
- **flutter**: `Color(0xFFFF0000)`

### Named Color Output

- **named**: `red` (closest named color match)

## Precision Control

All numeric formats support configurable precision from 0 to 10 decimal places:

```json
{
  "color": "#FF8040",
  "output_format": "hsl",
  "precision": 3
}
```

Output: `hsl(20.000, 100.000%, 62.500%)`

## Variable Name Support

CSS and SCSS formats support custom variable names:

```json
{
  "color": "#FF0000",
  "output_format": "css-var",
  "variable_name": "primary-color"
}
```

Output: `--primary-color: #ff0000;`

## Performance Characteristics

### Core Conversion Performance

- **Color Creation**: ~0.015ms per UnifiedColor instance
- **Format Conversion**: ~0.003ms per conversion
- **Format Getters**: ~0.002ms per getter call
- **Color Parsing**: ~0.014ms per parse operation

### MCP Tool Performance

Individual conversions through the MCP tool handler (including validation, logging, and response formatting):

- **Simple formats** (hex, rgb, hsl): ~0.4-0.8ms per conversion
- **Advanced formats** (lab, xyz, lch): ~0.1-0.2ms per conversion
- **Framework formats** (swift, android, flutter): ~0.1ms per conversion
- **Complex formats** (tailwind): ~1.5ms per conversion (due to intelligent class generation)

## Mathematical Accuracy

The color conversion system maintains high mathematical accuracy:

- **Round-trip accuracy**: Colors maintain their values when converted through multiple formats
- **Perceptual uniformity**: LAB, LCH, OKLAB, and OKLCH spaces provide perceptually uniform color differences
- **Gamut handling**: Proper handling of out-of-gamut colors with intelligent clamping
- **Alpha channel**: Full support for transparency in applicable formats

## Color Space Information

### sRGB-based Formats

- HEX, RGB, HSL, HSV, HWB - All based on the sRGB color space
- Suitable for web and most digital applications

### Device-Independent Formats

- **LAB**: CIE L*a*b\* - Perceptually uniform, device-independent
- **XYZ**: CIE XYZ - Foundation color space for color science
- **LCH**: CIE LCH - Cylindrical representation of LAB

### Modern Perceptual Formats

- **OKLAB**: Improved perceptual uniformity over LAB
- **OKLCH**: Cylindrical representation of OKLAB
- Better for color manipulation and gradient generation

### Print Formats

- **CMYK**: Subtractive color model for print applications
- Automatic conversion from RGB with proper black generation

## Usage Examples

### Basic Conversion

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF0000",
    "output_format": "hsl"
  }
}
```

### High-Precision Scientific Conversion

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "lab(53.23088, 80.10930, 67.22006)",
    "output_format": "xyz",
    "precision": 5
  }
}
```

### Mobile Development

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "hsl(210, 50%, 60%)",
    "output_format": "swift",
    "precision": 3
  }
}
```

### CSS Variable Generation

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "#2563eb",
    "output_format": "css-var",
    "variable_name": "primary-blue"
  }
}
```

## Error Handling

The system provides comprehensive error handling with helpful suggestions:

```json
{
  "success": false,
  "error": {
    "code": "CONVERSION_ERROR",
    "message": "Invalid color format provided",
    "suggestions": [
      "Supported formats: HEX (#FF0000), RGB (rgb(255,0,0)), HSL (hsl(0,100%,50%)), HSV, CMYK, LAB, XYZ, and named colors",
      "Check the color value spelling and format",
      "Use quotes around color values in JSON"
    ]
  }
}
```

## Integration Notes

### Accessibility

All conversions include accessibility metadata:

- WCAG AA/AAA compliance information
- Brightness calculations
- Color temperature classification
- Contrast ratio information

### Metadata

Each conversion includes comprehensive metadata:

- Execution time
- Detected input format
- Color properties (brightness, temperature)
- Accessibility notes
- Performance recommendations

### Caching

The system implements intelligent caching for frequently converted colors, improving performance for repeated operations.

## Future Enhancements

Planned additions include:

- **P3 Display** color space support
- **Rec. 2020** wide gamut support
- **HDR** color formats
- **Spectral** color data support
- **Custom color space** definitions

This comprehensive color format support makes the MCP Color Server suitable for professional color workflows, scientific applications, web development, mobile app development, and print design.
