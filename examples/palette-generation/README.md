# Palette Generation Examples

This section demonstrates palette generation tools that create harmonious color combinations based on color theory principles.

## Available Harmony Types

- **monochromatic** - Variations of a single hue
- **analogous** - Adjacent colors on the color wheel
- **complementary** - Opposite colors on the color wheel
- **triadic** - Three evenly spaced colors
- **tetradic** - Four colors forming a rectangle
- **split_complementary** - Base color plus two adjacent to its complement
- **double_complementary** - Two pairs of complementary colors

## Examples

### Complementary Harmony Palette

**Tool Call:**

```json
{
  "tool": "generate_harmony_palette",
  "parameters": {
    "base_color": "#2563eb",
    "harmony_type": "complementary",
    "count": 5,
    "variation": 15
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "palette": [
      {
        "index": 0,
        "hex": "#2563eb",
        "rgb": {
          "r": 37,
          "g": 99,
          "b": 235,
          "a": 1
        },
        "hsl": {
          "h": 221,
          "s": 83,
          "l": 53,
          "a": 1
        },
        "hsv": {
          "h": 221,
          "s": 84,
          "v": 92,
          "a": 1
        },
        "metadata": {
          "brightness": 96,
          "temperature": "cool",
          "accessibility": {
            "contrastRatio": 5.168555560022562,
            "wcagAA": true,
            "wcagAAA": false,
            "colorBlindSafe": true
          }
        }
      },
      {
        "index": 1,
        "hex": "#ebac24",
        "rgb": {
          "r": 235,
          "g": 172,
          "b": 36,
          "a": 1
        },
        "hsl": {
          "h": 41,
          "s": 83,
          "l": 53,
          "a": 1
        },
        "hsv": {
          "h": 41,
          "s": 85,
          "v": 92,
          "a": 1
        },
        "metadata": {
          "brightness": 175,
          "temperature": "warm",
          "accessibility": {
            "contrastRatio": 10.458918041600818,
            "wcagAA": true,
            "wcagAAA": true,
            "colorBlindSafe": false
          }
        }
      },
      {
        "index": 2,
        "hex": "#1d66e9",
        "rgb": {
          "r": 29,
          "g": 102,
          "b": 233,
          "a": 1
        },
        "hsl": {
          "h": 218,
          "s": 82,
          "l": 51,
          "a": 1
        },
        "hsv": {
          "h": 218,
          "s": 88,
          "v": 91,
          "a": 1
        },
        "metadata": {
          "brightness": 95,
          "temperature": "cool",
          "accessibility": {
            "contrastRatio": 5.085448773328555,
            "wcagAA": true,
            "wcagAAA": false,
            "colorBlindSafe": true
          }
        }
      },
      {
        "index": 3,
        "hex": "#eca827",
        "rgb": {
          "r": 236,
          "g": 168,
          "b": 39,
          "a": 1
        },
        "hsl": {
          "h": 39,
          "s": 84,
          "l": 54,
          "a": 1
        },
        "hsv": {
          "h": 39,
          "s": 83,
          "v": 93,
          "a": 1
        },
        "metadata": {
          "brightness": 174,
          "temperature": "warm",
          "accessibility": {
            "contrastRatio": 10.196922804707475,
            "wcagAA": true,
            "wcagAAA": true,
            "colorBlindSafe": false
          }
        }
      },
      {
        "index": 4,
        "hex": "#2463e9",
        "rgb": {
          "r": 36,
          "g": 99,
          "b": 233,
          "a": 1
        },
        "hsl": {
          "h": 221,
          "s": 82,
          "l": 53,
          "a": 1
        },
        "hsv": {
          "h": 221,
          "s": 85,
          "v": 91,
          "a": 1
        },
        "metadata": {
          "brightness": 95,
          "temperature": "cool",
          "accessibility": {
            "contrastRatio": 5.202671145605413,
            "wcagAA": true,
            "wcagAAA": false,
            "colorBlindSafe": true
          }
        }
      }
    ],
    "metadata": {
      "type": "harmony",
      "baseColor": "#2563eb",
      "harmonyType": "complementary",
      "algorithm": "complementary_harmony",
      "diversity": 36,
      "harmonyScore": 60,
      "accessibilityScore": 14,
      "relationships": [
        {
          "fromIndex": 0,
          "toIndex": 1,
          "relationship": "complementary",
          "strength": 1,
          "angle": 180
        }
      ],
      "generationTime": 0,
      "color_count": 5,
      "harmony_description": "Uses colors that are opposite each other on the color wheel"
    },
    "relationships": [
      {
        "fromIndex": 0,
        "toIndex": 1,
        "relationship": "complementary",
        "strength": 1,
        "angle": 180
      }
    ],
    "scores": {
      "diversity": 36,
      "harmony": 60,
      "accessibility": 14
    }
  },
  "metadata": {
    "execution_time": 0,
    "tool": "generate_harmony_palette",
    "timestamp": "2025-09-23T02:19:59.153Z",
    "color_space_used": "HSL",
    "accessibility_notes": ["This palette may have accessibility concerns"],
    "recommendations": [
      "Consider adjusting colors for better contrast ratios",
      "Consider increasing variation for more diverse palette",
      "Some colors may not perfectly follow color theory principles",
      "Use the base and complement colors for high contrast elements"
    ]
  },
  "export_formats": {
    "css": ":root {\n  --color-1: #2563eb;\n  --color-2: #ebac24;\n  --color-3: #1d66e9;\n  --color-4: #eca827;\n  --color-5: #2463e9;\n}",
    "scss": "$color-1: #2563eb;\n$color-2: #ebac24;\n$color-3: #1d66e9;\n$color-4: #eca827;\n$color-5: #2463e9;",
    "tailwind": "module.exports = {\n  theme: {\n    extend: {\n      colors: {\n    'palette-1': '#2563eb',\n    'palette-2': '#ebac24',\n    'palette-3': '#1d66e9',\n    'palette-4': '#eca827',\n    'palette-5': '#2463e9',\n      }\n    }\n  }\n}",
    "json": {
      "colors": [
        {
          "index": 0,
          "hex": "#2563eb",
          "rgb": {
            "r": 37,
            "g": 99,
            "b": 235,
            "a": 1
          },
          "hsl": {
            "h": 221,
            "s": 83,
            "l": 53,
            "a": 1
          },
          "hsv": {
            "h": 221,
            "s": 84,
            "v": 92,
            "a": 1
          },
          "metadata": {
            "brightness": 96,
            "temperature": "cool",
            "accessibility": {
              "contrastRatio": 5.168555560022562,
              "wcagAA": true,
              "wcagAAA": false,
              "colorBlindSafe": true
            }
          }
        }
      ]
    }
  }
}
```

## Key Features

- **Color Theory Based**: Palettes follow established color harmony principles
- **Comprehensive Metadata**: Each color includes brightness, temperature, and accessibility data
- **Relationship Analysis**: Shows how colors relate to each other (complementary, analogous, etc.)
- **Accessibility Scoring**: Evaluates the palette for WCAG compliance
- **Multiple Export Formats**: CSS, SCSS, Tailwind, and JSON formats included
- **Harmony Scoring**: Quantifies how well the palette follows color theory
- **Diversity Metrics**: Measures color variation within the palette
