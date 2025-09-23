# HTML Visualization Guide

This guide provides comprehensive documentation for the HTML visualization system in the MCP Color Server, including usage examples, accessibility features, and best practices.

## Overview

The MCP Color Server provides three main HTML visualization tools:

1. **create_palette_html** - Interactive color palette visualizations
2. **create_color_wheel_html** - Interactive color wheel visualizations
3. **create_gradient_html** - Gradient preview visualizations

All HTML visualizations are:

- **Self-contained** - No external dependencies
- **Accessible** - WCAG 2.1 AA compliant
- **Responsive** - Mobile-first design
- **Interactive** - Optional JavaScript interactivity
- **Themeable** - Light, dark, and auto themes

## Color Palette Visualizations

### Basic Usage

```json
{
  "tool": "create_palette_html",
  "parameters": {
    "palette": ["#FF0000", "#00FF00", "#0000FF"]
  }
}
```

### Layout Options

#### Horizontal Layout (Default)

```json
{
  "palette": ["#FF0000", "#00FF00", "#0000FF"],
  "layout": "horizontal"
}
```

#### Vertical Layout

```json
{
  "palette": ["#FF0000", "#00FF00", "#0000FF"],
  "layout": "vertical"
}
```

#### Grid Layout

```json
{
  "palette": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"],
  "layout": "grid"
}
```

#### Circular Layout

```json
{
  "palette": ["#FF0000", "#00FF00", "#0000FF"],
  "layout": "circular"
}
```

### Size Options

```json
{
  "palette": ["#FF0000", "#00FF00"],
  "size": "large",
  "custom_dimensions": [300, 200] // Only when size is "custom"
}
```

Available sizes: `small`, `medium` (default), `large`, `custom`

### Display Options

```json
{
  "palette": ["#FF0000", "#00FF00"],
  "show_values": true, // Show color values (default: true)
  "show_names": true, // Show color names (default: false)
  "accessibility_info": true // Show accessibility information (default: false)
}
```

### Interactive Features

```json
{
  "palette": ["#FF0000", "#00FF00"],
  "interactive": true,
  "export_formats": ["hex", "rgb", "hsl", "css"]
}
```

### Themes

```json
{
  "palette": ["#FF0000", "#00FF00"],
  "theme": "dark" // "light" (default), "dark", "auto"
}
```

## Color Wheel Visualizations

### Basic Usage

```json
{
  "tool": "create_color_wheel_html",
  "parameters": {
    "type": "hsl",
    "size": 400
  }
}
```

### Wheel Types

- `hsl` - HSL color wheel (default)
- `hsv` - HSV color wheel
- `rgb` - RGB color wheel
- `ryw` - Red-Yellow-White wheel
- `ryb` - Red-Yellow-Blue wheel

### Highlight Colors

```json
{
  "type": "hsl",
  "highlight_colors": ["#FF0000", "#00FF00", "#0000FF"],
  "size": 500
}
```

### Color Harmony

```json
{
  "type": "hsl",
  "show_harmony": true,
  "harmony_type": "complementary"
}
```

Available harmony types:

- `complementary`
- `triadic`
- `analogous`
- `split_complementary`
- `tetradic`

### Interactive Features

```json
{
  "type": "hsl",
  "interactive": true, // Enable click and keyboard navigation
  "theme": "light"
}
```

## Gradient Visualizations

### Basic Usage

```json
{
  "tool": "create_gradient_html",
  "parameters": {
    "gradient_css": "linear-gradient(45deg, #ff0000, #0000ff)"
  }
}
```

### Gradient Types

#### Linear Gradients

```json
{
  "gradient_css": "linear-gradient(45deg, #ff0000, #0000ff)"
}
```

#### Radial Gradients

```json
{
  "gradient_css": "radial-gradient(circle, #ff0000, #0000ff)"
}
```

#### Conic Gradients

```json
{
  "gradient_css": "conic-gradient(#ff0000, #0000ff)"
}
```

### Preview Shapes

```json
{
  "gradient_css": "linear-gradient(45deg, #ff0000, #0000ff)",
  "preview_shapes": ["rectangle", "circle", "text", "button"]
}
```

Available shapes: `rectangle`, `circle`, `text`, `button`, `card`

### CSS Code Display

```json
{
  "gradient_css": "linear-gradient(45deg, #ff0000, #0000ff)",
  "show_css_code": true, // Show CSS code with copy button (default: true)
  "size": [600, 400] // Custom preview size
}
```

### Interactive Controls

```json
{
  "gradient_css": "linear-gradient(45deg, #ff0000, #0000ff)",
  "interactive_controls": true, // Enable angle/position controls
  "variations": true // Show gradient variations
}
```

## Accessibility Features

All HTML visualizations include comprehensive accessibility features:

### WCAG 2.1 AA Compliance

- Proper semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion support

### Keyboard Navigation

#### Color Palettes

- **Tab** - Navigate between color swatches
- **Enter/Space** - Select color and copy to clipboard
- **Arrow Keys** - Navigate in grid layouts

#### Color Wheels

- **Tab** - Navigate to wheel
- **Arrow Keys** - Navigate around wheel segments
- **Enter/Space** - Select color
- **Click** - Select color at mouse position

#### Gradients

- **Tab** - Navigate between controls
- **Enter/Space** - Activate buttons
- **Arrow Keys** - Adjust sliders (when interactive)

### Screen Reader Support

All visualizations include:

- Descriptive ARIA labels
- Live regions for dynamic updates
- Alternative text for visual elements
- Structured content hierarchy

### Color Vision Accessibility

- High contrast mode support
- Alternative indicators beyond color
- Accessibility information display
- WCAG contrast ratio calculations

## Responsive Design

All visualizations are mobile-first and responsive:

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations

- Touch-friendly controls (44px minimum)
- Simplified layouts
- Optimized font sizes
- Reduced animations

## Performance Considerations

### Response Time Requirements

- **Simple Operations**: < 500ms
- **Complex Visualizations**: < 2000ms
- **Large Palettes**: < 3000ms

### File Size Limits

- **HTML Output**: < 2MB
- **Embedded Assets**: Self-contained
- **No External Dependencies**: All CSS/JS embedded

### Memory Usage

- **Per Request**: < 100MB
- **Concurrent Requests**: 50+ supported
- **Cleanup**: Automatic resource cleanup

## Best Practices

### Color Palette Visualizations

1. **Limit Colors**: Use 10 or fewer colors for optimal performance
2. **Choose Layout**:
   - Horizontal: 2-6 colors
   - Grid: 4-12 colors
   - Circular: 3-8 colors
3. **Accessibility**: Enable accessibility info for public use
4. **Interactivity**: Enable for user-facing applications

### Color Wheel Visualizations

1. **Size Considerations**:
   - Mobile: 300-400px
   - Desktop: 400-600px
   - Large displays: 600-800px
2. **Highlight Colors**: Limit to 5-8 for clarity
3. **Harmony**: Use for educational purposes
4. **Performance**: Large wheels (>800px) may impact mobile performance

### Gradient Visualizations

1. **Preview Shapes**: Use 2-4 shapes maximum
2. **Interactive Controls**: Best with linear gradients
3. **CSS Code**: Always show for developer tools
4. **Complex Gradients**: May need accessibility notes

## Error Handling

All tools provide structured error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_COLOR_FORMAT",
    "message": "Invalid color format provided",
    "suggestions": [
      "Use hex format like #FF0000",
      "Use RGB format like rgb(255, 0, 0)"
    ]
  }
}
```

### Common Error Codes

- `INVALID_PARAMETERS` - Parameter validation failed
- `INVALID_COLOR_FORMAT` - Color format not supported
- `INVALID_GRADIENT_CSS` - Gradient CSS syntax error
- `INTERNAL_ERROR` - Unexpected server error

## Integration Examples

### Web Applications

```javascript
// Fetch palette visualization
const response = await fetch('/mcp/tools/create_palette_html', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    palette: ['#FF0000', '#00FF00', '#0000FF'],
    interactive: true,
    theme: 'auto',
  }),
});

const result = await response.json();
if (result.success) {
  document.getElementById('palette-container').innerHTML =
    result.visualizations.html;
}
```

### Design Tools

```python
# Generate color wheel for design tool
import requests

response = requests.post('http://localhost:3000/mcp/tools/create_color_wheel_html', json={
    'type': 'hsl',
    'size': 600,
    'highlight_colors': ['#FF6B6B', '#4ECDC4', '#45B7D1'],
    'show_harmony': True,
    'harmony_type': 'triadic',
    'interactive': True
})

if response.json()['success']:
    with open('color_wheel.html', 'w') as f:
        f.write(response.json()['visualizations']['html'])
```

### Educational Applications

```json
{
  "tool": "create_color_wheel_html",
  "parameters": {
    "type": "hsl",
    "size": 500,
    "show_harmony": true,
    "harmony_type": "complementary",
    "interactive": true,
    "theme": "light"
  }
}
```

## Troubleshooting

### Common Issues

1. **Large File Sizes**: Reduce palette size or disable interactivity
2. **Slow Performance**: Use smaller visualizations or simpler layouts
3. **Accessibility Issues**: Enable accessibility info and test with screen readers
4. **Mobile Issues**: Test responsive design and touch interactions

### Performance Optimization

1. **Caching**: Results are cached for repeated requests
2. **Compression**: HTML is optimized for size
3. **Lazy Loading**: JavaScript loads only when needed
4. **Memory Management**: Automatic cleanup after generation

### Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Mobile Browsers**: Optimized for iOS Safari and Chrome Mobile
- **Legacy Support**: Graceful degradation for older browsers
- **Feature Detection**: Progressive enhancement approach

## Advanced Features

### Custom Styling

All visualizations use CSS custom properties for easy theming:

```css
:root {
  --color-primary: #2563eb;
  --color-background: #ffffff;
  --spacing-md: 1rem;
  --border-radius: 0.5rem;
}
```

### Export Formats

Visualizations can export colors in multiple formats:

- **CSS**: Custom properties and variables
- **SCSS**: Variables and mixins
- **JSON**: Structured color data
- **Tailwind**: Utility classes

### Plugin Architecture

The HTML generator supports custom templates and helpers for specialized use cases.

## Conclusion

The HTML visualization system provides powerful, accessible, and performant color visualizations for a wide range of applications. By following the guidelines and best practices in this document, you can create effective color tools that work well across devices and user needs.

For additional support or advanced use cases, refer to the API documentation or contact the development team.
