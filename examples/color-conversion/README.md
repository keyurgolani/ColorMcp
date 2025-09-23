# Color Conversion Examples

This section demonstrates the `convert_color` tool, which converts colors between different formats with high precision and comprehensive metadata.

## Available Output Formats

- **hex** - Hexadecimal format (#RRGGBB)
- **rgb** - RGB format (rgb(r, g, b))
- **rgba** - RGBA format with alpha channel
- **hsl** - HSL format (hsl(h, s%, l%))
- **hsla** - HSLA format with alpha channel
- **hsv** - HSV format
- **hwb** - HWB format
- **cmyk** - CMYK format for print
- **lab** - LAB color space
- **xyz** - XYZ color space
- **lch** - LCH color space
- **oklab** - OKLab color space
- **oklch** - OKLCH color space
- **css-var** - CSS custom property
- **scss-var** - SCSS variable
- **tailwind** - Tailwind CSS class
- **swift** - Swift UIColor
- **android** - Android Color
- **flutter** - Flutter Color
- **named** - Named color (if available)

## Examples

### Basic HEX to RGB Conversion

**Tool Call:**

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "#3B82F6",
    "output_format": "rgb"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "original": "#3B82F6",
    "converted": "rgb(59, 130, 246)",
    "format": "rgb",
    "precision": 2,
    "detected_format": "hex"
  },
  "metadata": {
    "execution_time": 0,
    "tool": "convert_color",
    "timestamp": "2025-09-23T02:19:43.901Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "detectedInputFormat": "hex",
    "colorProperties": {
      "brightness": 122,
      "temperature": "cool",
      "wcagAA": true,
      "wcagAAA": false
    },
    "accessibility_notes": [
      "Brightness: 122/255",
      "Color temperature: cool",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: No"
    ],
    "accessibilityNotes": [
      "Brightness: 122/255",
      "Color temperature: cool",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: No"
    ],
    "recommendations": [
      "For better color accuracy in professional applications, consider using LAB color space",
      "Use higher precision (3-4 decimal places) for color matching applications",
      "Test color accessibility with the check_contrast tool",
      "Conversion completed within optimal time"
    ]
  }
}
```

### RGB to HSL with High Precision

**Tool Call:**

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "rgb(255, 99, 71)",
    "output_format": "hsl",
    "precision": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "original": "rgb(255, 99, 71)",
    "converted": "hsl(9.000, 100.000%, 64.000%)",
    "format": "hsl",
    "precision": 3,
    "detected_format": "rgb"
  },
  "metadata": {
    "execution_time": 1,
    "tool": "convert_color",
    "timestamp": "2025-09-23T02:19:48.414Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "detectedInputFormat": "rgb",
    "colorProperties": {
      "brightness": 142,
      "temperature": "warm",
      "wcagAA": true,
      "wcagAAA": true
    },
    "accessibility_notes": [
      "Brightness: 142/255",
      "Color temperature: warm",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: Yes"
    ],
    "accessibilityNotes": [
      "Brightness: 142/255",
      "Color temperature: warm",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: Yes"
    ],
    "recommendations": [
      "For better color accuracy in professional applications, consider using LAB color space",
      "Use higher precision (3-4 decimal places) for color matching applications",
      "Test color accessibility with the check_contrast tool",
      "Conversion completed within optimal time"
    ]
  }
}
```

### HSL to CSS Variable

**Tool Call:**

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "hsl(240, 100%, 50%)",
    "output_format": "css-var",
    "variable_name": "primary-blue"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "original": "hsl(240, 100%, 50%)",
    "converted": "--color: #0000ff;",
    "format": "css-var",
    "precision": 2,
    "detected_format": "hsl",
    "css_variable": "--primary-blue: #0000ff;",
    "scss_variable": "$primary-blue: #0000ff;"
  },
  "metadata": {
    "execution_time": 0,
    "tool": "convert_color",
    "timestamp": "2025-09-23T02:19:51.909Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "detectedInputFormat": "hsl",
    "colorProperties": {
      "brightness": 29,
      "temperature": "cool",
      "wcagAA": true,
      "wcagAAA": true
    },
    "accessibility_notes": [
      "Brightness: 29/255",
      "Color temperature: cool",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: Yes"
    ],
    "accessibilityNotes": [
      "Brightness: 29/255",
      "Color temperature: cool",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: Yes"
    ],
    "recommendations": [
      "For better color accuracy in professional applications, consider using LAB color space",
      "Use higher precision (3-4 decimal places) for color matching applications",
      "Test color accessibility with the check_contrast tool",
      "Conversion completed within optimal time"
    ]
  }
}
```

## Key Features

- **Automatic Format Detection**: The tool automatically detects the input color format
- **High Precision**: Configurable precision up to 10 decimal places
- **Comprehensive Metadata**: Includes execution time, color properties, and accessibility information
- **Accessibility Analysis**: Automatic brightness and temperature analysis with WCAG compliance checking
- **Recommendations**: Contextual suggestions for optimal usage
- **Multiple Output Formats**: Support for web, mobile, and design tool formats

### Na

med Color to LAB Color Space

**Tool Call:**

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "red",
    "output_format": "lab",
    "precision": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "original": "red",
    "converted": "lab(54.290, 80.810, 69.890)",
    "format": "lab",
    "precision": 3,
    "detected_format": "named"
  },
  "metadata": {
    "execution_time": 2,
    "tool": "convert_color",
    "timestamp": "2025-09-23T02:21:08.599Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "detectedInputFormat": "named",
    "colorProperties": {
      "brightness": 76,
      "temperature": "warm",
      "wcagAA": true,
      "wcagAAA": false
    },
    "accessibility_notes": [
      "Brightness: 76/255",
      "Color temperature: warm",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: No"
    ],
    "accessibilityNotes": [
      "Brightness: 76/255",
      "Color temperature: warm",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: No"
    ],
    "recommendations": [
      "For better color accuracy in professional applications, consider using LAB color space",
      "Use higher precision (3-4 decimal places) for color matching applications",
      "Test color accessibility with the check_contrast tool",
      "Conversion completed within optimal time"
    ]
  }
}
```

### HEX to Tailwind CSS Class

**Tool Call:**

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF5733",
    "output_format": "tailwind"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "original": "#FF5733",
    "converted": "red-400",
    "format": "tailwind",
    "precision": 2,
    "detected_format": "hex"
  },
  "metadata": {
    "execution_time": 0,
    "tool": "convert_color",
    "timestamp": "2025-09-23T02:21:11.989Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "detectedInputFormat": "hex",
    "colorProperties": {
      "brightness": 133,
      "temperature": "warm",
      "wcagAA": true,
      "wcagAAA": false
    },
    "accessibility_notes": [
      "Brightness: 133/255",
      "Color temperature: warm",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: No"
    ],
    "accessibilityNotes": [
      "Brightness: 133/255",
      "Color temperature: warm",
      "WCAG AA compliant: Yes",
      "WCAG AAA compliant: No"
    ],
    "recommendations": [
      "For better color accuracy in professional applications, consider using LAB color space",
      "Use higher precision (3-4 decimal places) for color matching applications",
      "Test color accessibility with the check_contrast tool",
      "Conversion completed within optimal time"
    ]
  }
}
```

## Usage Notes

- The tool automatically detects input format, supporting HEX, RGB, HSL, named colors, and more
- Precision parameter allows control over decimal places in numeric outputs
- Each conversion includes comprehensive metadata about color properties
- Accessibility information is automatically calculated for each color
- Recommendations are provided based on the specific conversion and use case
