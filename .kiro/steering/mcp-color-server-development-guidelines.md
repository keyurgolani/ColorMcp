---
inclusion: always
---

# MCP Color Server Development Guidelines

## Core Development Principles

### Quality Standards
- **Zero-Defect Policy**: No TypeScript errors, ESLint warnings, failing tests, or runtime errors
- **Test Coverage**: Maintain 90%+ test coverage for all new code
- **Accessibility First**: All color tools must meet WCAG 2.1 AA standards
- **Performance Requirements**: Color operations < 100ms, palette generation < 500ms, visualizations < 2s

### Development Workflow
- Implement complete features end-to-end before moving to next feature
- Use conventional commit format: `feat:`, `fix:`, `docs:`, `test:`
- Each commit should add working, tested functionality
- Tag major milestones for rollback capability

## MCP Protocol Standards

### Required Response Format
All tools must return responses in this standardized format:
```json
{
  "success": boolean,
  "data": object,
  "metadata": {
    "execution_time": number,
    "accessibility_notes": string[],
    "recommendations": string[]
  },
  "visualizations": {
    "html": "string (complete HTML document)",
    "png_base64": "string (base64 encoded PNG)"
  },
  "export_formats": {
    "css": "string",
    "scss": "string",
    "tailwind": "string",
    "json": "object"
  }
}
```

### Protocol Compliance
- Implement JSON-RPC 2.0 message handling with proper error codes
- Use stdio transport as primary communication method
- Provide structured tool definitions with complete parameter schemas
- Handle errors gracefully with actionable error messages
- Support concurrent request processing

### Error Handling Pattern
```javascript
// Structured error responses
{
  "success": false,
  "error": {
    "code": "INVALID_COLOR_FORMAT",
    "message": "The provided color format is not supported",
    "suggestions": ["Try #FF0000", "Use rgb(255,0,0)", "Check documentation"]
  }
}
```

## Color Implementation Standards

### Supported Formats
**Input Formats**: HEX (`#FF0000`, `#F00`), RGB (`rgb(255,0,0)`), HSL (`hsl(0,100%,50%)`), RGBA, HSLA, HSV, CMYK, LAB, XYZ, named colors

**Output Formats**: All input formats plus CSS variables, SCSS variables, Tailwind classes, Swift UIColor, Android Color, Flutter Color

### Color Theory Algorithms
- **Harmony Types**: Monochromatic, analogous, complementary, split-complementary, triadic, tetradic
- **Contrast Calculation**: Use WCAG formula `(L1 + 0.05) / (L2 + 0.05)`
- **Perceptual Distance**: Implement Delta E CIE2000 for accurate color matching
- **Color Vision Deficiency**: Support protanopia, deuteranopia, tritanopia simulation

### Performance Optimization
- Cache frequently converted colors using lookup tables
- Implement object pooling for temporary color objects
- Use efficient color representation (32-bit integers vs objects)
- Stream processing for large datasets

## Code Quality Requirements

### TypeScript Standards
- Use strict mode with no `any` types
- Functions limited to 50 lines maximum
- Comprehensive JSDoc comments for all public functions
- Structured error responses with actionable messages
- Input validation with helpful error suggestions

### Testing Requirements
- **Unit Tests**: Color conversion accuracy, input validation, edge cases
- **Integration Tests**: Complete MCP workflows, tool registration, error propagation
- **Performance Tests**: Response time benchmarks, memory usage, concurrent requests
- **Accessibility Tests**: WCAG compliance, color vision deficiency simulation

## Accessibility Requirements

### WCAG Compliance Standards
- **Level AA**: Normal text 4.5:1, large text 3:1 contrast ratios
- **Level AAA**: Normal text 7:1, large text 4.5:1 contrast ratios
- **Color Vision Deficiency**: Test against protanopia, deuteranopia, tritanopia
- **Universal Design**: Never rely solely on color to convey information

### Contrast Calculation
```javascript
// WCAG contrast ratio formula
function calculateContrast(color1, color2) {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
```

### Accessibility Optimization
- Preserve hue when adjusting for contrast compliance
- Use LAB color space for perceptually uniform adjustments
- Provide alternative indicators (text, icons, patterns) alongside color
- Generate accessibility reports with improvement suggestions

## Performance Standards

### Response Time Requirements
- **Simple Operations**: < 100ms (color conversions, basic analysis)
- **Complex Operations**: < 500ms (palette generation, harmony calculations)
- **Visualizations**: < 2000ms (HTML/PNG generation)
- **Image Processing**: < 2000ms (palette extraction from images)

### Resource Management
- **Memory Limits**: 100MB per request, 1GB total server usage
- **Concurrent Processing**: Limit to 4 CPU-intensive operations
- **Caching**: 256MB cache size with TTL-based cleanup
- **Algorithm Complexity**: Prefer O(n) or O(n log n) over O(n²)

## Visualization Standards

### HTML Output Requirements
- **HTML5 Compliance**: Valid DOCTYPE, semantic structure, proper meta tags
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels and keyboard navigation
- **Responsive Design**: Mobile-first approach with standard breakpoints
- **Self-Contained**: Embedded CSS and JavaScript, no external dependencies

### PNG Output Requirements
- **Quality Standards**: 150 DPI minimum, sRGB color space, proper ICC profiles
- **File Size**: Optimized compression without quality loss (< 10MB)
- **Professional Design**: Consistent typography, proper spacing, brand compliance
- **Accessibility**: Include accessibility information in visualizations

## Documentation Standards

### Required Documentation
- Complete README with installation and usage examples
- JSDoc comments for all public functions
- API documentation with parameter schemas and examples
- Troubleshooting section for common issues
- Accessibility compliance information

### Open Source Requirements
- MIT license for MCP servers
- CONTRIBUTING.md with development setup instructions
- CODE_OF_CONDUCT.md following community standards
- SECURITY.md for vulnerability reporting
- Automated CI/CD pipeline with quality checksculations for reuse
- **Lazy Evaluation**: Defer expensive operations until needed

#### File Size Limits
```javascript
// File size constraints
const fileLimits = {
    htmlOutput: '2MB', // Maximum HTML file size
    pngOutput: '10MB', // Maximum PNG file size
    inputImages: '50MB', // Maximum input image size
    paletteSize: 100, // Maximum colors per palette
    gradientStops: 50 // Maximum gradient stops
};
```

### Caching Strategy

#### Cache Implementation
```javascript
// Multi-level caching system
class ColorCache {
    constructor() {
        this.memoryCache = new Map(); // Fast in-memory cache
        this.diskCache = new LRUCache({ max: 1000 }); // Persistent cache
        this.maxAge = 3600000; // 1 hour cache TTL
    }
    
    get(key) {
        // Check memory cache first
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }
        
        // Check disk cache
        const diskResult = this.diskCache.get(key);
        if (diskResult) {
            // Promote to memory cache
            this.memoryCache.set(key, diskResult);
            return diskResult;
        }
        
        return null;
    }
    
    set(key, value) {
        this.memoryCache.set(key, value);
        this.diskCache.set(key, value);
        
        // Cleanup old entries
        if (this.memoryCache.size > 500) {
            this.cleanup();
        }
    }
}
```

#### Cache Keys Strategy
- **Color Conversions**: `convert:${inputColor}:${outputFormat}:${precision}`
- **Palette Generation**: `palette:${algorithm}:${baseColor}:${parameters}`
- **Visualizations**: `viz:${type}:${hash(parameters)}`
- **Image Processing**: `image:${imageHash}:${algorithm}:${parameters}`

## Testing Standards

### Unit Testing Requirements

#### Test Coverage Standards
```javascript
// Minimum test coverage requirements
const coverageRequirements = {
    statements: 90, // 90% statement coverage
    branches: 85, // 85% branch coverage
    functions: 95, // 95% function coverage
    lines: 90 // 90% line coverage
};
```

#### Color Conversion Testing
```javascript
// Comprehensive color conversion tests
describe('Color Conversion', () => {
    test('HEX to RGB conversion accuracy', () => {
        expect(convertColor('#FF0000', 'rgb')).toBe('rgb(255, 0, 0)');
        expect(convertColor('#00FF00', 'rgb')).toBe('rgb(0, 255, 0)');
        expect(convertColor('#0000FF', 'rgb')).toBe('rgb(0, 0, 255)');
    });
    
    test('Precision handling', () => {
        const result = convertColor('hsl(0, 50%, 50%)', 'lab', 3);
        expect(result).toMatch(/lab\(\d+\.\d{3}, -?\d+\.\d{3}, -?\d+\.\d{3}\)/);
    });
    
    test('Invalid input handling', () => {
        expect(() => convertColor('invalid', 'rgb')).toThrow();
        expect(convertColor('', 'rgb')).toContain('error');
    });
});
```

#### Palette Generation Testing
```javascript
// Palette generation algorithm tests
describe('Palette Generation', () => {
    test('Complementary palette accuracy', () => {
        const palette = generateHarmonyPalette('#FF0000', 'complementary', 2);
        expect(palette.colors).toHaveLength(2);
        expect(palette.colors[1]).toBeCloseTo('#00FFFF', 5); // Cyan complement
    });
    
    test('Color theory compliance', () => {
        const palette = generateHarmonyPalette('#FF0000', 'triadic', 3);
        const hues = palette.colors.map(color => rgbToHsl(color).h);
        expect(Math.abs(hues[1] - hues[0])).toBeCloseTo(120, 5);
        expect(Math.abs(hues[2] - hues[0])).toBeCloseTo(240, 5);
    });
});
```

### Integration Testing

#### MCP Protocol Testing
```javascript
// MCP protocol compliance tests
describe('MCP Protocol Integration', () => {
    test('Tool registration', async () => {
        const tools = await server.listTools();
        expect(tools).toContain('convert_color');
        expect(tools).toContain('generate_palette');
        expect(tools).toContain('create_visualization');
    });
    
    test('JSON-RPC 2.0 compliance', async () => {
        const response = await server.callTool('convert_color', {
            color: '#FF0000',
            output_format: 'rgb'
        });
        
        expect(response).toHaveProperty('id');
        expect(response).toHaveProperty('result');
        expect(response.jsonrpc).toBe('2.0');
    });
    
    test('Error handling', async () => {
        const response = await server.callTool('convert_color', {
            color: 'invalid',
            output_format: 'rgb'
        });
        
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('code');
        expect(response.error).toHaveProperty('message');
    });
});
```

#### End-to-End Workflow Testing
```javascript
// Complete workflow tests
describe('End-to-End Workflows', () => {
    test('Design system generation workflow', async () => {
        // Generate theme
        const theme = await server.callTool('generate_theme', {
            theme_type: 'light',
            primary_color: '#2563eb',
            style: 'material'
        });
        
        expect(theme.success).toBe(true);
        expect(theme.data.colors).toHaveProperty('primary');
        expect(theme.data.colors).toHaveProperty('background');
        
        // Create visualization
        const visualization = await server.callTool('create_theme_preview_html', {
            theme_colors: theme.data.colors,
            preview_type: 'dashboard'
        });
        
        expect(visualization.success).toBe(true);
        expect(visualization.visualizations.html).toContain('<!DOCTYPE html>');
        
        // Check accessibility
        const accessibility = await server.callTool('check_contrast', {
            foreground: theme.data.colors.primary,
            background: theme.data.colors.background
        });
        
        expect(accessibility.data.passes_aa).toBe(true);
    });
});
```

### Performance Testing

#### Load Testing
```javascript
// Concurrent request testing
describe('Performance Testing', () => {
    test('Concurrent request handling', async () => {
        const requests = Array(50).fill().map(() => 
            server.callTool('convert_color', {
                color: '#FF0000',
                output_format: 'hsl'
            })
        );
        
        const startTime = Date.now();
        const results = await Promise.all(requests);
        const endTime = Date.now();
        
        expect(results).toHaveLength(50);
        expect(results.every(r => r.success)).toBe(true);
        expect(endTime - startTime).toBeLessThan(5000); // Under 5 seconds
    });
    
    test('Memory usage monitoring', async () => {
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Generate large palette
        await server.callTool('generate_algorithmic_palette', {
            algorithm: 'golden_ratio',
            count: 100
        });
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Under 100MB
    });
});
```

#### Benchmark Testing
```javascript
// Performance benchmarks
describe('Performance Benchmarks', () => {
    test('Color conversion speed', async () => {
        const iterations = 1000;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            await convertColor('#FF0000', 'hsl');
        }
        
        const endTime = performance.now();
        const avgTime = (endTime - startTime) / iterations;
        
        expect(avgTime).toBeLessThan(1); // Under 1ms per conversion
    });
    
    test('Visualization generation speed', async () => {
        const startTime = performance.now();
        
        await server.callTool('create_palette_html', {
            palette: ['#FF0000', '#00FF00', '#0000FF'],
            layout: 'grid'
        });
        
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
    });
});
```

### Visual Testing

#### HTML Validation Testing
```javascript
// HTML output validation
describe('HTML Validation', () => {
    test('Valid HTML5 structure', async () => {
        const html = await server.callTool('create_color_wheel_html', {
            type: 'hsl',
            size: 400
        });
        
        expect(html.visualizations.html).toMatch(/^<!DOCTYPE html>/);
        expect(html.visualizations.html).toContain('<html lang="en">');
        expect(html.visualizations.html).toContain('<meta charset="UTF-8">');
        expect(html.visualizations.html).toContain('<meta name="viewport"');
    });
    
    test('Accessibility compliance', async () => {
        const html = await server.callTool('create_palette_html', {
            palette: ['#FF0000', '#00FF00'],
            accessibility_info: true
        });
        
        expect(html.visualizations.html).toContain('role=');
        expect(html.visualizations.html).toContain('aria-label=');
        expect(html.visualizations.html).toContain('tabindex=');
    });
});
```

#### PNG Quality Testing
```javascript
// PNG generation quality tests
describe('PNG Quality Testing', () => {
    test('Image generation consistency', async () => {
        const png1 = await server.callTool('create_palette_png', {
            palette: ['#FF0000', '#00FF00'],
            layout: 'horizontal'
        });
        
        const png2 = await server.callTool('create_palette_png', {
            palette: ['#FF0000', '#00FF00'],
            layout: 'horizontal'
        });
        
        // Same inputs should produce identical outputs
        expect(png1.visualizations.png_base64).toBe(png2.visualizations.png_base64);
    });
    
    test('Image quality validation', async () => {
        const png = await server.callTool('create_palette_png', {
            palette: ['#FF0000'],
            resolution: 300,
            dimensions: [1920, 1080]
        });
        
        const buffer = Buffer.from(png.visualizations.png_base64, 'base64');
        expect(buffer.length).toBeGreaterThan(1000); // Reasonable file size
        expect(buffer.slice(0, 8)).toEqual(PNG_SIGNATURE); // Valid PNG header
    });
});
```

### Security Testing

#### Input Validation Testing
```javascript
// Security and input validation tests
describe('Security Testing', () => {
    test('XSS prevention in HTML output', async () => {
        const maliciousInput = '<script>alert("xss")</script>';
        
        const html = await server.callTool('create_palette_html', {
            palette: [maliciousInput],
            show_names: true
        });
        
        expect(html.visualizations.html).not.toContain('<script>');
        expect(html.visualizations.html).toContain('&lt;script&gt;');
    });
    
    test('URL validation for image processing', async () => {
        const maliciousUrl = 'javascript:alert("xss")';
        
        const result = await server.callTool('extract_palette_from_image', {
            image_url: maliciousUrl
        });
        
        expect(result.success).toBe(false);
        expect(result.error.message).toContain('Invalid URL');
    });
    
    test('File size limits enforcement', async () => {
        const largeImageUrl = 'https://example.com/huge-image.jpg';
        
        const result = await server.callTool('extract_palette_from_image', {
            image_url: largeImageUrl
        });
        
        // Should handle large files gracefully
        expect(result).toHaveProperty('success');
        if (!result.success) {
            expect(result.error.message).toContain('file size');
        }
    });
});
```

## Continuous Integration Standards

### CI/CD Pipeline Requirements

#### Automated Testing Pipeline
```yaml
# GitHub Actions workflow example
name: MCP Color Server CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run performance tests
        run: npm run test:performance
      
      - name: Generate coverage report
        run: npm run coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

#### Quality Gates
- **Code Coverage**: Minimum 90% coverage required
- **Performance**: All benchmarks must pass
- **Security**: No high or critical security vulnerabilities
- **Accessibility**: All HTML outputs must pass accessibility tests
- **Visual Regression**: No unexpected visual changes

### Monitoring and Alerting

#### Performance Monitoring
```javascript
// Performance monitoring implementation
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.alerts = [];
    }
    
    recordMetric(operation, duration, memoryUsage) {
        const key = `${operation}_${Date.now()}`;
        this.metrics.set(key, {
            operation,
            duration,
            memoryUsage,
            timestamp: new Date()
        });
        
        // Check for performance issues
        if (duration > this.getThreshold(operation)) {
            this.triggerAlert('SLOW_OPERATION', { operation, duration });
        }
        
        if (memoryUsage > 100 * 1024 * 1024) { // 100MB
            this.triggerAlert('HIGH_MEMORY_USAGE', { operation, memoryUsage });
        }
    }
    
    getThreshold(operation) {
        const thresholds = {
            'convert_color': 100,
            'generate_palette': 500,
            'create_visualization': 2000
        };
        return thresholds[operation] || 1000;
    }
}
```

This comprehensive testing and performance guide ensures the MCP Color Server maintains high quality, performance, and reliability standards throughout development and production deployment.

---
inclusion: always
---

# Visualization Standards Guide

## HTML Output Standards

### HTML5 Compliance Requirements

#### Document Structure
All HTML visualizations must follow this structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Color visualization generated by MCP Color Server">
    <title>Color Visualization</title>
    <style>
        /* Embedded CSS with CSS custom properties */
    </style>
</head>
<body>
    <div class="visualization-container" role="main">
        <!-- Accessible content structure -->
    </div>
    <script>
        /* Embedded JavaScript for interactivity */
    </script>
</body>
</html>
```

#### Accessibility Requirements
- **WCAG 2.1 AA Compliant**: All generated HTML must meet accessibility standards
- **Semantic HTML**: Use proper heading hierarchy, landmarks, and ARIA labels
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Reader Support**: Provide alternative text and descriptions
- **Focus Management**: Visible focus indicators and logical tab order

#### Responsive Design Standards
- **Mobile-First Approach**: Design for mobile devices first, enhance for larger screens
- **Flexible Layouts**: Use CSS Grid and Flexbox for responsive layouts
- **Breakpoints**: Standard breakpoints at 768px, 1024px, and 1440px
- **Touch-Friendly**: Minimum 44px touch targets for interactive elements
- **Performance**: Optimize for fast loading on mobile networks

### CSS Standards

#### Modern CSS Requirements
```css
/* Use CSS custom properties for theming */
:root {
    --color-primary: #2563eb;
    --color-secondary: #64748b;
    --color-background: #ffffff;
    --color-text: #1e293b;
    --spacing-unit: 1rem;
    --border-radius: 0.5rem;
}

/* Responsive typography */
.visualization-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: clamp(0.875rem, 2.5vw, 1rem);
    line-height: 1.6;
}

/* Accessible focus styles */
.interactive-element:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
```

#### CSS Architecture
- **Component-Based**: Organize CSS by component functionality
- **BEM Methodology**: Use Block-Element-Modifier naming convention
- **CSS Custom Properties**: Use for theming and dynamic values
- **Progressive Enhancement**: Ensure basic functionality without JavaScript

### JavaScript Standards

#### Vanilla JavaScript Requirements
```javascript
// Use modern JavaScript features with fallbacks
class ColorVisualization {
    constructor(container) {
        this.container = container;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupAccessibility();
    }
    
    setupEventListeners() {
        // Use event delegation for performance
        this.container.addEventListener('click', this.handleClick.bind(this));
        this.container.addEventListener('keydown', this.handleKeydown.bind(this));
    }
    
    setupAccessibility() {
        // Ensure keyboard navigation works
        const interactiveElements = this.container.querySelectorAll('[data-interactive]');
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
        });
    }
}
```

#### Performance Requirements
- **No External Dependencies**: All JavaScript must be self-contained
- **Minimal File Size**: Keep JavaScript under 50KB for complex visualizations
- **Progressive Enhancement**: Core functionality must work without JavaScript
- **Error Handling**: Graceful degradation when JavaScript fails

## PNG Output Standards

### Image Quality Requirements

#### Resolution Standards
- **Web Use**: 72 DPI minimum, 150 DPI recommended
- **Print Use**: 300 DPI minimum, 600 DPI for high-quality print
- **Presentation Use**: 150 DPI for screen presentations
- **Social Media**: Optimized dimensions for platform requirements

#### Color Accuracy
- **Color Space**: sRGB for web, Adobe RGB for print when specified
- **Color Profile**: Embed ICC color profiles for accurate reproduction
- **Bit Depth**: 24-bit minimum, 32-bit with alpha channel when needed
- **Compression**: PNG compression optimized for file size without quality loss

#### File Size Optimization
```javascript
// PNG optimization guidelines
const pngOptimization = {
    maxFileSize: '10MB',
    compressionLevel: 6, // Balance between size and quality
    interlacing: false, // Disable for smaller files
    colorType: 'truecolor', // RGB or RGBA as needed
    bitDepth: 8 // Standard bit depth for most uses
};
```

### Professional Design Standards

#### Typography in Images
- **Font Selection**: Use system fonts or embed web-safe fonts
- **Readability**: Minimum 12pt font size for body text
- **Contrast**: Ensure text meets WCAG contrast requirements
- **Hierarchy**: Clear visual hierarchy with appropriate font weights

#### Layout and Composition
- **Grid System**: Use consistent grid for alignment
- **White Space**: Adequate spacing between elements
- **Visual Balance**: Distribute visual weight evenly
- **Brand Consistency**: Follow brand guidelines when applicable

#### Color Representation
- **Accurate Colors**: Ensure colors match their specified values
- **Consistent Rendering**: Colors should appear the same across devices
- **Accessibility**: Include accessibility information in visualizations
- **Context**: Show colors in realistic usage contexts

## Interactive Visualization Features

### Color Wheel Implementations

#### Standard Color Wheel
```javascript
// Color wheel configuration
const colorWheelConfig = {
    size: 400, // Default size in pixels
    interactive: true,
    showHarmony: false,
    harmonyType: 'complementary',
    highlightColors: [],
    theme: 'light'
};
```

#### Features Required
- **Interactive Selection**: Click to select colors
- **Harmony Visualization**: Show color relationships
- **Keyboard Navigation**: Arrow keys for color selection
- **Touch Support**: Touch and drag for mobile devices
- **Color Information**: Display color values on hover/focus

### Palette Visualizations

#### Layout Options
- **Horizontal**: Colors arranged in a single row
- **Vertical**: Colors arranged in a single column
- **Grid**: Colors arranged in a responsive grid
- **Circular**: Colors arranged in a circle
- **Wave**: Colors arranged in a flowing wave pattern

#### Interactive Features
```javascript
// Palette interaction features
const paletteFeatures = {
    showValues: true, // Display color values
    showNames: false, // Display color names
    interactive: true, // Enable interactions
    exportFormats: ['hex', 'rgb', 'hsl'], // Available export formats
    accessibilityInfo: false, // Show accessibility information
    copyToClipboard: true // Enable copy functionality
};
```

### Gradient Previews

#### Gradient Types Support
- **Linear Gradients**: With angle and position controls
- **Radial Gradients**: With center point and shape options
- **Conic Gradients**: With starting angle controls
- **Mesh Gradients**: Advanced multi-point gradients

#### Preview Shapes
```javascript
// Gradient preview shapes
const previewShapes = [
    'rectangle', // Standard rectangular preview
    'circle', // Circular preview
    'text', // Text with gradient background
    'button', // Button component preview
    'card' // Card component preview
];
```

## Accessibility in Visualizations

### Screen Reader Support

#### ARIA Labels and Descriptions
```html
<!-- Color swatch with proper ARIA labels -->
<div class="color-swatch" 
     role="button" 
     tabindex="0"
     aria-label="Color swatch: Red #FF0000"
     aria-describedby="color-info-1">
    <div class="color-display" style="background-color: #FF0000;"></div>
    <div id="color-info-1" class="sr-only">
        Hex value: #FF0000, RGB: 255, 0, 0, HSL: 0, 100%, 50%
    </div>
</div>
```

#### Alternative Text for Images
- **Descriptive Alt Text**: Describe the visualization content
- **Data Tables**: Provide tabular alternatives for complex visualizations
- **Text Summaries**: Include text summaries of visual information

### Keyboard Navigation

#### Navigation Patterns
- **Tab Order**: Logical tab order through interactive elements
- **Arrow Keys**: Use arrow keys for grid navigation
- **Enter/Space**: Activate buttons and selections
- **Escape**: Close modals and return to previous state

#### Focus Management
```css
/* Visible focus indicators */
.focusable:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

/* Skip links for screen readers */
.skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
}

.skip-link:focus {
    top: 6px;
}
```

## Performance Optimization

### HTML Optimization

#### File Size Management
- **Inline Resources**: Embed CSS and JavaScript for self-contained files
- **Minification**: Minify CSS and JavaScript in production
- **Compression**: Use efficient HTML structure
- **Caching**: Include appropriate cache headers

#### Loading Performance
```html
<!-- Optimize loading performance -->
<style>
    /* Critical CSS inline */
    .visualization-container { /* styles */ }
</style>

<script>
    // Defer non-critical JavaScript
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize interactive features
    });
</script>
```

### PNG Optimization

#### Compression Strategies
- **Palette Optimization**: Use indexed color when appropriate
- **Alpha Channel**: Only include alpha channel when needed
- **Progressive Loading**: Consider interlaced PNG for large images
- **Metadata Removal**: Strip unnecessary metadata

#### Memory Management
```javascript
// Efficient image generation
function generatePNG(options) {
    const canvas = createCanvas(options.width, options.height);
    const ctx = canvas.getContext('2d');
    
    // Use efficient drawing operations
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Clean up resources
    return canvas.toBuffer('image/png', {
        compressionLevel: 6,
        filters: canvas.PNG_FILTER_NONE
    });
}
```

## Quality Assurance

### Visual Testing

#### Cross-Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Feature Detection**: Use feature detection, not browser detection
- **Graceful Degradation**: Ensure basic functionality in older browsers

#### Visual Regression Testing
```javascript
// Visual testing configuration
const visualTests = {
    browsers: ['chrome', 'firefox', 'safari'],
    viewports: [
        { width: 375, height: 667 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1440, height: 900 } // Desktop
    ],
    threshold: 0.1 // 0.1% pixel difference tolerance
};
```

### Accessibility Testing

#### Automated Testing
- **axe-core**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Performance and accessibility auditing
- **Color Contrast**: Automated contrast ratio checking

#### Manual Testing
- **Screen Reader Testing**: Test with NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: Test all functionality with keyboard only
- **Color Vision Testing**: Test with color vision deficiency simulators
- **User Testing**: Test with users who have disabilities

This guide ensures all visualizations meet professional standards for quality, accessibility, and performance across all output formats.

# MCP Color Server - Tool Specifications

## Overview

This document provides detailed specifications for all MCP tools provided by the Color Server. Each tool follows the standardized response format and includes comprehensive parameter validation, error handling, and accessibility features.

## Standard Response Format

All tools return responses in this format:
```json
{
  "success": "boolean",
  "data": "object (tool-specific response)",
  "metadata": {
    "execution_time": "number (milliseconds)",
    "color_space_used": "string",
    "accessibility_notes": "array of strings",
    "recommendations": "array of strings"
  },
  "visualizations": {
    "html": "string (complete HTML document)",
    "png_base64": "string (base64 encoded PNG)",
    "svg": "string (SVG markup when applicable)"
  },
  "export_formats": {
    "css": "string",
    "scss": "string", 
    "tailwind": "string",
    "json": "object",
    "ase": "string (base64 Adobe Swatch Exchange)"
  }
}
```

## Color Conversion Tools

### convert_color

Convert colors between different formats with high precision.

**Parameters:**
```json
{
  "color": "string (required) - Input color in any supported format",
  "output_format": "string (required) - Target format: hex|rgb|rgba|hsl|hsla|hsv|cmyk|lab|xyz|css_var|scss_var|tailwind|swift|android|flutter",
  "precision": "number (optional) - Decimal places for numeric outputs (default: 2)"
}
```

**Example Usage:**
```json
{
  "tool": "convert_color",
  "parameters": {
    "color": "#FF0000",
    "output_format": "hsl",
    "precision": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "#FF0000",
    "converted": "hsl(0, 100.0%, 50.0%)",
    "format": "hsl"
  },
  "metadata": {
    "execution_time": 15,
    "color_space_used": "sRGB",
    "accessibility_notes": [],
    "recommendations": []
  }
}
```

### analyze_color

Analyze color properties including brightness, contrast, temperature, and accessibility.

**Parameters:**
```json
{
  "color": "string (required) - Color to analyze",
  "analysis_types": "array (optional) - Types of analysis: ['brightness', 'contrast', 'temperature', 'saturation', 'accessibility']"
}
```

**Example Usage:**
```json
{
  "tool": "analyze_color",
  "parameters": {
    "color": "#2563eb",
    "analysis_types": ["brightness", "temperature", "accessibility"]
  }
}
```

### calculate_color_distance

Calculate perceptual distance between two colors using various algorithms.

**Parameters:**
```json
{
  "color1": "string (required) - First color",
  "color2": "string (required) - Second color",
  "method": "string (optional) - Algorithm: euclidean|delta_e|cie76|cie94|cie2000 (default: cie2000)",
  "color_space": "string (optional) - Color space: rgb|lab|xyz|lch (default: lab)"
}
```

## Palette Generation Tools

### generate_harmony_palette

Generate color palettes based on color theory principles.

**Parameters:**
```json
{
  "base_color": "string (required) - Base color for harmony",
  "harmony_type": "string (required) - Type: monochromatic|analogous|complementary|triadic|tetradic|split_complementary|double_complementary",
  "count": "number (optional) - Number of colors (3-10, default: 5)",
  "variation": "number (optional) - Variation amount (0-100, default: 20)"
}
```

**Example Usage:**
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

### generate_contextual_palette

Generate palettes optimized for specific contexts and use cases.

**Parameters:**
```json
{
  "context": "string (required) - Context: web_design|mobile_app|print|brand|data_visualization|accessibility|dark_theme|light_theme",
  "primary_color": "string (optional) - Primary color to build around",
  "mood": "string (optional) - Mood: professional|creative|energetic|calm|modern|vintage|minimal|bold",
  "industry": "string (optional) - Industry: tech|healthcare|finance|education|entertainment|nonprofit|retail|fashion"
}
```

### generate_algorithmic_palette

Generate palettes using mathematical algorithms.

**Parameters:**
```json
{
  "algorithm": "string (required) - Algorithm: golden_ratio|fibonacci|perceptual_uniform|chroma_progression|hue_shift",
  "base_color": "string (optional) - Starting color",
  "count": "number (optional) - Number of colors (3-20, default: 5)",
  "parameters": "object (optional) - Algorithm-specific settings"
}
```

### extract_palette_from_image

Extract dominant colors from images.

**Parameters:**
```json
{
  "image_url": "string (required) - URL of image to process",
  "method": "string (optional) - Extraction method: dominant|kmeans|median_cut|octree|histogram (default: kmeans)",
  "color_count": "number (optional) - Number of colors to extract (3-10, default: 5)",
  "quality": "string (optional) - Processing quality: low|medium|high|ultra (default: medium)",
  "ignore_background": "boolean (optional) - Attempt to ignore background colors (default: false)"
}
```

## Gradient Generation Tools

### generate_linear_gradient

Create linear gradients with precise control.

**Parameters:**
```json
{
  "colors": "array (required) - Array of color strings",
  "positions": "array (optional) - Stop positions (0-100)",
  "angle": "number (optional) - Gradient angle (0-360, default: 90)",
  "interpolation": "string (optional) - Interpolation: linear|ease|ease_in|ease_out|bezier (default: linear)",
  "color_space": "string (optional) - Color space: rgb|hsl|lab|lch (default: rgb)",
  "steps": "number (optional) - Number of steps for stepped gradients"
}
```

### generate_radial_gradient

Create radial gradients with center point and shape control.

**Parameters:**
```json
{
  "colors": "array (required) - Array of color strings",
  "positions": "array (optional) - Stop positions (0-100)",
  "center": "array (optional) - Center point [x, y] (0-100, default: [50, 50])",
  "shape": "string (optional) - Shape: circle|ellipse (default: circle)",
  "size": "string (optional) - Size: closest_side|closest_corner|farthest_side|farthest_corner|explicit (default: farthest_corner)",
  "dimensions": "array (optional) - [width, height] if size is explicit"
}
```

### generate_conic_gradient

Create conic (angular) gradients.

**Parameters:**
```json
{
  "colors": "array (required) - Array of color strings",
  "positions": "array (optional) - Angle positions (0-360)",
  "center": "array (optional) - Center point [x, y] (0-100, default: [50, 50])",
  "starting_angle": "number (optional) - Starting angle (0-360, default: 0)"
}
```

### generate_mesh_gradient

Create advanced mesh gradients with multiple control points.

**Parameters:**
```json
{
  "grid_size": "array (required) - Grid dimensions [width, height] (2x2 to 10x10)",
  "colors": "array (required) - 2D array of colors matching grid",
  "smoothing": "number (optional) - Smoothing amount (0-100, default: 50)",
  "blend_mode": "string (optional) - Blend mode: normal|multiply|screen|overlay|soft_light|hard_light (default: normal)"
}
```

## Theme Generation Tools

### generate_theme

Generate complete design system themes.

**Parameters:**
```json
{
  "theme_type": "string (required) - Theme type: light|dark|auto|high_contrast|colorblind_friendly",
  "primary_color": "string (required) - Primary brand color",
  "style": "string (optional) - Design style: material|ios|fluent|custom (default: material)",
  "components": "array (optional) - Components to generate: ['background', 'surface', 'primary', 'secondary', 'accent', 'text', 'border', 'shadow', 'success', 'warning', 'error', 'info']",
  "accessibility_level": "string (optional) - WCAG level: AA|AAA (default: AA)",
  "brand_colors": "array (optional) - Additional brand colors to incorporate"
}
```

### generate_semantic_colors

Map colors to semantic roles for UI design.

**Parameters:**
```json
{
  "base_palette": "array (required) - Array of base colors",
  "semantic_roles": "array (optional) - Roles: ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral']",
  "context": "string (optional) - Context: web|mobile|desktop|print (default: web)",
  "ensure_contrast": "boolean (optional) - Ensure WCAG contrast compliance (default: true)"
}
```

## Accessibility Tools

### check_contrast

Check color contrast compliance with WCAG standards.

**Parameters:**
```json
{
  "foreground": "string (required) - Foreground color",
  "background": "string (required) - Background color",
  "text_size": "string (optional) - Text size: normal|large (default: normal)",
  "standard": "string (optional) - Standard: WCAG_AA|WCAG_AAA|APCA (default: WCAG_AA)"
}
```

### simulate_colorblindness

Simulate how colors appear to users with color vision deficiencies.

**Parameters:**
```json
{
  "colors": "array (required) - Array of colors to simulate",
  "type": "string (required) - Deficiency type: protanopia|deuteranopia|tritanopia|protanomaly|deuteranomaly|tritanomaly|monochromacy",
  "severity": "number (optional) - Severity percentage (0-100, default: 100)"
}
```

### optimize_for_accessibility

Optimize colors for accessibility compliance.

**Parameters:**
```json
{
  "palette": "array (required) - Array of colors to optimize",
  "use_cases": "array (required) - Use cases: ['text', 'background', 'accent', 'interactive']",
  "target_standard": "string (optional) - Target standard: WCAG_AA|WCAG_AAA (default: WCAG_AA)",
  "preserve_hue": "boolean (optional) - Preserve original hues when possible (default: true)"
}
```

## Color Utility Tools

### mix_colors

Mix multiple colors with specified ratios and blend modes.

**Parameters:**
```json
{
  "colors": "array (required) - Array of colors to mix",
  "ratios": "array (optional) - Mix ratios for each color",
  "blend_mode": "string (optional) - Blend mode: normal|multiply|screen|overlay|color_burn|color_dodge|darken|lighten|difference|exclusion (default: normal)",
  "color_space": "string (optional) - Color space for mixing: rgb|hsl|lab|lch (default: rgb)"
}
```

### generate_color_variations

Generate tints, shades, and tones of a base color.

**Parameters:**
```json
{
  "base_color": "string (required) - Base color for variations",
  "variation_type": "string (required) - Type: tints|shades|tones|all",
  "steps": "number (optional) - Number of variation steps (3-20, default: 10)",
  "intensity": "number (optional) - Variation intensity (0-100, default: 50)"
}
```

### sort_colors

Sort colors by various properties.

**Parameters:**
```json
{
  "colors": "array (required) - Array of colors to sort",
  "sort_by": "string (required) - Sort criteria: hue|saturation|lightness|brightness|temperature|frequency",
  "direction": "string (optional) - Sort direction: ascending|descending (default: ascending)",
  "group_similar": "boolean (optional) - Group similar colors together (default: false)"
}
```

### analyze_color_collection

Analyze a collection of colors for diversity, harmony, and other metrics.

**Parameters:**
```json
{
  "colors": "array (required) - Array of colors to analyze",
  "metrics": "array (optional) - Metrics to calculate: ['diversity', 'harmony', 'contrast_range', 'temperature_distribution', 'accessibility_score']"
}
```

## HTML Visualization Tools

### create_color_wheel_html

Generate interactive color wheel visualizations.

**Parameters:**
```json
{
  "type": "string (optional) - Color wheel type: rgb|ryw|ryb|hsl|hsv (default: hsl)",
  "size": "number (optional) - Size in pixels (200-1000, default: 400)",
  "interactive": "boolean (optional) - Enable interactivity (default: true)",
  "show_harmony": "boolean (optional) - Show harmony relationships (default: false)",
  "harmony_type": "string (optional) - Harmony type if show_harmony is true",
  "highlight_colors": "array (optional) - Colors to highlight on wheel",
  "theme": "string (optional) - Theme: light|dark|auto (default: light)"
}
```

### create_palette_html

Generate interactive palette visualizations.

**Parameters:**
```json
{
  "palette": "array (required) - Array of colors",
  "layout": "string (optional) - Layout: horizontal|vertical|grid|circular|wave (default: horizontal)",
  "style": "string (optional) - Style: swatches|gradient|cards|minimal|detailed (default: swatches)",
  "size": "string (optional) - Size: small|medium|large|custom (default: medium)",
  "custom_dimensions": "array (optional) - [width, height] if size is custom",
  "show_values": "boolean (optional) - Show color values (default: true)",
  "show_names": "boolean (optional) - Show color names (default: false)",
  "interactive": "boolean (optional) - Enable interactions (default: true)",
  "export_formats": "array (optional) - Available export formats (default: ['hex', 'rgb', 'hsl'])",
  "accessibility_info": "boolean (optional) - Show accessibility information (default: false)"
}
```

### create_gradient_html

Generate gradient preview visualizations.

**Parameters:**
```json
{
  "gradient_css": "string (required) - CSS gradient definition",
  "preview_shapes": "array (optional) - Preview shapes: ['rectangle', 'circle', 'text', 'button', 'card']",
  "size": "array (optional) - Preview size [width, height]",
  "show_css_code": "boolean (optional) - Display CSS code (default: true)",
  "interactive_controls": "boolean (optional) - Enable interactive controls (default: false)",
  "variations": "boolean (optional) - Show angle/position variations (default: false)"
}
```

### create_theme_preview_html

Generate theme preview mockups.

**Parameters:**
```json
{
  "theme_colors": "object (required) - Semantic color mapping",
  "preview_type": "string (optional) - Preview type: website|mobile_app|dashboard|components (default: website)",
  "components": "array (optional) - Components to show: ['header', 'sidebar', 'content', 'footer', 'buttons', 'forms', 'cards']",
  "interactive": "boolean (optional) - Enable interactivity (default: true)",
  "responsive": "boolean (optional) - Responsive design (default: true)"
}
```

### create_accessibility_chart_html

Generate accessibility compliance visualizations.

**Parameters:**
```json
{
  "color_combinations": "array (required) - Array of [foreground, background] pairs",
  "chart_type": "string (optional) - Chart type: contrast_matrix|compliance_grid|heatmap (default: contrast_matrix)",
  "standard": "string (optional) - WCAG standard: WCAG_AA|WCAG_AAA (default: WCAG_AA)",
  "interactive": "boolean (optional) - Enable interactivity (default: true)",
  "show_recommendations": "boolean (optional) - Show improvement recommendations (default: true)"
}
```

### create_color_theory_html

Generate educational color theory demonstrations.

**Parameters:**
```json
{
  "concept": "string (required) - Concept: color_harmony|color_temperature|saturation|brightness|complementary|analogous",
  "base_color": "string (required) - Base color for demonstration",
  "interactive": "boolean (optional) - Enable interactivity (default: true)",
  "educational_mode": "boolean (optional) - Show explanations (default: true)",
  "animation": "boolean (optional) - Animate relationships (default: false)"
}
```

## PNG Visualization Tools

### create_palette_png

Generate high-quality palette images.

**Parameters:**
```json
{
  "palette": "array (required) - Array of colors",
  "layout": "string (optional) - Layout: horizontal|vertical|grid|circular (default: horizontal)",
  "resolution": "number (optional) - DPI: 72|150|300|600 (default: 150)",
  "dimensions": "array (optional) - [width, height] in pixels",
  "style": "string (optional) - Style: flat|gradient|material|glossy|fabric|paper (default: flat)",
  "labels": "boolean (optional) - Show color values (default: true)",
  "label_style": "string (optional) - Label style: minimal|detailed|branded (default: minimal)",
  "background": "string (optional) - Background: transparent|white|black|custom (default: white)",
  "margin": "number (optional) - Margin in pixels (default: 20)"
}
```

### create_gradient_png

Generate gradient images.

**Parameters:**
```json
{
  "gradient": "object (required) - Gradient definition",
  "dimensions": "array (required) - [width, height] in pixels",
  "resolution": "number (optional) - DPI: 72|150|300|600 (default: 150)",
  "format": "string (optional) - Format: png|png24|png32 (default: png32)",
  "quality": "string (optional) - Quality: draft|standard|high|ultra (default: standard)",
  "effects": "array (optional) - Effects: ['noise', 'texture', 'border', 'shadow']"
}
```

### create_color_comparison_png

Generate color comparison charts.

**Parameters:**
```json
{
  "color_sets": "array (required) - Array of color arrays to compare",
  "comparison_type": "string (optional) - Type: side_by_side|overlay|difference|harmony (default: side_by_side)",
  "chart_style": "string (optional) - Style: professional|artistic|scientific (default: professional)",
  "annotations": "boolean (optional) - Show analysis annotations (default: true)",
  "resolution": "number (optional) - DPI: 72|150|300|600 (default: 150)",
  "format_for": "string (optional) - Optimize for: web|print|presentation (default: web)"
}
```

### create_accessibility_report_png

Generate accessibility compliance reports.

**Parameters:**
```json
{
  "color_palette": "array (required) - Array of colors to analyze",
  "report_type": "string (optional) - Type: contrast_matrix|colorblind_simulation|compliance_summary (default: compliance_summary)",
  "layout": "string (optional) - Layout: portrait|landscape (default: portrait)",
  "resolution": "number (optional) - DPI: 150|300|600 (default: 300)",
  "branding": "object (optional) - Branding elements (logo, headers)",
  "detailed_annotations": "boolean (optional) - Include detailed annotations (default: true)"
}
```

### create_mood_board_png

Generate artistic mood boards with colors.

**Parameters:**
```json
{
  "palette": "array (required) - Array of colors",
  "style": "string (optional) - Style: modern|vintage|minimalist|artistic|corporate (default: modern)",
  "elements": "array (optional) - Elements: ['colors', 'textures', 'typography', 'shapes'] (default: ['colors'])",
  "dimensions": "array (optional) - [width, height] in pixels",
  "resolution": "number (optional) - DPI: 150|300 (default: 150)",
  "composition": "string (optional) - Composition: grid|organic|geometric|flowing (default: grid)"
}
```

## Advanced Visualization Tools

### create_3d_color_space_html

Generate 3D color space visualizations.

**Parameters:**
```json
{
  "color_space": "string (required) - Color space: rgb|hsl|hsv|lab|xyz",
  "highlighted_colors": "array (optional) - Colors to highlight in 3D space",
  "interactive": "boolean (optional) - Enable 3D interaction (default: true)",
  "projection": "string (optional) - Projection: perspective|orthographic (default: perspective)",
  "rotation": "boolean (optional) - Allow user rotation (default: true)",
  "slice_plane": "boolean (optional) - Show 2D slices (default: false)"
}
```

### create_color_transition_html

Generate animated color transitions.

**Parameters:**
```json
{
  "start_color": "string (required) - Starting color",
  "end_color": "string (required) - Ending color",
  "transition_type": "string (optional) - Type: linear|ease|bounce|elastic|steps (default: linear)",
  "duration": "number (optional) - Duration in seconds (default: 2)",
  "steps": "number (optional) - Number of steps for step transitions",
  "color_space": "string (optional) - Interpolation space: rgb|hsl|lab|lch (default: rgb)",
  "show_intermediate_values": "boolean (optional) - Show color values during transition (default: false)"
}
```

### create_harmony_visualization_html

Generate color harmony relationship visualizations.

**Parameters:**
```json
{
  "base_color": "string (required) - Base color for harmony",
  "harmony_types": "array (optional) - Harmony types to show",
  "layout": "string (optional) - Layout: circular|linear|radial (default: circular)",
  "interactive": "boolean (optional) - Enable interactivity (default: true)",
  "show_relationships": "boolean (optional) - Show connecting lines (default: true)",
  "animation": "boolean (optional) - Animate harmony generation (default: false)"
}
```

## Error Handling

All tools implement comprehensive error handling with structured responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_COLOR_FORMAT",
    "message": "The provided color format is not supported",
    "details": {
      "provided": "invalid_color",
      "supported_formats": ["hex", "rgb", "hsl", "hsv", "cmyk", "lab", "xyz", "named"]
    },
    "suggestions": [
      "Try using a hex format like #FF0000",
      "Use RGB format like rgb(255, 0, 0)",
      "Check the color format documentation"
    ]
  },
  "metadata": {
    "tool": "convert_color",
    "timestamp": "2024-01-15T10:30:00Z",
    "execution_time": 5
  }
}
```

## Performance Considerations

- All tools are designed to meet the performance requirements specified in the steering documents
- Caching is implemented for expensive operations
- Memory usage is monitored and optimized
- Graceful degradation is provided for resource-intensive operations
- Response times are tracked and optimized continuously

This comprehensive tool specification ensures consistent, reliable, and high-performance color operations across all MCP Color Server implementations.