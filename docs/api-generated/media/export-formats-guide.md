# Export Formats Guide

The MCP Color Server provides comprehensive export format tools that allow you to export color palettes in various formats for different platforms and use cases.

## Available Export Tools

### 1. CSS Export (`export_css`)

Generate modern CSS with custom properties and utility classes.

**Features:**

- CSS custom properties (CSS variables)
- Utility classes for background, text, and border colors
- RGB and HSL variants for alpha transparency
- Lighter/darker variants for hover states
- Minification support
- Semantic naming support

**Example Usage:**

```json
{
  "tool": "export_css",
  "parameters": {
    "colors": ["#FF0000", "#00FF00", "#0000FF"],
    "format": "both",
    "prefix": "brand",
    "semantic_names": ["primary", "secondary", "accent"],
    "include_rgb_hsl": true,
    "include_fallbacks": true
  }
}
```

**Output:**

```css
:root {
  --brand-primary: #ff0000;
  --brand-primary-rgb: 255, 0, 0;
  --brand-primary-hsl: 0, 100%, 50%;
  --brand-primary-light: #ff3333;
  --brand-primary-dark: #cc0000;
}

.bg-brand-primary {
  background-color: var(--brand-primary, #ff0000);
}

.text-brand-primary {
  color: var(--brand-primary, #ff0000);
}
```

### 2. SCSS Export (`export_scss`)

Generate SCSS variables, maps, and mixins for Sass projects.

**Features:**

- SCSS variables
- Color maps for organization
- Utility mixins and functions
- Namespace support
- Color variants (light/dark)

**Example Usage:**

```json
{
  "tool": "export_scss",
  "parameters": {
    "colors": ["#FF0000", "#00FF00"],
    "format": "all",
    "prefix": "color",
    "namespace": "theme",
    "include_functions": true,
    "include_variants": true
  }
}
```

**Output:**

```scss
// Color Variables
$theme-color-1: #ff0000;
$theme-color-1-light: #ff3333;
$theme-color-1-dark: #cc0000;

// Color Map
$theme-colors: (
  'color-1': #ff0000,
  'color-1-light': #ff3333,
  'color-1-dark': #cc0000,
);

// Utility Functions
@function theme-color($name) {
  @if map-has-key($theme-colors, $name) {
    @return map-get($theme-colors, $name);
  }
  @warn "Color '#{$name}' not found";
  @return null;
}

@mixin theme-bg-color($name, $opacity: 1) {
  $color: theme-color($name);
  @if $color {
    background-color: rgba($color, $opacity);
  }
}
```

### 3. Tailwind CSS Export (`export_tailwind`)

Generate Tailwind CSS configuration and utility classes.

**Features:**

- Tailwind config format
- Plugin format for custom utilities
- CSS utility classes
- Shade variations (50, 100, 200, etc.)
- Extend or replace default colors

**Example Usage:**

```json
{
  "tool": "export_tailwind",
  "parameters": {
    "colors": ["#FF0000", "#00FF00"],
    "format": "config",
    "prefix": "brand",
    "include_shades": true,
    "extend_default": true
  }
}
```

**Output:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-1': {
          50: '#ffe6e6',
          100: '#ffcccc',
          200: '#ff9999',
          300: '#ff6666',
          400: '#ff3333',
          500: '#ff0000',
          600: '#cc0000',
          700: '#990000',
          800: '#660000',
          900: '#330000',
          950: '#1a0000',
        },
      },
    },
  },
  plugins: [],
};
```

### 4. JSON Export (`export_json`)

Generate JSON format for programmatic use and API integration.

**Features:**

- Multiple format structures (simple, detailed, API, design tokens)
- Color metadata and analysis
- Accessibility information
- Color variations (tints, shades, tones)
- Pretty printing or minification

**Example Usage:**

```json
{
  "tool": "export_json",
  "parameters": {
    "colors": ["#FF0000", "#00FF00"],
    "format": "detailed",
    "include_metadata": true,
    "include_accessibility": true,
    "group_name": "Brand Colors",
    "version: "0.1.0""
  }
}
```

**Output:**

```json
{
  "palette": {
    "name": "Brand Colors",
    "version: "0.1.0"",
    "created": "2024-01-15T10:30:00.000Z",
    "color_count": 2
  },
  "colors": [
    {
      "id": "color-1",
      "name": "color-1",
      "hex": "#ff0000",
      "rgb": { "r": 255, "g": 0, "b": 0 },
      "hsl": { "h": 0, "s": 100, "l": 50 },
      "hsv": { "h": 0, "s": 100, "v": 100 },
      "metadata": {
        "brightness": 0.299,
        "temperature": "warm",
        "is_light": false,
        "is_dark": true
      },
      "accessibility": {
        "contrast_white": 3.998,
        "contrast_black": 5.252,
        "wcag_aa_normal": false,
        "wcag_aaa_normal": false
      }
    }
  ]
}
```

## Format Comparison

| Feature            | CSS                  | SCSS                | Tailwind         | JSON                  |
| ------------------ | -------------------- | ------------------- | ---------------- | --------------------- |
| Variables          | ✅ Custom Properties | ✅ Variables & Maps | ✅ Config Object | ✅ Structured Data    |
| Utility Classes    | ✅ Generated         | ✅ Mixins           | ✅ Generated     | ❌                    |
| Color Variants     | ✅ Light/Dark        | ✅ Light/Dark       | ✅ Shade Scale   | ✅ Tints/Shades/Tones |
| Semantic Names     | ✅                   | ✅                  | ✅               | ✅                    |
| Metadata           | ❌                   | ❌                  | ❌               | ✅                    |
| Accessibility Info | ❌                   | ❌                  | ❌               | ✅                    |
| Minification       | ✅                   | ❌                  | ❌               | ✅                    |

## Best Practices

### CSS Export

- Use semantic names for better maintainability
- Include RGB/HSL variants for alpha transparency
- Enable fallbacks for older browser support
- Minify for production use

### SCSS Export

- Use maps for large color palettes
- Leverage mixins for consistent application
- Use functions for dynamic color manipulation
- Organize with namespaces

### Tailwind Export

- Include shade variations for design flexibility
- Use semantic names for brand colors
- Test configuration in your Tailwind setup
- Consider extending vs replacing default colors

### JSON Export

- Use detailed format for comprehensive information
- Include metadata for color analysis
- Use API format for web service integration
- Use design tokens format for design systems

## Integration Examples

### CSS Integration

```html
<link rel="stylesheet" href="colors.css" />
<div class="bg-primary text-white">Primary Button</div>
```

### SCSS Integration

```scss
@import 'colors';

.button {
  @include bg-color('primary');
  @include text-color('white');
}
```

### Tailwind Integration

```javascript
// tailwind.config.js
const colors = require('./colors.config.js');
module.exports = colors;
```

### JSON Integration

```javascript
import colors from './colors.json';
const primaryColor = colors.colors.find(c => c.name === 'primary');
```

## Performance Considerations

- All export tools complete within 1000ms for typical palettes
- Large palettes (50+ colors) may take longer but still under performance limits
- Minification reduces file sizes significantly
- Caching is implemented for repeated exports

## Error Handling

All export tools provide comprehensive error handling:

- **Invalid Colors**: Clear error messages with format suggestions
- **Parameter Validation**: Joi schema validation with helpful feedback
- **File Size Limits**: Automatic optimization and warnings
- **Format Errors**: Specific guidance for fixing issues

## Common Use Cases

1. **Design System Creation**: Use JSON format for comprehensive color data
2. **Web Development**: Use CSS format for modern web applications
3. **Sass Projects**: Use SCSS format with mixins and functions
4. **Tailwind Projects**: Use Tailwind format with shade variations
5. **API Integration**: Use JSON API format for web services
6. **Documentation**: Use JSON detailed format for color specifications
