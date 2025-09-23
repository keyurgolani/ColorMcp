# Accessibility Guide for MCP Color Server

## Overview

The MCP Color Server provides comprehensive accessibility tools to ensure your color choices meet modern accessibility standards and work for users with various visual abilities. This guide covers all accessibility features and best practices.

## Accessibility Standards Supported

### WCAG (Web Content Accessibility Guidelines)

- **WCAG 2.1 AA**: Standard accessibility level (4.5:1 contrast for normal text, 3:1 for large text)
- **WCAG 2.1 AAA**: Enhanced accessibility level (7:1 contrast for normal text, 4.5:1 for large text)

### APCA (Advanced Perceptual Contrast Algorithm)

- **Modern Standard**: More perceptually accurate contrast measurement
- **Context-Aware**: Different thresholds based on text size and weight
- **Future-Proof**: Designed for modern displays and typography

### Color Vision Deficiency Support

- **Protanopia**: Missing L-cones (red-blind) - affects ~1% of males
- **Deuteranopia**: Missing M-cones (green-blind) - affects ~1% of males
- **Tritanopia**: Missing S-cones (blue-blind) - affects ~0.003% of population
- **Protanomaly**: Reduced L-cone sensitivity - affects ~1% of males
- **Deuteranomaly**: Reduced M-cone sensitivity - affects ~5% of males
- **Tritanomaly**: Reduced S-cone sensitivity - affects ~0.01% of population
- **Monochromacy**: Complete color blindness - affects ~0.003% of population

## Accessibility Tools

### 1. Contrast Checking (`check_contrast`)

Check if color combinations meet accessibility standards.

```json
{
  "tool": "check_contrast",
  "parameters": {
    "foreground": "#2563eb",
    "background": "#ffffff",
    "text_size": "normal",
    "standard": "WCAG_AA"
  }
}
```

**Response includes:**

- WCAG AA/AAA compliance status
- Exact contrast ratio
- APCA score (when using APCA standard)
- Alternative color suggestions
- Accessibility recommendations

**Best Practices:**

- Always test text/background combinations
- Use "large" text size for headings and large UI elements
- Consider WCAG AAA for critical content
- Test with APCA for modern applications

### 2. Colorblind Simulation (`simulate_colorblindness`)

See how colors appear to users with color vision deficiencies.

```json
{
  "tool": "simulate_colorblindness",
  "parameters": {
    "colors": ["#ff0000", "#00ff00", "#0000ff"],
    "type": "protanopia",
    "severity": 100
  }
}
```

**Supported Types:**

- `protanopia`: Red-blind (missing L-cones)
- `deuteranopia`: Green-blind (missing M-cones)
- `tritanopia`: Blue-blind (missing S-cones)
- `protanomaly`: Red-weak (reduced L-cones)
- `deuteranomaly`: Green-weak (reduced M-cones)
- `tritanomaly`: Blue-weak (reduced S-cones)
- `monochromacy`: Complete color blindness

**Response includes:**

- Simulated colors for each input
- Difference scores (how much colors change)
- Accessibility impact assessment
- Type-specific recommendations

**Best Practices:**

- Test with deuteranopia (most common type)
- Check critical color combinations
- Use severity parameter to test partial deficiencies
- Never rely solely on color to convey information

### 3. Accessibility Optimization (`optimize_for_accessibility`)

Automatically improve colors for better accessibility compliance.

```json
{
  "tool": "optimize_for_accessibility",
  "parameters": {
    "palette": ["#ff6b6b", "#4ecdc4", "#45b7d1"],
    "use_cases": ["text", "background", "accent"],
    "target_standard": "WCAG_AA",
    "preserve_hue": true,
    "preserve_brand_colors": ["#ff6b6b"]
  }
}
```

**Use Cases:**

- `text`: Optimize for text readability
- `background`: Optimize for background usage
- `accent`: Optimize for accent/highlight colors
- `interactive`: Optimize for buttons and interactive elements

**Response includes:**

- Optimized colors for each use case
- Detailed change descriptions
- Contrast improvement metrics
- Recommended color pairings
- Compliance rate improvements

**Best Practices:**

- Specify accurate use cases for better optimization
- Use `preserve_hue: true` to maintain brand identity
- Preserve critical brand colors when necessary
- Review optimized colors in context

## Accessibility Workflow

### 1. Initial Assessment

Start by checking your current color palette:

```json
// Check contrast for key combinations
{
  "tool": "check_contrast",
  "parameters": {
    "foreground": "#your-text-color",
    "background": "#your-bg-color",
    "standard": "WCAG_AA"
  }
}

// Simulate colorblindness
{
  "tool": "simulate_colorblindness",
  "parameters": {
    "colors": ["#color1", "#color2", "#color3"],
    "type": "deuteranopia"
  }
}
```

### 2. Identify Issues

Look for:

- ❌ Contrast ratios below 4.5:1 (normal text) or 3:1 (large text)
- ❌ Colors that become indistinguishable when simulating colorblindness
- ❌ Red/green combinations for protanopia/deuteranopia
- ❌ Blue/yellow combinations for tritanopia

### 3. Optimize Colors

Use the optimization tool to fix issues:

```json
{
  "tool": "optimize_for_accessibility",
  "parameters": {
    "palette": ["#problematic-color1", "#problematic-color2"],
    "use_cases": ["text", "background"],
    "target_standard": "WCAG_AA",
    "preserve_hue": true
  }
}
```

### 4. Verify Improvements

Re-test optimized colors:

```json
// Verify contrast improvements
{
  "tool": "check_contrast",
  "parameters": {
    "foreground": "#optimized-text-color",
    "background": "#optimized-bg-color",
    "standard": "WCAG_AA"
  }
}

// Verify colorblind accessibility
{
  "tool": "simulate_colorblindness",
  "parameters": {
    "colors": ["#optimized-color1", "#optimized-color2"],
    "type": "deuteranopia"
  }
}
```

## Common Accessibility Issues and Solutions

### Issue: Low Contrast Text

**Problem:** Light gray text on white background

```
Foreground: #CCCCCC
Background: #FFFFFF
Contrast: 1.6:1 ❌
```

**Solution:** Darken the text color

```
Foreground: #666666
Background: #FFFFFF
Contrast: 5.7:1 ✅
```

### Issue: Red/Green Color Coding

**Problem:** Using red and green to indicate status

```
Success: #00FF00 (green)
Error: #FF0000 (red)
Issue: Indistinguishable for red/green colorblind users
```

**Solution:** Add additional visual cues

```
Success: #00AA00 (darker green) + checkmark icon
Error: #CC0000 (darker red) + X icon
Alternative: Use blue/orange combination
```

### Issue: Insufficient Color Differentiation

**Problem:** Similar colors for different categories

```
Category A: #4A90E2
Category B: #5BA0F2
Issue: Too similar, especially for colorblind users
```

**Solution:** Increase color distance

```
Category A: #2563EB (blue)
Category B: #DC2626 (red)
Alternative: Use patterns or shapes in addition to color
```

## Advanced Accessibility Techniques

### 1. Multi-Modal Design

Don't rely solely on color:

- **Icons**: Add icons to color-coded elements
- **Patterns**: Use patterns or textures
- **Typography**: Use font weight or style variations
- **Spacing**: Use whitespace to create visual hierarchy

### 2. Progressive Enhancement

Design for accessibility first:

1. Start with high contrast black/white design
2. Add colors that maintain accessibility
3. Test with colorblind simulation
4. Verify with real users when possible

### 3. Context-Aware Optimization

Different contexts need different approaches:

**Data Visualization:**

- Use colorblind-safe palettes
- Provide alternative views (patterns, labels)
- Ensure sufficient contrast between adjacent colors

**UI Components:**

- Focus on interactive element visibility
- Maintain brand colors where possible
- Optimize for touch targets and hover states

**Content:**

- Prioritize text readability
- Use semantic color meanings consistently
- Provide high contrast mode options

## Testing Checklist

### ✅ Contrast Testing

- [ ] All text meets WCAG AA standards (4.5:1 normal, 3:1 large)
- [ ] Interactive elements have sufficient contrast
- [ ] Focus indicators are clearly visible
- [ ] Error states are distinguishable

### ✅ Colorblind Testing

- [ ] Test with protanopia simulation
- [ ] Test with deuteranopia simulation
- [ ] Test with tritanopia simulation
- [ ] Verify information is conveyed without color alone

### ✅ Real-World Testing

- [ ] Test on different devices and screens
- [ ] Test in different lighting conditions
- [ ] Get feedback from users with visual impairments
- [ ] Use automated accessibility testing tools

## APCA vs WCAG Guidelines

### When to Use WCAG

- **Legal Compliance**: Required for government and public websites
- **Established Standard**: Widely recognized and tested
- **Conservative Approach**: Ensures broad compatibility

### When to Use APCA

- **Modern Applications**: Better for current display technology
- **Perceptual Accuracy**: More aligned with human vision
- **Future-Proofing**: Likely to become the next standard

### Comparison Example

```
Colors: #767676 text on #FFFFFF background

WCAG 2.1 AA: 4.54:1 ✅ (passes)
APCA: Lc 68.5 ✅ (passes for most text)

Colors: #949494 text on #FFFFFF background

WCAG 2.1 AA: 2.8:1 ❌ (fails)
APCA: Lc 58.2 ⚠️ (marginal, depends on text size)
```

## Resources and References

### Standards Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [APCA Documentation](https://github.com/Myndex/SAPC-APCA)
- [Color Universal Design](https://jfly.uni-koeln.de/color/)

### Testing Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [Sim Daltonism](https://michelf.ca/projects/sim-daltonism/) (macOS)

### Color Palettes

- [Colorbrewer](https://colorbrewer2.org/) - Colorblind-safe palettes
- [Viz Palette](https://projects.susielu.com/viz-palette) - Data visualization colors
- [Accessible Colors](https://accessible-colors.com/) - WCAG compliant color generator

## Best Practices Summary

1. **Test Early and Often**: Check accessibility throughout the design process
2. **Use Multiple Indicators**: Don't rely on color alone
3. **Consider Context**: Different use cases need different approaches
4. **Preserve Brand Identity**: Balance accessibility with brand requirements
5. **Get Real Feedback**: Test with actual users when possible
6. **Stay Updated**: Accessibility standards and tools continue to evolve
7. **Document Decisions**: Keep track of accessibility choices and rationale
8. **Educate Teams**: Ensure everyone understands accessibility importance

Remember: Accessibility benefits everyone, not just users with disabilities. Good color accessibility creates better user experiences for all users across different devices, lighting conditions, and contexts.
