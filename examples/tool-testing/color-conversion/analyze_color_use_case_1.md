# Analyze Color - Use Case 1: UI Design Color Assessment

## Scenario

UI designer evaluating a coral-red color for button design and accessibility compliance.

## Input Parameters

```json
{
  "color": "#FF6B6B"
}
```

## Output

```json
{
  "success": true,
  "data": {
    "analysis": {
      "brightness": {
        "perceived_brightness": 151,
        "relative_luminance": 0.328,
        "brightness_category": "medium",
        "is_light": true
      },
      "temperature": {
        "temperature": "warm",
        "hue_category": "red",
        "kelvin_approximation": 1900,
        "warmth_score": 1
      },
      "accessibility": {
        "wcag_aa_normal": true,
        "wcag_aa_large": true,
        "wcag_aaa_normal": true,
        "wcag_aaa_large": true,
        "color_blind_safe": false
      }
    },
    "summary": {
      "overall_score": 80,
      "primary_issues": ["May be problematic for color-blind users"],
      "strengths": ["Excellent contrast for text", "Clear warm temperature"]
    }
  }
}
```

## Key Insights

- Excellent WCAG compliance for text contrast
- Warm, energetic color suitable for call-to-action buttons
- Needs consideration for color-blind accessibility
