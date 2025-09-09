# Check Contrast - Use Case 1: Button Text Accessibility

## Scenario

Web developer checking if white text on blue button meets WCAG AA standards.

## Input Parameters

```json
{
  "foreground": "#FFFFFF",
  "background": "#2563EB",
  "standard": "WCAG_AA",
  "text_size": "normal"
}
```

## Output

```json
{
  "success": true,
  "data": {
    "contrast_ratio": 5.17,
    "compliance": {
      "wcag_aa": true,
      "wcag_aaa": false,
      "passes": true
    },
    "recommendations": ["Good contrast - meets AA standards"]
  }
}
```

## Practical Application

```css
.primary-button {
  background-color: #2563eb;
  color: #ffffff; /* 5.17:1 contrast ratio - WCAG AA compliant */
}
```

## Key Insights

- Contrast ratio of 5.17:1 exceeds WCAG AA requirement (4.5:1)
- Safe for normal text size
- Doesn't meet AAA standards (7:1) but AA is sufficient for most use cases
