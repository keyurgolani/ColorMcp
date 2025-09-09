# Check Contrast - Use Case 3: Large Text Heading Compliance

## Scenario

Content designer verifying dark gray headings on white background for large text.

## Input Parameters

```json
{
  "foreground": "#1F2937",
  "background": "#FFFFFF",
  "standard": "WCAG_AA",
  "text_size": "large"
}
```

## Output

```json
{
  "success": true,
  "data": {
    "contrast_ratio": 14.68,
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

- Exceptional contrast ratio of 14.68:1
- Exceeds both AA and AAA requirements for large text
- Perfect for headings and important content
