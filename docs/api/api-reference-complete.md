# MCP Color Server - Complete API Reference

## Overview

The MCP Color Server provides a comprehensive set of tools for color manipulation, palette generation, gradient creation, and visualization through the Model Context Protocol (MCP). This document provides complete API reference with examples, error handling, and best practices.

## Table of Contents

1. [Color Conversion Tools](#color-conversion-tools)
2. [Color Analysis Tools](#color-analysis-tools)
3. [Palette Generation Tools](#palette-generation-tools)
4. [Gradient Generation Tools](#gradient-generation-tools)
5. [Theme Generation Tools](#theme-generation-tools)
6. [Accessibility Tools](#accessibility-tools)
7. [Visualization Tools](#visualization-tools)
8. [Export Format Tools](#export-format-tools)
9. [Utility Tools](#utility-tools)
10. [Error Handling](#error-handling)
11. [Performance Guidelines](#performance-guidelines)
12. [Best Practices](#best-practices)

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
    "html_file": {
      "file_path": string,
      "filename": string,
      "size": number,
      "type": "html",
      "created_at": string
    },
    "png_files": [
      {
        "file_path": string,
        "filename": string,
        "size": number,
        "type": "png",
        "background_variant": "light" | "dark",
        "created_at": string
      }
    ]
  },
  "export_formats": {
    "css": string,
    "scss": string,
    "tailwind": string,
    "json": object
  },
  "error": {
    "code": string,
    "message": string,
    "suggestions": string[]
  }
}
```

## Color Conversion Tools

### convert_color

Convert colors between different formats with high precision and framework support.

**Parameters:**

- `color` (string, required): Input color in any supported format
- `output_format` (string, required): Target format
- `precision` (number, optional): Decimal places for numeric outputs (0-10, default: 2)
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
- Named Colors: `red`, `blue`, `forestgreen`, etc.

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

**Examples:**

```json
// Basic HEX to RGB conversion
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF0000",
    "output_format": "rgb"
  }
}
// Response: { "success": true, "data": { "converted": "rgb(255, 0, 0)" } }

// High precision LAB conversion
{
  "tool": "convert_color",
  "parameters": {
    "color": "hsl(25, 100%, 69%)",
    "output_format": "lab",
    "precision": 5
  }
}

// CSS variable generation
{
  "tool": "convert_color",
  "parameters": {
    "color": "#2563eb",
    "output_format": "css-var",
    "variable_name": "primary-color"
  }
}
// Response: { "data": { "converted": "--primary-color: #2563eb;" } }

// Mobile framework conversion
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF0000",
    "output_format": "swift",
    "precision": 3
  }
}
// Response: { "data": { "converted": "UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.000)" } }
```

**Performance:** < 100ms for all conversions

## Color Analysis Tools

### analyze_color

Analyze color properties including brightness, contrast, temperature, and accessibility metrics.

**Parameters:**

- `color` (string, required): Color to analyze
- `analysis_types` (array, optional): Types of analysis to perform
- `compare_color` (string, optional): Second color for comparison
- `include_recommendations` (boolean, optional): Include usage recommendations

**Analysis Types:**

- `brightness`: Perceived brightness (0-100)
- `temperature`: Color temperature classification
- `contrast`: Contrast ratios against white/black
- `accessibility`: WCAG compliance analysis
- `saturation`: Color saturation metrics
- `hue`: Hue analysis and relationships

**Examples:**

```json
// Complete color analysis
{
  "tool": "analyze_color",
  "parameters": {
    "color": "#2563eb",
    "analysis_types": ["brightness", "temperature", "accessibility"],
    "include_recommendations": true
  }
}

// Color comparison analysis
{
  "tool": "analyze_color",
  "parameters": {
    "color": "#ff0000",
    "compare_color": "#00ff00",
    "analysis_types": ["contrast", "brightness"]
  }
}
```

**Response Data:**

```json
{
  "brightness": 45.2,
  "temperature": "cool",
  "kelvin_approximation": 6500,
  "contrast_white": 5.89,
  "contrast_black": 3.56,
  "accessibility": {
    "wcag_aa_normal": true,
    "wcag_aa_large": true,
    "wcag_aaa_normal": false
  },
  "recommendations": [
    "Suitable for primary buttons and links",
    "Good contrast against white backgrounds"
  ]
}
```

### calculate_color_distance

Calculate perceptual distance between colors using various algorithms.

**Parameters:**

- `color1` (string, required): First color
- `color2` (string, required): Second color
- `method` (string, optional): Algorithm to use
- `color_space` (string, optional): Color space for calculation

**Distance Methods:**

- `euclidean`: Simple Euclidean distance
- `delta_e`: Generic Delta E
- `cie76`: CIE76 Delta E
- `cie94`: CIE94 Delta E
- `cie2000`: CIE2000 Delta E (most accurate)

**Color Spaces:**

- `rgb`: RGB color space
- `lab`: LAB color space (recommended)
- `xyz`: XYZ color space
- `lch`: LCH color space

## Palette Generation Tools

### generate_harmony_palette

Generate color palettes based on color theory principles.

**Parameters:**

- `base_color` (string, required): Base color for harmony
- `harmony_type` (string, required): Type of color harmony
- `count` (number, optional): Number of colors (3-10, default: 5)
- `variation` (number, optional): Variation amount (0-100, default: 20)

**Harmony Types:**

- `monochromatic`: Variations of a single hue
- `analogous`: Adjacent colors on color wheel
- `complementary`: Opposite colors on color wheel
- `triadic`: Three evenly spaced colors
- `tetradic`: Four colors forming rectangle
- `split_complementary`: Base + two adjacent to complement
- `double_complementary`: Two complementary pairs

**Examples:**

```json
// Complementary palette
{
  "tool": "generate_harmony_palette",
  "parameters": {
    "base_color": "#2563eb",
    "harmony_type": "complementary",
    "count": 5,
    "variation": 15
  }
}

// Triadic palette with high variation
{
  "tool": "generate_harmony_palette",
  "parameters": {
    "base_color": "#e74c3c",
    "harmony_type": "triadic",
    "count": 3,
    "variation": 30
  }
}
```

### generate_contextual_palette

Generate palettes optimized for specific contexts and use cases.

**Parameters:**

- `context` (string, required): Usage context
- `primary_color` (string, optional): Primary color to build around
- `mood` (string, optional): Desired mood/feeling
- `industry` (string, optional): Industry context
- `accessibility_level` (string, optional): WCAG compliance level

**Contexts:**

- `web_design`: Web application interfaces
- `mobile_app`: Mobile application design
- `print`: Print media and materials
- `brand`: Brand identity systems
- `data_visualization`: Charts and graphs
- `accessibility`: High contrast, accessible designs
- `dark_theme`: Dark mode interfaces
- `light_theme`: Light mode interfaces

**Moods:**

- `professional`: Corporate, trustworthy
- `creative`: Artistic, expressive
- `energetic`: Dynamic, vibrant
- `calm`: Peaceful, relaxing
- `modern`: Contemporary, sleek
- `vintage`: Retro, nostalgic
- `minimal`: Clean, simple
- `bold`: Strong, impactful

### generate_algorithmic_palette

Generate palettes using mathematical algorithms.

**Parameters:**

- `algorithm` (string, required): Algorithm to use
- `base_color` (string, optional): Starting color
- `count` (number, optional): Number of colors
- `parameters` (object, optional): Algorithm-specific settings

**Algorithms:**

- `golden_ratio`: Based on golden ratio proportions
- `fibonacci`: Fibonacci sequence-based spacing
- `perceptual_uniform`: Perceptually uniform distribution
- `chroma_progression`: Progressive chroma changes
- `hue_shift`: Systematic hue shifting

## Gradient Generation Tools

### generate_linear_gradient

Create linear gradients with precise mathematical control.

**Parameters:**

- `colors` (array, required): Array of color strings
- `positions` (array, optional): Stop positions (0-100)
- `angle` (number, optional): Gradient angle (0-360, default: 90)
- `interpolation` (string, optional): Interpolation method
- `color_space` (string, optional): Color space for interpolation
- `steps` (number, optional): Number of steps for stepped gradients

**Interpolation Methods:**

- `linear`: Linear interpolation
- `ease`: Ease interpolation
- `ease_in`: Ease-in interpolation
- `ease_out`: Ease-out interpolation
- `bezier`: Bezier curve interpolation

**Examples:**

```json
// Basic linear gradient
{
  "tool": "generate_linear_gradient",
  "parameters": {
    "colors": ["#ff0000", "#00ff00", "#0000ff"],
    "angle": 45
  }
}

// Advanced gradient with custom positions
{
  "tool": "generate_linear_gradient",
  "parameters": {
    "colors": ["#2563eb", "#7c3aed", "#db2777"],
    "positions": [0, 30, 100],
    "angle": 135,
    "interpolation": "ease",
    "color_space": "lab"
  }
}
```

### generate_radial_gradient

Create radial gradients with center point and shape control.

**Parameters:**

- `colors` (array, required): Array of color strings
- `positions` (array, optional): Stop positions (0-100)
- `center` (array, optional): Center point [x, y] (0-100)
- `shape` (string, optional): Gradient shape
- `size` (string, optional): Size method
- `dimensions` (array, optional): Explicit dimensions

**Shapes:**

- `circle`: Circular gradient
- `ellipse`: Elliptical gradient

**Size Methods:**

- `closest_side`: To closest side
- `closest_corner`: To closest corner
- `farthest_side`: To farthest side
- `farthest_corner`: To farthest corner
- `explicit`: Use explicit dimensions

### generate_conic_gradient

Create conic (angular) gradients.

**Parameters:**

- `colors` (array, required): Array of color strings
- `positions` (array, optional): Angle positions (0-360)
- `center` (array, optional): Center point [x, y]
- `starting_angle` (number, optional): Starting angle (0-360)

## Theme Generation Tools

### generate_theme

Generate complete design system themes with semantic color mapping.

**Parameters:**

- `theme_type` (string, required): Type of theme
- `primary_color` (string, required): Primary brand color
- `style` (string, optional): Design system style
- `components` (array, optional): Components to generate colors for
- `accessibility_level` (string, optional): WCAG compliance level
- `brand_colors` (array, optional): Additional brand colors

**Theme Types:**

- `light`: Light theme
- `dark`: Dark theme
- `auto`: Adaptive theme
- `high_contrast`: High contrast theme
- `colorblind_friendly`: Optimized for color vision deficiencies

**Design Styles:**

- `material`: Material Design
- `ios`: iOS Human Interface Guidelines
- `fluent`: Microsoft Fluent Design
- `custom`: Custom design system

**Components:**

- `background`: Background colors
- `surface`: Surface colors
- `primary`: Primary action colors
- `secondary`: Secondary action colors
- `accent`: Accent colors
- `text`: Text colors
- `border`: Border colors
- `shadow`: Shadow colors
- `success`: Success state colors
- `warning`: Warning state colors
- `error`: Error state colors
- `info`: Information colors

## Accessibility Tools

### check_contrast

Check color contrast compliance with WCAG standards.

**Parameters:**

- `foreground` (string, required): Foreground color
- `background` (string, required): Background color
- `text_size` (string, optional): Text size category
- `standard` (string, optional): Accessibility standard

**Text Sizes:**

- `normal`: Normal text (< 18pt or < 14pt bold)
- `large`: Large text (≥ 18pt or ≥ 14pt bold)

**Standards:**

- `WCAG_AA`: WCAG 2.1 AA (4.5:1 normal, 3:1 large)
- `WCAG_AAA`: WCAG 2.1 AAA (7:1 normal, 4.5:1 large)
- `APCA`: Advanced Perceptual Contrast Algorithm

### simulate_colorblindness

Simulate how colors appear to users with color vision deficiencies.

**Parameters:**

- `colors` (array, required): Colors to simulate
- `type` (string, required): Type of color vision deficiency
- `severity` (number, optional): Severity percentage (0-100)

**Deficiency Types:**

- `protanopia`: Red-blind (missing L-cones)
- `deuteranopia`: Green-blind (missing M-cones)
- `tritanopia`: Blue-blind (missing S-cones)
- `protanomaly`: Red-weak (anomalous L-cones)
- `deuteranomaly`: Green-weak (anomalous M-cones)
- `tritanomaly`: Blue-weak (anomalous S-cones)
- `monochromacy`: Complete color blindness

### optimize_for_accessibility

Optimize colors for accessibility compliance while preserving design intent.

**Parameters:**

- `palette` (array, required): Colors to optimize
- `use_cases` (array, required): How colors will be used
- `target_standard` (string, optional): Target WCAG standard
- `preserve_hue` (boolean, optional): Preserve original hues
- `preserve_brand_colors` (array, optional): Colors not to modify

**Use Cases:**

- `text`: Text colors
- `background`: Background colors
- `accent`: Accent and highlight colors
- `interactive`: Interactive element colors

## Visualization Tools

### create_palette_html

Generate interactive HTML palette visualizations with file output.

**Parameters:**

- `palette` (array, required): Array of colors
- `layout` (string, optional): Layout style
- `style` (string, optional): Visual style
- `size` (string, optional): Size preset
- `show_values` (boolean, optional): Show color values
- `interactive` (boolean, optional): Enable interactivity
- `accessibility_info` (boolean, optional): Show accessibility info

**Layouts:**

- `horizontal`: Single row layout
- `vertical`: Single column layout
- `grid`: Responsive grid layout
- `circular`: Circular arrangement
- `wave`: Flowing wave pattern

**Styles:**

- `swatches`: Color swatches
- `gradient`: Gradient preview
- `cards`: Card-based layout
- `minimal`: Minimal design
- `detailed`: Detailed information

### create_color_wheel_html

Generate interactive color wheel visualizations.

**Parameters:**

- `type` (string, optional): Color wheel type
- `size` (number, optional): Size in pixels
- `interactive` (boolean, optional): Enable interactivity
- `show_harmony` (boolean, optional): Show harmony relationships
- `highlight_colors` (array, optional): Colors to highlight

**Wheel Types:**

- `hsl`: HSL color wheel
- `hsv`: HSV color wheel
- `rgb`: RGB color wheel
- `ryw`: Red-Yellow-White wheel
- `ryb`: Red-Yellow-Blue wheel

### create_palette_png

Generate high-quality PNG palette images with dual backgrounds.

**Parameters:**

- `palette` (array, required): Array of colors
- `layout` (string, optional): Layout arrangement
- `resolution` (number, optional): DPI resolution
- `dimensions` (array, optional): Custom dimensions
- `style` (string, optional): Visual style
- `labels` (boolean, optional): Show color labels

**Resolutions:**

- `72`: Web resolution
- `150`: Standard print
- `300`: High-quality print
- `600`: Professional print

**Styles:**

- `flat`: Flat color swatches
- `gradient`: Gradient effects
- `material`: Material design
- `glossy`: Glossy finish
- `fabric`: Fabric texture
- `paper`: Paper texture

## Export Format Tools

### export_css

Generate modern CSS with custom properties and utility classes.

**Parameters:**

- `colors` (array, required): Colors to export
- `format` (string, optional): CSS format type
- `semantic_names` (array, optional): Semantic color names
- `include_rgb_hsl` (boolean, optional): Include RGB/HSL variants
- `prefix` (string, optional): Variable prefix

**Formats:**

- `variables`: CSS custom properties only
- `classes`: Utility classes only
- `both`: Variables and classes

### export_scss

Generate SCSS variables, maps, and mixins.

**Parameters:**

- `colors` (array, required): Colors to export
- `format` (string, optional): SCSS format type
- `include_functions` (boolean, optional): Include utility functions
- `namespace` (string, optional): Variable namespace

**Formats:**

- `variables`: SCSS variables
- `map`: Color map
- `mixins`: Utility mixins
- `all`: Complete SCSS system

### export_tailwind

Generate Tailwind CSS configuration and utility classes.

**Parameters:**

- `colors` (array, required): Colors to export
- `include_shades` (boolean, optional): Generate shade variations
- `semantic_names` (array, optional): Semantic color names
- `extend_default` (boolean, optional): Extend default colors

### export_json

Generate JSON format for programmatic use and API integration.

**Parameters:**

- `colors` (array, required): Colors to export
- `format` (string, optional): JSON structure format
- `include_accessibility` (boolean, optional): Include accessibility data
- `group_name` (string, optional): Palette group name

**Formats:**

- `simple`: Basic color array
- `detailed`: Detailed color objects
- `api`: API-ready format
- `design_tokens`: Design tokens format

## Error Handling

All tools implement comprehensive error handling with structured responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "provided": "invalid input",
      "expected": "valid format"
    },
    "suggestions": [
      "Try using a hex format like #FF0000",
      "Check the documentation for valid formats"
    ]
  },
  "metadata": {
    "tool": "tool_name",
    "timestamp": "2024-01-15T10:30:00Z",
    "execution_time": 5
  }
}
```

### Common Error Codes

- `INVALID_COLOR_FORMAT`: Invalid color input format
- `INVALID_PARAMETER`: Invalid parameter value
- `MISSING_REQUIRED_PARAMETER`: Required parameter not provided
- `PARAMETER_OUT_OF_RANGE`: Parameter value outside valid range
- `PROCESSING_ERROR`: Error during color processing
- `FILE_SYSTEM_ERROR`: File operation error
- `MEMORY_LIMIT_EXCEEDED`: Memory usage exceeded limits
- `TIMEOUT_ERROR`: Operation timed out

## Performance Guidelines

### Response Time Requirements

- **Color Conversions**: < 100ms
- **Palette Generation**: < 500ms
- **Visualizations**: < 2000ms
- **Complex Operations**: < 5000ms

### Resource Limits

- **Memory Usage**: < 100MB per request
- **File Size**: < 10MB for PNG, < 2MB for HTML
- **Concurrent Requests**: Up to 50 simultaneous
- **Cache Size**: 256MB with TTL cleanup

### Optimization Tips

1. **Use Caching**: Frequently used colors are cached automatically
2. **Batch Operations**: Combine multiple operations when possible
3. **Appropriate Precision**: Use lower precision for faster operations
4. **File Output**: Use file-based output for large visualizations
5. **Concurrent Limits**: Limit concurrent expensive operations

## Best Practices

### Color Input

1. **Consistent Format**: Use consistent color formats within workflows
2. **Validation**: Validate colors before complex operations
3. **Precision**: Use appropriate precision for your use case
4. **Named Colors**: Use named colors for better readability

### Palette Generation

1. **Base Color Selection**: Choose appropriate base colors for harmony
2. **Context Awareness**: Consider usage context when generating palettes
3. **Accessibility First**: Always check accessibility compliance
4. **Brand Consistency**: Maintain brand color consistency

### Visualization

1. **File Management**: Use environment variables for file output paths
2. **Background Variants**: Utilize dual background PNG generation
3. **Interactive Features**: Enable interactivity for better user experience
4. **Responsive Design**: Ensure visualizations work on all devices

### Export Formats

1. **Format Selection**: Choose appropriate formats for your platform
2. **Semantic Naming**: Use meaningful names for colors
3. **Documentation**: Include comments and documentation in exports
4. **Version Control**: Track changes in exported formats

### Error Handling

1. **Graceful Degradation**: Handle errors gracefully in applications
2. **User Feedback**: Provide clear error messages to users
3. **Retry Logic**: Implement retry logic for transient errors
4. **Logging**: Log errors for debugging and monitoring

### Security

1. **Input Validation**: Always validate user inputs
2. **File Paths**: Sanitize file paths and names
3. **Resource Limits**: Respect memory and processing limits
4. **Access Control**: Implement appropriate access controls

This comprehensive API reference provides all the information needed to effectively use the MCP Color Server in your applications. For additional examples and tutorials, see the [examples](../examples/) directory.
