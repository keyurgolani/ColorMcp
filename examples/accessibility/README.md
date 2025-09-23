# Accessibility Examples

This section demonstrates accessibility tools that help ensure colors meet WCAG standards and are usable by people with color vision deficiencies.

## Available Tools

- **check_contrast** - Verify WCAG contrast compliance
- **simulate_colorblindness** - Show how colors appear to users with color vision deficiencies
- **optimize_for_accessibility** - Automatically adjust colors for better accessibility

## Examples

### WCAG Contrast Checking

**Tool Call:**

```json
{
  "tool": "check_contrast",
  "parameters": {
    "foreground": "#2563eb",
    "background": "#ffffff",
    "standard": "WCAG_AA"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "foreground": "#2563eb",
    "background": "#ffffff",
    "contrast_ratio": 5.17,
    "text_size": "normal",
    "standard": "WCAG_AA",
    "compliance": {
      "wcag_aa": true,
      "wcag_aaa": false,
      "passes": true
    },
    "recommendations": ["Good contrast - meets AA standards"]
  },
  "metadata": {
    "execution_time": 0,
    "tool": "check_contrast",
    "timestamp": "2025-09-23T02:20:12.293Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "accessibility_notes": [],
    "accessibilityNotes": [],
    "recommendations": ["Good contrast - meets AA standards"]
  }
}
```

### Color Blindness Simulation

**Tool Call:**

```json
{
  "tool": "simulate_colorblindness",
  "parameters": {
    "colors": ["#FF0000", "#00FF00", "#0000FF"],
    "type": "protanopia",
    "severity": 100
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deficiency_type": "protanopia",
    "severity": 100,
    "results": [
      {
        "original_color": "#FF0000",
        "simulated_color": "#c5c400",
        "difference_score": 96.34,
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#00FF00",
        "simulated_color": "#aeb086",
        "difference_score": 96.03,
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#0000FF",
        "simulated_color": "#0000e1",
        "difference_score": 12.54,
        "accessibility_impact": "minimal"
      }
    ],
    "summary": {
      "total_colors": 3,
      "colors_affected": 3,
      "average_difference": 68.31,
      "accessibility_concerns": [
        "3 out of 3 colors are significantly affected",
        "High overall color distortion detected"
      ]
    },
    "recommendations": [
      "2 colors are severely affected by protanopia",
      "Consider using alternative colors with better differentiation",
      "Avoid red-green color combinations",
      "Use blue and yellow for better differentiation",
      "Consider using high-contrast color schemes",
      "Test with actual users who have color vision deficiencies",
      "Use text labels or icons in addition to color coding",
      "Ensure sufficient contrast ratios for text readability"
    ]
  },
  "metadata": {
    "execution_time": null,
    "tool": "simulate_colorblindness",
    "timestamp": "2025-09-23T02:23:08.524Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "accessibility_notes": [
      "3 colors show significant changes for protanopia users",
      "Consider using alternative color combinations for better accessibility"
    ],
    "accessibilityNotes": [
      "3 colors show significant changes for protanopia users",
      "Consider using alternative color combinations for better accessibility"
    ],
    "recommendations": [
      "2 colors are severely affected by protanopia",
      "Consider using alternative colors with better differentiation",
      "Avoid red-green color combinations",
      "Use blue and yellow for better differentiation",
      "Consider using high-contrast color schemes"
    ]
  }
}
```

## Key Features

### Contrast Checking

- **WCAG Standards**: Supports AA and AAA compliance levels
- **Text Size Consideration**: Different requirements for normal vs large text
- **Precise Ratios**: Calculates exact contrast ratios
- **Pass/Fail Results**: Clear compliance status

### Color Blindness Simulation

- **Multiple Types**: Protanopia, deuteranopia, tritanopia, and more
- **Severity Levels**: Adjustable severity from 0-100%
- **Impact Assessment**: Categorizes impact as minimal, moderate, or severe
- **Difference Scoring**: Quantifies how much colors change
- **Comprehensive Recommendations**: Specific suggestions for improvement

## Understanding Results

### Contrast Ratios

- **4.5:1** - WCAG AA minimum for normal text
- **3:1** - WCAG AA minimum for large text
- **7:1** - WCAG AAA minimum for normal text
- **4.5:1** - WCAG AAA minimum for large text

### Color Vision Deficiency Types

- **Protanopia** - Red color blindness (affects ~1% of men)
- **Deuteranopia** - Green color blindness (affects ~1% of men)
- **Tritanopia** - Blue color blindness (very rare)
- **Protanomaly** - Reduced red sensitivity
- **Deuteranomaly** - Reduced green sensitivity (most common)
- **Tritanomaly** - Reduced blue sensitivity

## Best Practices

1. **Test Early**: Check accessibility during design phase
2. **Multiple Methods**: Don't rely solely on color to convey information
3. **High Contrast**: Aim for contrast ratios above minimum requirements
4. **User Testing**: Test with actual users who have color vision deficiencies
5. **Alternative Indicators**: Use text, icons, or patterns alongside color
