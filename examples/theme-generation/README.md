# Theme Generation Examples

This section demonstrates tools for generating complete design system themes and semantic color mappings.

## Available Theme Tools

- **generate_theme** - Create complete design system themes
- **generate_semantic_colors** - Map colors to semantic UI roles

## Examples

### Complete Theme Generation

**Tool Call:**

```json
{
  "tool": "generate_theme",
  "parameters": {
    "theme_type": "light",
    "primary_color": "#2563eb",
    "style": "material"
  }
}
```

**Response:**

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
          "secondary": "#9f8fe6",
          "background": "#ffffff",
          "surface": "#fafafa",
          "text": "#1e293b",
          "text_secondary": "#64748b",
          "accent": "#f6ab09",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
          "info": "#3b82f6",
          "border": "#e0e0e0",
          "shadow": "rgba(0, 0, 0, 0.1)",
          "disabled": "#94a3b8",
          "hover": "#134cc9",
          "focus": "#0f5bff"
        },
        "accessibility_score": 100,
        "wcag_compliance": "AAA"
      }
    },
    "accessibility_report": {
      "overall_score": 100,
      "wcag_compliance": "AAA",
      "contrast_issues": [],
      "recommendations": []
    }
  },
  "metadata": {
    "execution_time": 0,
    "tool": "generate_theme",
    "timestamp": "2025-09-23T02:27:01.967Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "accessibility_notes": ["Theme meets WCAG AAA accessibility standards"],
    "accessibilityNotes": ["Theme meets WCAG AAA accessibility standards"],
    "recommendations": []
  }
}
```

### Semantic Color Mapping

**Tool Call:**

```json
{
  "tool": "generate_semantic_colors",
  "parameters": {
    "base_palette": ["#2563eb", "#10b981", "#f59e0b", "#ef4444"],
    "semantic_roles": ["primary", "success", "warning", "error"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "base_palette": ["#2563eb", "#10b981", "#f59e0b", "#ef4444"],
    "context": "web",
    "semantic_mapping": [
      {
        "role": "primary",
        "color": "#f59e0b",
        "adjusted": false,
        "contrast_ratio": 9.778071798962173,
        "accessibility_notes": ["Excellent contrast - meets AAA standards"],
        "usage_guidelines": [
          "Use for main actions, links, and brand elements",
          "Ensure sufficient contrast against backgrounds",
          "Consider hover and focus states"
        ]
      },
      {
        "role": "success",
        "color": "#10b981",
        "adjusted": false,
        "contrast_ratio": 8.278612383989437,
        "accessibility_notes": ["Excellent contrast - meets AAA standards"],
        "usage_guidelines": [
          "Use for positive feedback, confirmations, and success states",
          "Avoid using green alone - add icons or text"
        ]
      },
      {
        "role": "warning",
        "color": "#f59e0b",
        "adjusted": false,
        "contrast_ratio": 9.778071798962173,
        "accessibility_notes": ["Excellent contrast - meets AAA standards"],
        "usage_guidelines": [
          "Use for cautions, warnings, and attention-needed states",
          "Ensure visibility for colorblind users"
        ]
      },
      {
        "role": "error",
        "color": "#ef4444",
        "adjusted": false,
        "contrast_ratio": 5.58046438625577,
        "accessibility_notes": ["Good contrast - meets AA standards"],
        "usage_guidelines": [
          "Use for errors, failures, and destructive actions",
          "Must have high contrast for accessibility"
        ]
      }
    ],
    "accessibility_report": {
      "overall_compliance": "AAA",
      "contrast_issues": [],
      "adjustments_made": 0
    },
    "usage_recommendations": [
      "Test colors with actual content and backgrounds",
      "Consider colorblind users - use icons and text alongside colors",
      "Define hover and focus states for interactive elements",
      "Test across different devices and screen settings"
    ]
  },
  "metadata": {
    "execution_time": 1,
    "tool": "generate_semantic_colors",
    "timestamp": "2025-09-23T02:27:06.554Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "accessibility_notes": ["Semantic colors meet WCAG AAA standards"],
    "accessibilityNotes": ["Semantic colors meet WCAG AAA standards"],
    "recommendations": [
      "Test colors with actual content and backgrounds",
      "Consider colorblind users - use icons and text alongside colors",
      "Define hover and focus states for interactive elements"
    ]
  }
}
```

## Key Features

### Complete Theme Generation

- **Multiple Theme Types**: Light, dark, high contrast, colorblind-friendly
- **Design System Styles**: Material, iOS, Fluent, custom
- **Comprehensive Color Sets**: Primary, secondary, background, surface, text, etc.
- **Accessibility Compliance**: Automatic WCAG AA/AAA compliance
- **State Colors**: Hover, focus, disabled states included

### Semantic Color Mapping

- **Role-Based Assignment**: Maps colors to UI semantic roles
- **Context Awareness**: Optimized for web, mobile, desktop, print
- **Accessibility Validation**: Ensures contrast compliance
- **Usage Guidelines**: Specific recommendations for each color role
- **Automatic Adjustments**: Colors adjusted for accessibility when needed

## Theme Types

### Light Theme

- Bright backgrounds with dark text
- High contrast for readability
- Standard for most applications

### Dark Theme

- Dark backgrounds with light text
- Reduced eye strain in low light
- Modern aesthetic preference

### High Contrast

- Maximum contrast ratios
- Enhanced accessibility
- Meets WCAG AAA standards

### Colorblind Friendly

- Optimized for color vision deficiencies
- Uses patterns and shapes alongside color
- Tested with simulation tools

## Design System Styles

### Material Design

- Google's Material Design principles
- Elevation and shadow system
- Consistent with Android guidelines

### iOS/Human Interface

- Apple's design language
- Clean, minimal aesthetic
- Consistent with iOS guidelines

### Fluent Design

- Microsoft's design system
- Depth and motion emphasis
- Consistent with Windows guidelines

### Custom

- Flexible system for unique brands
- Customizable principles
- Adaptable to any design language

## Semantic Roles

### Primary Colors

- **primary** - Main brand color, primary actions
- **secondary** - Supporting brand color, secondary actions
- **accent** - Highlight color, call-to-action elements

### Feedback Colors

- **success** - Positive feedback, confirmations
- **warning** - Cautions, attention needed
- **error** - Errors, failures, destructive actions
- **info** - Information, neutral notifications

### Interface Colors

- **background** - Main background color
- **surface** - Card and component backgrounds
- **text** - Primary text color
- **text_secondary** - Secondary text, captions
- **border** - Borders and dividers
- **shadow** - Drop shadows and elevation

### State Colors

- **hover** - Hover state for interactive elements
- **focus** - Focus state for keyboard navigation
- **disabled** - Disabled state for inactive elements

## Accessibility Features

### WCAG Compliance

- **AA Standard**: 4.5:1 contrast for normal text, 3:1 for large text
- **AAA Standard**: 7:1 contrast for normal text, 4.5:1 for large text
- **Automatic Validation**: All generated colors tested for compliance
- **Adjustment Recommendations**: Suggestions for non-compliant colors

### Color Vision Deficiency Support

- **Simulation Testing**: Colors tested with CVD simulation
- **Alternative Indicators**: Recommendations for non-color indicators
- **Pattern Integration**: Suggestions for patterns and textures
- **High Contrast Options**: Enhanced contrast for better visibility

## Usage Guidelines

### Implementation

1. **Start with Primary**: Define your primary brand color
2. **Choose Theme Type**: Select light, dark, or high contrast
3. **Select Style**: Pick design system style (Material, iOS, etc.)
4. **Review Accessibility**: Check compliance scores and recommendations
5. **Test with Content**: Validate colors with actual UI content

### Best Practices

- Test themes with real content and users
- Provide theme switching options when possible
- Consider cultural color associations
- Maintain consistency across platforms
- Document color usage guidelines for your team

### Integration

- Export themes to your preferred format (CSS, SCSS, JSON)
- Use semantic names rather than color names
- Implement proper fallbacks for older browsers
- Test across different devices and screen settings
