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

      expect(html).toContain(':root {');
      expect(html).toContain('--color-primary');
      expect(html).toContain('--spacing-');
      expect(html).toContain('--border-radius');
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
      expect(html).toContain('.sr-only');
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
      expect(html).toContain('initializePaletteVisualization');
      expect(html).toContain('setupKeyboardNavigation');
      expect(html).toContain('copyColorToClipboard');
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
      expect(html).toContain('Home');
      expect(html).toContain('End');
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
      expect(html).toContain('fallbackCopyToClipboard');
      expect(html).toContain('copyColorToClipboard');
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

      expect(html).toContain('exportPalette');
      expect(html).toContain('generateCSSExport');
      expect(html).toContain('downloadFile');
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
      expect(html).toContain('contrast-ratio');
      expect(html).toContain('wcag-badge');
      expect(html).toContain('aria-describedby=');
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
      expect(html).toContain('<footer');
      expect(html).toContain('<h1>');
      expect(html).toContain('<time');
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
});
