# Simulate Colorblindness - Use Case 4: Mild Protanomaly Traffic Light Colors

## Scenario

Traffic system designer testing red/green/yellow colors for mild protanomaly (partial red-blindness).

## Input Parameters

```json
{
  "colors": ["#DC2626", "#16A34A", "#CA8A04"],
  "type": "protanomaly",
  "severity": 50
}
```

## Output

```json
{
  "data": {
    "results": [
      {
        "original_color": "#DC2626",
        "simulated_color": "#c57e26",
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#16A34A",
        "simulated_color": "#538d5b",
        "accessibility_impact": "moderate"
      },
      {
        "original_color": "#CA8A04",
        "simulated_color": "#be9f35",
        "accessibility_impact": "moderate"
      }
    ],
    "summary": {
      "colors_affected": 3,
      "average_difference": 30.89
    }
  }
}
```

## Key Insights

- Even mild protanomaly (50%) significantly affects red
- Red becomes orange-brown, harder to distinguish
- Position and shape cues essential for traffic systems
