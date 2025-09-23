# PNG Generation Examples

This section demonstrates high-quality PNG image generation tools for creating professional color visualizations.

## Available PNG Tools

- **create_palette_png** - Generate palette images with various layouts
- **create_gradient_png** - Create gradient visualization images
- **create_color_comparison_png** - Generate comparison charts
- **create_accessibility_report_png** - Create accessibility compliance reports

## Examples

### Palette PNG Generation

**Tool Call:**

```json
{
  "tool": "create_palette_png",
  "parameters": {
    "palette": ["#2563eb", "#ebac24", "#1d66e9", "#eca827", "#2463e9"],
    "layout": "horizontal",
    "resolution": 150,
    "labels": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "palette": ["#2563eb", "#ebac24", "#1d66e9", "#eca827", "#2463e9"],
    "layout": "horizontal",
    "dimensions": [640, 160],
    "resolution": 150,
    "light_file_size": 2626,
    "dark_file_size": 1707,
    "total_file_size": 4333,
    "color_count": 5
  },
  "metadata": {
    "execution_time": 147,
    "tool": "create_palette_png",
    "timestamp": "2025-09-23T02:24:27.472Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "accessibility_notes": [
      "Light background variant optimized for light themes",
      "Dark background variant optimized for dark themes"
    ],
    "accessibilityNotes": [
      "Light background variant optimized for light themes",
      "Dark background variant optimized for dark themes"
    ],
    "recommendations": [
      "Use high resolution (300+ DPI) for print applications",
      "Light variant works best on light backgrounds",
      "Dark variant works best on dark backgrounds",
      "Grid layout works best for large palettes"
    ]
  },
  "visualizations": {
    "png_files": [
      {
        "file_path": "/tmp/mcp-color-server/visualizations/palette-horizontal-light.png",
        "filename": "palette-horizontal-light.png",
        "size": 2626,
        "created_at": "2025-09-23T01:31:22.533Z",
        "type": "png",
        "description": "Color palette with 5 colors (light background)"
      },
      {
        "file_path": "/tmp/mcp-color-server/visualizations/palette-horizontal-dark.png",
        "filename": "palette-horizontal-dark.png",
        "size": 1707,
        "created_at": "2025-09-23T01:31:22.534Z",
        "type": "png",
        "description": "Color palette with 5 colors (dark background)"
      }
    ]
  }
}
```

## Key Features

### High-Quality Output

- **Multiple Resolutions**: 72, 150, 300, 600 DPI options
- **Professional Design**: Clean, modern appearance
- **Color Accuracy**: sRGB color space for consistent reproduction
- **Optimized Compression**: Balanced file size and quality

### Layout Options

- **Horizontal**: Colors arranged in a single row
- **Vertical**: Colors arranged in a single column
- **Grid**: Responsive grid layout for larger palettes
- **Circular**: Colors arranged in a circular pattern

### Background Variants

- **Light Background**: Optimized for light themes and presentations
- **Dark Background**: Optimized for dark themes and modern designs
- **Transparent**: PNG with transparent background
- **Custom**: User-specified background color

### Label Styles

- **Minimal**: Clean color values only
- **Detailed**: Color values with additional information
- **Branded**: Professional branding elements

## Resolution Guidelines

### 72 DPI - Web Use

- Optimized for web display
- Smaller file sizes
- Good for digital presentations

### 150 DPI - Standard Quality

- Balanced quality and file size
- Good for most applications
- Recommended default

### 300 DPI - Print Quality

- High-quality printing
- Professional publications
- Larger file sizes

### 600 DPI - Ultra High Quality

- Premium printing applications
- Large format displays
- Maximum quality

## File Output Details

### Dual Background System

Most palette PNGs generate two variants:

1. **Light Background**: White or light gray background
2. **Dark Background**: Dark gray or black background

This ensures optimal visibility in different contexts.

### File Naming Convention

- `palette-[layout]-light.png` - Light background variant
- `palette-[layout]-dark.png` - Dark background variant
- `gradient-[type]-[timestamp].png` - Gradient images
- `comparison-[type]-[timestamp].png` - Comparison charts

### File Locations

All PNG files are saved to `/tmp/mcp-color-server/visualizations/`

## Quality Levels

### Draft Quality

- Fast generation
- Smaller file sizes
- Good for quick previews

### Standard Quality

- Balanced speed and quality
- Recommended for most uses
- Good compression

### High Quality

- Slower generation
- Larger file sizes
- Professional results

### Ultra Quality

- Maximum quality settings
- Largest file sizes
- Premium applications

## Use Cases

- **Design Presentations**: Professional palette displays
- **Brand Guidelines**: Consistent color documentation
- **Print Materials**: High-resolution color references
- **Social Media**: Optimized images for sharing
- **Documentation**: Visual color references in documents
