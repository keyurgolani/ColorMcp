# Create Palette HTML - Use Case 1: Interactive Design System Showcase

## Scenario

Design system team creating an interactive showcase of their primary color palette for documentation.

## Input Parameters

```json
{
  "palette": ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
  "layout": "horizontal",
  "style": "swatches",
  "interactive": true,
  "show_values": true
}
```

## Output Features

- **Interactive Color Swatches**: Click to copy individual colors
- **Keyboard Navigation**: Arrow keys, Home/End navigation
- **Accessibility**: WCAG compliant with ARIA labels and screen reader support
- **Export Options**: Multiple format exports (HEX, RGB, HSL)
- **Responsive Design**: Mobile-friendly layout
- **Copy Functionality**: Individual colors and entire palette

## Key Features Generated

- Complete HTML5 document with embedded CSS and JavaScript
- Professional styling with CSS custom properties
- Keyboard accessibility and focus management
- Copy-to-clipboard functionality with fallbacks
- Export functionality for different color formats
- Screen reader announcements for actions

## Use Cases

- Design system documentation
- Client presentations
- Developer handoff tools
- Color palette sharing
- Accessibility testing
