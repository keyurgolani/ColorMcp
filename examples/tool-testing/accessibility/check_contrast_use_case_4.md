# Check Contrast - Use Case 4: Error Message Accessibility Issues

## Scenario

UX designer discovering accessibility issues with red error text on light red background.

## Input Parameters

```json
{
  "foreground": "#EF4444",
  "background": "#FEF2F2",
  "standard": "WCAG_AA",
  "text_size": "normal"
}
```

## Output

```json
{
  "success": true,
  "data": {
    "contrast_ratio": 3.44,
    "compliance": {
      "wcag_aa": false,
      "wcag_aaa": false,
      "passes": false
    },
    "alternative_combinations": {
      "foreground_adjustments": [
        { "color": "#5e0808", "contrast_ratio": 12.68, "passes": true },
        { "color": "#8d0c0c", "contrast_ratio": 8.76, "passes": true }
      ]
    }
  }
}
```

## Key Insights

- Fails WCAG AA with only 3.44:1 contrast ratio
- Tool provides alternative color suggestions
- Darker red (#5e0808) would provide excellent contrast (12.68:1)
