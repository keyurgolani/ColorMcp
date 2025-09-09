# MCP Color Server

A comprehensive Model Context Protocol (MCP) server that provides advanced color manipulation, palette generation, gradient creation, and visualization capabilities to AI applications.

## Features

- **Comprehensive Color Format Support**: Convert between 22+ formats including HEX, RGB, HSL, HSV, HWB, CMYK, LAB, XYZ, LCH, OKLAB, OKLCH, and named colors
- **Framework Integration**: Native support for CSS variables, SCSS, Tailwind classes, Swift UIColor, Android Color, and Flutter Color formats
- **High-Precision Conversion**: Configurable precision up to 10 decimal places for scientific and professional applications
- **Palette Generation**: Create harmonious color palettes based on color theory principles
- **Gradient Creation**: Generate linear, radial, and conic gradients with advanced interpolation
- **Accessibility Compliance**: WCAG 2.1 AA/AAA contrast checking and colorblind simulation
- **Visualization Generation**: Create interactive HTML and high-quality PNG visualizations
- **Theme Generation**: Generate complete design system themes with semantic color mapping
- **Performance Optimized**: Sub-100ms response times for all color operations with intelligent caching

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Install Dependencies

```bash
npm install
```

### Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Usage

### As an MCP Server

The color server implements the Model Context Protocol and can be used with any MCP-compatible client.

#### Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "color": {
      "command": "node",
      "args": ["path/to/mcp-color-server/dist/index.js"]
    }
  }
}
```

#### Available Tools

- `convert_color`: Convert colors between different formats
- `analyze_color`: Analyze color properties (brightness, contrast, temperature)
- `generate_harmony_palette`: Create color palettes based on harmony principles
- `generate_gradient`: Create CSS gradients with advanced options
- `check_contrast`: Verify WCAG accessibility compliance
- `create_palette_html`: Generate interactive HTML visualizations
- `create_palette_png`: Generate high-quality PNG images

## Supported Color Formats

### Input Formats

The MCP Color Server accepts colors in any of these formats:

#### Standard Web Formats
- **HEX**: `#FF0000`, `#F00`, `FF0000`, `F00`
- **RGB**: `rgb(255, 0, 0)`, `255, 0, 0`, `255 0 0`, `[255, 0, 0]`
- **RGBA**: `rgba(255, 0, 0, 0.5)`
- **HSL**: `hsl(0, 100%, 50%)`, `0, 100%, 50%`
- **HSLA**: `hsla(0, 100%, 50%, 0.8)`
- **HSV/HSB**: `hsv(0, 100%, 100%)`, `hsb(0, 100%, 100%)`
- **HSVA**: `hsva(0, 100%, 100%, 0.7)`

#### Advanced Color Spaces
- **HWB**: `hwb(0, 0%, 0%)`
- **CMYK**: `cmyk(0%, 100%, 100%, 0%)`
- **LAB**: `lab(53.23, 80.11, 67.22)`
- **XYZ**: `xyz(41.24, 21.26, 1.93)`
- **LCH**: `lch(53.23, 104.55, 40.85)`
- **OKLAB**: `oklab(0.628, 0.225, 0.126)`
- **OKLCH**: `oklch(0.628, 0.258, 29.23)`

#### Named Colors
- **CSS Named Colors**: `red`, `blue`, `forestgreen`, `lightsteelblue`, etc.

### Output Formats

Convert to any of these formats with configurable precision:

#### Web Development
```json
{
  "color": "#FF0000",
  "output_format": "hex"
}
// Result: "#ff0000"

{
  "color": "#FF0000", 
  "output_format": "rgb"
}
// Result: "rgb(255, 0, 0)"

{
  "color": "#FF0000",
  "output_format": "hsl",
  "precision": 1
}
// Result: "hsl(0.0, 100.0%, 50.0%)"
```

#### CSS Variables
```json
{
  "color": "#FF0000",
  "output_format": "css-var",
  "variable_name": "primary-color"
}
// Result: "--primary-color: #ff0000;"

{
  "color": "#FF0000",
  "output_format": "scss-var", 
  "variable_name": "accent_color"
}
// Result: "$accent_color: #ff0000;"
```

#### Mobile Development
```json
{
  "color": "#FF0000",
  "output_format": "swift",
  "precision": 3
}
// Result: "UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.000)"

{
  "color": "#FF0000",
  "output_format": "android"
}
// Result: "Color.parseColor(\"#FFFF0000\")"

{
  "color": "#FF0000", 
  "output_format": "flutter"
}
// Result: "Color(0xFFFF0000)"
```

#### Framework Integration
```json
{
  "color": "#FF0000",
  "output_format": "tailwind"
}
// Result: "red-500"
```

#### Scientific/Professional
```json
{
  "color": "#FF0000",
  "output_format": "lab",
  "precision": 6
}
// Result: "lab(53.230000, 80.110000, 67.220000)"

{
  "color": "#FF0000",
  "output_format": "oklab", 
  "precision": 8
}
// Result: "oklab(0.62800000, 0.22500000, 0.12600000)"
```

### Usage Examples

#### Basic Color Conversion
```javascript
// Convert HEX to RGB
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF0000",
    "output_format": "rgb"
  }
}

// Convert RGB to HSL with high precision
{
  "tool": "convert_color", 
  "parameters": {
    "color": "rgb(255, 128, 64)",
    "output_format": "hsl",
    "precision": 4
  }
}
```

#### Advanced Color Space Conversions
```javascript
// Convert to LAB color space for perceptual uniformity
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF8040",
    "output_format": "lab",
    "precision": 3
  }
}

// Convert to OKLCH for modern color workflows
{
  "tool": "convert_color",
  "parameters": {
    "color": "hsl(25, 100%, 69%)",
    "output_format": "oklch", 
    "precision": 5
  }
}
```

#### Framework-Specific Outputs
```javascript
// Generate Swift UIColor
{
  "tool": "convert_color",
  "parameters": {
    "color": "#2563eb",
    "output_format": "swift",
    "precision": 3
  }
}

// Generate Tailwind CSS class
{
  "tool": "convert_color",
  "parameters": {
    "color": "#ef4444", 
    "output_format": "tailwind"
  }
}

// Generate CSS custom property
{
  "tool": "convert_color",
  "parameters": {
    "color": "#10b981",
    "output_format": "css-var",
    "variable_name": "success-color"
  }
}
```

### Performance Characteristics

- **Single Conversions**: < 100ms response time
- **Batch Operations**: < 20ms average per conversion
- **High Precision**: Up to 10 decimal places without performance impact
- **Memory Efficient**: Optimized for concurrent operations
- **Caching**: Intelligent caching for frequently converted colors

### Direct Usage

```typescript
import { ColorServer } from './src/server.js';

const server = new ColorServer();
// Server usage examples will be added as implementation progresses
```

## Development

### Project Structure

```
mcp-color-server/
├── src/                    # Source code
│   ├── server.ts          # Main MCP server implementation
│   ├── tools/             # Tool implementations
│   ├── validation/        # Input validation schemas
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── tests/                 # Test files
├── docs/                  # Documentation
├── examples/              # Usage examples
└── dist/                  # Compiled output
```

### Code Quality

This project maintains high code quality standards:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Enforces code style and catches potential issues
- **Prettier**: Automatic code formatting
- **Jest**: Comprehensive test suite with 90%+ coverage requirement
- **Continuous Integration**: Automated testing and quality checks

### Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- server.test.ts
```

### Building

```bash
# Clean previous build
npm run clean

# Build for production
npm run build

# Type check without building
npm run type-check
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/mcp-color-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mcp-color-server/discussions)
- **Documentation**: [docs/](docs/)

## Roadmap

See our [project roadmap](docs/ROADMAP.md) for planned features and improvements.