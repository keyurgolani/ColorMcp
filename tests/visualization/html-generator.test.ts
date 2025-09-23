/**
 * Tests for HTML generator
 */

import {
  HTMLGenerator,
  PaletteVisualizationData,
} from '../../src/visualization/html-generator';

describe('HTMLGenerator', () => {
  let generator: HTMLGenerator;

  beforeEach(() => {
    generator = new HTMLGenerator();
  });

  describe('Template compilation', () => {
    test('should initialize without errors', () => {
      expect(generator).toBeInstanceOf(HTMLGenerator);
    });

    test('should compile base template', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: {},
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Test Palette');
      expect(html).toContain('#FF0000');
    });
  });

  describe('Handlebars helpers', () => {
    test('should format contrast ratio correctly', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
            accessibility: {
              contrastRatio: 4.567,
              wcagAA: true,
              wcagAAA: false,
            },
          },
        ],
        options: { accessibilityInfo: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('4.57'); // Formatted to 2 decimal places
    });

    test('should generate correct accessibility badges', () => {
      const dataAAA: PaletteVisualizationData = {
        colors: [
          {
            hex: '#000000',
            rgb: 'rgb(0, 0, 0)',
            hsl: 'hsl(0, 0%, 0%)',
            accessibility: {
              contrastRatio: 21.0,
              wcagAA: true,
              wcagAAA: true,
            },
          },
        ],
        options: { accessibilityInfo: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const htmlAAA = generator.generatePaletteHTML(dataAAA);
      expect(htmlAAA).toContain('AAA');
      expect(htmlAAA).toContain('accessibility-aaa');

      const dataAA: PaletteVisualizationData = {
        colors: [
          {
            hex: '#666666',
            rgb: 'rgb(102, 102, 102)',
            hsl: 'hsl(0, 0%, 40%)',
            accessibility: {
              contrastRatio: 5.5,
              wcagAA: true,
              wcagAAA: false,
            },
          },
        ],
        options: { accessibilityInfo: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const htmlAA = generator.generatePaletteHTML(dataAA);
      expect(htmlAA).toContain('AA');
      expect(htmlAA).toContain('accessibility-aa');

      const dataFail: PaletteVisualizationData = {
        colors: [
          {
            hex: '#CCCCCC',
            rgb: 'rgb(204, 204, 204)',
            hsl: 'hsl(0, 0%, 80%)',
            accessibility: {
              contrastRatio: 2.0,
              wcagAA: false,
              wcagAAA: false,
            },
          },
        ],
        options: { accessibilityInfo: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const htmlFail = generator.generatePaletteHTML(dataFail);
      expect(htmlFail).toContain('Fail');
      expect(htmlFail).toContain('accessibility-fail');
    });

    test('should determine text color based on luminance', () => {
      const darkData: PaletteVisualizationData = {
        colors: [
          {
            hex: '#000000',
            rgb: 'rgb(0, 0, 0)',
            hsl: 'hsl(0, 0%, 0%)',
          },
        ],
        options: { showValues: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const darkHtml = generator.generatePaletteHTML(darkData);
      expect(darkHtml).toContain('color: #ffffff'); // White text on dark background

      const lightData: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FFFFFF',
            rgb: 'rgb(255, 255, 255)',
            hsl: 'hsl(0, 0%, 100%)',
          },
        ],
        options: { showValues: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const lightHtml = generator.generatePaletteHTML(lightData);
      expect(lightHtml).toContain('color: #000000'); // Black text on light background
    });

    test('should generate layout classes correctly', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { layout: 'grid' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);
      expect(html).toContain('palette-layout-grid');
    });

    test('should generate size classes correctly', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { size: 'large' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);
      expect(html).toContain('palette-size-large');
    });
  });

  describe('CSS generation', () => {
    test('should include CSS custom properties', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: {},
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('visualization-container');
      expect(html).toContain('color-swatch');
      expect(html).toContain('palette-grid');
    });

    test('should include responsive CSS', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: {},
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('@media (max-width: 768px)');
      expect(html).toContain('clamp(');
    });

    test('should include accessibility CSS', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: {},
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('@media (prefers-contrast: high)');
      expect(html).toContain('@media (prefers-reduced-motion: reduce)');
      expect(html).toContain('role="button"');
    });

    test('should include dark theme support', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { theme: 'dark' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('.theme-dark');
      expect(html).toContain('theme-dark');
    });
  });

  describe('JavaScript generation', () => {
    test('should include JavaScript when interactive', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { interactive: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('<script>');
      expect(html).toContain('copyToClipboard');
      expect(html).toContain('addEventListener');
      expect(html).toContain('showNotification');
    });

    test('should not include JavaScript when not interactive', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { interactive: false },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).not.toContain('<script>');
    });

    test('should include keyboard navigation support', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { interactive: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('ArrowRight');
      expect(html).toContain('ArrowLeft');
      expect(html).toContain('ArrowUp');
      expect(html).toContain('ArrowDown');
      expect(html).toContain('keydown');
      expect(html).toContain('preventDefault');
    });

    test('should include clipboard functionality', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { interactive: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('navigator.clipboard');
      expect(html).toContain('copyToClipboard');
      expect(html).toContain('copy-color-btn');
    });

    test('should include export functionality when export formats are provided', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: {
          interactive: true,
          showValues: true,
          exportFormats: ['hex', 'css'],
        },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('export-controls');
      expect(html).toContain('export-format-btn');
      expect(html).toContain('copy-all-btn');
    });

    test('should include ARIA live region for screen readers', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { interactive: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('createAriaLiveRegion');
      expect(html).toContain('announceToScreenReader');
      expect(html).toContain('aria-live');
    });
  });

  describe('Accessibility features', () => {
    test('should include proper ARIA attributes', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: {},
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('role="main"');
      expect(html).toContain('role="group"');
      expect(html).toContain('role="button"');
      expect(html).toContain('aria-label=');
      expect(html).toContain('tabindex="0"');
    });

    test('should include accessibility information when enabled', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
            accessibility: {
              contrastRatio: 4.5,
              wcagAA: true,
              wcagAAA: false,
            },
          },
        ],
        options: { accessibilityInfo: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('accessibility-info');
      expect(html).toContain('accessibility-badge');
      expect(html).toContain('accessibility-summary');
    });

    test('should include semantic HTML structure', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { interactive: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);

      expect(html).toContain('<header');
      expect(html).toContain('<main');
      expect(html).toContain('<h1>');
      expect(html).toContain('role="main"');
    });
  });

  describe('Layout variations', () => {
    test('should handle horizontal layout', () => {
      const data: PaletteVisualizationData = {
        colors: [
          { hex: '#FF0000', rgb: 'rgb(255, 0, 0)', hsl: 'hsl(0, 100%, 50%)' },
          { hex: '#00FF00', rgb: 'rgb(0, 255, 0)', hsl: 'hsl(120, 100%, 50%)' },
        ],
        options: { layout: 'horizontal' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 2,
        },
      };

      const html = generator.generatePaletteHTML(data);
      expect(html).toContain('palette-layout-horizontal');
    });

    test('should handle vertical layout', () => {
      const data: PaletteVisualizationData = {
        colors: [
          { hex: '#FF0000', rgb: 'rgb(255, 0, 0)', hsl: 'hsl(0, 100%, 50%)' },
          { hex: '#00FF00', rgb: 'rgb(0, 255, 0)', hsl: 'hsl(120, 100%, 50%)' },
        ],
        options: { layout: 'vertical' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 2,
        },
      };

      const html = generator.generatePaletteHTML(data);
      expect(html).toContain('palette-layout-vertical');
    });

    test('should handle grid layout', () => {
      const data: PaletteVisualizationData = {
        colors: [
          { hex: '#FF0000', rgb: 'rgb(255, 0, 0)', hsl: 'hsl(0, 100%, 50%)' },
          { hex: '#00FF00', rgb: 'rgb(0, 255, 0)', hsl: 'hsl(120, 100%, 50%)' },
          { hex: '#0000FF', rgb: 'rgb(0, 0, 255)', hsl: 'hsl(240, 100%, 50%)' },
          {
            hex: '#FFFF00',
            rgb: 'rgb(255, 255, 0)',
            hsl: 'hsl(60, 100%, 50%)',
          },
        ],
        options: { layout: 'grid' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 4,
        },
      };

      const html = generator.generatePaletteHTML(data);
      expect(html).toContain('palette-layout-grid');
    });

    test('should handle circular layout', () => {
      const data: PaletteVisualizationData = {
        colors: [
          { hex: '#FF0000', rgb: 'rgb(255, 0, 0)', hsl: 'hsl(0, 100%, 50%)' },
          { hex: '#00FF00', rgb: 'rgb(0, 255, 0)', hsl: 'hsl(120, 100%, 50%)' },
          { hex: '#0000FF', rgb: 'rgb(0, 0, 255)', hsl: 'hsl(240, 100%, 50%)' },
        ],
        options: { layout: 'circular' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 3,
        },
      };

      const html = generator.generatePaletteHTML(data);
      expect(html).toContain('palette-layout-circular');
    });
  });

  describe('Additional HTML generation methods', () => {
    test('should generate color wheel HTML', () => {
      const data = {
        type: 'hsl' as const,
        size: 400,
        interactive: true,
        showHarmony: false,
        highlightColors: [
          {
            hex: '#FF0000',
            hue: 0,
            saturation: 100,
            lightness: 50,
          },
        ],
        theme: 'light' as const,
        metadata: {
          title: 'Color Wheel',
          description: 'Interactive color wheel',
          timestamp: '2024-01-01 12:00:00',
          wheelType: 'hsl',
        },
      };

      const html = generator.generateColorWheelHTML(data);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Color Wheel');
    });

    test('should generate gradient HTML', () => {
      const data = {
        gradientCSS: 'linear-gradient(90deg, #FF0000, #0000FF)',
        previewShapes: ['rectangle'],
        size: [400, 300] as [number, number],
        showCSSCode: true,
        interactiveControls: true,
        variations: false,
        metadata: {
          title: 'Gradient Preview',
          description: 'CSS gradient preview',
          timestamp: '2024-01-01 12:00:00',
          gradientType: 'linear',
        },
      };

      const html = generator.generateGradientHTML(data);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Gradient Preview');
    });

    test('should generate theme preview HTML', () => {
      const data = {
        themeColors: {
          primary: {
            hex: '#2563eb',
            rgb: 'rgb(37, 99, 235)',
            hsl: 'hsl(217, 91%, 60%)',
            name: 'Primary Blue',
          },
          secondary: {
            hex: '#64748b',
            rgb: 'rgb(100, 116, 139)',
            hsl: 'hsl(215, 16%, 47%)',
            name: 'Secondary Gray',
          },
          background: {
            hex: '#ffffff',
            rgb: 'rgb(255, 255, 255)',
            hsl: 'hsl(0, 0%, 100%)',
            name: 'White Background',
          },
          text: {
            hex: '#1e293b',
            rgb: 'rgb(30, 41, 59)',
            hsl: 'hsl(222, 32%, 17%)',
            name: 'Dark Text',
          },
        },
        previewType: 'website' as const,
        components: ['header', 'content', 'buttons'],
        interactive: true,
        responsive: true,
        theme: 'light' as const,
        metadata: {
          title: 'Theme Preview',
          description: 'Design system theme preview',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 4,
          previewType: 'website',
        },
      };

      const html = generator.generateThemePreviewHTML(data);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Theme Preview');
    });
  });

  describe('Accessibility testing methods', () => {
    test('should generate accessibility report', () => {
      const testHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Test</title></head>
        <body>
          <h1>Test Page</h1>
          <button>Click me</button>
        </body>
        </html>
      `;

      const result = generator.generateAccessibilityReport(testHTML);

      expect(result).toHaveProperty('report');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalIssues');
      expect(result.summary).toHaveProperty('criticalIssues');
      expect(result.summary).toHaveProperty('overallScore');
      expect(result.summary).toHaveProperty('wcagLevel');
    });

    test('should test color accessibility', () => {
      const colors = [
        { hex: '#FF0000', name: 'Red' },
        { hex: '#00FF00', name: 'Green' },
        { hex: '#0000FF' }, // No name
      ];

      const backgrounds = ['#ffffff', '#000000'];

      const result = generator.testColorAccessibility(colors, backgrounds);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('color', '#FF0000');
      expect(result[0]).toHaveProperty('name', 'Red');
      expect(result[0]).toHaveProperty('backgrounds');
      expect(result[0]?.backgrounds).toHaveLength(2);

      expect(result[2]).toHaveProperty('color', '#0000FF');
      expect(result[2]).not.toHaveProperty('name');

      // Check background test results
      result.forEach(colorResult => {
        colorResult.backgrounds.forEach(bgResult => {
          expect(bgResult).toHaveProperty('background');
          expect(bgResult).toHaveProperty('contrastRatio');
          expect(bgResult).toHaveProperty('wcagAA');
          expect(bgResult).toHaveProperty('wcagAAA');
          expect(typeof bgResult.contrastRatio).toBe('number');
          expect(typeof bgResult.wcagAA).toBe('boolean');
          expect(typeof bgResult.wcagAAA).toBe('boolean');
        });
      });
    });

    test('should test color accessibility with default backgrounds', () => {
      const colors = [{ hex: '#666666', name: 'Gray' }];

      const result = generator.testColorAccessibility(colors);

      expect(result).toHaveLength(1);
      expect(result[0]?.backgrounds).toHaveLength(2); // Default white and black
      expect(result[0]?.backgrounds?.[0]?.background).toBe('#ffffff');
      expect(result[0]?.backgrounds?.[1]?.background).toBe('#000000');
    });
  });

  describe('Helper methods', () => {
    test('should handle invalid hex colors in textColor helper', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: 'invalid-color',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { showValues: true },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);
      // Should default to black text for invalid colors
      expect(html).toContain('color: #000000');
    });

    test('should handle math helper operations', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { size: 'large' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);
      // The math helper should be used in the template
      expect(html).toContain('<!DOCTYPE html>');
    });

    test('should handle equality helper', () => {
      const data: PaletteVisualizationData = {
        colors: [
          {
            hex: '#FF0000',
            rgb: 'rgb(255, 0, 0)',
            hsl: 'hsl(0, 100%, 50%)',
          },
        ],
        options: { layout: 'grid' },
        metadata: {
          title: 'Test Palette',
          description: 'Test description',
          timestamp: '2024-01-01 12:00:00',
          colorCount: 1,
        },
      };

      const html = generator.generatePaletteHTML(data);
      // The eq helper should be used in conditional rendering
      expect(html).toContain('palette-layout-grid');
    });
  });
});
