# MCP Color Server - Complete API Reference

## Overview

The MCP Color Server provides a comprehensive set of tools for color manipulation, palette generation, gradient creation, and visualization through the Model Context Protocol (MCP). This document provides detailed specifications for all available tools.

## Table of Contents

- [Color Conversion Tools](#color-conversion-tools)
- [Color Analysis Tools](#color-analysis-tools)
- [Palette Generation Tools](#palette-generation-tools)
- [Gradient Generation Tools](#gradient-generation-tools)
- [Theme Generation Tools](#theme-generation-tools)
- [Accessibility Tools](#accessibility-tools)
- [Visualization Tools](#visualization-tools)
- [Export Format Tools](#export-format-tools)
- [Color Utility Tools](#color-utility-tools)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Standard Response Format

All tools return responses in this standardized format:

```json
{
  "success": boolean,
  "data": object,
  "metadata": {
    "execution_time": number,
    "color_space_used": string,
    "accessibility_notes": string[],
    "recommendations": string[]
  },
  "visualizations": {
    "html": string,
    "png_base64": string,
    "svg": string
  },
  "export_formats": {
    "css": string,
    "scss": string,
    "tailwind": string,
    "json": object
  }
}
```

## Color Conversion Tools

### convert_color

Convert colors between different formats with high precision.

**Parameters:**

- `color` (string, required): Input color in any supported format
- `output_format` (string, required): Target format
- `precision` (number, optional): Decimal places for numeric outputs (default: 2, max: 10)
- `variable_name` (string, optional): Variable name for CSS/SCSS formats

**Supported Input Formats:**

- HEX: `#FF0000`, `#F00`, `FF0000`, `F00`
- RGB: `rgb(255, 0, 0)`, `255, 0, 0`, `[255, 0, 0]`
- RGBA: `rgba(255, 0, 0, 0.5)`
- HSL: `hsl(0, 100%, 50%)`, `0, 100%, 50%`
- HSLA: `hsla(0, 100%, 50%, 0.8)`
- HSV/HSB: `hsv(0, 100%, 100%)`
- HWB: `hwb(0, 0%, 0%)`
- CMYK: `cmyk(0%, 100%, 100%, 0%)`
- LAB: `lab(53.23, 80.11, 67.22)`
- XYZ: `xyz(41.24, 21.26, 1.93)`
- LCH: `lch(53.23, 104.55, 40.85)`
- OKLAB: `oklab(0.628, 0.225, 0.126)`
- OKLCH: `oklch(0.628, 0.258, 29.23)`
- Named colors: `red`, `blue`, `forestgreen`, etc.

**Supported Output Formats:**

- `hex`: Hexadecimal format
- `rgb`: RGB format
- `rgba`: RGB with alpha
- `hsl`: HSL format
- `hsla`: HSL with alpha
- `hsv`: HSV format
- `hwb`: HWB format
- `cmyk`: CMYK format
- `lab`: LAB color space
- `xyz`: XYZ color space
- `lch`: LCH color space
- `oklab`: OKLAB color space
- `oklch`: OKLCH color space
- `css-var`: CSS custom property
- `scss-var`: SCSS variable
- `tailwind`: Tailwind CSS class
- `swift`: Swift UIColor
- `android`: Android Color
- `flutter`: Flutter Color
- `named`: Closest named color

**Example:**

```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF0000",
    "output_format": "hsl",
    "precision": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "original": "#FF0000",
    "converted": "hsl(0.000, 100.000%, 50.000%)",
    "format": "hsl",
    "precision": 3
  },
  "metadata": {
    "execution_time": 15,
    "color_space_used": "sRGB",
    "accessibility_notes": [],
    "recommendations": ["Consider using HSL for better color manipulation"]
  }
}
```

## Color Analysis Tools

### analyze_color

Analyze color properties including brightness, contrast, temperature, and accessibility.

**Parameters:**

- `color` (string, required): Color to analyze
- `analysis_types` (array, optional): Types of analysis to perform
- `compare_color` (string, optional): Second color for comparison
- `include_recommendations` (boolean, optional): Include usage recommendations (default: true)

**Analysis Types:**

- `brightness`: Perceived brightness (0-100)
- `temperature`: Color temperature classification
- `contrast`: Contrast ratios against white/black
- `accessibility`: WCAG compliance information
- `saturation`: Color saturation analysis
- `hue`: Hue analysis and relationships

**Example:**

```json
{
  "tool": "analyze_color",
  "parameters": {
    "color": "#2563eb",
    "analysis_types": ["brightness", "temperature", "accessibility"],
    "include_recommendations": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "color": "#2563eb",
    "brightness": {
      "perceived": 45.2,
      "relative_luminance": 0.127,
      "classification": "medium"
    },
    "temperature": {
      "kelvin": 6500,
      "classification": "cool",
      "description": "Cool blue tone"
    },
    "accessibility": {
      "contrast_white": 5.74,
      "contrast_black": 3.66,
      "wcag_aa_normal": true,
      "wcag_aa_large": true,
      "wcag_aaa_normal": false,
      "wcag_aaa_large": true
    }
  },
  "metadata": {
    "execution_time": 25,
    "accessibility_notes": [
      "Passes WCAG AA for normal text on white background",
      "Consider darker shade for AAA compliance"
    ],
    "recommendations": [
      "Excellent for primary buttons and links",
      "Good contrast for text on light backgrounds"
    ]
  }
}
```

## Palette Generation Tools

### generate_harmony_palette

Generate color palettes based on color theory principles.

**Parameters:**

- `base_color` (string, required): Base color for harmony
- `harmony_type` (string, required): Type of harmony
- `count` (number, optional): Number of colors (3-10, default: 5)
- `variation` (number, optional): Variation amount (0-100, default: 20)

**Harmony Types:**

- `monochromatic`: Variations of a single hue
- `analogous`: Adjacent colors on color wheel
- `complementary`: Opposite colors on color wheel
- `triadic`: Three evenly spaced colors
- `tetradic`: Four colors forming rectangle
- `split_complementary`: Base + two colors adjacent to complement
- `double_complementary`: Two complementary pairs

**Example:**

```json
{
  "tool": "generate_harmony_palette",
  "parameters": {
    "base_color": "#2563eb",
    "harmony_type": "complementary",
    "count": 5,
    "variation": 15
  }
}
```

### generate_theme

Generate complete design system themes with semantic color mapping.

**Parameters:**

- `theme_type` (string, required): Type of theme
- `primary_color` (string, required): Primary brand color
- `style` (string, optional): Design system style (default: "material")
- `accessibility_level` (string, optional): WCAG level (default: "AA")
- `components` (array, optional): Components to generate colors for
- `brand_colors` (array, optional): Additional brand colors

**Theme Types:**

- `light`: Light theme with dark text
- `dark`: Dark theme with light text
- `auto`: Adaptive theme
- `high_contrast`: High contrast for accessibility
- `colorblind_friendly`: Optimized for color vision deficiencies

**Design Styles:**

- `material`: Google Material Design
- `ios`: Apple Human Interface Guidelines
- `fluent`: Microsoft Fluent Design
- `custom`: Custom design system

**Example:**

```json
{
  "tool": "generate_theme",
  "parameters": {
    "theme_type": "light",
    "primary_color": "#2563eb",
    "style": "material",
    "accessibility_level": "AA"
  }
}
```

## Gradient Generation Tools

### generate_linear_gradient

Create linear gradients with precise control over colors, positions, and interpolation.

**Parameters:**

- `colors` (array, required): Array of color strings
- `positions` (array, optional): Stop positions (0-100)
- `angle` (number, optional): Gradient angle (0-360, default: 90)
- `interpolation` (string, optional): Interpolation method (default: "linear")
- `color_space` (string, optional): Color space for interpolation (default: "rgb")
- `steps` (number, optional): Number of steps for stepped gradients

**Interpolation Methods:**

- `linear`: Linear interpolation
- `ease`: Ease interpolation
- `ease_in`: Ease-in interpolation
- `ease_out`: Ease-out interpolation
- `bezier`: Bezier curve interpolation

**Color Spaces:**

- `rgb`: RGB color space
- `hsl`: HSL color space
- `lab`: LAB color space (perceptually uniform)
- `lch`: LCH color space

**Example:**

```json
{
  "tool": "generate_linear_gradient",
  "parameters": {
    "colors": ["#ff0000", "#00ff00", "#0000ff"],
    "positions": [0, 50, 100],
    "angle": 45,
    "color_space": "lab"
  }
}
```

### generate_radial_gradient

Create radial gradients with center point and shape control.

**Parameters:**

- `colors` (array, required): Array of color strings
- `positions` (array, optional): Stop positions (0-100)
- `center` (array, optional): Center point [x, y] (0-100, default: [50, 50])
- `shape` (string, optional): Shape (default: "circle")
- `size` (string, optional): Size method (default: "farthest_corner")
- `dimensions` (array, optional): [width, height] if size is "explicit"

**Shapes:**

- `circle`: Circular gradient
- `ellipse`: Elliptical gradient

**Size Methods:**

- `closest_side`: Closest side of container
- `closest_corner`: Closest corner of container
- `farthest_side`: Farthest side of container
- `farthest_corner`: Farthest corner of container
- `explicit`: Use specified dimensions

## Accessibility Tools

### check_contrast

Check color contrast compliance with WCAG accessibility standards.

**Parameters:**

- `foreground` (string, required): Foreground color (typically text)
- `background` (string, required): Background color
- `text_size` (string, optional): Text size category (default: "normal")
- `standard` (string, optional): Accessibility standard (default: "WCAG_AA")

**Text Sizes:**

- `normal`: Normal text (< 18pt or < 14pt bold)
- `large`: Large text (≥ 18pt or ≥ 14pt bold)

**Standards:**

- `WCAG_AA`: WCAG 2.1 AA standard
- `WCAG_AAA`: WCAG 2.1 AAA standard
- `APCA`: Advanced Perceptual Contrast Algorithm

**Example:**

```json
{
  "tool": "check_contrast",
  "parameters": {
    "foreground": "#2563eb",
    "background": "#ffffff",
    "text_size": "normal",
    "standard": "WCAG_AA"
  }
}
```

### simulate_colorblindness

Simulate how colors appear to users with color vision deficiencies.

**Parameters:**

- `colors` (array, required): Array of colors to simulate
- `type` (string, required): Type of color vision deficiency
- `severity` (number, optional): Severity percentage (0-100, default: 100)

**Deficiency Types:**

- `protanopia`: Red-blind (missing L-cones)
- `deuteranopia`: Green-blind (missing M-cones)
- `tritanopia`: Blue-blind (missing S-cones)
- `protanomaly`: Red-weak (anomalous L-cones)
- `deuteranomaly`: Green-weak (anomalous M-cones)
- `tritanomaly`: Blue-weak (anomalous S-cones)
- `monochromacy`: Complete color blindness

**Example:**

```json
{
  "tool": "simulate_colorblindness",
  "parameters": {
    "colors": ["#ff0000", "#00ff00", "#0000ff"],
    "type": "deuteranopia",
    "severity": 100
  }
}
```

### optimize_for_accessibility

Optimize colors for accessibility compliance while preserving design intent.

**Parameters:**

- `palette` (array, required): Array of colors to optimize
- `use_cases` (array, required): Use cases for the colors
- `target_standard` (string, optional): Target accessibility standard (default: "WCAG_AA")
- `preserve_hue` (boolean, optional): Preserve original hues (default: true)
- `preserve_brand_colors` (array, optional): Colors that should not be modified

**Use Cases:**

- `text`: Text colors
- `background`: Background colors
- `accent`: Accent and highlight colors
- `interactive`: Interactive elements (buttons, links)

## Visualization Tools

### create_palette_html

Generate interactive HTML visualizations of color palettes.

**Parameters:**

- `palette` (array, required): Array of colors
- `layout` (string, optional): Layout style (default: "horizontal")
- `style` (string, optional): Visual style (default: "swatches")
- `size` (string, optional): Size of swatches (default: "medium")
- `show_values` (boolean, optional): Show color values (default: true)
- `interactive` (boolean, optional): Enable interactions (default: true)
- `accessibility_info` (boolean, optional): Show accessibility information (default: false)
- `export_formats` (array, optional): Available export formats
- `theme` (string, optional): Color theme (default: "light")

**Layout Options:**

- `horizontal`: Single row layout
- `vertical`: Single column layout
- `grid`: Responsive grid layout
- `circular`: Circular arrangement
- `wave`: Flowing wave pattern

**Visual Styles:**

- `swatches`: Simple color swatches
- `gradient`: Gradient preview
- `cards`: Card-based layout
- `minimal`: Minimal design
- `detailed`: Detailed information display

**Example:**

```json
{
  "tool": "create_palette_html",
  "parameters": {
    "palette": ["#ff0000", "#00ff00", "#0000ff"],
    "layout": "grid",
    "style": "cards",
    "show_values": true,
    "interactive": true,
    "accessibility_info": true
  }
}
```

### create_color_wheel_html

Generate interactive color wheel visualizations.

**Parameters:**

- `type` (string, optional): Color wheel type (default: "hsl")
- `size` (number, optional): Size in pixels (200-1000, default: 400)
- `interactive` (boolean, optional): Enable interactivity (default: true)
- `show_harmony` (boolean, optional): Show harmony relationships (default: false)
- `harmony_type` (string, optional): Harmony type if show_harmony is true
- `highlight_colors` (array, optional): Colors to highlight on wheel
- `theme` (string, optional): Color theme (default: "light")

**Color Wheel Types:**

- `hsl`: HSL color wheel
- `hsv`: HSV color wheel
- `rgb`: RGB color wheel
- `ryw`: Red-Yellow-White wheel
- `ryb`: Red-Yellow-Blue traditional wheel

### create_palette_png

Generate high-quality PNG images of color palettes.

**Parameters:**

- `palette` (array, required): Array of colors
- `layout` (string, optional): Layout arrangement (default: "horizontal")
- `resolution` (number, optional): DPI (72|150|300|600, default: 150)
- `dimensions` (array, optional): [width, height] in pixels
- `style` (string, optional): Visual style (default: "flat")
- `labels` (boolean, optional): Show color values (default: true)
- `background` (string, optional): Background color (default: "white")
- `margin` (number, optional): Margin in pixels (default: 20)

**Visual Styles:**

- `flat`: Flat color swatches
- `gradient`: Gradient effects
- `material`: Material design style
- `glossy`: Glossy finish
- `fabric`: Fabric texture
- `paper`: Paper texture

## Export Format Tools

### export_css

Generate modern CSS with custom properties and utility classes.

**Parameters:**

- `colors` (array, required): Array of colors to export
- `format` (string, optional): CSS format type (default: "both")
- `prefix` (string, optional): Prefix for variable names (default: "color")
- `semantic_names` (array, optional): Semantic names for colors
- `include_rgb_hsl` (boolean, optional): Include RGB and HSL variants (default: true)
- `include_fallbacks` (boolean, optional): Include fallback values (default: true)
- `minify` (boolean, optional): Minify CSS output (default: false)

**Format Types:**

- `variables`: CSS custom properties only
- `classes`: Utility classes only
- `both`: Both variables and classes

**Example:**

```json
{
  "tool": "export_css",
  "parameters": {
    "colors": ["#2563eb", "#ef4444", "#10b981"],
    "format": "both",
    "semantic_names": ["primary", "error", "success"],
    "include_rgb_hsl": true
  }
}
```

### export_scss

Generate SCSS variables, maps, and mixins with utility functions.

**Parameters:**

- `colors` (array, required): Array of colors to export
- `format` (string, optional): SCSS format type (default: "all")
- `prefix` (string, optional): Prefix for variable names (default: "color")
- `namespace` (string, optional): Optional namespace for variables
- `semantic_names` (array, optional): Semantic names for colors
- `include_functions` (boolean, optional): Include utility functions (default: true)
- `include_variants` (boolean, optional): Include lighter/darker variants (default: true)

**Format Types:**

- `variables`: SCSS variables only
- `map`: SCSS color map only
- `mixins`: SCSS mixins only
- `all`: All formats combined

### export_tailwind

Generate Tailwind CSS configuration and utility classes.

**Parameters:**

- `colors` (array, required): Array of colors to export
- `format` (string, optional): Export format type (default: "config")
- `prefix` (string, optional): Prefix for color names (default: "custom")
- `semantic_names` (array, optional): Semantic names for colors
- `include_shades` (boolean, optional): Include shade variations (default: true)
- `extend_default` (boolean, optional): Extend default colors (default: true)
- `generate_utilities` (array, optional): Utility classes to generate

**Format Types:**

- `config`: Tailwind configuration object
- `plugin`: Tailwind plugin
- `css`: CSS utility classes
- `all`: All formats

**Utility Classes:**

- `background`: Background color utilities
- `text`: Text color utilities
- `border`: Border color utilities
- `ring`: Ring color utilities
- `shadow`: Shadow color utilities
- `all`: All utility types

### export_json

Generate JSON format for programmatic use and API integration.

**Parameters:**

- `colors` (array, required): Array of colors to export
- `format` (string, optional): JSON structure format (default: "detailed")
- `group_name` (string, optional): Name for the color group
- `semantic_names` (array, optional): Semantic names for colors
- `include_metadata` (boolean, optional): Include color analysis metadata (default: true)
- `include_accessibility` (boolean, optional): Include accessibility information (default: true)
- `include_variations` (boolean, optional): Include color variations (default: false)
- `pretty_print` (boolean, optional): Format with indentation (default: true)
- `version: "0.1.0"""""")

**Format Types:**

- `simple`: Simple color array
- `detailed`: Detailed color objects with metadata
- `api`: API-friendly format
- `design_tokens`: Design tokens format

## Color Utility Tools

### mix_colors

Mix multiple colors with specified ratios and blend modes.

**Parameters:**

- `colors` (array, required): Array of colors to mix (2-10 colors)
- `ratios` (array, optional): Mix ratios for each color (must sum to 1.0)
- `blend_mode` (string, optional): Blend mode (default: "normal")
- `color_space` (string, optional): Color space for mixing (default: "rgb")

**Blend Modes:**

- `normal`: Normal blending
- `multiply`: Multiply blend
- `screen`: Screen blend
- `overlay`: Overlay blend
- `color_burn`: Color burn
- `color_dodge`: Color dodge
- `darken`: Darken blend
- `lighten`: Lighten blend
- `difference`: Difference blend
- `exclusion`: Exclusion blend

### generate_color_variations

Generate tints, shades, and tones of a base color.

**Parameters:**

- `base_color` (string, required): Base color for variations
- `variation_type` (string, required): Type of variations to generate
- `steps` (number, optional): Number of variation steps (3-20, default: 10)
- `intensity` (number, optional): Variation intensity (0-100, default: 50)

**Variation Types:**

- `tints`: Add white to create lighter versions
- `shades`: Add black to create darker versions
- `tones`: Add gray to create muted versions
- `all`: Generate all three types

### sort_colors

Sort colors by various properties with optional grouping.

**Parameters:**

- `colors` (array, required): Array of colors to sort (2-100 colors)
- `sort_by` (string, required): Property to sort by
- `direction` (string, optional): Sort direction (default: "ascending")
- `group_similar` (boolean, optional): Group similar colors (default: false)

**Sort Properties:**

- `hue`: Sort by hue value
- `saturation`: Sort by saturation level
- `lightness`: Sort by lightness value
- `brightness`: Sort by perceived brightness
- `temperature`: Sort by color temperature
- `frequency`: Sort by color frequency/popularity

### analyze_color_collection

Analyze a collection of colors for diversity, harmony, and accessibility metrics.

**Parameters:**

- `colors` (array, required): Array of colors to analyze (2-50 colors)
- `metrics` (array, optional): Metrics to calculate

**Available Metrics:**

- `diversity`: Color diversity score
- `harmony`: Color harmony assessment
- `contrast_range`: Contrast ratio range
- `temperature_distribution`: Temperature distribution analysis
- `accessibility_score`: Overall accessibility score

## Error Handling

All tools implement comprehensive error handling with structured responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_COLOR_FORMAT",
    "message": "The provided color format is not supported",
    "details": {
      "provided": "invalid_color",
      "supported_formats": [
        "hex",
        "rgb",
        "hsl",
        "hsv",
        "cmyk",
        "lab",
        "xyz",
        "named"
      ]
    },
    "suggestions": [
      "Try using a hex format like #FF0000",
      "Use RGB format like rgb(255, 0, 0)",
      "Check the color format documentation"
    ]
  },
  "metadata": {
    "tool": "convert_color",
    "timestamp": "2024-01-15T10:30:00Z",
    "execution_time": 5
  }
}
```

### Common Error Codes

- `INVALID_COLOR_FORMAT`: Unsupported color format
- `INVALID_PARAMETER`: Invalid parameter value
- `MISSING_REQUIRED_PARAMETER`: Required parameter not provided
- `PARAMETER_OUT_OF_RANGE`: Parameter value outside valid range
- `PROCESSING_ERROR`: Error during color processing
- `MEMORY_LIMIT_EXCEEDED`: Operation exceeded memory limits
- `TIMEOUT_ERROR`: Operation timed out
- `VALIDATION_ERROR`: Input validation failed

## Examples

### Basic Color Conversion

```json
// Convert HEX to HSL
{
  "tool": "convert_color",
  "parameters": {
    "color": "#2563eb",
    "output_format": "hsl",
    "precision": 2
  }
}

// Response
{
  "success": true,
  "data": {
    "original": "#2563eb",
    "converted": "hsl(217.22, 91.22%, 59.61%)",
    "format": "hsl"
  }
}
```

### Generate Complementary Palette

```json
// Create complementary color palette
{
  "tool": "generate_harmony_palette",
  "parameters": {
    "base_color": "#2563eb",
    "harmony_type": "complementary",
    "count": 5
  }
}

// Response includes palette with complementary colors
{
  "success": true,
  "data": {
    "colors": ["#2563eb", "#eb7d25", "#4f46e5", "#f59e0b", "#1e40af"],
    "harmony_type": "complementary",
    "base_color": "#2563eb"
  }
}
```

### Check Accessibility Compliance

```json
// Check contrast ratio
{
  "tool": "check_contrast",
  "parameters": {
    "foreground": "#2563eb",
    "background": "#ffffff",
    "standard": "WCAG_AA"
  }
}

// Response with compliance information
{
  "success": true,
  "data": {
    "contrast_ratio": 5.74,
    "passes_aa": true,
    "passes_aaa": false,
    "wcag_level": "AA"
  }
}
```

### Create Interactive Visualization

```json
// Generate HTML color wheel
{
  "tool": "create_color_wheel_html",
  "parameters": {
    "type": "hsl",
    "size": 400,
    "interactive": true,
    "show_harmony": true,
    "harmony_type": "triadic"
  }
}

// Response includes complete HTML document
{
  "success": true,
  "visualizations": {
    "html": "<!DOCTYPE html><html>...</html>"
  }
}
```

### Export to CSS

```json
// Export colors as CSS custom properties
{
  "tool": "export_css",
  "parameters": {
    "colors": ["#2563eb", "#ef4444", "#10b981"],
    "semantic_names": ["primary", "error", "success"],
    "format": "both"
  }
}

// Response with CSS code
{
  "success": true,
  "export_formats": {
    "css": ":root {\n  --color-primary: #2563eb;\n  --color-error: #ef4444;\n  --color-success: #10b981;\n}"
  }
}
```

## Performance Characteristics

- **Color Conversions**: < 100ms response time
- **Palette Generation**: < 500ms for basic harmonies
- **Visualizations**: < 2000ms for HTML/PNG generation
- **Memory Usage**: < 100MB per request
- **Concurrent Requests**: 50+ simultaneous requests supported
- **Caching**: Intelligent caching for frequently used operations

## Best Practices

### Color Format Selection

- Use HEX for web development and CSS
- Use RGB for programmatic color manipulation
- Use HSL for intuitive color adjustments
- Use LAB/OKLCH for perceptually uniform operations
- Use CMYK for print applications

### Accessibility Guidelines

- Always check contrast ratios for text/background combinations
- Test with colorblind simulation tools
- Provide alternative indicators beyond color alone
- Use semantic color names for better maintainability
- Consider high contrast themes for accessibility

### Performance Optimization

- Cache frequently converted colors
- Use appropriate precision levels (2-3 decimal places usually sufficient)
- Batch multiple operations when possible
- Use efficient color spaces for specific operations

### Integration Tips

- Validate all color inputs before processing
- Handle errors gracefully with fallback colors
- Use semantic color mapping for design systems
- Document color usage and accessibility requirements
- Test across different devices and viewing conditions

This comprehensive API reference provides all the information needed to effectively use the MCP Color Server in your applications and workflows.
