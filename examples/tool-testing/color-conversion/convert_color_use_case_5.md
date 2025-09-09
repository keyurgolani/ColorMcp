# Convert Color - Use Case 5: Tailwind CSS Integration

## Scenario

Frontend developer converting named colors to Tailwind CSS classes for utility-first styling.

## Input Parameters

```json
{
  "color": "coral",
  "output_format": "tailwind"
}
```

## Output

```json
{
  "data": {
    "original": "coral",
    "converted": "orange-300",
    "format": "tailwind",
    "detected_format": "named"
  }
}
```

## Practical Application

```html
<div class="bg-orange-300 text-gray-800">
  Coral-colored background using Tailwind
</div>
```

## Key Insights

- Named color "coral" maps to Tailwind's orange-300 class
- Perfect for utility-first CSS frameworks
- Excellent accessibility (WCAG AAA compliant)
