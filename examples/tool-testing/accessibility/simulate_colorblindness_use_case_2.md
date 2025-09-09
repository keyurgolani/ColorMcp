# Simulate Colorblindness - Use Case 2: UI State Colors for Deuteranopia

## Scenario

Product designer testing success/error/warning colors for deuteranopia (green-blind) users.

## Input Parameters

```json
{
  "colors": ["#10B981", "#EF4444", "#F59E0B"],
  "type": "deuteranopia",
  "severity": 100
}
```

## Output

```json
{
  "data": {
    "results": [
      {
        "original_color": "#10B981",
        "simulated_color": "#776c95",
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#EF4444",
        "simulated_color": "#c4ce44",
        "accessibility_impact": "severe"
      },
      {
        "original_color": "#F59E0B",
        "simulated_color": "#d9df5c",
        "accessibility_impact": "severe"
      }
    ],
    "summary": {
      "colors_affected": 3,
      "average_difference": 69.71
    }
  }
}
```

## Key Insights

- All semantic colors are severely affected
- Success green becomes purple-gray
- Error red becomes yellow-green
- Need alternative indicators beyond color
