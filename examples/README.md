# MCP Color Server Examples

This directory contains comprehensive examples, testing documentation, and integration patterns for the MCP Color Server.

## Directory Structure

```
examples/
├── README.md                    # This file
├── tool-testing/               # Comprehensive tool testing examples
│   ├── TESTING_SUMMARY.md     # Testing methodology and results
│   ├── color-conversion/       # Color conversion and analysis examples
│   ├── accessibility/          # Accessibility compliance examples
│   ├── palette-generation/     # Palette generation examples
│   └── visualizations/         # HTML/PNG visualization examples
└── integration/                # Framework integration examples (coming soon)
```

## Quick Start

### Basic Color Conversion

```javascript
// MCP tool call example
const result = await mcpClient.callTool('convert_color', {
  color: '#FF0000',
  output_format: 'hsl',
  precision: 2,
});

console.log(result);
// Output: { success: true, data: { converted: "hsl(0, 100%, 50%)" } }
```

## Tool Testing Examples

### ✅ Completed Testing (26 use cases)

- **Color Conversion** (10 examples): `convert_color`, `analyze_color`
- **Accessibility** (10 examples): `check_contrast`, `simulate_colorblindness`
- **Palette Generation** (5 examples): `generate_harmony_palette`
- **Visualizations** (1 example): `create_palette_html`

### 🔄 In Progress

- Additional palette generation tools
- Color wheel and gradient visualizations
- Utility tools (mixing, sorting, variations)

## Key Features Demonstrated

### Professional Color Workflows

- **Web Development**: HEX to HSL conversion, Tailwind integration
- **Mobile Development**: Swift UIColor, Android Color formats
- **Print Design**: CMYK conversion with high precision
- **Data Visualization**: LAB color space for perceptual uniformity

### Accessibility Excellence

- **WCAG Compliance**: AA/AAA contrast checking
- **Color Vision**: Protanopia, deuteranopia, tritanopia simulation
- **Universal Design**: Color-blind safe palette generation

### Interactive Visualizations

- **HTML5 Compliant**: Semantic markup with ARIA labels
- **Keyboard Navigation**: Full accessibility support
- **Export Capabilities**: Multiple format downloads
- **Responsive Design**: Mobile-first approach

## Performance Benchmarks

| Tool Category      | Avg Response Time | Use Cases Tested |
| ------------------ | ----------------- | ---------------- |
| Color Conversion   | 0-3ms             | 10               |
| Accessibility      | 0-1ms             | 10               |
| Palette Generation | 0-2ms             | 5                |
| HTML Visualization | 12ms              | 1                |

## Usage Patterns

Each example includes:

- **Input Parameters**: Complete parameter documentation
- **Expected Output**: Full response structure
- **Use Case Context**: Real-world application scenario
- **Performance Metrics**: Execution time and resource usage
- **Practical Applications**: How to integrate in projects

## Integration Examples (Coming Soon)

- React component integration
- Vue.js color picker components
- Node.js server-side color processing
- Design system automation
- CI/CD color validation

## Contributing

We welcome example contributions! Please:

1. Follow existing example structure
2. Include comprehensive documentation
3. Test with multiple use cases
4. Ensure accessibility compliance

## Support

- **Documentation**: See `tool-testing/TESTING_SUMMARY.md` for detailed testing results
- **Issues**: Report problems or request examples
- **Discussions**: Share use cases and integration patterns
