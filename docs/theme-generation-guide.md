# Theme Generation Guide

This guide covers the theme generation capabilities of the MCP Color Server, including complete design system theme generation and semantic color mapping.

## Overview

The MCP Color Server provides two main tools for theme generation:

1. **`generate_theme`** - Creates complete design system themes with light/dark variants
2. **`generate_semantic_colors`** - Maps colors to semantic roles for UI design

## Generate Theme Tool

### Basic Usage

```json
{
  "tool": "generate_theme",
  "parameters": {
    "theme_type": "light",
    "primary_color": "#2563eb"
  }
}
```

### Parameters

- **`theme_type`** (required): Type of theme to generate
  - `light` - Light theme variant
  - `dark` - Dark theme variant
  - `auto` - Both light and dark variants
  - `high_contrast` - High contrast theme for accessibility
  - `colorblind_friendly` - Optimized for color vision deficiencies

- **`primary_color`** (required): Primary brand color for the theme

- **`style`** (optional): Design system style
  - `material` (default) - Material Design style
  - `ios` - iOS Human Interface Guidelines
  - `fluent` - Microsoft Fluent Design
  - `custom` - Custom styling

- **`accessibility_level`** (optional): WCAG compliance level
  - `AA` (default) - WCAG AA standards
  - `AAA` - WCAG AAA standards

- **`brand_colors`** (optional): Additional brand colors to incorporate

### Response Structure

```json
{
  "success": true,
  "data": {
    "theme_type": "light",
    "style": "material",
    "primary_color": "#2563eb",
    "variants": {
      "light": {
        "name": "light",
        "colors": {
          "primary": "#2563eb",
          "secondary": "#64748b",
          "background": "#ffffff",
          "surface": "#f8fafc",
          "text": "#1e293b",
          "text_secondary": "#64748b",
          "accent": "#10b981",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
          "info": "#3b82f6",
          "border": "#e2e8f0",
          "shadow": "rgba(0, 0, 0, 0.1)",
          "disabled": "#94a3b8",
          "hover": "#1d4ed8",
          "focus": "#2563eb"
        },
        "accessibility_score": 95,
        "wcag_compliance": "AA"
      }
    },
    "accessibility_report": {
      "overall_score": 95,
      "wcag_compliance": "AA",
      "contrast_issues": [],
      "recommendations": []
    }
  }
}
```

### Theme Types

#### Light Theme

- Optimized for light backgrounds
- High contrast text on light surfaces
- Standard color relationships

#### Dark Theme

- Optimized for dark backgrounds
- Adjusted colors for dark mode viewing
- Maintains accessibility in low-light conditions

#### Auto Theme

- Generates both light and dark variants
- Consistent color relationships across themes
- Seamless theme switching support

#### High Contrast Theme

- Maximum contrast ratios for accessibility
- Black and white base colors
- Meets WCAG AAA standards

#### Colorblind Friendly Theme

- Avoids problematic color combinations
- Uses blue instead of green for success states
- Distinguishable for all color vision types

### Design Styles

#### Material Design

- Google Material Design principles
- Elevation-based shadows
- Standard Material color palette

#### iOS Style

- Apple Human Interface Guidelines
- iOS-specific color semantics
- Native iOS appearance

#### Fluent Design

- Microsoft Fluent Design System
- Windows-native styling
- Fluent color principles

## Generate Semantic Colors Tool

### Basic Usage

```json
{
  "tool": "generate_semantic_colors",
  "parameters": {
    "base_palette": ["#2563eb", "#10b981", "#f59e0b", "#ef4444"]
  }
}
```

### Parameters

- **`base_palette`** (required): Array of base colors to map to semantic roles

- **`semantic_roles`** (optional): Roles to generate colors for
  - Default: `['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral']`

- **`context`** (optional): Context for color usage
  - `web` (default) - Web applications
  - `mobile` - Mobile applications
  - `desktop` - Desktop applications
  - `print` - Print materials

- **`ensure_contrast`** (optional): Ensure WCAG contrast compliance (default: true)

- **`accessibility_level`** (optional): WCAG level to target (`AA` or `AAA`)

### Response Structure

```json
{
  "success": true,
  "data": {
    "base_palette": ["#2563eb", "#10b981", "#f59e0b", "#ef4444"],
    "context": "web",
    "semantic_mapping": [
      {
        "role": "primary",
        "color": "#2563eb",
        "adjusted": false,
        "contrast_ratio": 8.59,
        "accessibility_notes": ["Excellent contrast - meets AAA standards"],
        "usage_guidelines": [
          "Use for main actions, links, and brand elements",
          "Ensure sufficient contrast against backgrounds",
          "Consider hover and focus states"
        ]
      }
    ],
    "accessibility_report": {
      "overall_compliance": "AA",
      "contrast_issues": [],
      "adjustments_made": 0
    },
    "usage_recommendations": [
      "Test colors with actual content and backgrounds",
      "Consider colorblind users - use icons and text alongside colors"
    ]
  }
}
```

### Semantic Roles

#### Primary

- Main brand color
- Primary actions and CTAs
- Navigation elements

#### Secondary

- Supporting brand color
- Secondary actions
- Complementary elements

#### Success

- Positive feedback
- Confirmations
- Success states

#### Warning

- Cautions and alerts
- Attention-needed states
- Non-critical warnings

#### Error

- Error states
- Failures
- Destructive actions

#### Info

- Informational messages
- Neutral feedback
- Help content

#### Neutral

- Borders and dividers
- Subtle backgrounds
- Disabled states

### Context-Specific Behavior

#### Web Context

- Hover and focus state considerations
- Cross-browser compatibility
- Responsive design support

#### Mobile Context

- Touch-friendly interactions
- Light and dark mode support
- Various lighting conditions

#### Desktop Context

- Native platform integration
- Accessibility features
- High-resolution displays

#### Print Context

- Grayscale compatibility
- Ink cost considerations
- Paper color variations

## Accessibility Features

### WCAG Compliance

- Automatic contrast ratio checking
- AA and AAA standard support
- Accessibility score calculation

### Color Vision Deficiency Support

- Colorblind-friendly color selection
- Alternative visual indicators
- Distinguishable color combinations

### Contrast Optimization

- Automatic color adjustments
- Hue preservation when possible
- Alternative color suggestions

## Best Practices

### Theme Generation

1. Start with a strong primary color
2. Consider your target audience and accessibility needs
3. Test themes in actual UI contexts
4. Validate across different devices and lighting conditions

### Semantic Color Mapping

1. Provide a diverse base palette
2. Consider color psychology and cultural meanings
3. Test with colorblind users
4. Use additional visual indicators alongside color

### Accessibility

1. Always target at least WCAG AA compliance
2. Test with screen readers and assistive technologies
3. Provide alternative ways to convey information
4. Consider users with various visual abilities

## Integration Examples

### Design System Integration

```javascript
// Use generated theme in CSS custom properties
const theme = await generateTheme({
  theme_type: 'auto',
  primary_color: '#2563eb',
  style: 'material',
});

// Apply to CSS
const cssVars = Object.entries(theme.variants.light.colors)
  .map(([key, value]) => `--color-${key}: ${value};`)
  .join('\n');
```

### Component Library Integration

```javascript
// Map semantic colors to component props
const semanticColors = await generateSemanticColors({
  base_palette: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
  context: 'web',
});

// Use in React components
const Button = ({ variant = 'primary' }) => {
  const color = semanticColors.semantic_mapping.find(
    m => m.role === variant
  )?.color;

  return <button style={{ backgroundColor: color }}>Click me</button>;
};
```

## Troubleshooting

### Common Issues

#### Low Contrast Ratios

- Increase lightness difference between foreground and background
- Consider using darker or lighter variants
- Check against both light and dark backgrounds

#### Poor Color Harmony

- Ensure base palette has good color relationships
- Use color theory principles (complementary, analogous, etc.)
- Consider the emotional impact of color combinations

#### Accessibility Failures

- Target higher contrast ratios
- Avoid relying solely on color to convey information
- Test with actual users who have visual impairments

### Performance Considerations

- Theme generation typically completes in under 500ms
- Semantic color mapping completes in under 200ms
- Cache results when possible for production use
- Consider generating themes at build time for static sites

## Advanced Usage

### Custom Brand Integration

```json
{
  "tool": "generate_theme",
  "parameters": {
    "theme_type": "auto",
    "primary_color": "#2563eb",
    "brand_colors": ["#10b981", "#f59e0b", "#8b5cf6"],
    "style": "custom",
    "accessibility_level": "AAA"
  }
}
```

### Multi-Context Semantic Mapping

```json
{
  "tool": "generate_semantic_colors",
  "parameters": {
    "base_palette": ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    "semantic_roles": ["primary", "secondary", "success", "warning", "error"],
    "context": "mobile",
    "ensure_contrast": true,
    "accessibility_level": "AAA"
  }
}
```

This comprehensive theme generation system enables the creation of accessible, cohesive, and professional color schemes for any design system or application.
