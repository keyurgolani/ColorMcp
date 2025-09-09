# Analyze Color - Use Case 3: Success State Color Evaluation

## Scenario

Product designer evaluating a green color for success states and notifications.

## Input Parameters

```json
{
  "color": "#10B981"
}
```

## Output

```json
{
  "data": {
    "analysis": {
      "brightness": {
        "perceived_brightness": 128,
        "brightness_category": "medium"
      },
      "temperature": {
        "temperature": "cool",
        "hue_category": "green-cyan",
        "kelvin_approximation": 5000
      },
      "accessibility": {
        "wcag_aa_normal": true,
        "wcag_aaa_normal": true,
        "color_blind_safe": true
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

- Perfect for success states and positive feedback
- Color-blind safe ensures universal accessibility
- Cool temperature conveys trust and reliability
