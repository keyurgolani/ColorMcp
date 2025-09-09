# Simulate Colorblindness - Use Case 3: Blue Palette for Tritanopia

## Scenario

Brand designer testing blue-based color palette for tritanopia (blue-blind) users.

## Input Parameters

```json
{
  "colors": ["#3B82F6", "#8B5CF6", "#06B6D4"],
  "type": "tritanopia",
  "severity": 100
}
```

## Output

```json
{
  "data": {
    "results": [
      {
        "original_color": "#3B82F6",
        "simulated_color": "#41cec9",
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#8B5CF6",
        "simulated_color": "#89c5c0",
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#06B6D4",
        "simulated_color": "#2fc8c6",
        "accessibility_impact": "moderate"
      }
    ],
    "summary": {
      "colors_affected": 3,
      "average_difference": 64.75
    }
  }
}
```

## Key Insights

- Blue and purple become cyan/teal colors
- Cyan remains relatively stable
- Blue-based palettes problematic for tritanopia users
