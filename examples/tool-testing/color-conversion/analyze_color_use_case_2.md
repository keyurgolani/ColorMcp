# Analyze Color - Use Case 2: Dark Theme Color Comparison

## Scenario

Designer comparing dark background with light text for optimal contrast in dark theme.

## Input Parameters

```json
{
  "color": "#1E293B",
  "compare_color": "#F8FAFC"
}
```

## Output

```json
{
  "data": {
    "analysis": {
      "brightness": {
        "perceived_brightness": 40,
        "brightness_category": "very_dark"
      },
      "temperature": {
        "temperature": "cool",
        "hue_category": "blue",
        "kelvin_approximation": 6500
      },
      "accessibility": {
        "wcag_aa_normal": true,
        "wcag_aaa_normal": true,
        "color_blind_safe": true
      },
      "distance": {
        "cie2000": 41.83,
        "perceptual_difference": "very_different"
      }
    },
    "summary": {
      "overall_score": 100,
      "strengths": ["Excellent contrast", "Color-blind friendly"]
    }
  }
}
```

## Key Insights

- Perfect color combination for dark themes
- Excellent accessibility compliance
- High perceptual difference ensures readability
