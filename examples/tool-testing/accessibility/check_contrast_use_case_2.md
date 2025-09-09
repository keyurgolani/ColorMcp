# Check Contrast - Use Case 2: Secondary Text AAA Compliance

## Scenario

Designer checking if gray secondary text meets strict WCAG AAA standards.

## Input Parameters

```json
{
  "foreground": "#6B7280",
  "background": "#F9FAFB",
  "standard": "WCAG_AAA",
  "text_size": "normal"
}
```

## Output

```json
{
  "success": true,
  "data": {
    "contrast_ratio": 4.63,
    "compliance": {
      "wcag_aa": true,
      "wcag_aaa": false,
      "passes": false
    },
    "recommendations": [
      "This color combination does not meet accessibility standards"
    ]
  }
}
```

## Key Insights

- Meets WCAG AA (4.5:1) but fails AAA (7:1) requirements
- Suitable for most applications but not for high-accessibility needs
- Consider darker gray (#4B5563) for AAA compliance
