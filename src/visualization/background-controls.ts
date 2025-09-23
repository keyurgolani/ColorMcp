/**
 * Background Controls System for HTML Visualizations
 * Provides interactive background switching and color picker functionality
 */

import Handlebars from 'handlebars';

export interface BackgroundControlConfig {
  enableToggle: boolean;
  enableColorPicker: boolean;
  defaultBackground: 'light' | 'dark' | 'auto';
  customColors: string[];
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  accessibility: {
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
    highContrast: boolean;
  };
}

export const defaultBackgroundConfig: BackgroundControlConfig = {
  enableToggle: true,
  enableColorPicker: true,
  defaultBackground: 'light',
  customColors: [
    '#ffffff',
    '#f8f9fa',
    '#e9ecef',
    '#1a1a1a',
    '#212529',
    '#343a40',
  ],
  position: 'top-right',
  accessibility: {
    keyboardNavigation: true,
    screenReaderSupport: true,
    highContrast: true,
  },
};

/**
 * Register Handlebars helpers for background controls
 */
export function registerBackgroundControlHelpers(): void {
  // Helper to generate background toggle button
  Handlebars.registerHelper(
    'backgroundToggle',
    function (config: Partial<BackgroundControlConfig> = {}) {
      const mergedConfig = { ...defaultBackgroundConfig, ...config };

      if (!mergedConfig.enableToggle) {
        return '';
      }

      return new Handlebars.SafeString(`
      <button 
        id="background-toggle-btn" 
        class="background-control-btn toggle-btn"
        type="button"
        aria-label="Toggle between light and dark backgrounds"
        aria-pressed="false"
        title="Toggle background (Alt+T)"
        data-keyboard-shortcut="Alt+T">
        <span class="toggle-icon light-icon" aria-hidden="true">☀️</span>
        <span class="toggle-icon dark-icon" aria-hidden="true">🌙</span>
        <span class="sr-only">Toggle background theme</span>
      </button>
    `);
    }
  );

  // Helper to generate color picker
  Handlebars.registerHelper(
    'backgroundColorPicker',
    function (config: Partial<BackgroundControlConfig> = {}) {
      const mergedConfig = { ...defaultBackgroundConfig, ...config };

      if (!mergedConfig.enableColorPicker) {
        return '';
      }

      const presetColors = mergedConfig.customColors
        .map(
          color =>
            `<button class="preset-color-btn" 
               data-color="${color}" 
               style="background-color: ${color};"
               aria-label="Set background to ${color}"
               title="${color}"></button>`
        )
        .join('');

      return new Handlebars.SafeString(`
      <div class="background-color-picker" role="group" aria-label="Background color picker">
        <button 
          id="color-picker-toggle" 
          class="background-control-btn picker-toggle-btn"
          type="button"
          aria-expanded="false"
          aria-controls="color-picker-panel"
          aria-label="Open background color picker"
          title="Choose background color">
          <span class="picker-icon" aria-hidden="true">🎨</span>
          <span class="sr-only">Background color picker</span>
        </button>
        
        <div 
          id="color-picker-panel" 
          class="color-picker-panel" 
          role="dialog"
          aria-label="Background color selection"
          aria-hidden="true">
          
          <div class="color-picker-header">
            <h3 id="color-picker-title">Background Color</h3>
            <button 
              class="close-picker-btn" 
              type="button"
              aria-label="Close color picker"
              title="Close (Escape)">
              ✕
            </button>
          </div>
          
          <div class="color-picker-content">
            <div class="preset-colors" role="group" aria-label="Preset colors">
              <h4>Preset Colors</h4>
              <div class="preset-grid">
                ${presetColors}
              </div>
            </div>
            
            <div class="custom-color-section">
              <label for="custom-color-input">Custom Color:</label>
              <div class="custom-color-controls">
                <input 
                  type="color" 
                  id="custom-color-input"
                  class="custom-color-input"
                  value="#ffffff"
                  aria-label="Select custom background color">
                <input 
                  type="text" 
                  id="custom-color-text"
                  class="custom-color-text"
                  placeholder="#ffffff"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="Enter hex color value">
              </div>
            </div>
            
            <div class="color-picker-actions">
              <button 
                id="reset-background-btn" 
                class="reset-btn"
                type="button"
                aria-label="Reset to default background">
                Reset
              </button>
              <button 
                id="apply-color-btn" 
                class="apply-btn"
                type="button"
                aria-label="Apply selected color">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    `);
    }
  );

  // Helper to generate accessibility warning
  Handlebars.registerHelper('accessibilityWarning', function () {
    return new Handlebars.SafeString(`
      <div 
        id="accessibility-warning" 
        class="accessibility-warning" 
        role="alert"
        aria-live="polite"
        style="display: none;">
        <span class="warning-icon" aria-hidden="true">⚠️</span>
        <span class="warning-text"></span>
        <button 
          class="dismiss-warning-btn" 
          type="button"
          aria-label="Dismiss warning">
          ✕
        </button>
      </div>
    `);
  });

  // Helper to generate complete background controls container
  Handlebars.registerHelper(
    'backgroundControls',
    function (config: Partial<BackgroundControlConfig> = {}) {
      const mergedConfig = { ...defaultBackgroundConfig, ...config };

      const positionClass = `controls-${mergedConfig.position}`;
      const toggleButton = mergedConfig.enableToggle
        ? (
            Handlebars.helpers['backgroundToggle'] as (
              config: unknown
            ) => string
          )?.(config) || ''
        : '';
      const colorPicker = mergedConfig.enableColorPicker
        ? (
            Handlebars.helpers['backgroundColorPicker'] as (
              config: unknown
            ) => string
          )?.(config) || ''
        : '';
      const accessibilityWarning =
        (Handlebars.helpers['accessibilityWarning'] as () => string)?.() || '';

      return new Handlebars.SafeString(`
      <div 
        class="background-controls ${positionClass}" 
        role="toolbar" 
        aria-label="Background controls"
        data-default-background="${mergedConfig.defaultBackground}">
        
        ${toggleButton}
        ${colorPicker}
        ${accessibilityWarning}
        
        <div class="controls-help" style="display: none;">
          <h4>Keyboard Shortcuts</h4>
          <ul>
            <li><kbd>Alt+T</kbd> - Toggle background</li>
            <li><kbd>Alt+C</kbd> - Open color picker</li>
            <li><kbd>Escape</kbd> - Close color picker</li>
            <li><kbd>Tab</kbd> - Navigate controls</li>
          </ul>
        </div>
      </div>
    `);
    }
  );

  // Helper to check if background controls should be included
  Handlebars.registerHelper(
    'shouldIncludeBackgroundControls',
    function (
      config?: Partial<BackgroundControlConfig>,
      options?: { hash: Partial<BackgroundControlConfig> }
    ) {
      // Handle both parameter and hash-based calls
      const actualConfig = config || options?.hash || {};
      const mergedConfig = { ...defaultBackgroundConfig, ...actualConfig };

      return mergedConfig.enableToggle || mergedConfig.enableColorPicker;
    }
  );

  // Helper to generate CSS custom properties for background controls
  Handlebars.registerHelper(
    'backgroundControlsCSS',
    function (config: Partial<BackgroundControlConfig> = {}) {
      const mergedConfig = { ...defaultBackgroundConfig, ...config };

      return new Handlebars.SafeString(`
      :root {
        --bg-controls-position: ${mergedConfig.position};
        --bg-controls-default: ${mergedConfig.defaultBackground === 'light' ? '#ffffff' : '#1a1a1a'};
        --bg-controls-accent: ${mergedConfig.defaultBackground === 'light' ? '#2563eb' : '#60a5fa'};
        --bg-controls-text: ${mergedConfig.defaultBackground === 'light' ? '#1e293b' : '#f1f5f9'};
        --bg-controls-border: ${mergedConfig.defaultBackground === 'light' ? '#e2e8f0' : '#374151'};
        --bg-controls-shadow: ${
          mergedConfig.defaultBackground === 'light'
            ? 'rgba(0, 0, 0, 0.1)'
            : 'rgba(0, 0, 0, 0.3)'
        };
      }
    `);
    }
  );
}

/**
 * Generate CSS for background controls
 */
export function generateBackgroundControlsCSS(
  _config: Partial<BackgroundControlConfig> = {}
): string {
  return `
    /* Background Controls Styles */
    .background-controls {
      position: fixed;
      z-index: 1000;
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      background: var(--bg-controls-default);
      border: 1px solid var(--bg-controls-border);
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px var(--bg-controls-shadow);
      transition: all 0.2s ease-in-out;
    }

    .background-controls.controls-top-right {
      top: 1rem;
      right: 1rem;
    }

    .background-controls.controls-top-left {
      top: 1rem;
      left: 1rem;
    }

    .background-controls.controls-bottom-right {
      bottom: 1rem;
      right: 1rem;
    }

    .background-controls.controls-bottom-left {
      bottom: 1rem;
      left: 1rem;
    }

    .background-control-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      background: transparent;
      border: 1px solid var(--bg-controls-border);
      border-radius: 0.375rem;
      color: var(--bg-controls-text);
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      font-size: 1.125rem;
    }

    .background-control-btn:hover {
      background: var(--bg-controls-accent);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px -1px var(--bg-controls-shadow);
    }

    .background-control-btn:focus {
      outline: 2px solid var(--bg-controls-accent);
      outline-offset: 2px;
    }

    .background-control-btn:active {
      transform: translateY(0);
    }

    /* Toggle Button Styles */
    .toggle-btn[aria-pressed="false"] .dark-icon {
      display: none;
    }

    .toggle-btn[aria-pressed="true"] .light-icon {
      display: none;
    }

    /* Color Picker Styles */
    .background-color-picker {
      position: relative;
    }

    .color-picker-panel {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 20rem;
      max-width: 90vw;
      background: var(--bg-controls-default);
      border: 1px solid var(--bg-controls-border);
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px var(--bg-controls-shadow);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-0.5rem);
      transition: all 0.2s ease-in-out;
      z-index: 1001;
    }

    .color-picker-panel[aria-hidden="false"] {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .color-picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid var(--bg-controls-border);
    }

    .color-picker-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--bg-controls-text);
    }

    .close-picker-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0.25rem;
      color: var(--bg-controls-text);
      cursor: pointer;
      font-size: 0.875rem;
    }

    .close-picker-btn:hover {
      background: var(--bg-controls-border);
    }

    .color-picker-content {
      padding: 1rem;
    }

    .preset-colors h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--bg-controls-text);
    }

    .preset-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .preset-color-btn {
      width: 2rem;
      height: 2rem;
      border: 2px solid var(--bg-controls-border);
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }

    .preset-color-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 4px -1px var(--bg-controls-shadow);
    }

    .preset-color-btn:focus {
      outline: 2px solid var(--bg-controls-accent);
      outline-offset: 2px;
    }

    .custom-color-section {
      margin-bottom: 1rem;
    }

    .custom-color-section label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--bg-controls-text);
    }

    .custom-color-controls {
      display: flex;
      gap: 0.5rem;
    }

    .custom-color-input {
      width: 3rem;
      height: 2.5rem;
      border: 1px solid var(--bg-controls-border);
      border-radius: 0.375rem;
      cursor: pointer;
    }

    .custom-color-text {
      flex: 1;
      height: 2.5rem;
      padding: 0 0.75rem;
      border: 1px solid var(--bg-controls-border);
      border-radius: 0.375rem;
      background: transparent;
      color: var(--bg-controls-text);
      font-family: monospace;
    }

    .custom-color-text:focus {
      outline: 2px solid var(--bg-controls-accent);
      outline-offset: -2px;
      border-color: var(--bg-controls-accent);
    }

    .color-picker-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .reset-btn,
    .apply-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--bg-controls-border);
      border-radius: 0.375rem;
      background: transparent;
      color: var(--bg-controls-text);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.15s ease-in-out;
    }

    .apply-btn {
      background: var(--bg-controls-accent);
      color: white;
      border-color: var(--bg-controls-accent);
    }

    .reset-btn:hover,
    .apply-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px -1px var(--bg-controls-shadow);
    }

    /* Accessibility Warning Styles */
    .accessibility-warning {
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #fbbf24;
      color: #92400e;
      border: 1px solid #f59e0b;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1002;
      max-width: 90vw;
      font-size: 0.875rem;
    }

    .warning-icon {
      font-size: 1rem;
    }

    .dismiss-warning-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0.25rem;
      color: #92400e;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .dismiss-warning-btn:hover {
      background: rgba(146, 64, 14, 0.1);
    }

    /* Screen Reader Only Content */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* High Contrast Mode Support */
    @media (prefers-contrast: high) {
      .background-controls {
        border-width: 2px;
      }
      
      .background-control-btn {
        border-width: 2px;
      }
      
      .background-control-btn:focus {
        outline-width: 3px;
      }
    }

    /* Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
      .background-controls,
      .background-control-btn,
      .color-picker-panel,
      .preset-color-btn {
        transition: none;
      }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .background-controls {
        padding: 0.5rem;
        gap: 0.375rem;
      }
      
      .background-control-btn {
        width: 2.25rem;
        height: 2.25rem;
        font-size: 1rem;
      }
      
      .color-picker-panel {
        width: 18rem;
        right: -1rem;
      }
    }

    /* Dark Mode Adjustments */
    [data-background-theme="dark"] {
      --bg-controls-default: #1a1a1a;
      --bg-controls-accent: #60a5fa;
      --bg-controls-text: #f1f5f9;
      --bg-controls-border: #374151;
      --bg-controls-shadow: rgba(0, 0, 0, 0.3);
    }
  `;
}
