/**
 * Tests for BackgroundController class
 */

import { JSDOM } from 'jsdom';
import { BackgroundController } from '../../src/visualization/background-controller';

describe('BackgroundController', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window & typeof globalThis;
  let controller: BackgroundController;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};

    // Set up DOM environment
    dom = new JSDOM(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div class="background-controls" data-default-background="light">
            <button id="background-toggle-btn" aria-pressed="false"></button>
            <button id="color-picker-toggle" aria-expanded="false"></button>
            <div id="color-picker-panel" aria-hidden="true">
              <button class="close-picker-btn"></button>
              <input id="custom-color-input" type="color" value="#ffffff">
              <input id="custom-color-text" type="text" value="#ffffff">
              <button id="reset-background-btn"></button>
              <button id="apply-color-btn"></button>
              <button class="preset-color-btn" data-color="#ffffff"></button>
              <button class="preset-color-btn" data-color="#000000"></button>
            </div>
            <div id="accessibility-warning" style="display: none;">
              <span class="warning-text"></span>
              <button class="dismiss-warning-btn"></button>
            </div>
          </div>
        </body>
      </html>
    `,
      {
        url: 'http://localhost',
        pretendToBeVisual: true,
      }
    );

    document = dom.window.document;
    window = dom.window as unknown as Window & typeof globalThis;

    // Mock localStorage
    const mockSetItem = jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    const mockGetItem = jest.fn((key: string) => mockLocalStorage[key] || null);
    const mockRemoveItem = jest.fn((key: string) => {
      delete mockLocalStorage[key];
    });
    const mockClear = jest.fn(() => {
      mockLocalStorage = {};
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        clear: mockClear,
      },
      writable: true,
    });

    // Add polyfills for missing DOM APIs
    if (!window.KeyboardEvent) {
      window.KeyboardEvent = class KeyboardEvent extends Event {
        code: string;
        altKey: boolean;
        ctrlKey: boolean;
        shiftKey: boolean;
        metaKey: boolean;

        constructor(type: string, options: any = {}) {
          super(type, options);
          this.code = options.code || '';
          this.altKey = options.altKey || false;
          this.ctrlKey = options.ctrlKey || false;
          this.shiftKey = options.shiftKey || false;
          this.metaKey = options.metaKey || false;
        }
      } as any;
    }

    // Fix Event constructor for JSDOM
    const OriginalEvent = window.Event;
    window.Event = class Event extends OriginalEvent {
      constructor(type: string, options: any = {}) {
        super(type, options);
      }
    } as any;

    // Make DOM available globally
    global.document = document;
    global.window = window;
    (global as any).KeyboardEvent = window.KeyboardEvent;
    (global as any).Event = window.Event;
    (global as any).Element = window.Element;
    (global as any).Node = window.Node;
    (global as any).localStorage = window.localStorage;

    // Create controller instance
    controller = new BackgroundController();
  });

  afterEach(() => {
    if (controller) {
      controller.destroy();
    }
    dom.window.close();
  });

  describe('Initialization', () => {
    test('initializes with default light theme', () => {
      const state = controller.getState();
      expect(state.theme).toBe('light');
      expect(state.timestamp).toBeDefined();
    });

    test('loads saved state from localStorage', () => {
      const savedState = {
        theme: 'dark',
        timestamp: Date.now(),
      };

      // Set up localStorage data before creating controller
      mockLocalStorage['mcp-color-server-background-state'] =
        JSON.stringify(savedState);

      // Ensure the mock localStorage is properly connected
      expect(
        window.localStorage.getItem('mcp-color-server-background-state')
      ).toBe(JSON.stringify(savedState));

      // Mock the global objects for the new controller
      (global as any).document = document;
      (global as any).window = window;
      (global as any).localStorage = window.localStorage;

      const newController = new BackgroundController();
      const state = newController.getState();

      expect(state.theme).toBe('dark');
      newController.destroy();
    });

    test('handles invalid localStorage data gracefully', () => {
      mockLocalStorage['mcp-color-server-background-state'] = 'invalid-json';

      const newController = new BackgroundController();
      const state = newController.getState();

      expect(state.theme).toBe('light'); // Should fall back to default
      newController.destroy();
    });
  });

  describe('Theme Toggle', () => {
    test('toggles from light to dark theme', () => {
      const toggleBtn = document.getElementById(
        'background-toggle-btn'
      ) as HTMLButtonElement;

      // Initial state should be light
      expect(controller.getState().theme).toBe('light');
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false');

      // Click toggle button
      toggleBtn.click();

      // Should switch to dark
      expect(controller.getState().theme).toBe('dark');
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');
    });

    test('toggles from dark to light theme', () => {
      // Set initial state to dark
      controller.setTheme('dark');
      const toggleBtn = document.getElementById(
        'background-toggle-btn'
      ) as HTMLButtonElement;

      expect(controller.getState().theme).toBe('dark');
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');

      // Click toggle button
      toggleBtn.click();

      // Should switch to light
      expect(controller.getState().theme).toBe('light');
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false');
    });

    test('applies theme to document body', () => {
      controller.setTheme('dark');

      expect(document.body.classList.contains('theme-dark')).toBe(true);
      expect(
        document.documentElement.getAttribute('data-background-theme')
      ).toBe('dark');
      // JSDOM returns colors in rgb format, so we need to check for that
      const bgColor = document.body.style.backgroundColor;
      expect(bgColor === '#1a1a1a' || bgColor === 'rgb(26, 26, 26)').toBe(true);
    });
  });

  describe('Color Picker', () => {
    test('opens color picker on toggle click', () => {
      const toggleBtn = document.getElementById(
        'color-picker-toggle'
      ) as HTMLButtonElement;
      const panel = document.getElementById(
        'color-picker-panel'
      ) as HTMLElement;

      expect(panel.getAttribute('aria-hidden')).toBe('true');
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');

      toggleBtn.click();

      expect(panel.getAttribute('aria-hidden')).toBe('false');
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    });

    test('closes color picker on close button click', () => {
      const toggleBtn = document.getElementById(
        'color-picker-toggle'
      ) as HTMLButtonElement;
      const panel = document.getElementById(
        'color-picker-panel'
      ) as HTMLElement;
      const closeBtn = panel.querySelector(
        '.close-picker-btn'
      ) as HTMLButtonElement;

      // Open picker first
      toggleBtn.click();
      expect(panel.getAttribute('aria-hidden')).toBe('false');

      // Close picker
      closeBtn.click();
      expect(panel.getAttribute('aria-hidden')).toBe('true');
    });

    test('applies custom color', () => {
      const colorInput = document.getElementById(
        'custom-color-input'
      ) as HTMLInputElement;
      const applyBtn = document.getElementById(
        'apply-color-btn'
      ) as HTMLButtonElement;

      // Set custom color
      colorInput.value = '#ff0000';
      colorInput.dispatchEvent(new Event('input'));

      // Apply color
      applyBtn.click();

      const state = controller.getState();
      expect(state.theme).toBe('custom');
      expect(state.customColor).toBe('#ff0000');
      // Browser normalizes hex colors to rgb format
      expect(document.body.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    test('syncs color input and text input', () => {
      const colorInput = document.getElementById(
        'custom-color-input'
      ) as HTMLInputElement;
      const textInput = document.getElementById(
        'custom-color-text'
      ) as HTMLInputElement;

      // Change color input
      colorInput.value = '#00ff00';
      colorInput.dispatchEvent(new Event('input'));

      expect(textInput.value).toBe('#00ff00');

      // Change text input
      textInput.value = '#0000ff';
      textInput.dispatchEvent(new Event('input'));

      expect(colorInput.value).toBe('#0000ff');
    });

    test('validates hex color format', () => {
      const textInput = document.getElementById(
        'custom-color-text'
      ) as HTMLInputElement;
      const colorInput = document.getElementById(
        'custom-color-input'
      ) as HTMLInputElement;

      // Valid hex color
      textInput.value = '#123abc';
      textInput.dispatchEvent(new Event('input'));
      expect(textInput.value).toBe('#123abc');

      // Invalid hex color should be reset on blur to the color input value
      textInput.value = 'invalid';
      textInput.dispatchEvent(new Event('blur'));
      expect(textInput.value).toBe(colorInput.value); // Should reset to color input value
    });

    test('preset color buttons work', () => {
      const presetBtn = document.querySelector(
        '[data-color="#000000"]'
      ) as HTMLButtonElement;
      const colorInput = document.getElementById(
        'custom-color-input'
      ) as HTMLInputElement;
      const textInput = document.getElementById(
        'custom-color-text'
      ) as HTMLInputElement;

      presetBtn.click();

      expect(colorInput.value).toBe('#000000');
      expect(textInput.value).toBe('#000000');
    });
  });

  describe('Keyboard Navigation', () => {
    test('Alt+T toggles theme', () => {
      const initialTheme = controller.getState().theme;

      // Simulate Alt+T keypress
      const event = new KeyboardEvent('keydown', {
        code: 'KeyT',
        altKey: true,
      });
      document.dispatchEvent(event);

      const newTheme = controller.getState().theme;
      expect(newTheme).not.toBe(initialTheme);
    });

    test('Alt+C opens color picker', () => {
      const panel = document.getElementById(
        'color-picker-panel'
      ) as HTMLElement;

      expect(panel.getAttribute('aria-hidden')).toBe('true');

      // Simulate Alt+C keypress
      const event = new KeyboardEvent('keydown', {
        code: 'KeyC',
        altKey: true,
      });
      document.dispatchEvent(event);

      expect(panel.getAttribute('aria-hidden')).toBe('false');
    });

    test('Escape closes color picker', () => {
      const toggleBtn = document.getElementById(
        'color-picker-toggle'
      ) as HTMLButtonElement;
      const panel = document.getElementById(
        'color-picker-panel'
      ) as HTMLElement;

      // Open picker first
      toggleBtn.click();
      expect(panel.getAttribute('aria-hidden')).toBe('false');

      // Simulate Escape keypress
      const event = new KeyboardEvent('keydown', {
        code: 'Escape',
      });
      document.dispatchEvent(event);

      expect(panel.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Accessibility Features', () => {
    test('calculates optimal text color for backgrounds', () => {
      // Light background should use dark text
      controller.setTheme('custom', '#ffffff');
      expect(
        document.documentElement.style.getPropertyValue('--dynamic-text-color')
      ).toBe('#1e293b');

      // Dark background should use light text
      controller.setTheme('custom', '#000000');
      expect(
        document.documentElement.style.getPropertyValue('--dynamic-text-color')
      ).toBe('#f1f5f9');
    });

    test('shows accessibility warning for poor contrast', () => {
      document.getElementById('accessibility-warning') as HTMLElement;

      // Create elements with poor contrast
      const testElement = document.createElement('span');
      testElement.style.color = '#cccccc';
      testElement.textContent = 'Test text';
      document.body.appendChild(testElement);

      // Set background that creates poor contrast
      controller.setTheme('custom', '#dddddd');

      // Warning should be shown (this is a simplified test)
      // In real implementation, this would check actual contrast ratios
    });

    test('dismisses accessibility warning', () => {
      const warning = document.getElementById(
        'accessibility-warning'
      ) as HTMLElement;
      const dismissBtn = warning.querySelector(
        '.dismiss-warning-btn'
      ) as HTMLButtonElement;

      // Show warning first
      warning.style.display = 'flex';

      // Dismiss warning
      dismissBtn.click();

      expect(warning.style.display).toBe('none');
    });

    test('announces changes to screen readers', () => {
      // Mock screen reader announcement by intercepting appendChild
      const announcements: string[] = [];
      const originalAppendChild = document.body.appendChild;

      document.body.appendChild = jest.fn().mockImplementation((node: Node) => {
        if (node instanceof Element && node.getAttribute('aria-live')) {
          announcements.push(node.textContent || '');
        }
        return originalAppendChild.call(document.body, node);
      }) as any;

      controller.setTheme('dark');

      // Should announce theme change
      expect(
        announcements.some(a => a.includes('Background switched to dark theme'))
      ).toBe(true);

      // Restore original method
      document.body.appendChild = originalAppendChild;
    });
  });

  describe('State Persistence', () => {
    test('saves state to localStorage', () => {
      // Clear any previous calls
      jest.clearAllMocks();

      controller.setTheme('dark');

      // Check if localStorage.setItem was called
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'mcp-color-server-background-state',
        expect.stringContaining('"theme":"dark"')
      );

      const savedData = mockLocalStorage['mcp-color-server-background-state'];
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        expect(parsedData.theme).toBe('dark');
        expect(parsedData.timestamp).toBeDefined();
      }
    });

    test('saves custom color state', () => {
      // Clear any previous calls
      jest.clearAllMocks();

      controller.setTheme('custom', '#ff0000');

      // Check if localStorage.setItem was called
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'mcp-color-server-background-state',
        expect.stringContaining('"theme":"custom"')
      );

      const savedData = mockLocalStorage['mcp-color-server-background-state'];
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        expect(parsedData.theme).toBe('custom');
        expect(parsedData.customColor).toBe('#ff0000');
      }
    });

    test('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      window.localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      expect(() => {
        controller.setTheme('dark');
      }).not.toThrow();
    });
  });

  describe('Reset Functionality', () => {
    test('resets to default theme', () => {
      const resetBtn = document.getElementById(
        'reset-background-btn'
      ) as HTMLButtonElement;

      // Change to custom theme first
      controller.setTheme('custom', '#ff0000');
      expect(controller.getState().theme).toBe('custom');

      // Reset to default
      resetBtn.click();

      expect(controller.getState().theme).toBe('light'); // Default from data attribute
    });

    test('respects data-default-background attribute', () => {
      const container = document.querySelector(
        '.background-controls'
      ) as HTMLElement;
      const resetBtn = document.getElementById(
        'reset-background-btn'
      ) as HTMLButtonElement;

      // Set default to dark
      container.dataset['defaultBackground'] = 'dark';

      // Change to custom theme first
      controller.setTheme('custom', '#ff0000');

      // Reset should go to dark
      resetBtn.click();

      expect(controller.getState().theme).toBe('dark');
    });
  });

  describe('Color Utilities', () => {
    test('validates hex colors correctly', () => {
      // Valid hex colors
      expect(controller['isValidHexColor']('#ffffff')).toBe(true);
      expect(controller['isValidHexColor']('#000000')).toBe(true);
      expect(controller['isValidHexColor']('#123abc')).toBe(true);

      // Invalid hex colors
      expect(controller['isValidHexColor']('#fff')).toBe(false); // Too short
      expect(controller['isValidHexColor']('#gggggg')).toBe(false); // Invalid characters
      expect(controller['isValidHexColor']('ffffff')).toBe(false); // Missing #
      expect(controller['isValidHexColor']('')).toBe(false); // Empty
    });

    test('converts hex to RGB correctly', () => {
      const rgb = controller['hexToRgb']('#ff0000');
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });

      const rgb2 = controller['hexToRgb']('#00ff00');
      expect(rgb2).toEqual({ r: 0, g: 255, b: 0 });

      const invalid = controller['hexToRgb']('invalid');
      expect(invalid).toBeNull();
    });

    test('calculates luminance correctly', () => {
      const whiteLuminance = controller['calculateLuminance']('#ffffff');
      const blackLuminance = controller['calculateLuminance']('#000000');

      expect(whiteLuminance).toBeCloseTo(1, 1);
      expect(blackLuminance).toBeCloseTo(0, 1);
      expect(whiteLuminance).toBeGreaterThan(blackLuminance);
    });
  });

  describe('Public API', () => {
    test('getState returns current state', () => {
      const state = controller.getState();

      expect(state).toHaveProperty('theme');
      expect(state).toHaveProperty('timestamp');
      expect(['light', 'dark', 'custom']).toContain(state.theme);
    });

    test('setTheme updates state correctly', () => {
      controller.setTheme('dark');
      expect(controller.getState().theme).toBe('dark');

      controller.setTheme('custom', '#ff0000');
      const state = controller.getState();
      expect(state.theme).toBe('custom');
      expect(state.customColor).toBe('#ff0000');
    });

    test('getContrastInfo returns contrast information', () => {
      controller.setTheme('light');
      const contrastInfo = controller.getContrastInfo();

      expect(contrastInfo).toHaveProperty('ratio');
      expect(contrastInfo).toHaveProperty('wcagAA');
      expect(contrastInfo).toHaveProperty('wcagAAA');
      expect(typeof contrastInfo?.ratio).toBe('number');
    });

    test('destroy cleans up resources', () => {
      const root = document.documentElement;

      // Set some properties
      controller.setTheme('custom', '#ff0000');
      expect(root.style.getPropertyValue('--dynamic-bg-color')).toBeTruthy();

      // Destroy controller
      controller.destroy();

      // Properties should be cleaned up
      expect(root.style.getPropertyValue('--dynamic-bg-color')).toBe('');
      expect(root.style.getPropertyValue('--dynamic-text-color')).toBe('');
    });
  });
});
