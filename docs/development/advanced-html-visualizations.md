# Advanced HTML Visualizations Guide

This guide covers the advanced features of the MCP Color Server's HTML visualization system, including interactive elements, accessibility features, and best practices.

## Overview

The MCP Color Server provides three advanced HTML visualization tools:

1. **`create_color_wheel_html`** - Interactive color wheels with harmony highlighting
2. **`create_gradient_html`** - Gradient previews with CSS code display
3. **`create_theme_preview_html`** - Theme mockups in realistic UI contexts

All tools generate self-contained HTML documents with embedded CSS and JavaScript, ensuring they work without external dependencies.

## Interactive Features

### Color Wheel Visualization

The color wheel tool creates interactive HSL, HSV, or RGB color wheels with the following features:

#### Basic Usage

```json
{
  "tool": "create_color_wheel_html",
  "parameters": {
    "type": "hsl",
    "size": 400,
    "interactive": true,
    "show_harmony": true,
    "harmony_type": "complementary",
    "highlight_colors": ["#ff0000", "#00ff00"],
    "theme": "light"
  }
}
```

#### Interactive Features

- **Click Selection**: Click anywhere on the wheel to select a color
- **Keyboard Navigation**: Use arrow keys to navigate the color space
  - `←/→`: Adjust hue (color around the wheel)
  - `↑/↓`: Adjust saturation (distance from center)
  - `Enter/Space`: Select current color
- **Harmony Visualization**: Shows color theory relationships with connecting lines
- **Copy to Clipboard**: Automatically copies selected colors
- **Screen Reader Support**: Full ARIA labels and descriptions

#### Harmony Types

- `complementary`: Colors opposite on the color wheel
- `triadic`: Three colors evenly spaced (120° apart)
- `analogous`: Adjacent colors on the wheel
- `split_complementary`: Base color plus two colors adjacent to its complement
- `tetradic`: Four colors forming a rectangle on the wheel

### Gradient Preview

The gradient tool creates interactive previews with CSS code display:

#### Basic Usage

```json
{
  "tool": "create_gradient_html",
  "parameters": {
    "gradient_css": "linear-gradient(45deg, #ff0000, #0000ff)",
    "preview_shapes": ["rectangle", "circle", "text", "button", "card"],
    "show_css_code": true,
    "interactive_controls": true,
    "variations": true
  }
}
```

#### Interactive Features

- **Multiple Preview Shapes**: See gradients applied to different UI elements
- **CSS Code Display**: Toggle-able CSS code panel with copy functionality
- **Interactive Controls**: Adjust gradient parameters in real-time
- **Gradient Variations**: Automatic generation of angle and position variations
- **Copy Functionality**: Copy CSS code or individual gradient definitions

### Theme Preview

The theme preview tool shows colors in realistic UI contexts:

#### Basic Usage

```json
{
  "tool": "create_theme_preview_html",
  "parameters": {
    "theme_colors": {
      "primary": "#2563eb",
      "secondary": "#64748b",
      "background": "#ffffff",
      "surface": "#f8fafc",
      "text": "#1e293b"
    },
    "preview_type": "dashboard",
    "components": ["header", "sidebar", "content", "cards"],
    "interactive": true,
    "responsive": true
  }
}
```

#### Preview Types

- **`website`**: Traditional website layout with header, navigation, and content
- **`mobile_app`**: Mobile application interface
- **`dashboard`**: Admin dashboard with sidebar and metrics cards
- **`components`**: Individual UI components showcase

## Accessibility Features

All HTML visualizations are built with accessibility as a priority:

### WCAG 2.1 AA Compliance

#### Semantic HTML

- Proper heading hierarchy (`h1`, `h2`, `h3`)
- Semantic landmarks (`main`, `header`, `nav`, `section`)
- ARIA roles and labels for interactive elements
- Screen reader friendly descriptions

#### Keyboard Navigation

- Full keyboard accessibility with logical tab order
- Arrow key navigation for grid layouts
- Enter/Space activation for interactive elements
- Escape key for closing modals and menus

#### Visual Accessibility

- High contrast focus indicators
- Sufficient color contrast ratios (4.5:1 minimum)
- Support for `prefers-reduced-motion`
- Support for `prefers-contrast: high`
- Scalable text and UI elements

#### Screen Reader Support

```html
<!-- Example of accessible color swatch -->
<div
  class="color-swatch"
  role="button"
  tabindex="0"
  aria-label="Color red #FF0000"
  aria-describedby="color-info-1"
>
  <div class="color-display" style="background-color: #FF0000;"></div>
  <div id="color-info-1" class="sr-only">
    Hex value: #FF0000, RGB: 255, 0, 0, HSL: 0, 100%, 50%
  </div>
</div>
```

### Accessibility Testing

The system includes comprehensive accessibility testing:

```typescript
import { accessibilityTester } from '../utils/accessibility-testing';

// Test HTML for accessibility compliance
const report = accessibilityTester.generateAccessibilityReport(html);
console.log(`Accessibility Score: ${report.summary.overallScore}/100`);
console.log(`WCAG Level: ${report.summary.wcagLevel}`);
```

#### Test Categories

1. **HTML Structure**: DOCTYPE, lang attribute, semantic elements
2. **ARIA Labels**: Proper labeling of interactive elements
3. **Keyboard Navigation**: Tab order and keyboard event handlers
4. **Color Contrast**: WCAG AA/AAA compliance testing
5. **Responsive Design**: Viewport and mobile-friendly features

## Copy-to-Clipboard Functionality

All visualizations include robust copy-to-clipboard features:

### Implementation

```javascript
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    return new Promise((resolve, reject) => {
      try {
        document.execCommand('copy');
        textArea.remove();
        resolve();
      } catch (err) {
        textArea.remove();
        reject(err);
      }
    });
  }
}
```

### Copy Options

- **Individual Colors**: Click any color swatch to copy its value
- **All Colors**: Copy entire palette in various formats
- **CSS Code**: Copy generated CSS custom properties
- **Export Formats**: HEX, RGB, HSL, CSS, JSON, SCSS

### Visual Feedback

- Toast notifications for successful/failed operations
- Temporary visual indicators on copied elements
- Screen reader announcements for copy actions

## Responsive Design

All visualizations are fully responsive with mobile-first design:

### Breakpoints

```css
/* Mobile First */
.palette-grid {
  grid-template-columns: repeat(2, 1fr);
}

/* Tablet */
@media (min-width: 768px) {
  .palette-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .palette-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
```

### Responsive Typography

```css
body {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
}

.visualization-header h1 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}
```

### Touch-Friendly Design

- Minimum 44px touch targets
- Appropriate spacing for finger navigation
- Swipe gestures for mobile interactions

## Cross-Browser Compatibility

### Supported Browsers

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Graceful Degradation**: Basic functionality in older browsers

### Feature Detection

```javascript
// Check for modern clipboard API
if (navigator.clipboard && window.isSecureContext) {
  // Use modern API
} else {
  // Fallback to document.execCommand
}

// Check for CSS custom properties support
if (CSS.supports('color', 'var(--test)')) {
  // Use CSS custom properties
} else {
  // Fallback to static colors
}
```

### Progressive Enhancement

- Core functionality works without JavaScript
- Enhanced features layer on top
- Fallbacks for unsupported features

## Performance Optimization

### File Size Management

- Embedded CSS and JavaScript (no external dependencies)
- Minified code in production builds
- Optimized image assets and icons
- Efficient DOM manipulation

### Loading Performance

```html
<!-- Critical CSS inline -->
<style>
  .visualization-container {
    /* critical styles */
  }
</style>

<!-- Deferred JavaScript -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    // Initialize interactive features
  });
</script>
```

### Memory Management

- Event listener cleanup
- Efficient color calculations
- Minimal DOM queries
- Garbage collection friendly patterns

## Best Practices

### Color Accessibility

1. **Always test contrast ratios** against WCAG standards
2. **Provide alternative indicators** beyond color alone
3. **Test with color vision deficiency simulators**
4. **Include accessibility information** in visualizations

### Interactive Design

1. **Provide clear visual feedback** for all interactions
2. **Ensure keyboard navigation** works intuitively
3. **Include helpful tooltips** and descriptions
4. **Test with screen readers** regularly

### Performance

1. **Keep HTML files under 2MB** for fast loading
2. **Use efficient CSS selectors** and avoid deep nesting
3. **Minimize JavaScript execution** on page load
4. **Test on mobile devices** and slow connections

### Documentation

1. **Include usage examples** for all features
2. **Document accessibility features** clearly
3. **Provide troubleshooting guides** for common issues
4. **Keep examples up to date** with latest features

## Examples

### Complete Color Wheel Example

```json
{
  "tool": "create_color_wheel_html",
  "parameters": {
    "type": "hsl",
    "size": 500,
    "interactive": true,
    "show_harmony": true,
    "harmony_type": "triadic",
    "highlight_colors": ["#e74c3c", "#f39c12", "#3498db"],
    "theme": "light"
  }
}
```

### Advanced Gradient Preview

```json
{
  "tool": "create_gradient_html",
  "parameters": {
    "gradient_css": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "preview_shapes": ["rectangle", "circle", "text", "button", "card"],
    "size": [600, 400],
    "show_css_code": true,
    "interactive_controls": true,
    "variations": true,
    "theme": "dark"
  }
}
```

### Comprehensive Theme Preview

```json
{
  "tool": "create_theme_preview_html",
  "parameters": {
    "theme_colors": {
      "primary": "#2563eb",
      "secondary": "#64748b",
      "background": "#ffffff",
      "surface": "#f8fafc",
      "text": "#1e293b",
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#ef4444"
    },
    "preview_type": "dashboard",
    "components": [
      "header",
      "sidebar",
      "content",
      "footer",
      "buttons",
      "forms",
      "cards"
    ],
    "interactive": true,
    "responsive": true,
    "theme": "light"
  }
}
```

## Troubleshooting

### Common Issues

#### Colors Not Displaying Correctly

- Verify color format is supported (HEX, RGB, HSL)
- Check for typos in color values
- Ensure proper CSS color syntax

#### Keyboard Navigation Not Working

- Verify `tabindex` attributes are present
- Check that JavaScript is enabled
- Test focus indicators are visible

#### Copy-to-Clipboard Failing

- Ensure HTTPS context for modern clipboard API
- Test fallback method in older browsers
- Check for JavaScript errors in console

#### Accessibility Issues

- Run automated accessibility tests
- Test with screen readers
- Verify color contrast ratios
- Check keyboard-only navigation

### Performance Issues

#### Large File Sizes

- Reduce number of colors in palette
- Minimize embedded assets
- Use efficient CSS and JavaScript

#### Slow Loading

- Test on slower connections
- Optimize image assets
- Minimize DOM complexity

This guide provides comprehensive coverage of the advanced HTML visualization features. For additional help, refer to the API documentation or create an issue in the project repository.
