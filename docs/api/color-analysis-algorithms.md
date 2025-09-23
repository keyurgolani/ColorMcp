# Color Analysis Algorithms Documentation

## Overview

The MCP Color Server implements comprehensive color analysis algorithms to provide detailed insights about color properties, accessibility compliance, and perceptual characteristics. This document describes the mathematical formulas and algorithms used in the color analysis system.

## Brightness Analysis

### Perceived Brightness Formula

The perceived brightness calculation uses the standard luminance formula that accounts for human visual perception:

```
Perceived Brightness = 0.299 × R + 0.587 × G + 0.114 × B
```

Where R, G, B are the red, green, and blue components (0-255).

**Rationale**: This formula reflects the human eye's different sensitivity to different colors. Green contributes most to perceived brightness (58.7%), red contributes moderately (29.9%), and blue contributes least (11.4%).

### Relative Luminance (WCAG Standard)

For accessibility calculations, we use the WCAG relative luminance formula:

```
L = 0.2126 × R + 0.7152 × G + 0.0722 × B
```

Where R, G, B are gamma-corrected values:

- If RsRGB ≤ 0.03928: R = RsRGB / 12.92
- If RsRGB > 0.03928: R = ((RsRGB + 0.055) / 1.055)^2.4

And RsRGB = R_8bit / 255

### Brightness Categories

Colors are categorized based on perceived brightness:

- **Very Dark**: 0-50 (0-20%)
- **Dark**: 51-101 (20-40%)
- **Medium**: 102-152 (40-60%)
- **Light**: 153-203 (60-80%)
- **Very Light**: 204-255 (80-100%)

## Color Temperature Analysis

### Hue-Based Classification

Color temperature is determined by hue ranges in the HSL color space:

| Hue Range | Temperature | Color Category | Kelvin Approximation     |
| --------- | ----------- | -------------- | ------------------------ |
| 0°-30°    | Warm        | Red            | 1900K (Candlelight)      |
| 30°-60°   | Warm        | Orange         | 2700K (Incandescent)     |
| 60°-90°   | Neutral     | Yellow         | 3000K (Warm White)       |
| 90°-150°  | Neutral     | Yellow-Green   | 4000K (Cool White)       |
| 150°-210° | Cool        | Green-Cyan     | 5000K (Daylight)         |
| 210°-270° | Cool        | Blue           | 6500K (Cool Daylight)    |
| 270°-330° | Cool        | Purple         | 7000K (Cool Daylight)    |
| 330°-360° | Warm        | Magenta-Red    | 2000K (Warm Candlelight) |

### Warmth Score

The warmth score is a normalized value from -1 (coolest) to +1 (warmest):

- Red (0°): +1.0 (Maximum warm)
- Orange (30°): +0.8
- Yellow (60°): +0.3
- Green (120°): 0.0 (Neutral)
- Cyan (180°): -0.5
- Blue (240°): -1.0 (Maximum cool)
- Purple (270°): -0.7
- Magenta (300°): +0.9

## Contrast Analysis

### WCAG Contrast Ratio Formula

The contrast ratio between two colors is calculated using:

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
```

Where:

- L1 is the relative luminance of the lighter color
- L2 is the relative luminance of the darker color
- 0.05 is added to prevent division by zero

### WCAG Compliance Standards

| Standard | Normal Text | Large Text |
| -------- | ----------- | ---------- |
| WCAG AA  | 4.5:1       | 3.0:1      |
| WCAG AAA | 7.0:1       | 4.5:1      |

**Large Text Definition**: 18pt+ regular or 14pt+ bold text

## Color Distance Algorithms

### CIE76 Delta E (Simple Euclidean)

The simplest color difference formula using Euclidean distance in LAB space:

```
ΔE*76 = √[(L2-L1)² + (a2-a1)² + (b2-b1)²]
```

### CIE94 Delta E (Improved)

An improved formula with weighting factors:

```
ΔE*94 = √[(ΔL/kL×SL)² + (ΔC/kC×SC)² + (ΔH/kH×SH)²]
```

Where:

- SL = 1
- SC = 1 + K1×C1
- SH = 1 + K2×C1
- K1 = 0.045, K2 = 0.015
- kL = kC = kH = 1 (for graphic arts)

### CIE2000 Delta E (Most Accurate)

The most sophisticated color difference formula (simplified implementation):

```
ΔE*00 = √[(ΔL'/kL×SL)² + (ΔC'/kC×SC)² + (ΔH'/kH×SH)² + RT×(ΔC'/kC×SC)×(ΔH'/kH×SH)]
```

This formula includes rotation terms and additional corrections for improved accuracy.

### Perceptual Difference Interpretation

| Delta E Range | Perceptual Difference |
| ------------- | --------------------- |
| 0-1           | Identical             |
| 1-2.3         | Very Similar          |
| 2.3-5         | Similar               |
| 5-10          | Different             |
| 10+           | Very Different        |

## Accessibility Analysis

### Color Blind Safety Assessment

Colors are evaluated for color vision deficiency safety based on:

1. **Hue Range Analysis**: Colors in red-green ranges (0°-60° and 90°-150°) are flagged as potentially problematic
2. **Saturation Consideration**: Low saturation colors (<30%) are generally safer
3. **Lightness Extremes**: Very light (>80%) or very dark (<20%) colors are safer due to brightness differences

### Accessibility Recommendations

The system generates contextual recommendations based on:

- Contrast ratio results
- Color blind safety assessment
- Brightness characteristics
- Temperature properties

## Performance Characteristics

### Optimization Strategies

1. **Caching**: Frequently calculated values (luminance, LAB conversion) are cached
2. **Lazy Evaluation**: Complex calculations only performed when requested
3. **Efficient Algorithms**: Optimized mathematical operations for speed

### Performance Targets

- Simple analysis (brightness, temperature): <50ms
- Complete analysis with comparison: <100ms
- Batch analysis (5+ colors): <300ms total
- Memory usage: <10MB per analysis

## Use Cases and Applications

### Design System Creation

- Evaluate color harmony and accessibility
- Generate semantic color mappings
- Ensure WCAG compliance across themes

### Brand Color Analysis

- Assess brand color accessibility
- Analyze color temperature for brand personality
- Generate complementary color suggestions

### Data Visualization

- Select colors with sufficient perceptual distance
- Ensure accessibility for color-blind users
- Optimize contrast for different backgrounds

### Educational Applications

- Demonstrate color theory principles
- Teach accessibility best practices
- Visualize color relationships

## Mathematical Accuracy

All algorithms are implemented with high precision:

- Floating-point calculations use double precision
- Rounding only applied to final output values
- Intermediate calculations maintain full precision
- Results validated against known color standards

## References

1. WCAG 2.1 Guidelines - Web Content Accessibility Guidelines
2. CIE Standards - International Commission on Illumination
3. Sharma, G., Wu, W., & Dalal, E. N. (2005). The CIEDE2000 color‐difference formula
4. Hunt, R. W. G. (2004). The Reproduction of Colour
5. Fairchild, M. D. (2013). Color Appearance Models
