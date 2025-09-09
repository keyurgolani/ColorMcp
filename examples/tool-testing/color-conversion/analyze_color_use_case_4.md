# Analyze Color - Use Case 4: Warning State Color Analysis

## Scenario

UX designer analyzing an amber/orange color for warning messages and alerts.

## Input Parameters

```json
{
  "color": "#F59E0B"
}
```

## Output

```json
{
  "data": {
    "analysis": {
      "brightness": {
        "perceived_brightness": 167,
        "brightness_category": "light"
      },
      "temperature": {
        "temperature": "warm",
        "hue_category": "orange",
        "kelvin_approximation": 2700
      },
      "accessibility": {
        "wcag_aa_normal": true,
        "wcag_aaa_normal": true,
        "color_blind_safe": false
      }
    },
    "summary": {
      "overall_score": 90,
      "primary_issues": ["May be problematic for color-blind users"],
      "strengths": ["Excellent contrast", "Clear warm temperature"]
    }
  }
}
```

## Key Insights

- Excellent for warning states with high visibility
- Needs additional indicators for color-blind users
- Warm temperature conveys urgency appropriately
