# Gradient Generation Examples

This section demonstrates gradient generation tools that create CSS gradients with precise control over colors, positions, and effects.

## Available Gradient Types

- **Linear Gradients** - Straight line transitions between colors
- **Radial Gradients** - Circular or elliptical transitions from center outward
- **Conic Gradients** - Angular transitions around a center point

## Examples

### Linear Gradient with Angle

**Tool Call:**

```json
{
  "tool": "generate_linear_gradient",
  "parameters": {
    "colors": ["#ff6b6b", "#4ecdc4", "#45b7d1"],
    "angle": 45,
    "interpolation": "linear"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "css": "linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)",
    "type": "linear",
    "angle": 45,
    "colors": [
      {
        "color": "#ff6b6b",
        "position": 0,
        "hex": "#ff6b6b",
        "rgb": "rgb(255, 107, 107)",
        "hsl": "hsl(0, 100%, 71%)"
      },
      {
        "color": "#4ecdc4",
        "position": 50,
        "hex": "#4ecdc4",
        "rgb": "rgb(78, 205, 196)",
        "hsl": "hsl(176, 56%, 55%)"
      },
      {
        "color": "#45b7d1",
        "position": 100,
        "hex": "#45b7d1",
        "rgb": "rgb(69, 183, 209)",
        "hsl": "hsl(191, 60%, 55%)"
      }
    ],
    "interpolation": "linear",
    "color_space": "rgb",
    "total_stops": 3
  },
  "metadata": {
    "execution_time": 0,
    "tool": "generate_linear_gradient",
    "timestamp": "2025-09-23T02:23:37.913Z",
    "color_space_used": "rgb",
    "colorSpaceUsed": "rgb",
    "accessibility_notes": [
      "Ensure sufficient contrast between gradient colors and any overlaid text",
      "Test gradient visibility with color vision deficiency simulators"
    ],
    "accessibilityNotes": [
      "Ensure sufficient contrast between gradient colors and any overlaid text",
      "Test gradient visibility with color vision deficiency simulators"
    ],
    "recommendations": []
  },
  "export_formats": {
    "css": "linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)",
    "scss": "$gradient: linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%);",
    "json": {
      "type": "linear",
      "angle": 45,
      "colors": [
        {
          "color": "#ff6b6b",
          "position": 0,
          "hex": "#ff6b6b",
          "rgb": "rgb(255, 107, 107)",
          "hsl": "hsl(0, 100%, 71%)"
        },
        {
          "color": "#4ecdc4",
          "position": 50,
          "hex": "#4ecdc4",
          "rgb": "rgb(78, 205, 196)",
          "hsl": "hsl(176, 56%, 55%)"
        },
        {
          "color": "#45b7d1",
          "position": 100,
          "hex": "#45b7d1",
          "rgb": "rgb(69, 183, 209)",
          "hsl": "hsl(191, 60%, 55%)"
        }
      ],
      "css": "linear-gradient(45deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%)"
    }
  }
}
```

### Radial Gradient with Center Control

**Tool Call:**

```json
{
  "tool": "generate_radial_gradient",
  "parameters": {
    "colors": ["#667eea", "#764ba2"],
    "shape": "circle",
    "center": [50, 50]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "css": "radial-gradient(circle farthest-corner at 50% 50%, #667eea 0%, #764ba2 100%)",
    "type": "radial",
    "center": [50, 50],
    "shape": "circle",
    "size": "farthest_corner",
    "colors": [
      {
        "color": "#667eea",
        "position": 0,
        "hex": "#667eea",
        "rgb": "rgb(102, 126, 234)",
        "hsl": "hsl(229, 76%, 66%)"
      },
      {
        "color": "#764ba2",
        "position": 100,
        "hex": "#764ba2",
        "rgb": "rgb(118, 75, 162)",
        "hsl": "hsl(270, 37%, 46%)"
      }
    ],
    "interpolation": "linear",
    "color_space": "rgb",
    "total_stops": 2
  },
  "metadata": {
    "execution_time": 0,
    "tool": "generate_radial_gradient",
    "timestamp": "2025-09-23T02:23:42.299Z",
    "color_space_used": "rgb",
    "colorSpaceUsed": "rgb",
    "accessibility_notes": [
      "Ensure sufficient contrast between gradient colors and any overlaid text",
      "Test gradient visibility with color vision deficiency simulators",
      "Radial gradients can create focus points - use carefully for accessibility"
    ],
    "accessibilityNotes": [
      "Ensure sufficient contrast between gradient colors and any overlaid text",
      "Test gradient visibility with color vision deficiency simulators",
      "Radial gradients can create focus points - use carefully for accessibility"
    ],
    "recommendations": []
  },
  "export_formats": {
    "css": "radial-gradient(circle farthest-corner at 50% 50%, #667eea 0%, #764ba2 100%)",
    "scss": "$gradient: radial-gradient(circle farthest-corner at 50% 50%, #667eea 0%, #764ba2 100%);",
    "json": {
      "type": "radial",
      "center": [50, 50],
      "shape": "circle",
      "size": "farthest_corner",
      "colors": [
        {
          "color": "#667eea",
          "position": 0,
          "hex": "#667eea",
          "rgb": "rgb(102, 126, 234)",
          "hsl": "hsl(229, 76%, 66%)"
        },
        {
          "color": "#764ba2",
          "position": 100,
          "hex": "#764ba2",
          "rgb": "rgb(118, 75, 162)",
          "hsl": "hsl(270, 37%, 46%)"
        }
      ],
      "css": "radial-gradient(circle farthest-corner at 50% 50%, #667eea 0%, #764ba2 100%)"
    }
  }
}
```

## Key Features

### Linear Gradients

- **Angle Control**: Precise angle specification (0-360 degrees)
- **Color Positioning**: Custom stop positions for each color
- **Interpolation Methods**: Linear, ease, bezier transitions
- **Color Space Options**: RGB, HSL, LAB color space interpolation

### Radial Gradients

- **Shape Control**: Circle or ellipse shapes
- **Center Positioning**: Precise center point control
- **Size Options**: Closest/farthest side/corner sizing
- **Custom Dimensions**: Explicit width/height control

### Export Formats

- **CSS**: Ready-to-use CSS gradient syntax
- **SCSS**: SCSS variable format
- **JSON**: Structured data for programmatic use

## Understanding Parameters

### Linear Gradient Angles

- **0°** - Bottom to top
- **90°** - Left to right (default)
- **180°** - Top to bottom
- **270°** - Right to left
- **45°** - Bottom-left to top-right

### Radial Gradient Sizes

- **closest-side** - Gradient ends at closest edge
- **closest-corner** - Gradient ends at closest corner
- **farthest-side** - Gradient ends at farthest edge
- **farthest-corner** - Gradient ends at farthest corner (default)

## Accessibility Considerations

- Test gradient contrast with overlaid text
- Ensure gradients don't interfere with content readability
- Consider how gradients appear to users with color vision deficiencies
- Use gradients as enhancement, not primary information conveyance
