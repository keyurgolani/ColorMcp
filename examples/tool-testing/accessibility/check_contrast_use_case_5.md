# Check Contrast - Use Case 5: Dark Theme Warning Text

## Scenario

Dark theme designer verifying yellow warning text on dark background meets accessibility standards.

## Input Parameters

```json
{
  "foreground": "#FBBF24",
  "background": "#1F2937",
  "standard": "WCAG_AA",
  "text_size": "normal"
}
```

## Output

```json
{
  "success": true,
  "data": {
    "contrast_ratio": 8.79,
    "compliance": {
      "wcag_aa": true,
      "wcag_aaa": true,
      "passes": true
    },
    "recommendations": ["Excellent contrast - meets AAA standards"]
  }
}
```

## Key Insights

- Outstanding contrast ratio of 8.79:1
- Exceeds both AA and AAA requirements
- Perfect for warning messages in dark themes
