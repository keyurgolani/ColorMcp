# HTML Visualizations Examples

This section demonstrates interactive HTML visualization tools that create comprehensive color displays and interfaces.

## Available Visualizations

- **create_palette_html** - Interactive color palette displays
- **create_color_wheel_html** - Interactive color wheels with harmony visualization
- **create_gradient_html** - Gradient preview and editing interfaces
- **create_theme_preview_html** - Complete theme mockups and previews

## Examples

### Interactive Color Palette

**Tool Call:**

```json
{
  "tool": "create_palette_html",
  "parameters": {
    "palette": ["#2563eb", "#ebac24", "#1d66e9", "#eca827", "#2463e9"],
    "layout": "horizontal",
    "style": "swatches",
    "show_values": true,
    "interactive": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "colors": [
      {
        "hex": "#2563eb",
        "rgb": "rgb(37, 99, 235)",
        "hsl": "hsl(221.00, 83.00%, 53.00%)",
        "name": "blue"
      },
      {
        "hex": "#ebac24",
        "rgb": "rgb(235, 172, 36)",
        "hsl": "hsl(41.00, 83.00%, 53.00%)",
        "name": "orange"
      }
    ],
    "layout": "horizontal",
    "color_count": 5,
    "file_path": "/tmp/mcp-color-server/visualizations/enhanced-palette-1758594006977.html",
    "file_name": "enhanced-palette-1758594006977.html",
    "file_size": 59952,
    "background_controls_enabled": true,
    "accessibility_features": [
      "Background theme toggle",
      "Custom background color picker",
      "Keyboard navigation",
      "Screen reader support",
      "Contrast warnings",
      "WCAG compliance checking"
    ]
  },
  "metadata": {
    "execution_time": 5,
    "tool": "create_palette_html",
    "timestamp": "2025-09-23T02:20:06.978Z",
    "color_space_used": "sRGB",
    "accessibility_notes": [],
    "recommendations": [
      "HTML file saved with interactive background controls",
      "Use Alt+T to toggle background theme",
      "Use Alt+C to open color picker"
    ],
    "colorCount": 5
  },
  "visualizations": {
    "html": "File saved: /tmp/mcp-color-server/visualizations/enhanced-palette-1758594006977.html"
  }
}
```

### Interactive Color Wheel with Harmony

**Tool Call:**

```json
{
  "tool": "create_color_wheel_html",
  "parameters": {
    "type": "hsl",
    "size": 400,
    "interactive": true,
    "show_harmony": true,
    "harmony_type": "complementary"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "wheel_type": "hsl",
    "size": 400,
    "highlight_colors": [],
    "harmony_type": "complementary",
    "interactive": true,
    "file_path": "/tmp/mcp-color-server/visualizations/enhanced-color-wheel-hsl-1758594261551.html",
    "file_name": "enhanced-color-wheel-hsl-1758594261551.html",
    "file_size": 67946,
    "background_controls_enabled": true,
    "accessibility_features": [
      "Background theme toggle",
      "Custom background color picker",
      "Keyboard navigation",
      "Screen reader support",
      "Interactive color selection",
      "Harmony visualization"
    ]
  },
  "metadata": {
    "execution_time": 4,
    "tool": "create_color_wheel_html",
    "timestamp": "2025-09-23T02:24:21.552Z",
    "color_space_used": "HSL",
    "accessibility_notes": [],
    "recommendations": [
      "HTML file saved with interactive background controls",
      "Use Alt+T to toggle background theme",
      "Use Alt+C to open color picker"
    ]
  },
  "visualizations": {
    "html": "File saved: /tmp/mcp-color-server/visualizations/enhanced-color-wheel-hsl-1758594261551.html"
  }
}
```

## Key Features

### Interactive Elements

- **Click to Select**: Click colors to select and copy values
- **Keyboard Navigation**: Full keyboard accessibility support
- **Background Controls**: Toggle between light/dark themes
- **Color Picker Integration**: Built-in color picker for custom backgrounds
- **Export Options**: Multiple format export (HEX, RGB, HSL, CSS, etc.)

### Accessibility Features

- **WCAG Compliant**: Meets accessibility standards
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Shortcuts**: Alt+T (theme toggle), Alt+C (color picker)
- **High Contrast**: Optimized for various visual needs
- **Focus Indicators**: Clear focus states for navigation

### Layout Options

- **Horizontal**: Colors arranged in a single row
- **Vertical**: Colors arranged in a single column
- **Grid**: Responsive grid layout for larger palettes
- **Circular**: Colors arranged in a circle
- **Wave**: Flowing wave pattern layout

### Color Wheel Types

- **HSL**: Hue-Saturation-Lightness wheel
- **HSV**: Hue-Saturation-Value wheel
- **RGB**: Red-Green-Blue color space
- **RYW**: Red-Yellow-White traditional wheel
- **RYB**: Red-Yellow-Blue artistic wheel

## Generated Files

All HTML visualizations are saved as complete, self-contained files that include:

- Embedded CSS for styling
- Embedded JavaScript for interactivity
- No external dependencies
- Mobile-responsive design
- Professional appearance

## Usage Tips

1. **File Locations**: Files are saved to `/tmp/mcp-color-server/visualizations/`
2. **Self-Contained**: No internet connection required to view
3. **Mobile Friendly**: Responsive design works on all devices
4. **Print Ready**: Optimized for printing when needed
5. **Shareable**: Can be shared as standalone HTML files

## Customization Options

- **Theme Control**: Light/dark theme switching
- **Size Adjustment**: Custom dimensions for different use cases
- **Color Highlighting**: Emphasize specific colors
- **Harmony Visualization**: Show color theory relationships
- **Export Integration**: Built-in export to various formats
