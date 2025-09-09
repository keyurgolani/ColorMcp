# Convert Color - Use Case 1: Web Developer Brand Colors

## Scenario

A web developer needs to convert their brand's primary blue color from HEX to HSL for CSS custom properties and better color manipulation.

## Input Parameters

```json
{
  "color": "#2563eb",
  "output_format": "hsl",
  "precision": 1
}
```

## Output

```json
{
  "success": true,
  "data": {
    "original": "#2563eb",
    "converted": "hsl(221.0, 83.0%, 53.0%)",
    "format": "hsl",
    "precision": 1,
    "detected_format": "hex"
  },
  "metadata": {
    "execution_time": 0,
    "tool": "convert_color",
    "timestamp": "2025-09-09T16:33:52.682Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "detectedInputFormat": "hex",
    "colorProperties": {
      "brightness": 96,
      "temperature": "cool",
      "wcagAA": true,
      "wcagAAA": false
    },
    "accessibility_notes": [
      "Brightness: 96/255",
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

## Practical Application

```css
:root {
  --primary-color: hsl(221, 83%, 53%);
  --primary-light: hsl(221, 83%, 63%);
  --primary-dark: hsl(221, 83%, 43%);
}
```

## Key Insights

- HSL format makes it easy to create color variations by adjusting lightness
- The tool provides accessibility information automatically
- Execution time was optimal (0ms)
- Color temperature analysis helps with design decisions
