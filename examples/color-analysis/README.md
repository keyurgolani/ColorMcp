# Color Analysis Examples

This section demonstrates the `analyze_color` tool, which provides comprehensive analysis of color properties including brightness, temperature, contrast, and accessibility metrics.

## Available Analysis Types

- **brightness** - Perceived brightness and luminance calculations
- **temperature** - Color temperature (warm/cool) analysis
- **contrast** - Contrast ratios against common backgrounds
- **accessibility** - WCAG compliance and color-blind safety

## Examples

### Comprehensive Color Analysis

**Tool Call:**

```json
{
  "tool": "analyze_color",
  "parameters": {
    "color": "#FF6B35",
    "analysis_types": ["brightness", "temperature", "accessibility"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "color": "#FF6B35",
    "analysis": {
      "brightness": {
        "perceived_brightness": 145,
        "relative_luminance": 0.32032431593305644,
        "brightness_category": "medium",
        "is_light": true
      },
      "temperature": {
        "temperature": "warm",
        "hue_category": "red",
        "kelvin_approximation": 1900,
        "warmth_score": 1
      },
      "contrast": {
        "against_white": 2.84,
        "against_black": 7.41,
        "best_contrast": 7.41,
        "best_background": "black"
      },
      "accessibility": {
        "wcag_aa_normal": true,
        "wcag_aa_large": true,
        "wcag_aaa_normal": true,
        "wcag_aaa_large": true,
        "color_blind_safe": false,
        "recommendations": [
          "This color may be difficult for color-blind users to distinguish"
        ]
      }
    },
    "summary": {
      "overall_score": 80,
      "primary_issues": [
        "May be problematic for color-blind users",
        "Medium brightness may limit contrast options"
      ],
      "strengths": ["Excellent contrast for text", "Clear warm temperature"]
    }
  },
  "metadata": {
    "execution_time": 0,
    "tool": "analyze_color",
    "timestamp": "2025-09-23T02:19:55.296Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "accessibility_notes": ["May be difficult for color-blind users"],
    "accessibilityNotes": ["May be difficult for color-blind users"],
    "recommendations": [
      "This color may be difficult for color-blind users to distinguish",
      "This warm color works well for energetic, friendly designs"
    ]
  }
}
```

## Key Features

- **Perceived Brightness**: Calculates how bright a color appears to human vision
- **Relative Luminance**: Technical luminance measurement for accessibility calculations
- **Color Temperature**: Determines if a color is warm or cool with Kelvin approximation
- **Contrast Analysis**: Shows contrast ratios against white and black backgrounds
- **Accessibility Assessment**: WCAG compliance checking and color-blind safety evaluation
- **Overall Scoring**: Provides a comprehensive score with strengths and issues identified

## Understanding the Results

### Brightness Analysis

- **perceived_brightness**: 0-255 scale of how bright the color appears
- **relative_luminance**: 0-1 scale used for contrast calculations
- **brightness_category**: "light", "medium", or "dark"
- **is_light**: Boolean indicating if the color is considered light

### Temperature Analysis

- **temperature**: "warm" or "cool" classification
- **hue_category**: Color family (red, orange, yellow, green, blue, purple)
- **kelvin_approximation**: Approximate color temperature in Kelvin
- **warmth_score**: -1 (cool) to 1 (warm) numeric score

### Accessibility Analysis

- **wcag_aa_normal**: Meets WCAG AA for normal text (4.5:1 ratio)
- **wcag_aa_large**: Meets WCAG AA for large text (3:1 ratio)
- **wcag_aaa_normal**: Meets WCAG AAA for normal text (7:1 ratio)
- **wcag_aaa_large**: Meets WCAG AAA for large text (4.5:1 ratio)
- **color_blind_safe**: Safe for users with color vision deficiencies

##

# Dark Color Analysis

**Tool Call:**

```json
{
  "tool": "analyze_color",
  "parameters": {
    "color": "#1a1a1a",
    "analysis_types": ["brightness", "contrast"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "color": "#1a1a1a",
    "analysis": {
      "brightness": {
        "perceived_brightness": 26,
        "relative_luminance": 0.010329823029626936,
        "brightness_category": "very_dark",
        "is_light": false
      },
      "temperature": {
        "temperature": "warm",
        "hue_category": "red",
        "kelvin_approximation": 1900,
        "warmth_score": 1
      },
      "contrast": {
        "against_white": 17.4,
        "against_black": 1.21,
        "best_contrast": 17.4,
        "best_background": "white"
      },
      "accessibility": {
        "wcag_aa_normal": true,
        "wcag_aa_large": true,
        "wcag_aaa_normal": true,
        "wcag_aaa_large": true,
        "color_blind_safe": true,
        "recommendations": []
      }
    },
    "summary": {
      "overall_score": 100,
      "primary_issues": [],
      "strengths": [
        "Excellent contrast for text",
        "Color-blind friendly",
        "High contrast potential"
      ]
    }
  },
  "metadata": {
    "execution_time": 0,
    "tool": "analyze_color",
    "timestamp": "2025-09-23T02:21:53.943Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "accessibility_notes": [],
    "accessibilityNotes": [],
    "recommendations": [
      "Consider using white or light text on this background",
      "This warm color works well for energetic, friendly designs"
    ]
  }
}
```

### Bright Green Analysis (All Analysis Types)

**Tool Call:**

```json
{
  "tool": "analyze_color",
  "parameters": {
    "color": "#00ff00",
    "analysis_types": ["all"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "color": "#00ff00",
    "analysis": {
      "brightness": {
        "perceived_brightness": 150,
        "relative_luminance": 0.7152,
        "brightness_category": "medium",
        "is_light": true
      },
      "temperature": {
        "temperature": "neutral",
        "hue_category": "yellow-green",
        "kelvin_approximation": 4000,
        "warmth_score": 0
      },
      "contrast": {
        "against_white": 1.37,
        "against_black": 15.3,
        "best_contrast": 15.3,
        "best_background": "black"
      },
      "accessibility": {
        "wcag_aa_normal": true,
        "wcag_aa_large": true,
        "wcag_aaa_normal": true,
        "wcag_aaa_large": true,
        "color_blind_safe": false,
        "recommendations": [
          "This color may be difficult for color-blind users to distinguish"
        ]
      }
    },
    "summary": {
      "overall_score": 80,
      "primary_issues": [
        "May be problematic for color-blind users",
        "Medium brightness may limit contrast options"
      ],
      "strengths": ["Excellent contrast for text"]
    }
  },
  "metadata": {
    "execution_time": 0,
    "tool": "analyze_color",
    "timestamp": "2025-09-23T02:21:58.168Z",
    "color_space_used": "sRGB",
    "colorSpaceUsed": "sRGB",
    "accessibility_notes": ["May be difficult for color-blind users"],
    "accessibilityNotes": ["May be difficult for color-blind users"],
    "recommendations": [
      "This color may be difficult for color-blind users to distinguish"
    ]
  }
}
```

## Practical Applications

- **UI Design**: Analyze colors for optimal contrast and accessibility
- **Brand Colors**: Evaluate brand colors for various use cases
- **Color Accessibility**: Ensure colors meet WCAG guidelines
- **Color Psychology**: Understand the temperature and emotional impact of colors
- **Design Systems**: Create comprehensive color analysis for design tokens
