# Color Utility Operations

This document provides examples and use cases for the color utility tools in the MCP Color Server.

## Mix Colors Tool

The `mix_colors` tool allows you to blend multiple colors with configurable ratios and blend modes.

### Basic Usage

```json
{
  "tool": "mix_colors",
  "parameters": {
    "colors": ["#FF0000", "#0000FF"],
    "ratios": [0.7, 0.3],
    "blend_mode": "normal",
    "color_space": "rgb"
  }
}
```

### Supported Blend Modes

- `normal` - Standard color mixing
- `multiply` - Darker blending
- `screen` - Lighter blending
- `overlay` - Contrast-based blending
- `darken` - Keep darker colors
- `lighten` - Keep lighter colors
- `difference` - Color difference
- `exclusion` - Exclusion blending
- `color_burn` - Burn effect
- `color_dodge` - Dodge effect

### Color Spaces

- `rgb` - Red, Green, Blue mixing
- `hsl` - Hue, Saturation, Lightness mixing
- `lab` - Perceptually uniform mixing
- `lch` - Lightness, Chroma, Hue mixing

## Generate Color Variations Tool

The `generate_color_variations` tool creates tints, shades, and tones of a base color.

### Basic Usage

```json
{
  "tool": "generate_color_variations",
  "parameters": {
    "base_color": "#FF0000",
    "variation_type": "tints",
    "steps": 5,
    "intensity": 50
  }
}
```

### Variation Types

- `tints` - Lighter variations (adding white)
- `shades` - Darker variations (adding black)
- `tones` - Desaturated variations (adding gray)
- `all` - Generate all three types

### Use Cases

- **Tints**: Backgrounds, subtle accents, hover states
- **Shades**: Text colors, emphasis, active states
- **Tones**: Subtle color variations, disabled states

## Sort Colors Tool

The `sort_colors` tool organizes colors by various properties.

### Basic Usage

```json
{
  "tool": "sort_colors",
  "parameters": {
    "colors": ["#FF0000", "#00FF00", "#0000FF"],
    "sort_by": "hue",
    "direction": "ascending",
    "group_similar": false
  }
}
```

### Sort Criteria

- `hue` - Color wheel position (0-360°)
- `saturation` - Color intensity (0-100%)
- `lightness` - Brightness level (0-100%)
- `brightness` - Perceived brightness
- `temperature` - Warm/cool classification
- `frequency` - How often colors appear

### Grouping Similar Colors

Set `group_similar: true` to automatically group colors that are visually similar.

## Analyze Color Collection Tool

The `analyze_color_collection` tool provides comprehensive analysis of color palettes.

### Basic Usage

```json
{
  "tool": "analyze_color_collection",
  "parameters": {
    "colors": ["#FF0000", "#00FF00", "#0000FF"],
    "metrics": ["diversity", "harmony", "accessibility_score"]
  }
}
```

### Available Metrics

- `diversity` - Color variety and spread
- `harmony` - Color theory compliance
- `contrast_range` - Accessibility contrast analysis
- `temperature_distribution` - Warm/cool balance
- `accessibility_score` - Overall accessibility rating

### Analysis Results

The tool provides:

- **Diversity Score**: 0-100 rating of color variety
- **Harmony Type**: Detected color relationships (complementary, triadic, etc.)
- **Accessibility Compliance**: WCAG AA/AAA compliance counts
- **Temperature Balance**: Distribution of warm/cool/neutral colors
- **Recommendations**: Specific improvement suggestions

## Performance Characteristics

All color utility tools are optimized for performance:

- **Mix Colors**: < 100ms for up to 10 colors
- **Generate Variations**: < 100ms for up to 20 steps
- **Sort Colors**: < 200ms for up to 100 colors
- **Analyze Collection**: < 300ms for up to 50 colors

## Export Formats

All tools provide multiple export formats:

### CSS Variables

```css
--color-1: #ff0000;
--color-2: #00ff00;
--color-3: #0000ff;
```

### SCSS Variables

```scss
$color-1: #ff0000;
$color-2: #00ff00;
$color-3: #0000ff;
```

### JSON Format

```json
{
  "colors": ["#FF0000", "#00FF00", "#0000FF"],
  "metadata": {
    "operation": "sort",
    "criteria": "hue"
  }
}
```

## Best Practices

### Color Mixing

- Use LAB color space for perceptually uniform mixing
- Start with equal ratios and adjust as needed
- Consider the intended use case when choosing blend modes

### Color Variations

- Use moderate intensity (30-70%) for subtle variations
- Generate more steps for smoother transitions
- Test variations for accessibility compliance

### Color Sorting

- Sort by hue for rainbow-like progressions
- Sort by lightness to identify contrast relationships
- Use grouping to identify redundant colors

### Collection Analysis

- Analyze palettes before finalizing designs
- Aim for diversity scores above 60 for varied palettes
- Ensure accessibility scores above 70 for public use

## Integration Examples

### Design System Creation

1. Start with brand colors
2. Generate variations for each brand color
3. Sort colors by use case (backgrounds, text, accents)
4. Analyze the complete collection for accessibility
5. Export in appropriate format for your platform

### Palette Optimization

1. Analyze existing palette for diversity and harmony
2. Identify gaps or redundancies
3. Mix colors to fill gaps or create transitions
4. Re-analyze to verify improvements
5. Sort final palette for logical organization
