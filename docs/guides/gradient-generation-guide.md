# Gradient Generation Guide

## Overview

The MCP Color Server provides comprehensive gradient generation capabilities with precise mathematical control and CSS output. This guide covers the gradient generation tools and their usage patterns.

## Available Tools

### generate_linear_gradient

Generate linear gradients with precise mathematical control and CSS output.

#### Parameters

- **colors** (required): Array of 2-20 color strings in any supported format
- **positions** (optional): Stop positions (0-100). If not provided, colors are evenly distributed
- **angle** (optional): Gradient angle in degrees (0-360, default: 90)
- **interpolation** (optional): Interpolation method: linear, ease, ease_in, ease_out, bezier (default: linear)
- **color_space** (optional): Color space for interpolation: rgb, hsl, lab, lch (default: rgb)
- **steps** (optional): Number of steps for stepped gradients (2-100)

#### Example Usage

```json
{
  "tool": "generate_linear_gradient",
  "parameters": {
    "colors": ["#FF0000", "#00FF00", "#0000FF"],
    "angle": 45,
    "interpolation": "ease"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "css": "linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
    "type": "linear",
    "angle": 45,
    "colors": [
      {
        "color": "#FF0000",
        "position": 0,
        "hex": "#ff0000",
        "rgb": "rgb(255, 0, 0)",
        "hsl": "hsl(0, 100%, 50%)"
      }
    ],
    "interpolation": "ease",
    "color_space": "rgb",
    "total_stops": 3
  },
  "export_formats": {
    "css": "linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
    "scss": "$gradient: linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%);",
    "json": {
      "type": "linear",
      "angle": 45,
      "colors": [...],
      "css": "..."
    }
  }
}
```

### generate_radial_gradient

Generate radial gradients with precise mathematical control and CSS output.

#### Parameters

- **colors** (required): Array of 2-20 color strings in any supported format
- **positions** (optional): Stop positions (0-100). If not provided, colors are evenly distributed
- **center** (optional): Center point [x, y] as percentages (0-100, default: [50, 50])
- **shape** (optional): Gradient shape: circle, ellipse (default: circle)
- **size** (optional): Gradient size method: closest_side, closest_corner, farthest_side, farthest_corner, explicit (default: farthest_corner)
- **dimensions** (optional): [width, height] dimensions when size is explicit
- **interpolation** (optional): Interpolation method: linear, ease, ease_in, ease_out, bezier (default: linear)
- **color_space** (optional): Color space for interpolation: rgb, hsl, lab, lch (default: rgb)
- **steps** (optional): Number of steps for stepped gradients (2-100)

#### Example Usage

```json
{
  "tool": "generate_radial_gradient",
  "parameters": {
    "colors": ["#FF0000", "#0000FF"],
    "center": [25, 75],
    "shape": "ellipse",
    "size": "closest_side"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "css": "radial-gradient(ellipse closest-side at 25% 75%, #ff0000 0%, #0000ff 100%)",
    "type": "radial",
    "center": [25, 75],
    "shape": "ellipse",
    "size": "closest_side",
    "colors": [...],
    "interpolation": "linear",
    "color_space": "rgb",
    "total_stops": 2
  }
}
```

## Color Format Support

Both gradient tools support all standard color formats:

- **HEX**: `#FF0000`, `#F00`
- **RGB**: `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)`
- **HSL**: `hsl(0, 100%, 50%)`, `hsla(0, 100%, 50%, 0.5)`
- **Named Colors**: `red`, `blue`, `green`, etc.

## Interpolation Methods

### Linear (Default)

Evenly distributed color stops with no easing.

```json
{
  "interpolation": "linear"
}
```

### Ease

Smooth acceleration and deceleration.

```json
{
  "interpolation": "ease"
}
```

### Ease In

Gradual acceleration from start.

```json
{
  "interpolation": "ease_in"
}
```

### Ease Out

Gradual deceleration to end.

```json
{
  "interpolation": "ease_out"
}
```

### Bezier

Cubic bezier curve interpolation.

```json
{
  "interpolation": "bezier"
}
```

## Advanced Features

### Stepped Gradients

Create discrete color bands instead of smooth transitions:

```json
{
  "colors": ["red", "blue"],
  "steps": 5
}
```

### Custom Positions

Specify exact positions for color stops:

```json
{
  "colors": ["red", "yellow", "blue"],
  "positions": [0, 30, 100]
}
```

### Explicit Dimensions (Radial Only)

Use specific pixel dimensions for radial gradients:

```json
{
  "size": "explicit",
  "dimensions": [200, 100],
  "shape": "ellipse"
}
```

## Common Use Cases

### Background Gradients

```json
{
  "colors": ["#667eea", "#764ba2"],
  "angle": 135
}
```

### Button Gradients

```json
{
  "colors": ["#4facfe", "#00f2fe"],
  "angle": 90
}
```

### Radial Spotlight Effects

```json
{
  "colors": ["rgba(255,255,255,0.8)", "rgba(255,255,255,0)"],
  "center": [30, 30],
  "size": "farthest_corner"
}
```

### Color Transitions

```json
{
  "colors": ["#ff9a9e", "#fecfef", "#fecfef"],
  "interpolation": "ease",
  "steps": 10
}
```

## Performance Considerations

- **Response Time**: All gradient generation completes in under 1000ms
- **Color Limits**: Maximum 20 colors per gradient for optimal performance
- **Step Limits**: Maximum 100 steps for stepped gradients
- **Memory Usage**: Efficient algorithms with minimal memory footprint

## Browser Compatibility

Generated CSS includes proper vendor prefixes and fallbacks:

```css
background: linear-gradient(45deg, #ff0000, #0000ff);
background: -webkit-linear-gradient(45deg, #ff0000, #0000ff);
background: -moz-linear-gradient(45deg, #ff0000, #0000ff);
background: -o-linear-gradient(45deg, #ff0000, #0000ff);
```

## Accessibility Guidelines

### Contrast Requirements

- Ensure sufficient contrast between gradient colors and overlaid text
- Test with WCAG contrast ratio calculators
- Consider users with color vision deficiencies

### Color Vision Deficiency

- Test gradients with colorblind simulators
- Avoid red-green combinations for critical information
- Provide alternative visual indicators when needed

### Recommendations

- Use gradients as enhancement, not primary information carriers
- Maintain readability across the entire gradient
- Test on various devices and screen types

## Error Handling

### Common Errors

#### Invalid Color Format

```json
{
  "success": false,
  "error": {
    "code": "GRADIENT_GENERATION_ERROR",
    "message": "Invalid colors found: invalid_color at index 1",
    "suggestions": [
      "Check that all colors are in valid formats (hex, rgb, hsl, named)",
      "Use formats like #FF0000, rgb(255,0,0), or hsl(0,100%,50%)"
    ]
  }
}
```

#### Position Mismatch

```json
{
  "success": false,
  "error": {
    "code": "GRADIENT_GENERATION_ERROR",
    "message": "Position count (3) must match color count (2)",
    "suggestions": [
      "Ensure positions array matches color count if provided",
      "Remove positions to use automatic distribution"
    ]
  }
}
```

#### Invalid Parameters

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid parameters: angle must be between 0-360",
    "suggestions": [
      "Verify angle is between 0-360 degrees",
      "Check parameter documentation for valid ranges"
    ]
  }
}
```

## Integration Examples

### Web Development

```javascript
// Generate gradient for CSS
const gradient = await mcpClient.callTool('generate_linear_gradient', {
  colors: ['#667eea', '#764ba2'],
  angle: 135,
});

// Apply to element
element.style.background = gradient.data.css;
```

### Design Systems

```javascript
// Generate theme gradients
const primaryGradient = await mcpClient.callTool('generate_linear_gradient', {
  colors: [theme.primary, theme.primaryLight],
  angle: 90,
});

const secondaryGradient = await mcpClient.callTool('generate_radial_gradient', {
  colors: [theme.secondary, theme.secondaryDark],
  shape: 'circle',
});
```

### Dynamic Color Generation

```javascript
// Generate gradient from palette
const palette = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
const gradient = await mcpClient.callTool('generate_linear_gradient', {
  colors: palette,
  interpolation: 'ease',
  angle: 45,
});
```

## Mathematical Accuracy

### Position Calculation

- Precise mathematical distribution for even spacing
- Floating-point precision maintained throughout calculations
- Proper rounding for CSS output

### Interpolation Algorithms

- Mathematically accurate easing functions
- Consistent results across different inputs
- Proper handling of edge cases

### Color Space Conversions

- High-precision color format conversions
- Consistent color representation across formats
- Proper handling of alpha channels

## Best Practices

### Performance

- Use fewer colors when possible (2-5 colors optimal)
- Avoid excessive step counts for stepped gradients
- Cache generated gradients for repeated use

### Design

- Use standard angles (0°, 45°, 90°, 135°, 180°) for consistency
- Consider the visual weight of gradient directions
- Test gradients at different sizes and resolutions

### Accessibility

- Maintain sufficient contrast ratios
- Provide fallback solid colors
- Test with assistive technologies

### Code Organization

- Store gradient definitions in design tokens
- Use semantic naming for gradient variables
- Document gradient usage and purpose

This comprehensive guide covers all aspects of gradient generation with the MCP Color Server, from basic usage to advanced techniques and best practices.
