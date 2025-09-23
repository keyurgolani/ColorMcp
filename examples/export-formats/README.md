# Export Formats Examples

This section demonstrates tools for exporting colors in various formats for different development environments and use cases.

## Available Export Tools

- **export_css** - CSS custom properties and utility classes
- **export_scss** - SCSS variables, maps, and mixins
- **export_tailwind** - Tailwind CSS configuration and utilities
- **export_json** - JSON data structures for programmatic use

## Examples

### CSS Export with Variables and Classes

**Tool Call:**

```json
{
  "tool": "export_css",
  "parameters": {
    "colors": ["#2563eb", "#ebac24", "#1d66e9"],
    "format": "both",
    "prefix": "brand"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "css_output": ":root {\n  --brand-1: #2563eb;\n  --brand-1-rgb: 37, 99, 235;\n  --brand-1-hsl: 221, 83%, 53%;\n  --brand-1-light: #5284ef;\n  --brand-1-dark: #134cc9;\n  --brand-2: #ebac24;\n  --brand-2-rgb: 235, 172, 36;\n  --brand-2-hsl: 41, 83%, 53%;\n  --brand-2-light: #efbd52;\n  --brand-2-dark: #c98f13;\n  --brand-3: #1d66e9;\n  --brand-3-rgb: 29, 102, 233;\n  --brand-3-hsl: 219, 82%, 51%;\n  --brand-3-light: #4a83ed;\n  --brand-3-dark: #134fbe;\n}\n\n.bg-brand-1 {\n  background-color: var(--brand-1, #2563eb);\n}\n.text-brand-1 {\n  color: var(--brand-1, #2563eb);\n}\n.border-brand-1 {\n  border-color: var(--brand-1, #2563eb);\n}\n.bg-brand-1:hover {\n  background-color: var(--brand-1-dark, #2563eb);\n}\n\n.bg-brand-2 {\n  background-color: var(--brand-2, #ebac24);\n}\n.text-brand-2 {\n  color: var(--brand-2, #ebac24);\n}\n.border-brand-2 {\n  border-color: var(--brand-2, #ebac24);\n}\n.bg-brand-2:hover {\n  background-color: var(--brand-2-dark, #ebac24);\n}\n\n.bg-brand-3 {\n  background-color: var(--brand-3, #1d66e9);\n}\n.text-brand-3 {\n  color: var(--brand-3, #1d66e9);\n}\n.border-brand-3 {\n  border-color: var(--brand-3, #1d66e9);\n}\n.bg-brand-3:hover {\n  background-color: var(--brand-3-dark, #1d66e9);\n}",
    "format": "both",
    "color_count": 3,
    "prefix": "brand",
    "includes_fallbacks": true,
    "includes_variants": true,
    "minified": false
  },
  "metadata": {
    "execution_time": 2,
    "tool": "export_css",
    "timestamp": "2025-09-23T02:26:12.477Z",
    "recommendations": [
      "Use CSS custom properties for better maintainability",
      "Consider using semantic color names for better readability",
      "Test fallback values in older browsers if needed"
    ]
  }
}
```

### Tailwind CSS Configuration

**Tool Call:**

```json
{
  "tool": "export_tailwind",
  "parameters": {
    "colors": ["#2563eb", "#ebac24", "#1d66e9"],
    "format": "config",
    "prefix": "brand"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tailwind_output": "/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        'brand-1': {\n          '50': '#e8eefd',\n          '100': '#d0defb',\n          '200': '#a2bcf6',\n          '300': '#739bf2',\n          '400': '#447aee',\n          '500': '#2563eb',\n          '600': '#1147bb',\n          '700': '#0d358c',\n          '800': '#09235d',\n          '900': '#04122f',\n          '950': '#020917',\n        },\n        'brand-2': {\n          '50': '#fdf6e8',\n          '100': '#fbedd0',\n          '200': '#f6dca2',\n          '300': '#f2ca73',\n          '400': '#eeb844',\n          '500': '#ebac24',\n          '600': '#bb8511',\n          '700': '#8c640d',\n          '800': '#5d4309',\n          '900': '#2f2104',\n          '950': '#171102',\n        },\n        'brand-3': {\n          '50': '#e8effd',\n          '100': '#d1dffa',\n          '200': '#a2bff6',\n          '300': '#74a0f1',\n          '400': '#4580ed',\n          '500': '#1d66e9',\n          '600': '#124dba',\n          '700': '#0e3a8b',\n          '800': '#09265d',\n          '900': '#05132e',\n          '950': '#020a17',\n        },\n      },\n    },\n  },\n  plugins: [],\n}",
    "format": "config",
    "color_count": 3,
    "prefix": "brand",
    "includes_shades": true,
    "extends_default": true,
    "utilities": ["all"]
  },
  "metadata": {
    "execution_time": 1,
    "tool": "export_tailwind",
    "timestamp": "2025-09-23T02:26:16.680Z",
    "recommendations": [
      "Use semantic color names for better maintainability",
      "Consider including shade variations for more design flexibility",
      "Test the configuration in your Tailwind CSS setup"
    ]
  }
}
```

## Key Features

### CSS Export Options

- **Variables Only**: CSS custom properties in `:root`
- **Classes Only**: Utility classes for background, text, border
- **Both**: Complete system with variables and classes
- **Fallback Support**: Fallback values for older browsers
- **Variants**: Light/dark variations automatically generated

### SCSS Export Options

- **Variables**: SCSS variable declarations
- **Maps**: Color maps for programmatic access
- **Mixins**: Utility mixins for color manipulation
- **Functions**: Helper functions for color operations

### Tailwind Export Options

- **Configuration**: Complete `tailwind.config.js` file
- **Plugin**: Custom Tailwind plugin
- **CSS**: Generated utility classes
- **Shade System**: Automatic 50-950 shade generation

### JSON Export Options

- **Simple**: Basic color array
- **Detailed**: Complete color information with metadata
- **API**: Structured for API consumption
- **Design Tokens**: Design system token format

## Format Specifications

### CSS Custom Properties

```css
:root {
  --brand-primary: #2563eb;
  --brand-primary-rgb: 37, 99, 235;
  --brand-primary-hsl: 221, 83%, 53%;
  --brand-primary-light: #5284ef;
  --brand-primary-dark: #134cc9;
}
```

### SCSS Variables

```scss
$brand-primary: #2563eb;
$brand-secondary: #ebac24;

$brand-colors: (
  'primary': $brand-primary,
  'secondary': $brand-secondary,
);
```

### Tailwind Configuration

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#2563eb',
          600: '#1147bb',
          // ... full shade system
        },
      },
    },
  },
};
```

### JSON Structure

```json
{
  "colors": [
    {
      "name": "brand-primary",
      "hex": "#2563eb",
      "rgb": { "r": 37, "g": 99, "b": 235 },
      "hsl": { "h": 221, "s": 83, "l": 53 }
    }
  ]
}
```

## Usage Guidelines

### CSS

- Use custom properties for dynamic theming
- Include fallback values for browser compatibility
- Organize variables in logical groups

### SCSS

- Use maps for programmatic color access
- Create mixins for common color operations
- Namespace variables to avoid conflicts

### Tailwind

- Extend default colors rather than replacing
- Use semantic naming for better maintainability
- Include full shade systems for flexibility

### JSON

- Structure for your specific use case
- Include metadata for better tooling support
- Version your color data for consistency

## Integration Examples

### CSS Integration

```css
.button {
  background-color: var(--brand-primary);
  color: var(--brand-on-primary);
}

.button:hover {
  background-color: var(--brand-primary-dark);
}
```

### SCSS Integration

```scss
.card {
  background: map-get($brand-colors, 'surface');
  border: 1px solid map-get($brand-colors, 'outline');
}
```

### Tailwind Integration

```html
<button class="bg-brand-500 hover:bg-brand-600 text-white">Click me</button>
```

### JavaScript Integration

```javascript
import colors from './colors.json';

const primaryColor = colors.find(c => c.name === 'brand-primary');
document.documentElement.style.setProperty('--primary', primaryColor.hex);
```
