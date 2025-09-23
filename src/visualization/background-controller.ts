/**
 * BackgroundController - JavaScript class for managing interactive background controls
 * Handles theme switching, color picker, localStorage persistence, and accessibility
 */

export interface BackgroundState {
  theme: 'light' | 'dark' | 'custom';
  customColor?: string;
  timestamp: number;
}

export interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  recommendation?: string;
}

export class BackgroundController {
  private currentState: BackgroundState;
  private elements: {
    container?: HTMLElement;
    toggleBtn?: HTMLButtonElement;
    colorPickerToggle?: HTMLButtonElement;
    colorPickerPanel?: HTMLElement;
    customColorInput?: HTMLInputElement;
    customColorText?: HTMLInputElement;
    resetBtn?: HTMLButtonElement;
    applyBtn?: HTMLButtonElement;
    closeBtn?: HTMLButtonElement;
    accessibilityWarning?: HTMLElement;
    presetColorBtns?: NodeListOf<HTMLButtonElement>;
  } = {};

  private keyboardShortcuts: Map<string, () => void> = new Map();
  private isColorPickerOpen = false;
  private storageKey = 'mcp-color-server-background-state';

  constructor() {
    this.currentState = this.loadState();
    this.init();
  }

  private init(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupElements());
    } else {
      this.setupElements();
    }
  }

  private setupElements(): void {
    // Find all control elements
    this.elements.container = document.querySelector(
      '.background-controls'
    ) as HTMLElement;
    this.elements.toggleBtn = document.getElementById(
      'background-toggle-btn'
    ) as HTMLButtonElement;
    this.elements.colorPickerToggle = document.getElementById(
      'color-picker-toggle'
    ) as HTMLButtonElement;
    this.elements.colorPickerPanel = document.getElementById(
      'color-picker-panel'
    ) as HTMLElement;
    this.elements.customColorInput = document.getElementById(
      'custom-color-input'
    ) as HTMLInputElement;
    this.elements.customColorText = document.getElementById(
      'custom-color-text'
    ) as HTMLInputElement;
    this.elements.resetBtn = document.getElementById(
      'reset-background-btn'
    ) as HTMLButtonElement;
    this.elements.applyBtn = document.getElementById(
      'apply-color-btn'
    ) as HTMLButtonElement;
    this.elements.accessibilityWarning = document.getElementById(
      'accessibility-warning'
    ) as HTMLElement;
    this.elements.presetColorBtns = document.querySelectorAll(
      '.preset-color-btn'
    ) as NodeListOf<HTMLButtonElement>;

    // Find close button within color picker panel
    if (this.elements.colorPickerPanel) {
      this.elements.closeBtn = this.elements.colorPickerPanel.querySelector(
        '.close-picker-btn'
      ) as HTMLButtonElement;
    }

    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.applyCurrentState();
    this.updateAccessibility();
  }

  private setupEventListeners(): void {
    // Toggle button
    if (this.elements.toggleBtn) {
      this.elements.toggleBtn.addEventListener('click', () =>
        this.toggleTheme()
      );
    }

    // Color picker toggle
    if (this.elements.colorPickerToggle) {
      this.elements.colorPickerToggle.addEventListener('click', () =>
        this.toggleColorPicker()
      );
    }

    // Close color picker
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () =>
        this.closeColorPicker()
      );
    }

    // Custom color input
    if (this.elements.customColorInput) {
      this.elements.customColorInput.addEventListener('input', e => {
        const target = e.target as HTMLInputElement;
        if (this.elements.customColorText) {
          this.elements.customColorText.value = target.value;
        }
        this.updateColorPreview(target.value);
      });
    }

    // Custom color text input
    if (this.elements.customColorText) {
      this.elements.customColorText.addEventListener('input', e => {
        const target = e.target as HTMLInputElement;
        const color = target.value;

        if (this.isValidHexColor(color)) {
          if (this.elements.customColorInput) {
            this.elements.customColorInput.value = color;
          }
          this.updateColorPreview(color);
        }
      });

      this.elements.customColorText.addEventListener('blur', e => {
        const target = e.target as HTMLInputElement;
        const color = target.value;

        if (!this.isValidHexColor(color)) {
          target.value = this.elements.customColorInput?.value || '#ffffff';
        }
      });
    }

    // Preset color buttons
    if (this.elements.presetColorBtns) {
      this.elements.presetColorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const color = btn.dataset['color'];
          if (color) {
            this.setCustomColor(color);
          }
        });
      });
    }

    // Reset button
    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () =>
        this.resetToDefault()
      );
    }

    // Apply button
    if (this.elements.applyBtn) {
      this.elements.applyBtn.addEventListener('click', () =>
        this.applyCustomColor()
      );
    }

    // Click outside to close color picker
    document.addEventListener('click', e => {
      if (
        this.isColorPickerOpen &&
        this.elements.colorPickerPanel &&
        !this.elements.colorPickerPanel.contains(e.target as Node) &&
        !this.elements.colorPickerToggle?.contains(e.target as Node)
      ) {
        this.closeColorPicker();
      }
    });

    // Dismiss accessibility warning
    if (this.elements.accessibilityWarning) {
      const dismissBtn = this.elements.accessibilityWarning.querySelector(
        '.dismiss-warning-btn'
      );
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () =>
          this.hideAccessibilityWarning()
        );
      }
    }
  }

  private setupKeyboardShortcuts(): void {
    // Alt+T for toggle
    this.keyboardShortcuts.set('Alt+KeyT', () => this.toggleTheme());

    // Alt+C for color picker
    this.keyboardShortcuts.set('Alt+KeyC', () => this.toggleColorPicker());

    // Escape to close color picker
    this.keyboardShortcuts.set('Escape', () => {
      if (this.isColorPickerOpen) {
        this.closeColorPicker();
      }
    });

    document.addEventListener('keydown', e => {
      const key = `${e.altKey ? 'Alt+' : ''}${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.code}`;
      const handler = this.keyboardShortcuts.get(key);

      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }

  private toggleTheme(): void {
    const newTheme = this.currentState.theme === 'light' ? 'dark' : 'light';
    this.setState({ theme: newTheme, timestamp: Date.now() });
    this.applyCurrentState();
    this.updateAccessibility();
    this.saveState();

    // Announce to screen readers
    this.announceToScreenReader(`Background switched to ${newTheme} theme`);
  }

  private toggleColorPicker(): void {
    if (this.isColorPickerOpen) {
      this.closeColorPicker();
    } else {
      this.openColorPicker();
    }
  }

  private openColorPicker(): void {
    if (!this.elements.colorPickerPanel || !this.elements.colorPickerToggle)
      return;

    this.isColorPickerOpen = true;
    this.elements.colorPickerPanel.setAttribute('aria-hidden', 'false');
    this.elements.colorPickerToggle.setAttribute('aria-expanded', 'true');

    // Focus management
    const firstFocusable = this.elements.colorPickerPanel.querySelector(
      'button, input'
    ) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Update current color in picker
    if (this.currentState.theme === 'custom' && this.currentState.customColor) {
      this.setCustomColor(this.currentState.customColor);
    }
  }

  private closeColorPicker(): void {
    if (!this.elements.colorPickerPanel || !this.elements.colorPickerToggle)
      return;

    this.isColorPickerOpen = false;
    this.elements.colorPickerPanel.setAttribute('aria-hidden', 'true');
    this.elements.colorPickerToggle.setAttribute('aria-expanded', 'false');

    // Return focus to toggle button
    this.elements.colorPickerToggle.focus();
  }

  private setCustomColor(color: string): void {
    if (!this.isValidHexColor(color)) return;

    if (this.elements.customColorInput) {
      this.elements.customColorInput.value = color;
    }
    if (this.elements.customColorText) {
      this.elements.customColorText.value = color;
    }

    this.updateColorPreview(color);
  }

  private applyCustomColor(): void {
    const color =
      this.elements.customColorInput?.value ||
      this.elements.customColorText?.value;

    if (color && this.isValidHexColor(color)) {
      this.setState({
        theme: 'custom',
        customColor: color,
        timestamp: Date.now(),
      });
      this.applyCurrentState();
      this.updateAccessibility();
      this.saveState();
      this.closeColorPicker();

      // Announce to screen readers
      this.announceToScreenReader(`Background color changed to ${color}`);
    }
  }

  private resetToDefault(): void {
    const defaultTheme =
      (this.elements.container?.dataset['defaultBackground'] as
        | 'light'
        | 'dark') || 'light';
    this.setState({ theme: defaultTheme, timestamp: Date.now() });
    this.applyCurrentState();
    this.updateAccessibility();
    this.saveState();
    this.closeColorPicker();

    // Announce to screen readers
    this.announceToScreenReader(
      `Background reset to default ${defaultTheme} theme`
    );
  }

  private updateColorPreview(color: string): void {
    // Update the preview in the color picker if it exists
    const preview = document.querySelector('.color-preview') as HTMLElement;
    if (preview) {
      preview.style.backgroundColor = color;
    }
  }

  private applyCurrentState(): void {
    const body = document.body;
    const root = document.documentElement;

    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-custom');
    root.removeAttribute('data-background-theme');

    let backgroundColor: string;
    let textColor: string;

    switch (this.currentState.theme) {
      case 'dark':
        body.classList.add('theme-dark');
        root.setAttribute('data-background-theme', 'dark');
        backgroundColor = '#1a1a1a';
        textColor = '#f1f5f9';
        break;
      case 'custom':
        body.classList.add('theme-custom');
        root.setAttribute('data-background-theme', 'custom');
        backgroundColor = this.currentState.customColor || '#ffffff';
        textColor = this.getOptimalTextColor(backgroundColor);
        break;
      default:
        body.classList.add('theme-light');
        root.setAttribute('data-background-theme', 'light');
        backgroundColor = '#ffffff';
        textColor = '#1e293b';
    }

    // Apply CSS custom properties
    root.style.setProperty('--dynamic-bg-color', backgroundColor);
    root.style.setProperty('--dynamic-text-color', textColor);

    // Update body background
    body.style.backgroundColor = backgroundColor;
    body.style.color = textColor;

    // Update toggle button state
    if (this.elements.toggleBtn) {
      const isPressed = this.currentState.theme === 'dark';
      this.elements.toggleBtn.setAttribute(
        'aria-pressed',
        isPressed.toString()
      );
    }
  }

  private getOptimalTextColor(backgroundColor: string): string {
    const luminance = this.calculateLuminance(backgroundColor);
    return luminance > 0.5 ? '#1e293b' : '#f1f5f9';
  }

  private calculateLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  }

  private calculateContrastRatio(
    color1: string,
    color2: string
  ): ContrastResult {
    const lum1 = this.calculateLuminance(color1);
    const lum2 = this.calculateLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);

    const result: ContrastResult = {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7.0,
    };

    if (!result.wcagAA) {
      result.recommendation = `Current contrast ratio is ${ratio.toFixed(2)}:1. Consider using a ${lum1 > lum2 ? 'darker' : 'lighter'} background for better readability.`;
    }

    return result;
  }

  private updateAccessibility(): void {
    if (!this.elements.accessibilityWarning) return;

    const backgroundColor = this.getCurrentBackgroundColor();

    // Check contrast with various text elements
    const textElements = document.querySelectorAll(
      '.color-value, .color-info, h1, h2, h3, p, span'
    );
    let hasContrastIssues = false;
    let worstContrast = Infinity;

    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const elementColor = computedStyle.color;

      if (elementColor && elementColor !== 'rgba(0, 0, 0, 0)') {
        const elementHex = this.rgbToHex(elementColor);
        if (elementHex) {
          const contrast = this.calculateContrastRatio(
            elementHex,
            backgroundColor
          );
          if (!contrast.wcagAA) {
            hasContrastIssues = true;
            worstContrast = Math.min(worstContrast, contrast.ratio);
          }
        }
      }
    });

    if (hasContrastIssues) {
      this.showAccessibilityWarning(
        `Some text may be hard to read. Contrast ratio: ${worstContrast.toFixed(2)}:1 (minimum: 4.5:1)`
      );
    } else {
      this.hideAccessibilityWarning();
    }
  }

  private showAccessibilityWarning(message: string): void {
    if (!this.elements.accessibilityWarning) return;

    const warningText =
      this.elements.accessibilityWarning.querySelector('.warning-text');
    if (warningText) {
      warningText.textContent = message;
    }

    this.elements.accessibilityWarning.style.display = 'flex';

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideAccessibilityWarning();
    }, 10000);
  }

  private hideAccessibilityWarning(): void {
    if (this.elements.accessibilityWarning) {
      this.elements.accessibilityWarning.style.display = 'none';
    }
  }

  private getCurrentBackgroundColor(): string {
    switch (this.currentState.theme) {
      case 'dark':
        return '#1a1a1a';
      case 'custom':
        return this.currentState.customColor || '#ffffff';
      default:
        return '#ffffff';
    }
  }

  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16),
        }
      : null;
  }

  private rgbToHex(rgb: string): string | null {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return null;

    const r = parseInt(match[1]!);
    const g = parseInt(match[2]!);
    const b = parseInt(match[3]!);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      try {
        if (announcement.parentNode) {
          document.body.removeChild(announcement);
        }
      } catch {
        // Silently handle cases where the node was already removed
      }
    }, 1000);
  }

  private setState(newState: Partial<BackgroundState>): void {
    this.currentState = { ...this.currentState, ...newState };
  }

  private loadState(): BackgroundState {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as BackgroundState;
        // Validate stored state
        if (
          parsed.theme &&
          ['light', 'dark', 'custom'].includes(parsed.theme)
        ) {
          return parsed;
        }
      }
    } catch {
      // Silently handle localStorage errors in browser environments
      // This is expected behavior when localStorage is not available
    }

    // Return default state
    return {
      theme: 'light',
      timestamp: Date.now(),
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentState));
    } catch {
      // Silently handle localStorage errors in browser environments
      // This is expected behavior when localStorage is not available
    }
  }

  // Public API methods
  public getState(): BackgroundState {
    return { ...this.currentState };
  }

  public setTheme(
    theme: 'light' | 'dark' | 'custom',
    customColor?: string
  ): void {
    this.setState({
      theme,
      ...(customColor && { customColor }),
      timestamp: Date.now(),
    });
    this.applyCurrentState();
    this.updateAccessibility();
    this.saveState();

    // Announce to screen readers
    if (theme === 'custom' && customColor) {
      this.announceToScreenReader(
        `Background switched to custom color ${customColor}`
      );
    } else {
      this.announceToScreenReader(`Background switched to ${theme} theme`);
    }
  }

  public getContrastInfo(): ContrastResult | null {
    const backgroundColor = this.getCurrentBackgroundColor();
    const textColor = this.getOptimalTextColor(backgroundColor);
    return this.calculateContrastRatio(textColor, backgroundColor);
  }

  public destroy(): void {
    // Clean up event listeners and intervals
    this.keyboardShortcuts.clear();

    // Remove any dynamic styles
    const root = document.documentElement;
    root.style.removeProperty('--dynamic-bg-color');
    root.style.removeProperty('--dynamic-text-color');
  }
}

// Auto-initialize when script loads
let backgroundController: BackgroundController | null = null;

// Initialize controller when DOM is ready
if (typeof window !== 'undefined') {
  const initController = () => {
    if (!backgroundController) {
      backgroundController = new BackgroundController();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initController);
  } else {
    initController();
  }
}

// Export for manual initialization if needed
export { backgroundController };
