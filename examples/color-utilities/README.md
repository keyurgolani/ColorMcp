# Color Utilities Examples

This section demonstrates utility tools for color manipulation, mixing, and analysis.

## Available Utilities

- **mix_colors** - Blend multiple colors with custom ratios
- **generate_color_variations** - Create tints, shades, and tones
- **sort_colors** - Sort colors by various properties
- **analyze_color_collection** - Analyze groups of colors

## Examples

### Color Mixing

**Tool Call:**

```json
{
  "tool": "mix_colors",
  "parameters": {
    "colors": ["#ff0000", "#0000ff"],
    "ratios": [0.7, 0.3],
    "blend_mode": "normal"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "mixed_color": {
      "hex": "#b3004d",
      "rgb": {
        "r": 179,
        "g": 0,
        "b": 77,
        "a": 1
      },
      "hsl": {
        "h": 334,
        "s": 100,
        "l": 35,
        "a": 1
      },
      "hsv": {
        "h": 334,
        "s": 100,
        "v": 70,
        "a": 1
      }
    },
    "input_colors": ["#ff0000", "#0000ff"],
    "ratios": [0.7, 0.3],
    "blend_mode": "normal",
    "color_space": "rgb",
    "mixing_details": {
      "total_colors": 2,
      "effective_ratios": [0.7, 0.3],
      "color_space_used": "rgb",
      "blend_mode_used": "normal"
    }
  },
  "metadata": {
    "execution_time": 0,
    "tool": "mix_colors",
    "timestamp": "2025-09-23T02:24:31.973Z",
    "color_space_used": "rgb",
    "colorSpaceUsed": "rgb",
    "accessibility_notes": [
      "Mixed color has good contrast against white backgrounds"
    ],
    "accessibilityNotes": [
      "Mixed color has good contrast against white backgrounds"
    ],
    "recommendations": []
  }
}
```

### Color Variations (Tints)

**Tool Call:**

```json
{
  "tool": "generate_color_variations",
  "parameters": {
    "base_color": "#3498db",
    "variation_type": "tints",
    "steps": 5
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "base_color": {
      "hex": "#3498db",
      "rgb": "rgb(52, 152, 219)",
      "hsl": "hsl(204, 70%, 53%)",
      "hsv": "hsv(204, 76%, 86%)"
    },
    "variation_type": "tints",
    "variations": [
      {
        "hex": "#3398db",
        "rgb": "rgb(51, 152, 219)",
        "hsl": "hsl(204, 70%, 53%)",
        "hsv": "hsv(204, 77%, 86%)",
        "step": 1,
        "factor": 0
      },
      {
        "hex": "#4da5e0",
        "rgb": "rgb(77, 165, 224)",
        "hsl": "hsl(204, 70%, 59%)",
        "hsv": "hsv(204, 66%, 88%)",
        "step": 2,
        "factor": 0.125
      },
      {
        "hex": "#66b2e4",
        "rgb": "rgb(102, 178, 228)",
        "hsl": "hsl(204, 70%, 65%)",
        "hsv": "hsv(204, 55%, 89%)",
        "step": 3,
        "factor": 0.25
      },
      {
        "hex": "#80bfe9",
        "rgb": "rgb(128, 191, 233)",
        "hsl": "hsl(204, 70%, 71%)",
        "hsv": "hsv(204, 45%, 91%)",
        "step": 4,
        "factor": 0.375
      },
      {
        "hex": "#99cbed",
        "rgb": "rgb(153, 203, 237)",
        "hsl": "hsl(204, 70%, 77%)",
        "hsv": "hsv(204, 35%, 93%)",
        "step": 5,
        "factor": 0.5
      }
    ],
    "total_variations": 5,
    "analysis": {
      "count": 5,
      "lightness_range": {
        "min": 53,
        "max": 77
      },
      "saturation_range": {
        "min": 70,
        "max": 70
      },
      "accessibility_compliant": 5
    },
    "generation_details": {
      "steps": 5,
      "intensity": 50,
      "total_variations": 5,
      "variation_type": "tints"
    }
  },
  "metadata": {
    "execution_time": 0,
    "tool": "generate_color_variations",
    "timestamp": "2025-09-23T02:24:36.328Z",
    "color_space_used": "hsl",
    "colorSpaceUsed": "hsl",
    "accessibility_notes": [
      "Tints (lighter variations) are good for backgrounds and subtle accents"
    ],
    "accessibilityNotes": [
      "Tints (lighter variations) are good for backgrounds and subtle accents"
    ],
    "recommendations": [
      "Use tints for backgrounds, shades for text, and tones for subtle variations"
    ]
  },
  "export_formats": {
    "css": "--color-tints-1: #3398db;\n--color-tints-2: #4da5e0;\n--color-tints-3: #66b2e4;\n--color-tints-4: #80bfe9;\n--color-tints-5: #99cbed;",
    "scss": "$color-tints-1: #3398db;\n$color-tints-2: #4da5e0;\n$color-tints-3: #66b2e4;\n$color-tints-4: #80bfe9;\n$color-tints-5: #99cbed;",
    "json": {
      "base_color": "#3498db",
      "variation_type": "tints",
      "variations": ["#3398db", "#4da5e0", "#66b2e4", "#80bfe9", "#99cbed"]
    }
  }
}
```

## Key Features

### Color Mixing

- **Custom Ratios**: Precise control over mixing proportions
- **Blend Modes**: Multiple blend modes (normal, multiply, screen, etc.)
- **Color Space Options**: Mix in RGB, HSL, LAB, or LCH color spaces
- **Multiple Colors**: Mix 2-10 colors simultaneously

### Color Variations

- **Tints**: Lighter variations by adding white
- **Shades**: Darker variations by adding black
- **Tones**: Muted variations by adding gray
- **All**: Generate all three variation types

### Blend Modes

- **normal** - Standard color mixing
- **multiply** - Darkening blend
- **screen** - Lightening blend
- **overlay** - Contrast enhancement
- **color_burn** - Intense darkening
- **color_dodge** - Intense lightening

## Understanding Variations

### Tints (Adding White)

- Create lighter, more pastel versions
- Good for backgrounds and subtle accents
- Maintain hue while increasing lightness

### Shades (Adding Black)

- Create darker, more intense versions
- Good for text and strong accents
- Maintain hue while decreasing lightness

### Tones (Adding Gray)

- Create muted, sophisticated versions
- Good for subtle design elements
- Reduce saturation while maintaining balance

## Practical Applications

- **Design Systems**: Create consistent color scales
- **Brand Extensions**: Generate variations of brand colors
- **UI States**: Create hover, active, and disabled states
- **Color Harmonies**: Mix complementary colors for new options
- **Accessibility**: Generate variations that meet contrast requirements
