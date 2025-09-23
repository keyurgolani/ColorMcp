# Color Utility Operations Guide

This guide covers the color utility tools available in the MCP Color Server, including color mixing, variations generation, sorting, and collection analysis.

## Overview

The color utility tools provide advanced color manipulation capabilities that go beyond basic conversion and analysis. These tools enable sophisticated color operations for design workflows, palette management, and color theory applications.

## Available Tools

### 1. Color Mixing (`mix_colors`)

Mix multiple colors with configurable ratios and blend modes.

**Parameters:**

- `colors` (required): Array of 2-10 colors to mix
- `ratios` (optional): Mixing ratios for each color (must sum to 1.0)
- `blend_mode` (optional): Blend mode - normal, multiply, screen, overlay, etc.
- `color_space` (optional): Color space for mixing - rgb, hsl, lab, lch

**Example:**

```json
{
  "colors": ["#FF0000", "#0000FF"],
  "ratios": [0.7, 0.3],
  "blend_mode": "normal",
  "color_space": "rgb"
}
```

**Blend Modes:**

- `normal`: Standard color mixing
- `multiply`: Darker result (colors multiply)
- `screen`: Lighter result (inverse multiply)
- `overlay`: Combines multiply and screen
- `darken`: Takes darker of each channel
- `lighten`: Takes lighter of each channel
- `difference`: Absolute difference between colors
- `exclusion`: Similar to difference but lower contrast

### 2. Color Variations (`generate_color_variations`)

Generate tints, shades, and tones of a base color with mathematical precision.

**Parameters:**

- `base_color` (required): Base color for variations
- `variation_type` (required): Type - tints, shades, tones, or all
- `steps` (optional): Number of steps (3-20, default: 10)
- `intensity` (optional): Variation intensity (0-100, default: 50)

**Variation Types:**

- `tints`: Add white (lighter variations)
- `shades`: Add black (darker variations)
- `tones`: Add gray (desaturated variations)
- `all`: Generate all three types

**Example:**

```json
{
  "base_color": "#FF0000",
  "variation_type": "tints",
  "steps": 5,
  "intensity": 60
}
```

### 3. Color Sorting (`sort_colors`)

Sort colors by various properties with optional grouping.

**Parameters:**

- `colors` (required): Array of 2-100 colors to sort
- `sort_by` (required): Property - hue, saturation, lightness, brightness, temperature, frequency
- `direction` (optional): ascending or descending (default: ascending)
- `group_similar` (optional): Group similar colors together (default: false)

**Sort Criteria:**

- `hue`: Sort by color wheel position (0-360°)
- `saturation`: Sort by color intensity
- `lightness`: Sort by perceived lightness
- `brightness`: Sort by calculated brightness
- `temperature`: Sort by warm/cool classification
- `frequency`: Sort by color occurrence frequency

**Example:**

```json
{
  "colors": ["#FF0000", "#00FF00", "#0000FF"],
  "sort_by": "hue",
  "direction": "ascending",
  "group_similar": true
}
```

### 4. Color Collection Analysis (`analyze_color_collection`)

Analyze collections of colors for diversity, harmony, and other metrics.

**Parameters:**

- `colors` (required): Array of 2-50 colors to analyze
- `metrics` (optional): Metrics to calculate - diversity, harmony, contrast_range, temperature_distribution, accessibility_score

**Analysis Metrics:**

- `diversity`: Color variety and distribution
- `harmony`: Color theory compliance and relationships
- `contrast_range`: Contrast ratio analysis
- `temperature_distribution`: Warm/cool color balance
- `accessibility_score`: WCAG compliance assessment

**Example:**

```json
{
  "colors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"],
  "metrics": ["diversity", "harmony", "accessibility_score"]
}
```

## Performance Characteristics

All color utility tools are optimized for performance:

- **Response Time**: All operations complete in under 500ms
- **Memory Usage**: Efficient algorithms with minimal memory footprint
- **Concurrent Processing**: Support for multiple simultaneous requests
- **Caching**: Intelligent caching for repeated operations

## Use Cases

### Design Workflows

- **Palette Refinement**: Sort and analyze existing color palettes
- **Color Mixing**: Create custom colors by mixing existing ones
- **Variation Generation**: Create color scales and gradients
- **Quality Assessment**: Analyze palette diversity and harmony

### Brand Development

- **Color System Creation**: Generate comprehensive color variations
- **Accessibility Compliance**: Ensure color combinations meet standards
- **Temperature Balance**: Analyze warm/cool color distribution
- **Harmony Validation**: Verify color theory compliance

### Data Visualization

- **Color Ordering**: Sort colors for logical progression
- **Contrast Optimization**: Ensure sufficient contrast between colors
- **Perceptual Uniformity**: Use LAB color space for perceptual mixing
- **Accessibility**: Generate colorblind-friendly palettes

## Best Practices

### Color Mixing

1. **Use LAB color space** for perceptually uniform mixing
2. **Consider blend modes** for different visual effects
3. **Validate ratios** ensure they sum to 1.0
4. **Test accessibility** check contrast of mixed colors

### Variation Generation

1. **Choose appropriate intensity** based on use case
2. **Use tints for backgrounds** and light UI elements
3. **Use shades for text** and emphasis
4. **Use tones for subtle variations** and neutral elements

### Color Sorting

1. **Sort by hue** for rainbow-like progressions
2. **Sort by lightness** for contrast analysis
3. **Group similar colors** to identify redundancy
4. **Consider temperature** for warm/cool organization

### Collection Analysis

1. **Check diversity** ensure adequate color variety
2. **Validate harmony** verify color theory compliance
3. **Test accessibility** ensure WCAG compliance
4. **Balance temperature** maintain warm/cool equilibrium

## Error Handling

All tools provide comprehensive error handling:

- **Input Validation**: Clear error messages for invalid parameters
- **Color Format Errors**: Helpful suggestions for correct formats
- **Range Validation**: Guidance for parameter limits
- **Performance Limits**: Graceful handling of large datasets

## Export Formats

Results can be exported in multiple formats:

- **CSS**: Custom properties and variables
- **SCSS**: Variables and mixins
- **JSON**: Structured data for programmatic use
- **Tailwind**: Utility class configurations

## Integration Examples

### Workflow Integration

```javascript
// 1. Analyze existing palette
const analysis = await analyzeColorCollection({
  colors: existingPalette,
  metrics: ['diversity', 'harmony'],
});

// 2. Sort colors by hue
const sorted = await sortColors({
  colors: existingPalette,
  sort_by: 'hue',
});

// 3. Generate variations for primary color
const variations = await generateColorVariations({
  base_color: primaryColor,
  variation_type: 'all',
  steps: 10,
});

// 4. Mix colors for custom shades
const mixed = await mixColors({
  colors: [primaryColor, '#FFFFFF'],
  ratios: [0.8, 0.2],
  color_space: 'lab',
});
```

This comprehensive set of color utility tools provides the foundation for sophisticated color manipulation and analysis workflows in design and development applications.
