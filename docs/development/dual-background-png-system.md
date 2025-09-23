# Dual Background PNG Generation System

## Overview

The MCP Color Server now includes a comprehensive dual background PNG generation system that automatically creates both light and dark background variants of all PNG visualizations. This ensures optimal visibility and professional appearance across different viewing contexts.

## Features

### Automatic Dual Generation

- **Light Background**: Uses `#ffffff` (white) background optimized for light themes
- **Dark Background**: Uses `#1a1a1a` (dark gray) background optimized for dark themes
- **Intelligent Text Colors**: Automatically adjusts text colors for optimal contrast on each background
- **File-Based Output**: Saves PNG files to disk instead of returning base64 content

### Performance Optimization

- **Canvas Pooling**: Reuses Sharp instances for improved performance
- **Parallel Generation**: Creates both variants simultaneously
- **Memory Management**: Enforces size limits and validates output quality
- **Quality Validation**: Ensures both variants meet professional standards

### File Management

- **Descriptive Naming**: Files include background variant suffixes (`-light.png`, `-dark.png`)
- **Environment Configuration**: Uses `COLOR_MCP_VISUALIZATIONS_DIR` environment variable
- **Automatic Cleanup**: Removes old files based on configurable retention policies
- **Collision Prevention**: Includes timestamps and unique IDs in filenames

## Updated PNG Tools

All PNG generation tools now support dual background output:

### create_palette_png

Generates color palette images with both light and dark backgrounds.

**Example Response:**

```json
{
  "success": true,
  "data": {
    "palette": ["#FF0000", "#00FF00", "#0000FF"],
    "layout": "horizontal",
    "dimensions": [380, 140],
    "resolution": 150,
    "light_file_size": 2847,
    "dark_file_size": 2891,
    "total_file_size": 5738,
    "color_count": 3
  },
  "visualizations": {
    "png_files": [
      {
        "file_path": "/tmp/color-mcp/visualizations/palette-horizontal-light-2025-09-22T03-00-00-000Z.png",
        "filename": "palette-horizontal-light-2025-09-22T03-00-00-000Z.png",
        "size": 2847,
        "created_at": "2025-09-22T03:00:00.000Z",
        "type": "png",
        "description": "Color palette with 3 colors (light background)"
      },
      {
        "file_path": "/tmp/color-mcp/visualizations/palette-horizontal-dark-2025-09-22T03-00-00-000Z.png",
        "filename": "palette-horizontal-dark-2025-09-22T03-00-00-000Z.png",
        "size": 2891,
        "created_at": "2025-09-22T03:00:00.000Z",
        "type": "png",
        "description": "Color palette with 3 colors (dark background)"
      }
    ]
  }
}
```

### create_gradient_png

Generates gradient images with both background variants.

### create_color_comparison_png

Generates color comparison charts with both background variants.

## Configuration

### Environment Variables

Set the visualization output directory:

```bash
export COLOR_MCP_VISUALIZATIONS_DIR="/path/to/visualizations"
```

If not set, defaults to `/tmp/color-mcp/visualizations`.

### Quality Settings

Configure PNG generation quality:

- **draft**: Fast generation, higher compression
- **standard**: Balanced quality and performance (default)
- **high**: Better quality, slower generation
- **ultra**: Maximum quality, slowest generation

## Usage Examples

### Basic Palette Generation

```javascript
const result = await mcp.callTool('create_palette_png', {
  palette: ['#FF0000', '#00FF00', '#0000FF'],
  layout: 'horizontal',
  resolution: 300,
});

// Access light background variant
const lightFile = result.visualizations.png_files[0];
console.log(`Light variant: ${lightFile.file_path}`);

// Access dark background variant
const darkFile = result.visualizations.png_files[1];
console.log(`Dark variant: ${darkFile.file_path}`);
```

### Gradient Generation

```javascript
const result = await mcp.callTool('create_gradient_png', {
  gradient: {
    type: 'linear',
    colors: ['#FF0000', '#0000FF'],
    angle: 45,
  },
  dimensions: [800, 400],
  quality: 'high',
});

// Both light and dark variants are automatically generated
console.log(`Generated ${result.visualizations.png_files.length} variants`);
```

## File Naming Convention

Files follow a consistent naming pattern:

```
{tool-name}-{parameters}-{variant}-{timestamp}-{unique-id}.png
```

Examples:

- `palette-horizontal-light-2025-09-22T03-00-00-000Z-a1b2c3d4.png`
- `gradient-linear-dark-2025-09-22T03-00-00-000Z-e5f6g7h8.png`
- `comparison-side-by-side-light-2025-09-22T03-00-00-000Z-i9j0k1l2.png`

## Intelligent Text Color System

The system automatically adjusts text colors based on the background variant:

### Light Backgrounds (`#ffffff`)

- **Primary Text**: `#000000` (black)
- **Secondary Text**: `#666666` (dark gray)
- **Optimal Contrast**: Ensures WCAG AA compliance

### Dark Backgrounds (`#1a1a1a`)

- **Primary Text**: `#ffffff` (white)
- **Secondary Text**: `#cccccc` (light gray)
- **Optimal Contrast**: Maintains readability in dark themes

## Quality Validation

Each generated PNG undergoes automatic quality validation:

### File Integrity

- Validates PNG file headers and structure
- Ensures files are not corrupted during generation
- Verifies dimensions match expected values

### Size Validation

- Enforces maximum file size limits (10MB per variant)
- Validates minimum file sizes to detect generation errors
- Monitors total disk usage

### Visual Consistency

- Ensures both variants have identical dimensions
- Validates color accuracy and rendering quality
- Checks for proper text contrast ratios

## Performance Characteristics

### Generation Times

- **Small palettes** (1-5 colors): < 200ms per variant
- **Medium palettes** (6-20 colors): < 500ms per variant
- **Large palettes** (21-50 colors): < 1000ms per variant
- **Complex gradients**: < 800ms per variant

### Memory Usage

- **Peak memory**: < 100MB per generation request
- **Canvas pooling**: Reuses resources for efficiency
- **Automatic cleanup**: Prevents memory leaks

### File Sizes

- **Typical palette**: 2-5KB per variant
- **Complex gradients**: 5-20KB per variant
- **High-resolution images**: 50KB-2MB per variant

## Error Handling

The system provides comprehensive error handling:

### Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "INVALID_COLOR_FORMAT",
    "message": "Invalid colors found: invalid_color at index 0",
    "suggestions": [
      "Use valid color formats like #FF0000, rgb(255,0,0), or hsl(0,100%,50%)"
    ]
  }
}
```

### Memory Limit Errors

```json
{
  "success": false,
  "error": {
    "code": "MEMORY_LIMIT_ERROR",
    "message": "Image dimensions exceed memory limits. Maximum 100 megapixels allowed.",
    "suggestions": [
      "Reduce image dimensions or resolution",
      "Try generating smaller batches"
    ]
  }
}
```

### File System Errors

```json
{
  "success": false,
  "error": {
    "code": "FILE_SYSTEM_ERROR",
    "message": "Cannot write to visualization directory",
    "suggestions": [
      "Check directory permissions",
      "Ensure sufficient disk space",
      "Verify COLOR_MCP_VISUALIZATIONS_DIR is writable"
    ]
  }
}
```

## Migration from Legacy Format

### Old Response Format (Deprecated)

```json
{
  "visualizations": {
    "png_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

### New Response Format

```json
{
  "visualizations": {
    "png_files": [
      {
        "file_path": "/path/to/light-variant.png",
        "filename": "light-variant.png",
        "size": 2847,
        "type": "png"
      },
      {
        "file_path": "/path/to/dark-variant.png",
        "filename": "dark-variant.png",
        "size": 2891,
        "type": "png"
      }
    ]
  }
}
```

## Best Practices

### Choosing Background Variants

- **Light variant**: Use for light-themed applications, print materials, presentations
- **Dark variant**: Use for dark-themed applications, night mode interfaces, OLED displays

### File Management

- Set up automatic cleanup policies for production environments
- Monitor disk usage in high-volume scenarios
- Use descriptive custom names for important visualizations

### Performance Optimization

- Use appropriate quality settings for your use case
- Consider generating smaller dimensions for web use
- Batch multiple requests when possible

### Accessibility

- Both variants automatically meet WCAG AA contrast requirements
- Text colors are optimized for each background
- Consider colorblind-friendly palettes for inclusive design

## Troubleshooting

### Common Issues

**Files not generating**

- Check `COLOR_MCP_VISUALIZATIONS_DIR` environment variable
- Verify directory permissions and disk space
- Ensure Sharp library is properly installed

**Poor image quality**

- Increase quality setting to 'high' or 'ultra'
- Use higher resolution (300+ DPI) for print
- Check color format validity

**Large file sizes**

- Reduce image dimensions
- Use 'draft' quality for testing
- Optimize color palette size

**Memory errors**

- Reduce image dimensions or color count
- Process requests sequentially instead of parallel
- Monitor system memory usage

For additional support, refer to the main MCP Color Server documentation or check the troubleshooting guide.
