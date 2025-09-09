# Generate Harmony Palette - Use Case 1: Brand Identity Complementary Colors

## Scenario

Brand designer creating a complementary color palette for a tech startup's visual identity.

## Input Parameters

```json
{
  "base_color": "#2563EB",
  "harmony_type": "complementary",
  "count": 5,
  "variation": 20
}
```

## Output

```json
{
  "success": true,
  "data": {
    "palette": [
      { "hex": "#2563eb", "temperature": "cool" },
      { "hex": "#ebac24", "temperature": "warm" },
      { "hex": "#1856ea", "temperature": "cool" },
      { "hex": "#e9b323", "temperature": "warm" },
      { "hex": "#3168ec", "temperature": "cool" }
    ],
    "metadata": {
      "harmonyType": "complementary",
      "diversity": 36,
      "harmonyScore": 60,
      "accessibilityScore": 15
    }
  },
  "export_formats": {
    "css": ":root {\n  --color-1: #2563eb;\n  --color-2: #ebac24;\n  --color-3: #1856ea;\n  --color-4: #e9b323;\n  --color-5: #3168ec;\n}",
    "tailwind": "module.exports = {\n  theme: {\n    extend: {\n      colors: {\n    'palette-1': '#2563eb',\n    'palette-2': '#ebac24'\n      }\n    }\n  }\n}"
  }
}
```

## Key Insights

- Perfect blue-orange complementary relationship
- High contrast for dynamic brand presence
- Ready-to-use CSS and Tailwind exports
