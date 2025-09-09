# Simulate Colorblindness - Use Case 5: Complete Color Blindness (Monochromacy)

## Scenario

Accessibility specialist testing colorful data visualization for complete color blindness.

## Input Parameters

```json
{
  "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
  "type": "monochromacy",
  "severity": 100
}
```

## Output

```json
{
  "data": {
    "results": [
      {
        "original_color": "#FF6B6B",
        "simulated_color": "#9a9a9a",
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#4ECDC4",
        "simulated_color": "#bababa",
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#45B7D1",
        "simulated_color": "#a9a9a9",
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#96CEB4",
        "simulated_color": "#c2c2c2",
        "accessibility_impact": "moderate"
      }
    ],
    "summary": {
      "colors_affected": 4,
      "average_difference": 40.75
    }
  }
}
```

## Key Insights

- All colors become grayscale
- Brightness differences are the only distinguishing factor
- Patterns, textures, and labels essential for accessibility
