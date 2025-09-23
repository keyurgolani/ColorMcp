# PNG Generation Guide

## Overview

The MCP Color Server provides comprehensive PNG image generation capabilities for creating high-quality color visualizations. This guide covers the available PNG generation tools, their parameters, best practices, and use cases.

## Available PNG Generation Tools

### 1. create_palette_png

Generate high-quality PNG images of color palettes with professional layout and styling options.

#### Parameters

- **palette** (required): Array of colors in any supported format
- **layout** (optional): Layout arrangement - `horizontal`, `vertical`, `grid`, `circular` (default: `horizontal`)
- **resolution** (optional): Image resolution in DPI - `72`, `150`, `300`, `600` (default: `150`)
- **dimensions** (optional): Custom dimensions `[width, height]` in pixels
- **style** (optional): Visual style - `flat`, `gradient`, `material`, `glossy`, `fabric`, `paper` (default: `flat`)
- **labels** (optional): Show color values as labels (default: `true`)
- **label_style** (optional): Style of labels - `minimal`, `detailed`, `branded` (default: `minimal`)
- **background** (optional): Background - `transparent`, `white`, `black`, `custom` (default: `white`)
- **background_color** (optional): Custom background color (required if background is `custom`)
- **margin** (optional): Margin around palette in pixels (default: `20`)

#### Example Usage

```json
{
  "tool": "create_palette_png",
  "parameters": {
    "palette": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"],
    "layout": "grid",
    "resolution": 300,
    "style": "material",
    "labels": true,
    "label_style": "detailed",
    "background": "white",
    "margin": 30
  }
}
```

#### Use Cases

- **Design Documentation**: Create professional palette documentation for design systems
- **Client Presentations**: Generate high-quality images for client presentations
- **Print Materials**: Create print-ready palette references at 300+ DPI
- **Social Media**: Generate palette images for social media sharing
- **Brand Guidelines**: Document brand colors with consistent formatting

### 2. create_gradient_png

Generate high-quality PNG images of gradients with various styles and effects.

#### Parameters

- **gradient** (required): Gradient definition object
  - **type**: Gradient type - `linear`, `radial`, `conic`
  - **colors**: Array of colors for the gradient (2-20 colors)
  - **positions** (optional): Stop positions (0-100)
  - **angle** (optional): Angle for linear gradients (0-360, default: 90)
  - **center** (optional): Center point for radial/conic gradients `[x, y]` (default: `[50, 50]`)
  - **shape** (optional): Shape for radial gradients - `circle`, `ellipse` (default: `circle`)
- **dimensions** (required): Image dimensions `[width, height]` in pixels
- **resolution** (optional): Image resolution in DPI (default: `150`)
- **format** (optional): PNG format - `png`, `png24`, `png32` (default: `png32`)
- **quality** (optional): Quality level - `draft`, `standard`, `high`, `ultra` (default: `standard`)
- **effects** (optional): Visual effects - `noise`, `texture`, `border`, `shadow`

#### Example Usage

```json
{
  "tool": "create_gradient_png",
  "parameters": {
    "gradient": {
      "type": "linear",
      "colors": ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF"],
      "angle": 45,
      "positions": [0, 25, 50, 75, 100]
    },
    "dimensions": [800, 600],
    "resolution": 300,
    "quality": "high",
    "effects": ["border", "shadow"]
  }
}
```

#### Use Cases

- **Background Images**: Create gradient backgrounds for websites and applications
- **Design Elements**: Generate gradient elements for graphic design projects
- **Data Visualization**: Create gradient legends for data visualizations
- **Print Graphics**: Generate high-resolution gradients for print materials
- **UI Components**: Create gradient assets for user interface components

### 3. create_color_comparison_png

Generate PNG images comparing multiple color sets with various visualization styles.

#### Parameters

- **color_sets** (required): Array of color arrays to compare (2-10 sets)
- **comparison_type** (optional): Visualization type - `side_by_side`, `overlay`, `difference`, `harmony` (default: `side_by_side`)
- **chart_style** (optional): Visual style - `professional`, `artistic`, `scientific` (default: `professional`)
- **annotations** (optional): Show analysis annotations (default: `true`)
- **resolution** (optional): Image resolution in DPI (default: `150`)
- **format_for** (optional): Optimize for use case - `web`, `print`, `presentation` (default: `web`)
- **dimensions** (optional): Custom dimensions `[width, height]` in pixels

#### Example Usage

```json
{
  "tool": "create_color_comparison_png",
  "parameters": {
    "color_sets": [
      ["#FF0000", "#FF4444", "#FF8888", "#FFCCCC"],
      ["#00FF00", "#44FF44", "#88FF88", "#CCFFCC"],
      ["#0000FF", "#4444FF", "#8888FF", "#CCCCFF"]
    ],
    "comparison_type": "side_by_side",
    "chart_style": "professional",
    "annotations": true,
    "resolution": 300,
    "format_for": "print"
  }
}
```

#### Use Cases

- **A/B Testing**: Compare different color scheme options
- **Brand Analysis**: Analyze competitor color palettes
- **Accessibility Review**: Compare color combinations for accessibility
- **Design Evolution**: Show progression of color scheme development
- **Educational Materials**: Create color theory educational content

## Best Practices

### Resolution Guidelines

- **Web Use**: 72-150 DPI for screen display
- **Presentation**: 150 DPI for projectors and screens
- **Print**: 300+ DPI for high-quality printing
- **Large Format**: 600 DPI for professional large format printing

### Dimension Recommendations

#### Palette Images

- **Social Media**: 1080x1080 (square), 1200x630 (landscape)
- **Documentation**: 800x600, 1200x800
- **Print**: Based on physical size at 300 DPI
- **Presentations**: 1920x1080, 1280x720

#### Gradient Images

- **Backgrounds**: Match target container dimensions
- **UI Elements**: 2x actual size for retina displays
- **Print**: Calculate based on physical dimensions

#### Comparison Charts

- **Web**: 1200x800, 1600x900
- **Print**: A4 (2480x3508 at 300 DPI), Letter (2550x3300 at 300 DPI)
- **Presentation**: 1920x1080

### Performance Optimization

#### File Size Management

- Use appropriate resolution for intended use
- Choose optimal PNG format (png24 for indexed colors, png32 for full color)
- Consider compression quality vs. file size trade-offs
- Limit palette size for large images

#### Memory Efficiency

- Process large images in batches
- Use streaming for very large outputs
- Monitor memory usage during generation
- Clean up resources after generation

### Color Accuracy

#### Color Space Considerations

- All PNG outputs use sRGB color space
- Embed ICC color profiles for print use
- Test colors on target display devices
- Consider color management workflows

#### Accessibility

- Ensure sufficient contrast in generated images
- Test with color vision deficiency simulators
- Provide alternative text descriptions
- Include accessibility information in annotations

## Advanced Features

### Custom Styling

#### Material Design Style

```json
{
  "style": "material",
  "effects": ["shadow"],
  "background": "white",
  "margin": 24
}
```

#### Artistic Style

```json
{
  "chart_style": "artistic",
  "background": "custom",
  "background_color": "#f8f9fa",
  "effects": ["texture", "border"]
}
```

#### Scientific Style

```json
{
  "chart_style": "scientific",
  "annotations": true,
  "label_style": "detailed",
  "format_for": "print"
}
```

### Batch Processing

For generating multiple related images:

```javascript
const palettes = [
  ['#FF0000', '#FF4444', '#FF8888'],
  ['#00FF00', '#44FF44', '#88FF88'],
  ['#0000FF', '#4444FF', '#8888FF'],
];

const results = await Promise.all(
  palettes.map(palette =>
    createPalettePng({
      palette,
      layout: 'horizontal',
      resolution: 300,
    })
  )
);
```

### Quality Control

#### Validation Checklist

- [ ] Colors are valid and render correctly
- [ ] Resolution is appropriate for intended use
- [ ] File size is within acceptable limits
- [ ] Labels are readable and properly positioned
- [ ] Background and styling are consistent
- [ ] Accessibility requirements are met

#### Testing Recommendations

- Test on multiple devices and displays
- Verify print quality with test prints
- Check accessibility with screen readers
- Validate color accuracy with color management tools

## Troubleshooting

### Common Issues

#### Large File Sizes

- Reduce resolution if appropriate
- Use png24 format for limited color palettes
- Optimize dimensions for intended use
- Consider compression quality settings

#### Memory Errors

- Reduce image dimensions
- Process in smaller batches
- Increase available memory
- Use streaming for large operations

#### Color Accuracy Issues

- Verify input color formats
- Check color space settings
- Test on calibrated displays
- Use ICC color profiles for print

#### Performance Issues

- Optimize image dimensions
- Use appropriate quality settings
- Process images in parallel when possible
- Monitor system resources

### Error Messages

#### "Generated PNG exceeds 10MB size limit"

- Reduce image dimensions
- Lower resolution if appropriate
- Use more efficient PNG format
- Reduce color complexity

#### "Invalid color format"

- Check color string syntax
- Use supported color formats (hex, rgb, hsl, etc.)
- Validate color values are within valid ranges

#### "Insufficient memory"

- Reduce image size or complexity
- Close other applications
- Increase system memory
- Process in smaller batches

## Integration Examples

### Web Application Integration

```javascript
// Generate palette for web display
const paletteImage = await mcp.callTool('create_palette_png', {
  palette: userColors,
  layout: 'horizontal',
  resolution: 150,
  dimensions: [800, 200],
  background: 'transparent',
});

// Display in web page
const img = document.createElement('img');
img.src = `data:image/png;base64,${paletteImage.visualizations.png_base64}`;
document.body.appendChild(img);
```

### Print Workflow Integration

```javascript
// Generate high-resolution image for print
const printImage = await mcp.callTool('create_palette_png', {
  palette: brandColors,
  layout: 'grid',
  resolution: 300,
  style: 'professional',
  label_style: 'detailed',
  format_for: 'print',
});

// Save to file for print production
const buffer = Buffer.from(printImage.visualizations.png_base64, 'base64');
fs.writeFileSync('brand-palette-print.png', buffer);
```

### Design System Documentation

```javascript
// Generate consistent palette documentation
const documentationImages = await Promise.all([
  // Primary colors
  mcp.callTool('create_palette_png', {
    palette: primaryColors,
    layout: 'horizontal',
    style: 'material',
    label_style: 'detailed',
  }),

  // Secondary colors
  mcp.callTool('create_palette_png', {
    palette: secondaryColors,
    layout: 'horizontal',
    style: 'material',
    label_style: 'detailed',
  }),

  // Gradient examples
  mcp.callTool('create_gradient_png', {
    gradient: {
      type: 'linear',
      colors: primaryColors,
    },
    dimensions: [800, 200],
    quality: 'high',
  }),
]);
```

This comprehensive guide provides everything needed to effectively use the PNG generation capabilities of the MCP Color Server for professional color visualization needs.
