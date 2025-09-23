/**
 * Tests for Background Controls System
 */

import { JSDOM } from 'jsdom';
import {
  registerBackgroundControlHelpers,
  generateBackgroundControlsCSS,
  defaultBackgroundConfig,
} from '../../src/visualization/background-controls';
import Handlebars from 'handlebars';

describe('Background Controls', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body></body>
      </html>
    `,
      {
        url: 'http://localhost',
        pretendToBeVisual: true,
      }
    );

    document = dom.window.document;
    window = dom.window as unknown as Window;

    // Make DOM available globally for tests
    global.document = document;
    (global as any).window = window;

    // Register helpers
    registerBackgroundControlHelpers();
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Handlebars Helpers', () => {
    test('backgroundToggle helper generates toggle button', () => {
      const template = Handlebars.compile('{{backgroundToggle}}');
      const html = template({});

      expect(html).toContain('id="background-toggle-btn"');
      expect(html).toContain(
        'aria-label="Toggle between light and dark backgrounds"'
      );
      expect(html).toContain('data-keyboard-shortcut="Alt+T"');
      expect(html).toContain('☀️'); // Light icon
      expect(html).toContain('🌙'); // Dark icon
    });

    test('backgroundColorPicker helper generates color picker', () => {
      const template = Handlebars.compile('{{backgroundColorPicker}}');
      const html = template({});

      expect(html).toContain('id="color-picker-toggle"');
      expect(html).toContain('id="color-picker-panel"');
      expect(html).toContain('id="custom-color-input"');
      expect(html).toContain('preset-color-btn');
      expect(html).toContain('role="dialog"');
    });

    test('accessibilityWarning helper generates warning element', () => {
      const template = Handlebars.compile('{{accessibilityWarning}}');
      const html = template({});

      expect(html).toContain('id="accessibility-warning"');
      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('⚠️'); // Warning icon
    });

    test('backgroundControls helper generates complete controls', () => {
      const template = Handlebars.compile('{{backgroundControls}}');
      const html = template({});

      expect(html).toContain('class="background-controls');
      expect(html).toContain('role="toolbar"');
      expect(html).toContain('aria-label="Background controls"');
      expect(html).toContain('background-toggle-btn');
      expect(html).toContain('color-picker-toggle');
    });

    test('backgroundControls respects configuration', () => {
      const config = {
        enableToggle: false,
        enableColorPicker: true,
        position: 'top-left' as const,
      };

      const template = Handlebars.compile('{{backgroundControls this}}');
      const html = template(config);

      expect(html).not.toContain('background-toggle-btn');
      expect(html).toContain('color-picker-toggle');
      expect(html).toContain('controls-top-left');
    });

    test('shouldIncludeBackgroundControls helper works correctly', () => {
      const template = Handlebars.compile(
        '{{#if (shouldIncludeBackgroundControls options.backgroundControls)}}YES{{else}}NO{{/if}}'
      );

      // Should include when toggle or picker is enabled
      let html = template({
        options: {
          backgroundControls: { enableToggle: true, enableColorPicker: false },
        },
      });
      expect(html).toBe('YES');

      // Should not include when both are disabled
      html = template({
        options: {
          backgroundControls: { enableToggle: false, enableColorPicker: false },
        },
      });
      expect(html).toBe('NO');
    });
  });

  describe('CSS Generation', () => {
    test('generateBackgroundControlsCSS returns valid CSS', () => {
      const css = generateBackgroundControlsCSS();

      expect(css).toContain('.background-controls');
      expect(css).toContain('.background-control-btn');
      expect(css).toContain('.color-picker-panel');
      expect(css).toContain('.accessibility-warning');
      expect(css).toContain('@media (max-width: 768px)');
      expect(css).toContain('@media (prefers-contrast: high)');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });

    test('CSS includes all positioning classes', () => {
      const css = generateBackgroundControlsCSS();

      expect(css).toContain('.controls-top-right');
      expect(css).toContain('.controls-top-left');
      expect(css).toContain('.controls-bottom-right');
      expect(css).toContain('.controls-bottom-left');
    });

    test('CSS includes accessibility features', () => {
      const css = generateBackgroundControlsCSS();

      expect(css).toContain('.sr-only');
      expect(css).toContain('prefers-contrast: high');
      expect(css).toContain('prefers-reduced-motion: reduce');
      expect(css).toContain('outline:');
      expect(css).toContain('focus');
    });

    test('CSS includes dark mode support', () => {
      const css = generateBackgroundControlsCSS();

      expect(css).toContain('[data-background-theme="dark"]');
      expect(css).toContain('--bg-controls-default');
      expect(css).toContain('--bg-controls-accent');
    });
  });

  describe('Configuration', () => {
    test('defaultBackgroundConfig has expected properties', () => {
      expect(defaultBackgroundConfig.enableToggle).toBe(true);
      expect(defaultBackgroundConfig.enableColorPicker).toBe(true);
      expect(defaultBackgroundConfig.defaultBackground).toBe('light');
      expect(defaultBackgroundConfig.position).toBe('top-right');
      expect(defaultBackgroundConfig.accessibility.keyboardNavigation).toBe(
        true
      );
      expect(defaultBackgroundConfig.accessibility.screenReaderSupport).toBe(
        true
      );
      expect(defaultBackgroundConfig.customColors).toHaveLength(6);
    });

    test('custom configuration merges with defaults', () => {
      const customConfig = {
        enableToggle: false,
        position: 'bottom-left' as const,
      };

      const template = Handlebars.compile('{{backgroundControls this}}');
      const html = template(customConfig);

      expect(html).toContain('controls-bottom-left');
      expect(html).not.toContain('background-toggle-btn');
      expect(html).toContain('color-picker-toggle'); // Should still be enabled by default
    });
  });

  describe('Accessibility Features', () => {
    test('controls have proper ARIA attributes', () => {
      const template = Handlebars.compile('{{backgroundControls}}');
      const html = template({});

      expect(html).toContain('role="toolbar"');
      expect(html).toContain('aria-label="Background controls"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('aria-controls="color-picker-panel"');
      expect(html).toContain('aria-hidden="true"');
    });

    test('keyboard shortcuts are documented', () => {
      const template = Handlebars.compile('{{backgroundControls}}');
      const html = template({});

      expect(html).toContain('Alt+T');
      expect(html).toContain('Alt+C');
      expect(html).toContain('Escape');
      expect(html).toContain('Tab');
    });

    test('screen reader content is properly hidden', () => {
      const template = Handlebars.compile('{{backgroundControls}}');
      const html = template({});

      expect(html).toContain('class="sr-only"');
      expect(html).toContain('aria-hidden="true"');
    });

    test('color picker has proper dialog structure', () => {
      const template = Handlebars.compile('{{backgroundColorPicker}}');
      const html = template({});

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-label="Background color selection"');
      expect(html).toContain('id="color-picker-title"');
      expect(html).toContain('role="group"');
    });
  });

  describe('Responsive Design', () => {
    test('CSS includes mobile responsive styles', () => {
      const css = generateBackgroundControlsCSS();

      expect(css).toContain('@media (max-width: 768px)');
      expect(css).toMatch(/width:\s*2\.25rem/);
      expect(css).toMatch(/height:\s*2\.25rem/);
    });

    test('color picker adjusts for mobile', () => {
      const css = generateBackgroundControlsCSS();

      expect(css).toContain('width: 18rem');
      expect(css).toContain('right: -1rem');
    });
  });

  describe('Color Validation', () => {
    test('preset colors are valid hex colors', () => {
      defaultBackgroundConfig.customColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    test('default colors provide good contrast options', () => {
      const colors = defaultBackgroundConfig.customColors;

      // Should include light colors
      expect(colors.some(c => c === '#ffffff' || c === '#f8f9fa')).toBe(true);

      // Should include dark colors
      expect(colors.some(c => c === '#1a1a1a' || c === '#212529')).toBe(true);
    });
  });

  describe('Integration', () => {
    test('controls integrate with existing HTML structure', () => {
      const template = Handlebars.compile(`
        <div class="visualization-container">
          {{backgroundControls}}
          <main>Content</main>
        </div>
      `);

      const html = template({});

      expect(html).toContain('visualization-container');
      expect(html).toContain('background-controls');
      expect(html).toContain('<main>Content</main>');
    });

    test('CSS custom properties are properly defined', () => {
      const template = Handlebars.compile('{{backgroundControlsCSS}}');
      const css = template({});

      expect(css).toContain('--bg-controls-position');
      expect(css).toContain('--bg-controls-default');
      expect(css).toContain('--bg-controls-accent');
      expect(css).toContain('--bg-controls-text');
    });
  });

  describe('Error Handling', () => {
    test('helpers handle missing configuration gracefully', () => {
      const template = Handlebars.compile('{{backgroundToggle undefined}}');
      const html = template({});

      // Should still generate toggle button with defaults
      expect(html).toContain('background-toggle-btn');
    });

    test('helpers handle invalid configuration gracefully', () => {
      const template = Handlebars.compile('{{backgroundControls this}}');
      const html = template({ enableToggle: 'invalid' });

      // Should still generate controls
      expect(html).toContain('background-controls');
    });
  });
});
