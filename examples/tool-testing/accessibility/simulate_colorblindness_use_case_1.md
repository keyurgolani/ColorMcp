# Simulate Colorblindness - Use Case 1: Primary Color Accessibility

## Scenario

Designer testing how primary RGB colors appear to users with protanopia (red-blind).

## Input Parameters

```json
{
  "colors": ["#FF0000", "#00FF00", "#0000FF"],
  "type": "protanopia",
  "severity": 100
}
```

## Output

```json
{
  "success": true,
  "data": {
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
      "colors_affected": 3,
      "average_difference": 68.31,
      "accessibility_concerns": ["High overall color distortion detected"]
    }
  }
}
```

## Key Insights

- Red and green are severely affected (96%+ difference)
- Blue remains largely unchanged (12% difference)
- Avoid red-green combinations for protanopia users
