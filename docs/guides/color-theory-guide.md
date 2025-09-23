# Color Theory Guide for MCP Color Server

## Introduction

This guide provides comprehensive information about color theory principles implemented in the MCP Color Server's harmony palette generation system. Understanding these concepts will help you create more effective and visually appealing color schemes.

## Color Harmony Types

### 1. Monochromatic Harmony

**Definition**: Uses variations of a single hue with different saturation and lightness values.

**Characteristics**:

- Same hue across all colors
- Variations in saturation (intensity) and lightness (brightness)
- Creates a cohesive, elegant appearance
- Low contrast but high harmony

**Best Use Cases**:

- Minimalist designs
- Professional presentations
- Backgrounds and subtle interfaces
- When you want a calm, unified look

**Example**:

```json
{
  "base_color": "#3366CC",
  "harmony_type": "monochromatic",
  "count": 5,
  "variation": 30
}
```

**Generated Colors** (approximate):

- `#1A4D99` (darker, less saturated)
- `#2659B3` (darker)
- `#3366CC` (base)
- `#4D7FD9` (lighter)
- `#6699E6` (lighter, more saturated)

**Tips**:

- Add accent colors from other harmony types for visual interest
- Use high contrast monochromatic pairs for text and backgrounds
- Vary lightness more than saturation for better accessibility

---

### 2. Analogous Harmony

**Definition**: Uses colors that are adjacent to each other on the color wheel (typically within 30-60 degrees).

**Characteristics**:

- Colors share similar hue families
- Natural, harmonious appearance
- Low contrast between colors
- Creates smooth transitions

**Best Use Cases**:

- Nature-inspired designs
- Gradients and smooth transitions
- Calming, serene interfaces
- Landscape and organic themes

**Example**:

```json
{
  "base_color": "#FF6600",
  "harmony_type": "analogous",
  "count": 4,
  "variation": 20
}
```

**Generated Colors** (approximate):

- `#FF6600` (base - orange)
- `#FF8800` (yellow-orange)
- `#FF4400` (red-orange)
- `#FFAA00` (yellow)

**Color Theory Math**:

- Base hue: 24° (orange)
- Analogous range: ±30° to ±60°
- Colors at: 24°, 44°, 4°, 54°

**Tips**:

- Use one color as dominant, others as accents
- Great for creating depth and dimension
- Combine with neutral colors for balance

---

### 3. Complementary Harmony

**Definition**: Uses colors that are opposite each other on the color wheel (180 degrees apart).

**Characteristics**:

- Maximum contrast and visual impact
- Colors enhance each other's intensity
- Can be vibrant and energetic
- Risk of visual tension if not balanced

**Best Use Cases**:

- Call-to-action buttons
- High-impact graphics
- Sports and energy brands
- When you need maximum contrast

**Example**:

```json
{
  "base_color": "#FF0000",
  "harmony_type": "complementary",
  "count": 3,
  "variation": 15
}
```

**Generated Colors** (approximate):

- `#FF0000` (base - red, 0°)
- `#00FFFF` (complement - cyan, 180°)
- `#FF3333` (red variation)

**Color Theory Math**:

- Red hue: 0°
- Complement: 0° + 180° = 180° (cyan)
- Perfect mathematical opposition

**Tips**:

- Use one color as dominant (60%), complement as accent (10%)
- Add neutral colors to balance the intensity
- Great for creating focal points

---

### 4. Triadic Harmony

**Definition**: Uses three colors evenly spaced around the color wheel (120 degrees apart).

**Characteristics**:

- Balanced and vibrant
- High contrast while maintaining harmony
- Dynamic and energetic appearance
- Naturally pleasing to the eye

**Best Use Cases**:

- Playful, energetic designs
- Children's products
- Creative and artistic projects
- Balanced, dynamic interfaces

**Example**:

```json
{
  "base_color": "#FF0000",
  "harmony_type": "triadic",
  "count": 3,
  "variation": 10
}
```

**Generated Colors** (approximate):

- `#FF0000` (red, 0°)
- `#00FF00` (green, 120°)
- `#0000FF` (blue, 240°)

**Color Theory Math**:

- Base: 0° (red)
- Second: 0° + 120° = 120° (green)
- Third: 0° + 240° = 240° (blue)
- Perfect RGB primary triad

**Tips**:

- Use one color as primary, others as accents
- Adjust saturation and lightness for better balance
- Classic choice for logos and branding

---

### 5. Tetradic (Rectangle) Harmony

**Definition**: Uses four colors arranged in two complementary pairs (90 degrees apart).

**Characteristics**:

- Rich color palette with many possibilities
- Two sets of complementary relationships
- Can be overwhelming if not balanced
- Offers great flexibility

**Best Use Cases**:

- Complex designs with multiple elements
- Rich, sophisticated color schemes
- When you need many distinct colors
- Advanced design projects

**Example**:

```json
{
  "base_color": "#FF0000",
  "harmony_type": "tetradic",
  "count": 4,
  "variation": 5
}
```

**Generated Colors** (approximate):

- `#FF0000` (red, 0°)
- `#80FF00` (yellow-green, 90°)
- `#00FFFF` (cyan, 180°)
- `#8000FF` (purple, 270°)

**Color Theory Math**:

- Base: 0°
- Colors at: 0°, 90°, 180°, 270°
- Two complementary pairs: (0°, 180°) and (90°, 270°)

**Tips**:

- Choose one color as dominant
- Use complementary pairs for contrast
- Balance warm and cool colors

---

### 6. Split-Complementary Harmony

**Definition**: Uses a base color and two colors adjacent to its complement (typically 150° and 210° from base).

**Characteristics**:

- Softer than pure complementary
- Still provides good contrast
- More nuanced and sophisticated
- Easier to balance than complementary

**Best Use Cases**:

- Sophisticated designs
- When complementary is too harsh
- Professional and elegant interfaces
- Balanced contrast needs

**Example**:

```json
{
  "base_color": "#FF0000",
  "harmony_type": "split_complementary",
  "count": 3,
  "variation": 0
}
```

**Generated Colors** (approximate):

- `#FF0000` (red, 0°)
- `#00FF80` (spring green, 150°)
- `#0080FF` (azure, 210°)

**Color Theory Math**:

- Base: 0° (red)
- Complement would be: 180° (cyan)
- Split at: 180° - 30° = 150° and 180° + 30° = 210°

**Tips**:

- More versatile than pure complementary
- Use base color as dominant
- Split colors work well as accents

---

### 7. Double-Complementary Harmony

**Definition**: Uses two pairs of complementary colors, creating a rich four-color palette.

**Characteristics**:

- Very rich and complex
- Multiple contrast relationships
- Requires careful balance
- Offers maximum color variety

**Best Use Cases**:

- Complex, rich designs
- Artistic and creative projects
- When maximum color variety is needed
- Advanced color schemes

**Example**:

```json
{
  "base_color": "#FF0000",
  "harmony_type": "double_complementary",
  "count": 4,
  "variation": 25
}
```

**Generated Colors** (approximate):

- `#FF0000` (red, 0°)
- `#00FFFF` (cyan, 180°) - first complement
- `#FF8000` (orange, 30°) - second base
- `#0080FF` (blue, 210°) - second complement

**Tips**:

- Use one complementary pair as dominant
- Balance warm and cool colors
- Consider using variations rather than pure complements

---

## Color Wheel Mathematics

### Hue Calculations

The color wheel is based on 360 degrees:

- **Red**: 0° (or 360°)
- **Yellow**: 60°
- **Green**: 120°
- **Cyan**: 180°
- **Blue**: 240°
- **Magenta**: 300°

### Harmony Angle Calculations

```javascript
// Complementary
complement = (baseHue + 180) % 360;

// Triadic
color2 = (baseHue + 120) % 360;
color3 = (baseHue + 240) % 360;

// Tetradic
color2 = (baseHue + 90) % 360;
color3 = (baseHue + 180) % 360;
color4 = (baseHue + 270) % 360;

// Split-Complementary
complement = (baseHue + 180) % 360;
split1 = (complement - 30 + 360) % 360;
split2 = (complement + 30) % 360;

// Analogous (±30° range)
analogous1 = (baseHue - 30 + 360) % 360;
analogous2 = (baseHue + 30) % 360;
```

## Practical Application Guidelines

### Choosing the Right Harmony

1. **Monochromatic**: When you want elegance and simplicity
2. **Analogous**: For natural, calming effects
3. **Complementary**: For high impact and contrast
4. **Triadic**: For balanced energy and vibrancy
5. **Tetradic**: For complex, rich designs
6. **Split-Complementary**: For sophisticated contrast
7. **Double-Complementary**: For maximum variety

### Balancing Color Palettes

#### The 60-30-10 Rule

- **60%**: Dominant color (usually neutral or base)
- **30%**: Secondary color (supporting color)
- **10%**: Accent color (for highlights and calls-to-action)

#### Saturation and Lightness Considerations

- **High Saturation**: Use sparingly for accents
- **Medium Saturation**: Good for main interface elements
- **Low Saturation**: Excellent for backgrounds and large areas
- **Light Colors**: Good for backgrounds and spacious feeling
- **Dark Colors**: Good for text and creating depth

### Accessibility Considerations

#### WCAG Contrast Requirements

- **Normal Text**: 4.5:1 contrast ratio (AA), 7:1 (AAA)
- **Large Text**: 3:1 contrast ratio (AA), 4.5:1 (AAA)

#### Color Blind Considerations

- Don't rely solely on color to convey information
- Test with color blindness simulators
- Use patterns, textures, or labels alongside color
- Avoid problematic combinations (red/green for most common color blindness)

## Advanced Techniques

### Variation Parameters

The `variation` parameter (0-100) affects:

- **Hue variation**: Slight shifts in hue for more natural palettes
- **Saturation variation**: Different intensities for depth
- **Lightness variation**: Different brightness levels for hierarchy

### Palette Scoring

The system calculates three scores:

1. **Diversity Score (0-100)**:
   - Measures color variety in the palette
   - Higher scores indicate more diverse colors
   - Based on hue, saturation, and lightness differences

2. **Harmony Score (0-100)**:
   - Measures adherence to color theory principles
   - Higher scores indicate better theoretical compliance
   - Based on expected angle relationships

3. **Accessibility Score (0-100)**:
   - Measures potential accessibility compliance
   - Based on contrast ratios between colors
   - Higher scores indicate better accessibility potential

## Examples and Use Cases

### Web Design

```json
{
  "base_color": "#2563eb",
  "harmony_type": "split_complementary",
  "count": 5,
  "variation": 15
}
```

Perfect for professional websites with good contrast and sophistication.

### Mobile App

```json
{
  "base_color": "#10b981",
  "harmony_type": "analogous",
  "count": 4,
  "variation": 25
}
```

Great for nature or health apps with calming, organic feel.

### Brand Identity

```json
{
  "base_color": "#f59e0b",
  "harmony_type": "triadic",
  "count": 3,
  "variation": 10
}
```

Energetic and balanced for dynamic brands.

### Data Visualization

```json
{
  "base_color": "#3b82f6",
  "harmony_type": "tetradic",
  "count": 8,
  "variation": 20
}
```

Rich palette for complex charts and graphs.

## Troubleshooting Common Issues

### Palette Too Vibrant

- Reduce saturation of non-accent colors
- Increase lightness variation
- Use monochromatic or analogous harmony

### Palette Too Dull

- Increase saturation selectively
- Add complementary accent colors
- Use triadic or tetradic harmony

### Poor Accessibility

- Increase lightness contrast between colors
- Test with WCAG contrast checkers
- Consider monochromatic with high lightness variation

### Colors Don't Work Together

- Check if harmony type matches your needs
- Reduce variation parameter
- Consider split-complementary instead of complementary

## References and Further Reading

1. **Color Theory Fundamentals**: Johannes Itten's color wheel principles
2. **WCAG Guidelines**: Web Content Accessibility Guidelines 2.1
3. **Color Psychology**: Impact of colors on user perception and behavior
4. **Digital Color Spaces**: sRGB, Adobe RGB, and color management
5. **Cultural Color Meanings**: How colors are perceived across cultures

This guide provides the foundation for understanding and effectively using the MCP Color Server's harmony palette generation system. Experiment with different harmony types and parameters to discover what works best for your specific design needs.
