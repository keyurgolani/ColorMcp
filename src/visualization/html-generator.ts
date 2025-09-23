/**
 * HTML visualization generator using Handlebars templates
 */

import Handlebars from 'handlebars';
import {
  accessibilityTester,
  AccessibilityTestResult,
} from '../utils/accessibility-testing';

export interface HTMLGeneratorOptions {
  layout?: 'horizontal' | 'vertical' | 'grid' | 'circular' | 'wave';
  style?: 'swatches' | 'gradient' | 'cards' | 'minimal' | 'detailed';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customDimensions?: [number, number];
  showValues?: boolean;
  showNames?: boolean;
  interactive?: boolean;
  exportFormats?: string[];
  accessibilityInfo?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export interface PaletteVisualizationData {
  colors: Array<{
    hex: string;
    rgb: string;
    hsl: string;
    name?: string;
    accessibility?: {
      contrastRatio: number;
      wcagAA: boolean;
      wcagAAA: boolean;
    };
  }>;
  options: HTMLGeneratorOptions;
  metadata: {
    title: string;
    description: string;
    timestamp: string;
    colorCount: number;
  };
}

export interface ColorWheelVisualizationData {
  type: 'hsl' | 'hsv' | 'rgb' | 'ryw' | 'ryb';
  size: number;
  interactive: boolean;
  showHarmony: boolean;
  harmonyType?:
    | 'complementary'
    | 'triadic'
    | 'analogous'
    | 'split_complementary'
    | 'tetradic';
  highlightColors: Array<{
    hex: string;
    hue: number;
    saturation: number;
    lightness: number;
  }>;
  theme: 'light' | 'dark' | 'auto';
  metadata: {
    title: string;
    description: string;
    timestamp: string;
    wheelType: string;
  };
}

export interface GradientVisualizationData {
  gradientCSS: string;
  previewShapes: string[];
  size: [number, number];
  showCSSCode: boolean;
  interactiveControls: boolean;
  variations: boolean;
  metadata: {
    title: string;
    description: string;
    timestamp: string;
    gradientType: string;
  };
}

export interface ThemePreviewVisualizationData {
  themeColors: Record<
    string,
    {
      hex: string;
      rgb: string;
      hsl: string;
      name: string;
      accessibility?: {
        contrastRatio: number;
        wcagAA: boolean;
        wcagAAA: boolean;
      };
    }
  >;
  previewType: 'website' | 'mobile_app' | 'dashboard' | 'components';
  components: string[];
  interactive: boolean;
  responsive: boolean;
  theme: 'light' | 'dark' | 'auto';
  metadata: {
    title: string;
    description: string;
    timestamp: string;
    colorCount: number;
    previewType: string;
  };
}

export class HTMLGenerator {
  protected templates: Map<string, Handlebars.TemplateDelegate<unknown>> =
    new Map();

  constructor() {
    this.registerHelpers();
    this.compileTemplates();
  }

  private registerHelpers(): void {
    // Helper for contrast ratio formatting
    Handlebars.registerHelper('formatContrast', (ratio: number) => {
      return ratio.toFixed(2);
    });

    // Helper for accessibility badge
    Handlebars.registerHelper(
      'accessibilityBadge',
      (wcagAA: boolean, wcagAAA: boolean) => {
        if (wcagAAA) return 'AAA';
        if (wcagAA) return 'AA';
        return 'Fail';
      }
    );

    // Helper for accessibility class
    Handlebars.registerHelper(
      'accessibilityClass',
      (wcagAA: boolean, wcagAAA: boolean) => {
        if (wcagAAA) return 'accessibility-aaa';
        if (wcagAA) return 'accessibility-aa';
        return 'accessibility-fail';
      }
    );

    // Helper for color luminance calculation
    Handlebars.registerHelper('textColor', (hex: string) => {
      // Handle undefined or invalid hex values
      if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
        return '#000000'; // Default to black text
      }

      // Simple luminance calculation for text color
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      // Handle invalid color values
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return '#000000';
      }

      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#000000' : '#ffffff';
    });

    // Helper for layout classes
    Handlebars.registerHelper('layoutClass', (layout: string) => {
      return `palette-layout-${layout}`;
    });

    // Helper for size classes
    Handlebars.registerHelper('sizeClass', (size: string) => {
      return `palette-size-${size}`;
    });

    // Helper for mathematical operations
    Handlebars.registerHelper(
      'math',
      (lvalue: number, operator: string, rvalue?: number) => {
        if (operator === '/2') {
          return lvalue / 2;
        }
        if (operator === '*' && rvalue !== undefined) {
          return lvalue * rvalue;
        }
        return lvalue;
      }
    );

    // Helper for equality check
    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => {
      return a === b;
    });

    // Helper for checking if array includes value
    Handlebars.registerHelper('includes', (array: string[], value: string) => {
      return array && array.includes(value);
    });

    // Helper for array indexing
    Handlebars.registerHelper('index', (array: unknown[], index: number) => {
      return array && array[index];
    });
  }

  private compileTemplates(): void {
    // Base template for all visualizations
    const baseTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{metadata.description}}">
    <title>{{metadata.title}}</title>
    <style>
        {{{css}}}
    </style>
</head>
<body class="{{#if options.theme}}theme-{{options.theme}}{{else}}theme-light{{/if}}">
    <div class="visualization-container" role="main">
        <header class="visualization-header">
            <h1>{{metadata.title}}</h1>
            <p class="description">{{metadata.description}}</p>
        </header>
        
        <main class="visualization-content">
            {{{content}}}
        </main>
    </div>
    
    {{#if options.interactive}}
    <script>
        {{{javascript}}}
    </script>
    {{/if}}
</body>
</html>`;

    this.templates.set('base', Handlebars.compile(baseTemplate));

    // Enhanced palette content template
    const paletteContentTemplate = `
    <div class="palette-container {{layoutClass options.layout}} {{sizeClass options.size}}" 
         role="region" aria-label="Color palette with {{colors.length}} colors">
      
      {{#if options.showValues}}
      <div class="palette-controls export-controls" role="toolbar" aria-label="Palette controls">
        <button class="copy-all-btn export-palette" type="button" aria-label="Copy all colors">
          <span class="icon">📋</span>
          Copy All
        </button>
        {{#if options.exportFormats}}
        <div class="export-dropdown">
          <button class="export-btn" type="button" aria-haspopup="true" aria-expanded="false">
            <span class="icon">⬇️</span>
            Export
          </button>
          <ul class="export-menu" role="menu">
            {{#each options.exportFormats}}
            <li role="none">
              <button class="export-format-btn export-format" data-format="{{this}}" role="menuitem">{{this}}</button>
            </li>
            {{/each}}
          </ul>
        </div>
        {{/if}}
      </div>
      {{/if}}

      <div class="palette-grid" role="group" aria-label="Color swatches">
        {{#each colors}}
        <div class="color-swatch" 
             role="button" 
             tabindex="0"
             data-color="{{hex}}"
             data-rgb="{{rgb}}"
             data-hsl="{{hsl}}"
             aria-label="Color {{name}} {{hex}}"
             style="background-color: {{hex}}; color: {{textColor hex}};">
          
          <div class="color-display" style="background-color: {{hex}};"></div>
          
          {{#if ../options.showValues}}
          <div class="color-info">
            <div class="color-value primary-value">{{hex}}</div>
            {{#if ../options.showNames}}
            <div class="color-name">{{name}}</div>
            {{/if}}
            <div class="color-formats color-values">
              <div class="format-value" data-format="rgb">{{rgb}}</div>
              <div class="format-value" data-format="hsl">{{hsl}}</div>
            </div>
          </div>
          {{/if}}

          {{#if accessibility}}
          <div class="accessibility-info">
            <span class="accessibility-badge wcag-badge {{accessibilityClass accessibility.wcagAA accessibility.wcagAAA}}"
                  title="WCAG Contrast: {{formatContrast accessibility.contrastRatio}}:1">
              <span class="contrast-ratio">{{formatContrast accessibility.contrastRatio}}:1</span>
              {{accessibilityBadge accessibility.wcagAA accessibility.wcagAAA}}
            </span>
          </div>
          {{/if}}

          <button class="copy-color-btn" 
                  type="button" 
                  aria-label="Copy {{hex}}"
                  data-color="{{hex}}">
            <span class="icon">📋</span>
          </button>
        </div>
        {{/each}}
      </div>

      {{#if options.accessibilityInfo}}
      <div class="accessibility-summary" role="region" aria-label="Accessibility information">
        <h3>Accessibility Summary</h3>
        <ul>
          {{#each colors}}
          {{#if accessibility}}
          <li>
            <strong>{{name}} ({{hex}})</strong>: 
            {{#if accessibility.wcagAAA}}
            ✅ WCAG AAA compliant
            {{else if accessibility.wcagAA}}
            ✅ WCAG AA compliant
            {{else}}
            ⚠️ May not meet contrast requirements
            {{/if}}
            ({{formatContrast accessibility.contrastRatio}}:1)
          </li>
          {{/if}}
          {{/each}}
        </ul>
      </div>
      {{/if}}
    </div>`;

    this.templates.set(
      'palette-content',
      Handlebars.compile(paletteContentTemplate)
    );

    // Enhanced color wheel content template
    const colorWheelContentTemplate = `
    <div class="color-wheel-container" role="region" aria-label="Interactive {{type}} color wheel">
      
      <div class="wheel-controls" role="toolbar" aria-label="Color wheel controls">
        {{#if showHarmony}}
        <div class="harmony-info">
          <span class="harmony-label">Harmony: {{harmonyType}}</span>
        </div>
        {{/if}}
        
        <div class="wheel-info">
          <span class="selected-color" id="selected-color-display">
            Click on the wheel to select a color
          </span>
        </div>
      </div>

      <div class="wheel-wrapper">
        <svg class="color-wheel-svg" 
             width="{{size}}" 
             height="{{size}}" 
             viewBox="0 0 {{size}} {{size}}"
             role="img"
             aria-label="{{type}} color wheel"
             tabindex="0">
          
          <!-- Color wheel background will be generated by JavaScript -->
          <g class="wheel-background"></g>
          
          <!-- Harmony lines -->
          {{#if showHarmony}}
          <g class="harmony-lines" aria-label="Color harmony relationships"></g>
          {{/if}}
          
          <!-- Highlight colors -->
          {{#each highlightColors}}
          <circle class="highlight-color" 
                  data-color="{{hex}}"
                  data-hue="{{hue}}"
                  data-saturation="{{saturation}}"
                  data-lightness="{{lightness}}"
                  r="8"
                  fill="{{hex}}"
                  stroke="#fff"
                  stroke-width="2"
                  role="button"
                  tabindex="0"
                  aria-label="Highlighted color {{hex}}">
            <title>{{hex}} (H:{{hue}} S:{{saturation}}% L:{{lightness}}%)</title>
          </circle>
          {{/each}}
          
          <!-- Selection indicator -->
          <circle class="selection-indicator" 
                  r="6" 
                  fill="none" 
                  stroke="#000" 
                  stroke-width="2" 
                  style="display: none;"
                  pointer-events="none"></circle>
        </svg>
      </div>

      {{#if highlightColors.length}}
      <div class="highlighted-colors" role="region" aria-label="Highlighted colors">
        <h3>Highlighted Colors</h3>
        <div class="color-list">
          {{#each highlightColors}}
          <div class="color-item" 
               data-color="{{hex}}"
               role="button"
               tabindex="0"
               aria-label="{{hex}}">
            <div class="color-preview" style="background-color: {{hex}};"></div>
            <div class="color-details">
              <div class="color-value">{{hex}}</div>
              <div class="color-hsl">H:{{hue}} S:{{saturation}}% L:{{lightness}}%</div>
            </div>
            <button class="copy-color-btn" 
                    type="button" 
                    aria-label="Copy {{hex}}"
                    data-color="{{hex}}">
              📋
            </button>
          </div>
          {{/each}}
        </div>
      </div>
      {{/if}}
    </div>`;

    this.templates.set(
      'color-wheel-content',
      Handlebars.compile(colorWheelContentTemplate)
    );

    // Enhanced gradient content template
    const gradientContentTemplate = `
    <div class="gradient-container" role="region" aria-label="Gradient preview">
      
      <div class="gradient-controls" role="toolbar" aria-label="Gradient controls">
        {{#if showCSSCode}}
        <button class="toggle-code-btn" type="button" aria-expanded="false" aria-controls="css-code-panel">
          <span class="icon">💻</span>
          Show CSS Code
        </button>
        {{/if}}
        
        <button class="copy-gradient-btn" type="button" aria-label="Copy gradient CSS">
          <span class="icon">📋</span>
          Copy CSS
        </button>

        {{#if variations}}
        <button class="show-variations-btn" type="button" aria-expanded="false" aria-controls="variations-panel">
          <span class="icon">🎨</span>
          Show Variations
        </button>
        {{/if}}
      </div>

      <div class="gradient-previews">
        {{#each previewShapes}}
        <div class="preview-shape preview-{{this}}" 
             role="img" 
             aria-label="Gradient preview on {{this}} shape"
             style="background: {{../gradientCSS}}; width: {{math (index ../size 0) '/2'}}px; height: {{math (index ../size 1) '/2'}}px;">
          
          {{#eq this 'text'}}
          <span class="preview-text" style="background: {{../gradientCSS}}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            Sample Text
          </span>
          {{/eq}}
          
          {{#eq this 'button'}}
          <button class="preview-button" style="background: {{../gradientCSS}};">
            Button
          </button>
          {{/eq}}
          
          {{#eq this 'card'}}
          <div class="preview-card" style="background: {{../gradientCSS}};">
            <h4>Card Title</h4>
            <p>Card content with gradient background</p>
          </div>
          {{/eq}}
          
          <div class="shape-label">{{this}}</div>
        </div>
        {{/each}}
      </div>

      {{#if showCSSCode}}
      <div class="css-code-panel" id="css-code-panel" style="display: none;" role="region" aria-label="CSS code">
        <h3>CSS Code</h3>
        <pre class="css-code" tabindex="0" role="textbox" aria-readonly="true"><code>{{gradientCSS}}</code></pre>
        <button class="copy-code-btn" type="button" aria-label="Copy CSS code">
          <span class="icon">📋</span>
          Copy Code
        </button>
      </div>
      {{/if}}

      {{#if variations}}
      <div class="variations-panel" id="variations-panel" style="display: none;" role="region" aria-label="Gradient variations">
        <h3>Variations</h3>
        <div class="variation-grid">
          <!-- Variations will be generated by JavaScript -->
        </div>
      </div>
      {{/if}}

      {{#if interactiveControls}}
      <div class="interactive-controls" role="region" aria-label="Interactive gradient controls">
        <h3>Customize Gradient</h3>
        <div class="control-group">
          <label for="angle-slider">Angle:</label>
          <input type="range" id="angle-slider" min="0" max="360" value="90" aria-label="Gradient angle">
          <span class="angle-value">90°</span>
        </div>
        <!-- Additional controls will be added by JavaScript -->
      </div>
      {{/if}}
    </div>`;

    this.templates.set(
      'gradient-content',
      Handlebars.compile(gradientContentTemplate)
    );

    // Enhanced theme preview content template
    const themePreviewContentTemplate = `
    <div class="theme-preview-container" role="region" aria-label="{{previewType}} theme preview">
      
      <div class="theme-controls" role="toolbar" aria-label="Theme preview controls">
        <div class="preview-type-selector">
          <label for="preview-type">Preview Type:</label>
          <select id="preview-type" aria-label="Select preview type">
            <option value="website" {{#eq previewType 'website'}}selected{{/eq}}>Website</option>
            <option value="mobile_app" {{#eq previewType 'mobile_app'}}selected{{/eq}}>Mobile App</option>
            <option value="dashboard" {{#eq previewType 'dashboard'}}selected{{/eq}}>Dashboard</option>
            <option value="components" {{#eq previewType 'components'}}selected{{/eq}}>Components</option>
          </select>
        </div>
        
        {{#if responsive}}
        <div class="viewport-controls">
          <button class="viewport-btn active" data-viewport="desktop" aria-label="Desktop view">🖥️</button>
          <button class="viewport-btn" data-viewport="tablet" aria-label="Tablet view">📱</button>
          <button class="viewport-btn" data-viewport="mobile" aria-label="Mobile view">📱</button>
        </div>
        {{/if}}
      </div>

      <div class="theme-preview-frame {{previewType}}" 
           role="application" 
           aria-label="{{previewType}} preview"
           style="{{#each themeColors}}--color-{{@key}}: {{hex}}; {{/each}}">
        
        {{#eq previewType 'website'}}
        <div class="website-preview">
          {{#includes ../components 'header'}}
          <header class="preview-header" style="background-color: var(--color-primary, {{themeColors.primary.hex}}); color: var(--color-text, {{themeColors.text.hex}});">
            <nav class="preview-nav">
              <div class="logo">Brand</div>
              <ul class="nav-links">
                <li><a href="#" style="color: var(--color-text, {{themeColors.text.hex}});">Home</a></li>
                <li><a href="#" style="color: var(--color-text, {{themeColors.text.hex}});">About</a></li>
                <li><a href="#" style="color: var(--color-text, {{themeColors.text.hex}});">Contact</a></li>
              </ul>
            </nav>
          </header>
          {{/includes}}
          
          {{#includes ../components 'content'}}
          <main class="preview-content" style="background-color: var(--color-background, {{themeColors.background.hex}}); color: var(--color-text, {{themeColors.text.hex}});">
            <section class="hero" style="background-color: var(--color-surface, {{themeColors.surface.hex}});">
              <h1>Welcome to Our Website</h1>
              <p>This is a preview of how your theme colors look in a real website layout.</p>
              {{#includes ../../components 'buttons'}}
              <button class="cta-button" style="background-color: var(--color-secondary, {{themeColors.secondary.hex}}); color: var(--color-text, {{themeColors.text.hex}});">
                Get Started
              </button>
              {{/includes}}
            </section>
          </main>
          {{/includes}}
        </div>
        {{/eq}}

        {{#eq previewType 'dashboard'}}
        <div class="dashboard-preview">
          {{#includes ../components 'sidebar'}}
          <aside class="preview-sidebar" style="background-color: var(--color-sidebar, {{themeColors.sidebar.hex}}); color: var(--color-text, {{themeColors.text.hex}});">
            <div class="sidebar-header">
              <h2>Dashboard</h2>
            </div>
            <nav class="sidebar-nav">
              <ul>
                <li><a href="#" style="color: var(--color-text, {{themeColors.text.hex}});">Overview</a></li>
                <li><a href="#" style="color: var(--color-text, {{themeColors.text.hex}});">Analytics</a></li>
                <li><a href="#" style="color: var(--color-text, {{themeColors.text.hex}});">Settings</a></li>
              </ul>
            </nav>
          </aside>
          {{/includes}}
          
          <main class="dashboard-main" style="background-color: var(--color-background, {{themeColors.background.hex}});">
            {{#includes ../components 'header'}}
            <header class="dashboard-header" style="background-color: var(--color-surface, {{themeColors.surface.hex}}); color: var(--color-text, {{themeColors.text.hex}});">
              <h1>Dashboard Overview</h1>
            </header>
            {{/includes}}
            
            {{#includes ../components 'cards'}}
            <div class="dashboard-cards">
              <div class="metric-card" style="background-color: var(--color-success, {{themeColors.success.hex}}); color: white;">
                <h3>Revenue</h3>
                <p class="metric-value">$12,345</p>
              </div>
              <div class="metric-card" style="background-color: var(--color-warning, {{themeColors.warning.hex}}); color: white;">
                <h3>Users</h3>
                <p class="metric-value">1,234</p>
              </div>
              <div class="metric-card" style="background-color: var(--color-error, {{themeColors.error.hex}}); color: white;">
                <h3>Issues</h3>
                <p class="metric-value">5</p>
              </div>
            </div>
            {{/includes}}
          </main>
        </div>
        {{/eq}}

        {{#eq previewType 'components'}}
        <div class="components-preview">
          {{#includes ../components 'buttons'}}
          <section class="component-section">
            <h3>Buttons</h3>
            <div class="button-group">
              <button class="btn btn-primary" style="background-color: var(--color-primary, {{themeColors.primary.hex}}); color: var(--color-text, {{themeColors.text.hex}});">Primary</button>
              <button class="btn btn-secondary" style="background-color: var(--color-secondary, {{themeColors.secondary.hex}}); color: var(--color-text, {{themeColors.text.hex}});">Secondary</button>
              <button class="btn btn-success" style="background-color: var(--color-success, {{themeColors.success.hex}}); color: white;">Success</button>
              <button class="btn btn-warning" style="background-color: var(--color-warning, {{themeColors.warning.hex}}); color: white;">Warning</button>
              <button class="btn btn-error" style="background-color: var(--color-error, {{themeColors.error.hex}}); color: white;">Error</button>
            </div>
          </section>
          {{/includes}}
          
          {{#includes ../components 'forms'}}
          <section class="component-section">
            <h3>Form Elements</h3>
            <form class="preview-form">
              <div class="form-group">
                <label for="email" style="color: var(--color-text, {{themeColors.text.hex}});">Email:</label>
                <input type="email" id="email" style="border-color: var(--color-primary, {{themeColors.primary.hex}});">
              </div>
              <div class="form-group">
                <label for="message" style="color: var(--color-text, {{themeColors.text.hex}});">Message:</label>
                <textarea id="message" style="border-color: var(--color-primary, {{themeColors.primary.hex}});"></textarea>
              </div>
            </form>
          </section>
          {{/includes}}
        </div>
        {{/eq}}
      </div>

      <div class="theme-colors-panel" role="region" aria-label="Theme colors">
        <h3>Theme Colors</h3>
        <div class="color-swatches" role="group" aria-label="Theme color swatches">
          {{#each themeColors}}
          <div class="theme-color-swatch" 
               data-color="{{hex}}"
               role="button"
               tabindex="0"
               aria-label="{{name}} color {{hex}}">
            <div class="swatch-color" style="background-color: {{hex}};"></div>
            <div class="swatch-info">
              <div class="swatch-name">{{name}}</div>
              <div class="swatch-value">{{hex}}</div>
              {{#if accessibility}}
              <div class="swatch-accessibility {{accessibilityClass accessibility.wcagAA accessibility.wcagAAA}}">
                {{accessibilityBadge accessibility.wcagAA accessibility.wcagAAA}}
              </div>
              {{/if}}
            </div>
            <button class="copy-color-btn" 
                    type="button" 
                    aria-label="Copy {{hex}}"
                    data-color="{{hex}}">
              📋
            </button>
          </div>
          {{/each}}
        </div>
      </div>
    </div>`;

    this.templates.set(
      'theme-preview-content',
      Handlebars.compile(themePreviewContentTemplate)
    );
  }

  public generatePaletteHTML(data: PaletteVisualizationData): string {
    const content = this.templates.get('palette-content')!(data);
    const css = this.generateCSS(data.colors);
    const javascript = data.options.interactive
      ? this.generateJavaScript()
      : '';

    return this.templates.get('base')!({
      ...data,
      content,
      css,
      javascript,
    });
  }

  public generateColorWheelHTML(data: ColorWheelVisualizationData): string {
    const content = this.templates.get('color-wheel-content')!(data);
    const css = this.generateColorWheelCSS();
    const javascript = data.interactive
      ? this.generateColorWheelJavaScript(data)
      : '';

    return this.templates.get('base')!({
      metadata: data.metadata,
      options: { theme: data.theme, interactive: data.interactive },
      content,
      css,
      javascript,
    });
  }

  public generateGradientHTML(data: GradientVisualizationData): string {
    const content = this.templates.get('gradient-content')!(data);
    const css = this.generateGradientCSS(data);
    const javascript = data.interactiveControls
      ? this.generateGradientJavaScript(data)
      : '';

    return this.templates.get('base')!({
      metadata: data.metadata,
      options: { interactive: data.interactiveControls },
      content,
      css,
      javascript,
    });
  }

  public generateThemePreviewHTML(data: ThemePreviewVisualizationData): string {
    const content = this.templates.get('theme-preview-content')!(data);
    const css = this.generateThemePreviewCSS(data);
    const javascript = data.interactive
      ? this.generateThemePreviewJavaScript(data)
      : '';

    return this.templates.get('base')!({
      metadata: data.metadata,
      options: { theme: data.theme, interactive: data.interactive },
      content,
      css,
      javascript,
    });
  }

  /**
   * Generate comprehensive accessibility report for HTML visualization
   */
  public generateAccessibilityReport(html: string): {
    report: AccessibilityTestResult;
    summary: {
      totalIssues: number;
      criticalIssues: number;
      overallScore: number;
      wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail';
    };
  } {
    const fullReport = accessibilityTester.generateAccessibilityReport(html);

    return {
      report: fullReport.overall,
      summary: fullReport.summary,
    };
  }

  /**
   * Test color combinations for accessibility compliance
   */
  public testColorAccessibility(
    colors: Array<{ hex: string; name?: string }>,
    backgroundColors: string[] = ['#ffffff', '#000000']
  ): Array<{
    color: string;
    name?: string;
    backgrounds: Array<{
      background: string;
      contrastRatio: number;
      wcagAA: boolean;
      wcagAAA: boolean;
    }>;
  }> {
    return colors.map(color => {
      const result: {
        color: string;
        name?: string;
        backgrounds: Array<{
          background: string;
          contrastRatio: number;
          wcagAA: boolean;
          wcagAAA: boolean;
        }>;
      } = {
        color: color.hex,
        backgrounds: backgroundColors.map(bg => {
          const contrastRatio = this.calculateActualContrastRatio(
            color.hex,
            bg
          );

          return {
            background: bg,
            contrastRatio,
            wcagAA: contrastRatio >= 4.5,
            wcagAAA: contrastRatio >= 7.0,
          };
        }),
      };

      if (color.name) {
        result.name = color.name;
      }

      return result;
    });
  }

  /**
   * Calculate actual contrast ratio between two colors
   */
  private calculateActualContrastRatio(color1: string, color2: string): number {
    const getLuminance = (hex: string): number => {
      const rgb = this.hexToRgb(hex);
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  protected generateCSS(
    colors?: Array<{ hex: string; name?: string }>
  ): string {
    let cssCustomProperties = '';

    if (colors && colors.length > 0) {
      cssCustomProperties = `/* CSS Custom Properties */
:root {
${colors
  .map((color, index) => {
    const name = color.name
      ? color.name.toLowerCase().replace(/\s+/g, '-')
      : `color-${index + 1}`;
    return `  --${name}: ${color.hex};`;
  })
  .join('\n')}
  --color-primary: ${colors[0]?.hex || '#000000'};
  --color-secondary: ${colors[1]?.hex || colors[0]?.hex || '#666666'};
}

`;
    }

    return `${cssCustomProperties}/* Base CSS styles for visualizations */
* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 20px;
  line-height: 1.6;
  color: #333;
  background-color: #fff;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
}

.theme-dark body {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.visualization-container {
  max-width: 1200px;
  margin: 0 auto;
}

.visualization-header {
  text-align: center;
  margin-bottom: 2rem;
}

.visualization-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 600;
}

.description {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.theme-dark .description {
  color: #aaa;
}

/* Palette Styles */
.palette-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.palette-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.copy-all-btn,
.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.copy-all-btn:hover,
.export-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.copy-all-btn:focus,
.export-btn:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.export-dropdown {
  position: relative;
}

.export-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
  min-width: 120px;
  z-index: 10;
  display: none;
}

.export-dropdown[aria-expanded="true"] .export-menu {
  display: block;
}

.export-format-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.export-format-btn:hover {
  background: #f5f5f5;
}

.palette-grid {
  display: grid;
  gap: 1rem;
  justify-content: center;
}

.palette-layout-horizontal .palette-grid {
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.palette-layout-vertical .palette-grid {
  grid-template-columns: 1fr;
  max-width: 200px;
  margin: 0 auto;
}

.palette-layout-grid .palette-grid {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.palette-layout-circular .palette-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.color-swatch {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.color-swatch:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.color-swatch:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.2);
}

.palette-size-small .color-swatch {
  min-height: 80px;
}

.palette-size-medium .color-swatch {
  min-height: 120px;
}

.palette-size-large .color-swatch {
  min-height: 160px;
}

.color-display {
  height: 60px;
  width: 100%;
  border-radius: 0.5rem 0.5rem 0 0;
}

.palette-size-small .color-display {
  height: 40px;
}

.palette-size-large .color-display {
  height: 80px;
}

.color-info {
  padding: 0.75rem;
  background: #fff;
}

.theme-dark .color-info {
  background: #2a2a2a;
}

.color-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.primary-value {
  font-size: 1rem;
  color: #333;
}

.theme-dark .primary-value {
  color: #e0e0e0;
}

.color-name {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
  text-transform: capitalize;
}

.theme-dark .color-name {
  color: #aaa;
}

.color-formats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.format-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  color: #888;
  padding: 0.25rem 0.5rem;
  background: #f8f8f8;
  border-radius: 0.25rem;
}

.theme-dark .format-value {
  background: #3a3a3a;
  color: #ccc;
}

.accessibility-info {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.accessibility-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.accessibility-aaa {
  background: #22c55e;
  color: white;
}

.accessibility-aa {
  background: #f59e0b;
  color: white;
}

.accessibility-fail {
  background: #ef4444;
  color: white;
}

.copy-color-btn {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.color-swatch:hover .copy-color-btn,
.color-swatch:focus .copy-color-btn {
  opacity: 1;
}

.copy-color-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.copy-color-btn:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
  opacity: 1;
}

.accessibility-summary {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border-left: 4px solid #007acc;
}

.theme-dark .accessibility-summary {
  background: #2a2a2a;
}

.accessibility-summary h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.theme-dark .accessibility-summary h3 {
  color: #e0e0e0;
}

.accessibility-summary ul {
  margin: 0;
  padding-left: 1.5rem;
}

.accessibility-summary li {
  margin-bottom: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  body {
    padding: 1rem;
  }
  
  .palette-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .palette-layout-horizontal .palette-grid,
  .palette-layout-grid .palette-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
  
  .color-swatch {
    min-height: 100px;
  }
  
  .palette-size-large .color-swatch {
    min-height: 120px;
  }
}

@media (max-width: 480px) {
  .palette-layout-horizontal .palette-grid,
  .palette-layout-grid .palette-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Focus and keyboard navigation */
.color-swatch:focus-visible {
  outline: 3px solid #007acc;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .color-swatch {
    border: 2px solid #000;
  }
  
  .accessibility-badge {
    border: 1px solid #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .color-swatch {
    transition: none;
  }
  
  .copy-color-btn {
    transition: none;
  }
}`;
  }

  protected generateJavaScript(): string {
    return `/* Enhanced JavaScript for palette visualizations */
(function() {
  'use strict';
  
  // Accessibility functions
  function createAriaLiveRegion() {
    let liveRegion = document.getElementById('aria-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      document.body.appendChild(liveRegion);
    }
    return liveRegion;
  }
  
  function announceToScreenReader(message) {
    const liveRegion = createAriaLiveRegion();
    liveRegion.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
  
  // Utility functions
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      return new Promise((resolve, reject) => {
        try {
          document.execCommand('copy');
          textArea.remove();
          resolve();
        } catch (err) {
          textArea.remove();
          reject(err);
        }
      });
    }
  }
  
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.textContent = message;
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: \${type === 'success' ? '#22c55e' : '#ef4444'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    \`;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  function formatColorValue(color, format) {
    const colorData = {
      hex: color.dataset.color,
      rgb: color.dataset.rgb,
      hsl: color.dataset.hsl
    };
    
    return colorData[format] || colorData.hex;
  }
  
  // Initialize palette functionality
  function initializePaletteVisualization() {
    const paletteContainer = document.querySelector('.palette-container');
    if (!paletteContainer) return;
    
    // Copy individual colors
    const copyColorButtons = document.querySelectorAll('.copy-color-btn');
    copyColorButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const color = button.dataset.color;
        
        try {
          await copyToClipboard(color);
          showNotification(\`Copied \${color} to clipboard\`);
        } catch (err) {
          showNotification('Failed to copy color', 'error');
        }
      });
    });
    
    // Copy all colors
    const copyAllButton = document.querySelector('.copy-all-btn, .copy-palette');
    if (copyAllButton) {
      copyAllButton.addEventListener('click', async () => {
        const colors = Array.from(document.querySelectorAll('.color-swatch'))
          .map(swatch => swatch.dataset.color)
          .join('\\n');
        
        try {
          await copyToClipboard(colors);
          showNotification('Copied all colors to clipboard');
        } catch (err) {
          showNotification('Failed to copy colors', 'error');
        }
      });
    }
    
    // Export functionality
    const exportButton = document.querySelector('.export-btn');
    const exportMenu = document.querySelector('.export-menu');
    
    if (exportButton && exportMenu) {
      exportButton.addEventListener('click', () => {
        const isExpanded = exportButton.getAttribute('aria-expanded') === 'true';
        exportButton.setAttribute('aria-expanded', !isExpanded);
        exportMenu.style.display = isExpanded ? 'none' : 'block';
      });
      
      // Close export menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!exportButton.contains(e.target) && !exportMenu.contains(e.target)) {
          exportButton.setAttribute('aria-expanded', 'false');
          exportMenu.style.display = 'none';
        }
      });
      
      // Export format buttons
      const exportFormatButtons = document.querySelectorAll('.export-format-btn');
      exportFormatButtons.forEach(button => {
        button.addEventListener('click', async () => {
          const format = button.dataset.format;
          const colors = Array.from(document.querySelectorAll('.color-swatch'));
          let exportData = '';
          
          switch (format) {
            case 'hex':
              exportData = colors.map(c => c.dataset.color).join('\\n');
              break;
            case 'rgb':
              exportData = colors.map(c => c.dataset.rgb).join('\\n');
              break;
            case 'hsl':
              exportData = colors.map(c => c.dataset.hsl).join('\\n');
              break;
            case 'css':
              exportData = ':root {\\n' + 
                colors.map((c, i) => \`  --color-\${i + 1}: \${c.dataset.color};\`).join('\\n') + 
                '\\n}';
              break;
            case 'json':
              exportData = JSON.stringify(
                colors.map(c => ({
                  hex: c.dataset.color,
                  rgb: c.dataset.rgb,
                  hsl: c.dataset.hsl
                })), 
                null, 
                2
              );
              break;
          }
          
          try {
            await copyToClipboard(exportData);
            showNotification(\`Exported as \${format.toUpperCase()}\`);
            exportButton.setAttribute('aria-expanded', 'false');
            exportMenu.style.display = 'none';
          } catch (err) {
            showNotification('Failed to export', 'error');
          }
        });
      });
    }
    
    // Color swatch interactions
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
      // Click to copy
      swatch.addEventListener('click', async () => {
        const color = swatch.dataset.color;
        try {
          await copyToClipboard(color);
          showNotification(\`Copied \${color}\`);
        } catch (err) {
          showNotification('Failed to copy color', 'error');
        }
      });
      
      // Keyboard navigation
      swatch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          swatch.click();
        }
        
        // Arrow key navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const swatches = Array.from(document.querySelectorAll('.color-swatch'));
          const currentIndex = swatches.indexOf(swatch);
          let nextIndex = currentIndex;
          
          const isGrid = paletteContainer.classList.contains('palette-layout-grid');
          const columns = isGrid ? Math.floor(paletteContainer.offsetWidth / 150) : swatches.length;
          
          switch (e.key) {
            case 'ArrowLeft':
              nextIndex = Math.max(0, currentIndex - 1);
              break;
            case 'ArrowRight':
              nextIndex = Math.min(swatches.length - 1, currentIndex + 1);
              break;
            case 'ArrowUp':
              nextIndex = Math.max(0, currentIndex - columns);
              break;
            case 'ArrowDown':
              nextIndex = Math.min(swatches.length - 1, currentIndex + columns);
              break;
          }
          
          if (nextIndex !== currentIndex && swatches[nextIndex]) {
            swatches[nextIndex].focus();
          }
        }
      });
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePaletteVisualization);
  } else {
    initializePaletteVisualization();
  }
  
  console.log('Enhanced palette visualization loaded');
})();`;
  }

  protected generateColorWheelCSS(): string {
    return `${this.generateCSS()}

/* Color Wheel Specific Styles */
.color-wheel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
}

.wheel-controls {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 1rem;
}

.harmony-info {
  padding: 0.5rem 1rem;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  color: #0c4a6e;
  font-weight: 500;
}

.theme-dark .harmony-info {
  background: #1e3a8a;
  border-color: #3b82f6;
  color: #dbeafe;
}

.wheel-info {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #e9ecef;
  min-width: 200px;
  text-align: center;
}

.theme-dark .wheel-info {
  background: #2a2a2a;
  border-color: #404040;
}

.selected-color {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  font-weight: 500;
}

.wheel-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.color-wheel-svg {
  cursor: crosshair;
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: #fff;
}

.theme-dark .color-wheel-svg {
  background: #2a2a2a;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.color-wheel-svg:focus {
  outline: 3px solid #007acc;
  outline-offset: 4px;
}

.harmony-lines {
  pointer-events: none;
}

.harmony-line {
  stroke: #333;
  stroke-width: 2;
  stroke-dasharray: 5,5;
  opacity: 0.7;
}

.theme-dark .harmony-line {
  stroke: #e0e0e0;
}

.highlight-color {
  cursor: pointer;
  transition: all 0.2s ease;
}

.highlight-color:hover {
  r: 10;
  stroke-width: 3;
}

.highlight-color:focus {
  outline: none;
  stroke: #007acc;
  stroke-width: 3;
}

.selection-indicator {
  pointer-events: none;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.highlighted-colors {
  width: 100%;
  max-width: 600px;
  margin-top: 2rem;
}

.highlighted-colors h3 {
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
}

.theme-dark .highlighted-colors h3 {
  color: #e0e0e0;
}

.color-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.theme-dark .color-item {
  background: #2a2a2a;
  border-color: #404040;
}

.color-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.color-item:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.color-preview {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.color-details {
  flex: 1;
}

.color-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.theme-dark .color-value {
  color: #e0e0e0;
}

.color-hsl {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  color: #666;
}

.theme-dark .color-hsl {
  color: #aaa;
}

.color-item .copy-color-btn {
  position: static;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  opacity: 1;
  flex-shrink: 0;
}

.theme-dark .color-item .copy-color-btn {
  background: #3a3a3a;
  border-color: #505050;
}

.color-item .copy-color-btn:hover {
  background: #e9ecef;
  transform: scale(1.05);
}

.theme-dark .color-item .copy-color-btn:hover {
  background: #505050;
}

/* Responsive Design */
@media (max-width: 768px) {
  .color-wheel-container {
    padding: 1rem;
  }
  
  .wheel-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .color-wheel-svg {
    max-width: 90vw;
    height: auto;
  }
  
  .color-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .color-item {
    flex-direction: column;
    text-align: center;
  }
  
  .color-preview {
    width: 4rem;
    height: 4rem;
  }
}`;
  }

  protected generateColorWheelJavaScript(
    data: ColorWheelVisualizationData
  ): string {
    return `/* Enhanced Color Wheel JavaScript */
(function() {
  'use strict';
  
  const wheelData = ${JSON.stringify(data)};
  
  // Utility functions
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      return new Promise((resolve, reject) => {
        try {
          document.execCommand('copy');
          textArea.remove();
          resolve();
        } catch (err) {
          textArea.remove();
          reject(err);
        }
      });
    }
  }
  
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.textContent = message;
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: \${type === 'success' ? '#22c55e' : '#ef4444'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return \`#\${f(0)}\${f(8)}\${f(4)}\`;
  }
  
  function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
  
  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
  
  function cartesianToPolar(centerX, centerY, x, y) {
    const dx = x - centerX;
    const dy = y - centerY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    return { radius, angle };
  }
  
  // Initialize color wheel
  function initializeColorWheel() {
    const svg = document.querySelector('.color-wheel-svg');
    const wheelBackground = document.querySelector('.wheel-background');
    const selectionIndicator = document.querySelector('.selection-indicator');
    const selectedColorDisplay = document.getElementById('selected-color-display');
    
    if (!svg || !wheelBackground) return;
    
    const size = wheelData.size;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    
    // Generate color wheel background
    function generateWheel() {
      wheelBackground.innerHTML = '';
      
      const segments = 360;
      const segmentAngle = 360 / segments;
      
      for (let i = 0; i < segments; i++) {
        const angle = i * segmentAngle;
        const nextAngle = (i + 1) * segmentAngle;
        
        const startOuter = polarToCartesian(centerX, centerY, radius, angle);
        const endOuter = polarToCartesian(centerX, centerY, radius, nextAngle);
        const startInner = polarToCartesian(centerX, centerY, radius * 0.3, angle);
        const endInner = polarToCartesian(centerX, centerY, radius * 0.3, nextAngle);
        
        const largeArcFlag = segmentAngle <= 180 ? "0" : "1";
        
        const pathData = [
          "M", startOuter.x, startOuter.y,
          "A", radius, radius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
          "L", endInner.x, endInner.y,
          "A", radius * 0.3, radius * 0.3, 0, largeArcFlag, 0, startInner.x, startInner.y,
          "Z"
        ].join(" ");
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        
        let color;
        if (wheelData.type === 'hsl') {
          color = hslToHex(angle, 100, 50);
        } else if (wheelData.type === 'hsv') {
          // HSV to RGB conversion for wheel
          const c = 1;
          const x = c * (1 - Math.abs(((angle / 60) % 2) - 1));
          const m = 0;
          
          let r, g, b;
          if (angle >= 0 && angle < 60) {
            r = c; g = x; b = 0;
          } else if (angle >= 60 && angle < 120) {
            r = x; g = c; b = 0;
          } else if (angle >= 120 && angle < 180) {
            r = 0; g = c; b = x;
          } else if (angle >= 180 && angle < 240) {
            r = 0; g = x; b = c;
          } else if (angle >= 240 && angle < 300) {
            r = x; g = 0; b = c;
          } else {
            r = c; g = 0; b = x;
          }
          
          r = Math.round((r + m) * 255);
          g = Math.round((g + m) * 255);
          b = Math.round((b + m) * 255);
          
          color = \`#\${r.toString(16).padStart(2, '0')}\${g.toString(16).padStart(2, '0')}\${b.toString(16).padStart(2, '0')}\`;
        } else {
          // Default to HSL
          color = hslToHex(angle, 100, 50);
        }
        
        path.setAttribute("fill", color);
        path.setAttribute("stroke", "none");
        wheelBackground.appendChild(path);
      }
    }
    
    // Position highlight colors
    function positionHighlightColors() {
      const highlightColors = document.querySelectorAll('.highlight-color');
      highlightColors.forEach(colorElement => {
        const hue = parseFloat(colorElement.dataset.hue);
        const saturation = parseFloat(colorElement.dataset.saturation);
        
        // Position based on hue and saturation
        const angle = hue;
        const distance = radius * 0.3 + (radius * 0.7) * (saturation / 100);
        const position = polarToCartesian(centerX, centerY, distance, angle);
        
        colorElement.setAttribute('cx', position.x);
        colorElement.setAttribute('cy', position.y);
      });
    }
    
    // Generate harmony lines
    function generateHarmonyLines() {
      if (!wheelData.showHarmony || !wheelData.harmonyType) return;
      
      const harmonyLines = document.querySelector('.harmony-lines');
      if (!harmonyLines) return;
      
      harmonyLines.innerHTML = '';
      
      const highlightColors = wheelData.highlightColors;
      if (highlightColors.length === 0) return;
      
      const baseColor = highlightColors[0];
      const baseHue = baseColor.hue;
      
      let harmonyHues = [];
      
      switch (wheelData.harmonyType) {
        case 'complementary':
          harmonyHues = [baseHue, (baseHue + 180) % 360];
          break;
        case 'triadic':
          harmonyHues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
          break;
        case 'analogous':
          harmonyHues = [baseHue, (baseHue + 30) % 360, (baseHue - 30 + 360) % 360];
          break;
        case 'split_complementary':
          harmonyHues = [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360];
          break;
        case 'tetradic':
          harmonyHues = [baseHue, (baseHue + 90) % 360, (baseHue + 180) % 360, (baseHue + 270) % 360];
          break;
      }
      
      // Draw lines between harmony points
      for (let i = 0; i < harmonyHues.length; i++) {
        for (let j = i + 1; j < harmonyHues.length; j++) {
          const pos1 = polarToCartesian(centerX, centerY, radius * 0.8, harmonyHues[i]);
          const pos2 = polarToCartesian(centerX, centerY, radius * 0.8, harmonyHues[j]);
          
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute('x1', pos1.x);
          line.setAttribute('y1', pos1.y);
          line.setAttribute('x2', pos2.x);
          line.setAttribute('y2', pos2.y);
          line.setAttribute('class', 'harmony-line');
          
          harmonyLines.appendChild(line);
        }
      }
    }
    
    // Handle wheel interactions
    function handleWheelClick(event) {
      const rect = svg.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const polar = cartesianToPolar(centerX, centerY, x, y);
      
      // Check if click is within wheel bounds
      if (polar.radius < radius * 0.3 || polar.radius > radius) return;
      
      const hue = Math.round(polar.angle);
      const saturation = Math.round(((polar.radius - radius * 0.3) / (radius * 0.7)) * 100);
      const lightness = 50; // Default lightness
      
      const selectedColor = hslToHex(hue, saturation, lightness);
      
      // Update selection indicator
      if (selectionIndicator) {
        selectionIndicator.setAttribute('cx', x);
        selectionIndicator.setAttribute('cy', y);
        selectionIndicator.style.display = 'block';
      }
      
      // Update selected color display
      if (selectedColorDisplay) {
        selectedColorDisplay.textContent = \`Selected: \${selectedColor} (H:\${hue} S:\${saturation}% L:\${lightness}%)\`;
        selectedColorDisplay.style.color = selectedColor;
      }
      
      // Copy to clipboard
      copyToClipboard(selectedColor).then(() => {
        showNotification(\`Copied \${selectedColor} to clipboard\`);
      }).catch(() => {
        showNotification('Failed to copy color', 'error');
      });
    }
    
    // Keyboard navigation for wheel
    function handleWheelKeydown(event) {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) return;
      
      event.preventDefault();
      
      // Get current selection or start at center
      let currentX = centerX;
      let currentY = centerY;
      
      if (selectionIndicator && selectionIndicator.style.display !== 'none') {
        currentX = parseFloat(selectionIndicator.getAttribute('cx')) || centerX;
        currentY = parseFloat(selectionIndicator.getAttribute('cy')) || centerY;
      }
      
      const polar = cartesianToPolar(centerX, centerY, currentX, currentY);
      let newAngle = polar.angle;
      let newRadius = Math.max(radius * 0.3, Math.min(radius, polar.radius));
      
      const step = 5; // degrees
      const radiusStep = radius * 0.05;
      
      switch (event.key) {
        case 'ArrowLeft':
          newAngle = (newAngle - step + 360) % 360;
          break;
        case 'ArrowRight':
          newAngle = (newAngle + step) % 360;
          break;
        case 'ArrowUp':
          newRadius = Math.min(radius, newRadius + radiusStep);
          break;
        case 'ArrowDown':
          newRadius = Math.max(radius * 0.3, newRadius - radiusStep);
          break;
        case 'Enter':
        case ' ':
          // Simulate click at current position
          handleWheelClick({
            clientX: currentX + svg.getBoundingClientRect().left,
            clientY: currentY + svg.getBoundingClientRect().top
          });
          return;
      }
      
      const newPosition = polarToCartesian(centerX, centerY, newRadius, newAngle);
      
      // Update selection indicator
      if (selectionIndicator) {
        selectionIndicator.setAttribute('cx', newPosition.x);
        selectionIndicator.setAttribute('cy', newPosition.y);
        selectionIndicator.style.display = 'block';
      }
      
      // Update color display
      const hue = Math.round(newAngle);
      const saturation = Math.round(((newRadius - radius * 0.3) / (radius * 0.7)) * 100);
      const lightness = 50;
      const selectedColor = hslToHex(hue, saturation, lightness);
      
      if (selectedColorDisplay) {
        selectedColorDisplay.textContent = \`Navigate: \${selectedColor} (H:\${hue} S:\${saturation}% L:\${lightness}%)\`;
        selectedColorDisplay.style.color = selectedColor;
      }
    }
    
    // Initialize copy buttons for highlighted colors
    function initializeCopyButtons() {
      const copyButtons = document.querySelectorAll('.copy-color-btn');
      copyButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
          e.stopPropagation();
          const color = button.dataset.color;
          
          try {
            await copyToClipboard(color);
            showNotification(\`Copied \${color} to clipboard\`);
          } catch (err) {
            showNotification('Failed to copy color', 'error');
          }
        });
      });
      
      // Color item clicks
      const colorItems = document.querySelectorAll('.color-item');
      colorItems.forEach(item => {
        item.addEventListener('click', async () => {
          const color = item.dataset.color;
          try {
            await copyToClipboard(color);
            showNotification(\`Copied \${color} to clipboard\`);
          } catch (err) {
            showNotification('Failed to copy color', 'error');
          }
        });
        
        // Keyboard support
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
          }
        });
      });
    }
    
    // Initialize everything
    generateWheel();
    positionHighlightColors();
    generateHarmonyLines();
    initializeCopyButtons();
    
    // Add event listeners
    if (wheelData.interactive) {
      svg.addEventListener('click', handleWheelClick);
      svg.addEventListener('keydown', handleWheelKeydown);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeColorWheel);
  } else {
    initializeColorWheel();
  }
  
  console.log('Enhanced color wheel loaded with type:', wheelData.type);
})();`;
  }

  protected generateGradientCSS(_data: GradientVisualizationData): string {
    return `${this.generateCSS()}

/* Gradient Specific Styles */
.gradient-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.gradient-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.toggle-code-btn,
.copy-gradient-btn,
.show-variations-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.theme-dark .toggle-code-btn,
.theme-dark .copy-gradient-btn,
.theme-dark .show-variations-btn {
  background: #2a2a2a;
  border-color: #404040;
  color: #e0e0e0;
}

.toggle-code-btn:hover,
.copy-gradient-btn:hover,
.show-variations-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
  transform: translateY(-1px);
}

.theme-dark .toggle-code-btn:hover,
.theme-dark .copy-gradient-btn:hover,
.theme-dark .show-variations-btn:hover {
  background: #3a3a3a;
  border-color: #505050;
}

.toggle-code-btn:focus,
.copy-gradient-btn:focus,
.show-variations-btn:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.gradient-previews {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.preview-shape {
  position: relative;
  border-radius: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.preview-shape:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.preview-rectangle {
  min-height: 150px;
}

.preview-circle {
  aspect-ratio: 1;
  border-radius: 50%;
  min-height: 150px;
}

.preview-text {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
}

.preview-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  border: none;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-button:hover {
  transform: scale(1.05);
}

.preview-card {
  padding: 2rem;
  color: white;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.preview-card h4 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.preview-card p {
  margin: 0;
  opacity: 0.9;
  line-height: 1.5;
}

.shape-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.css-code-panel {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1rem;
}

.theme-dark .css-code-panel {
  background: #2a2a2a;
  border-color: #404040;
}

.css-code-panel h3 {
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-dark .css-code-panel h3 {
  color: #e0e0e0;
}

.css-code {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.theme-dark .css-code {
  background: #1a1a1a;
  border-color: #404040;
  color: #e0e0e0;
}

.css-code:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.copy-code-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.theme-dark .copy-code-btn {
  background: #3a3a3a;
  border-color: #505050;
  color: #e0e0e0;
}

.copy-code-btn:hover {
  background: #f5f5f5;
}

.theme-dark .copy-code-btn:hover {
  background: #4a4a4a;
}

.variations-panel {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1rem;
}

.theme-dark .variations-panel {
  background: #2a2a2a;
  border-color: #404040;
}

.variations-panel h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.theme-dark .variations-panel h3 {
  color: #e0e0e0;
}

.variation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.variation-item {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s ease;
}

.theme-dark .variation-item {
  background: #3a3a3a;
  border-color: #505050;
}

.variation-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.variation-preview {
  height: 80px;
  cursor: pointer;
}

.variation-label {
  padding: 0.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: #666;
}

.theme-dark .variation-label {
  color: #aaa;
}

.interactive-controls {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1rem;
}

.theme-dark .interactive-controls {
  background: #2a2a2a;
  border-color: #404040;
}

.interactive-controls h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.theme-dark .interactive-controls h3 {
  color: #e0e0e0;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.control-group label {
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.theme-dark .control-group label {
  color: #e0e0e0;
}

.control-group input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.theme-dark .control-group input[type="range"] {
  background: #505050;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #007acc;
  cursor: pointer;
}

.control-group input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #007acc;
  cursor: pointer;
  border: none;
}

.angle-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  color: #333;
  min-width: 40px;
}

.theme-dark .angle-value {
  color: #e0e0e0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .gradient-container {
    padding: 1rem;
  }
  
  .gradient-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .gradient-previews {
    grid-template-columns: 1fr;
  }
  
  .variation-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .control-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .control-group label {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .variation-grid {
    grid-template-columns: 1fr;
  }
}`;
  }

  protected generateGradientJavaScript(
    data: GradientVisualizationData
  ): string {
    return `/* Enhanced Gradient JavaScript */
(function() {
  'use strict';
  
  const gradientData = ${JSON.stringify(data)};
  
  // Utility functions
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      return new Promise((resolve, reject) => {
        try {
          document.execCommand('copy');
          textArea.remove();
          resolve();
        } catch (err) {
          textArea.remove();
          reject(err);
        }
      });
    }
  }
  
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.textContent = message;
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: \${type === 'success' ? '#22c55e' : '#ef4444'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  function parseGradient(gradientCSS) {
    const trimmed = gradientCSS.trim();
    
    // Extract gradient type
    let type = 'linear';
    if (trimmed.startsWith('radial-gradient')) type = 'radial';
    else if (trimmed.startsWith('conic-gradient')) type = 'conic';
    
    // Extract angle for linear gradients
    let angle = 90;
    const angleMatch = trimmed.match(/linear-gradient\\s*\\(\\s*([^,]+)/);
    if (angleMatch) {
      const angleStr = angleMatch[1].trim();
      if (angleStr.includes('deg')) {
        angle = parseInt(angleStr);
      } else if (angleStr === 'to right') {
        angle = 90;
      } else if (angleStr === 'to left') {
        angle = 270;
      } else if (angleStr === 'to bottom') {
        angle = 180;
      } else if (angleStr === 'to top') {
        angle = 0;
      }
    }
    
    // Extract colors
    const colorMatches = trimmed.match(/#[0-9a-f]{3,6}|rgb\\([^)]+\\)|hsl\\([^)]+\\)|rgba\\([^)]+\\)|hsla\\([^)]+\\)/gi) || [];
    
    return { type, angle, colors: colorMatches };
  }
  
  function generateGradientVariations(baseGradient) {
    const parsed = parseGradient(baseGradient);
    const variations = [];
    
    if (parsed.type === 'linear') {
      // Angle variations
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      angles.forEach(angle => {
        if (angle !== parsed.angle) {
          const newGradient = baseGradient.replace(
            /linear-gradient\\s*\\([^,]+,/,
            \`linear-gradient(\${angle}deg,\`
          );
          variations.push({
            gradient: newGradient,
            label: \`\${angle}°\`
          });
        }
      });
    }
    
    return variations.slice(0, 8); // Limit to 8 variations
  }
  
  function updateGradientPreviews(gradientCSS) {
    const previewShapes = document.querySelectorAll('.preview-shape');
    previewShapes.forEach(shape => {
      if (shape.classList.contains('preview-text')) {
        const textElement = shape.querySelector('.preview-text');
        if (textElement) {
          textElement.style.background = gradientCSS;
        }
      } else if (shape.classList.contains('preview-button')) {
        const buttonElement = shape.querySelector('.preview-button');
        if (buttonElement) {
          buttonElement.style.background = gradientCSS;
        }
      } else if (shape.classList.contains('preview-card')) {
        const cardElement = shape.querySelector('.preview-card');
        if (cardElement) {
          cardElement.style.background = gradientCSS;
        }
      } else {
        shape.style.background = gradientCSS;
      }
    });
  }
  
  // Initialize gradient functionality
  function initializeGradient() {
    const gradientContainer = document.querySelector('.gradient-container');
    if (!gradientContainer) return;
    
    let currentGradient = gradientData.gradientCSS;
    
    // Toggle CSS code panel
    const toggleCodeBtn = document.querySelector('.toggle-code-btn');
    const cssCodePanel = document.getElementById('css-code-panel');
    
    if (toggleCodeBtn && cssCodePanel) {
      toggleCodeBtn.addEventListener('click', () => {
        const isVisible = cssCodePanel.style.display !== 'none';
        cssCodePanel.style.display = isVisible ? 'none' : 'block';
        toggleCodeBtn.setAttribute('aria-expanded', !isVisible);
        toggleCodeBtn.innerHTML = \`
          <span class="icon">💻</span>
          \${isVisible ? 'Show' : 'Hide'} CSS Code
        \`;
      });
    }
    
    // Copy gradient CSS
    const copyGradientBtn = document.querySelector('.copy-gradient-btn');
    if (copyGradientBtn) {
      copyGradientBtn.addEventListener('click', async () => {
        try {
          await copyToClipboard(currentGradient);
          showNotification('Copied gradient CSS to clipboard');
        } catch (err) {
          showNotification('Failed to copy gradient', 'error');
        }
      });
    }
    
    // Copy CSS code
    const copyCodeBtn = document.querySelector('.copy-code-btn');
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', async () => {
        const cssCode = document.querySelector('.css-code');
        if (cssCode) {
          try {
            await copyToClipboard(cssCode.textContent);
            showNotification('Copied CSS code to clipboard');
          } catch (err) {
            showNotification('Failed to copy code', 'error');
          }
        }
      });
    }
    
    // Show variations
    const showVariationsBtn = document.querySelector('.show-variations-btn');
    const variationsPanel = document.getElementById('variations-panel');
    
    if (showVariationsBtn && variationsPanel) {
      showVariationsBtn.addEventListener('click', () => {
        const isVisible = variationsPanel.style.display !== 'none';
        variationsPanel.style.display = isVisible ? 'none' : 'block';
        showVariationsBtn.setAttribute('aria-expanded', !isVisible);
        showVariationsBtn.innerHTML = \`
          <span class="icon">🎨</span>
          \${isVisible ? 'Show' : 'Hide'} Variations
        \`;
        
        if (!isVisible) {
          generateVariationsGrid();
        }
      });
    }
    
    function generateVariationsGrid() {
      const variationGrid = document.querySelector('.variation-grid');
      if (!variationGrid) return;
      
      const variations = generateGradientVariations(currentGradient);
      variationGrid.innerHTML = '';
      
      variations.forEach(variation => {
        const variationItem = document.createElement('div');
        variationItem.className = 'variation-item';
        variationItem.innerHTML = \`
          <div class="variation-preview" style="background: \${variation.gradient};" 
               role="button" 
               tabindex="0"
               aria-label="Gradient variation \${variation.label}"
               data-gradient="\${variation.gradient}"></div>
          <div class="variation-label">\${variation.label}</div>
        \`;
        
        const preview = variationItem.querySelector('.variation-preview');
        preview.addEventListener('click', () => {
          currentGradient = variation.gradient;
          updateGradientPreviews(currentGradient);
          updateCSSCode(currentGradient);
          
          // Update interactive controls if present
          updateInteractiveControls(currentGradient);
          
          showNotification(\`Applied \${variation.label} variation\`);
        });
        
        preview.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            preview.click();
          }
        });
        
        variationGrid.appendChild(variationItem);
      });
    }
    
    function updateCSSCode(gradientCSS) {
      const cssCode = document.querySelector('.css-code');
      if (cssCode) {
        cssCode.textContent = gradientCSS;
      }
    }
    
    function updateInteractiveControls(gradientCSS) {
      const angleSlider = document.getElementById('angle-slider');
      const angleValue = document.querySelector('.angle-value');
      
      if (angleSlider && angleValue) {
        const parsed = parseGradient(gradientCSS);
        angleSlider.value = parsed.angle;
        angleValue.textContent = \`\${parsed.angle}°\`;
      }
    }
    
    // Interactive controls
    const angleSlider = document.getElementById('angle-slider');
    const angleValue = document.querySelector('.angle-value');
    
    if (angleSlider && angleValue) {
      angleSlider.addEventListener('input', (e) => {
        const newAngle = e.target.value;
        angleValue.textContent = \`\${newAngle}°\`;
        
        // Update gradient with new angle
        const newGradient = currentGradient.replace(
          /linear-gradient\\s*\\([^,]+,/,
          \`linear-gradient(\${newAngle}deg,\`
        );
        
        currentGradient = newGradient;
        updateGradientPreviews(currentGradient);
        updateCSSCode(currentGradient);
      });
      
      // Keyboard support for slider
      angleSlider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const currentValue = parseInt(angleSlider.value);
          const step = e.shiftKey ? 10 : 1;
          const newValue = e.key === 'ArrowLeft' 
            ? Math.max(0, currentValue - step)
            : Math.min(360, currentValue + step);
          
          angleSlider.value = newValue;
          angleSlider.dispatchEvent(new Event('input'));
        }
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + C to copy gradient
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        copyToClipboard(currentGradient).then(() => {
          showNotification('Copied gradient CSS');
        }).catch(() => {
          showNotification('Failed to copy gradient', 'error');
        });
      }
      
      // Ctrl/Cmd + Shift + C to copy CSS code
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        const cssCode = document.querySelector('.css-code');
        if (cssCode) {
          copyToClipboard(cssCode.textContent).then(() => {
            showNotification('Copied CSS code');
          }).catch(() => {
            showNotification('Failed to copy code', 'error');
          });
        }
      }
    });
    
    // Initialize CSS code display
    updateCSSCode(currentGradient);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGradient);
  } else {
    initializeGradient();
  }
  
  console.log('Enhanced gradient visualization loaded');
})();`;
  }

  protected generateThemePreviewCSS(
    data: ThemePreviewVisualizationData
  ): string {
    // Generate CSS custom properties for theme colors
    const themeColorProperties = Object.entries(data.themeColors)
      .map(([key, color]) => `  --color-${key}: ${color.hex};`)
      .join('\n');

    return `${this.generateCSS()}

/* Theme Color Custom Properties */
:root {
${themeColorProperties}
}

/* Theme Preview Specific Styles */
.theme-preview-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.theme-controls {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
  border: 1px solid #e9ecef;
}

.theme-dark .theme-controls {
  background: #2a2a2a;
  border-color: #404040;
}

.preview-type-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-type-selector label {
  font-weight: 500;
  color: #333;
}

.theme-dark .preview-type-selector label {
  color: #e0e0e0;
}

.preview-type-selector select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  background: #fff;
  color: #333;
  cursor: pointer;
}

.theme-dark .preview-type-selector select {
  background: #3a3a3a;
  border-color: #505050;
  color: #e0e0e0;
}

.viewport-controls {
  display: flex;
  gap: 0.5rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.theme-dark .viewport-controls {
  background: #3a3a3a;
  border-color: #505050;
}

.viewport-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.viewport-btn.active,
.viewport-btn:hover {
  background: #007acc;
  color: white;
  opacity: 1;
}

.viewport-btn:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.theme-preview-frame {
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: #fff;
  transition: all 0.3s ease;
}

.theme-dark .theme-preview-frame {
  border-color: #404040;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.theme-preview-frame.mobile {
  max-width: 375px;
  margin: 0 auto;
}

.theme-preview-frame.tablet {
  max-width: 768px;
  margin: 0 auto;
}

/* Website Preview Styles */
.website-preview {
  min-height: 400px;
}

.preview-header {
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.nav-links a:hover {
  opacity: 0.8;
}

.preview-content {
  padding: 3rem 2rem;
}

.hero {
  text-align: center;
  padding: 3rem 2rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
}

.hero h1 {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  font-weight: bold;
}

.hero p {
  margin: 0 0 2rem 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.cta-button {
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Dashboard Preview Styles */
.dashboard-preview {
  display: flex;
  min-height: 500px;
}

.preview-sidebar {
  width: 250px;
  padding: 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.sidebar-header h2 {
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.sidebar-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar-nav li {
  margin-bottom: 0.5rem;
}

.sidebar-nav a {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.sidebar-nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.metric-card {
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.9;
}

.metric-value {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
}

/* Components Preview Styles */
.components-preview {
  padding: 2rem;
}

.component-section {
  margin-bottom: 3rem;
}

.component-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.theme-dark .component-section h3 {
  color: #e0e0e0;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.preview-form {
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.theme-dark .form-group input,
.theme-dark .form-group textarea {
  background: #3a3a3a;
  border-color: #505050;
  color: #e0e0e0;
}

/* Theme Colors Panel */
.theme-colors-panel {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 2rem;
}

.theme-dark .theme-colors-panel {
  background: #2a2a2a;
  border-color: #404040;
}

.theme-colors-panel h3 {
  margin: 0 0 1rem 0;
  color: #333;
  text-align: center;
}

.theme-dark .theme-colors-panel h3 {
  color: #e0e0e0;
}

.color-swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.theme-color-swatch {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.theme-dark .theme-color-swatch {
  background: #3a3a3a;
  border-color: #505050;
}

.theme-color-swatch:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-color-swatch:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.swatch-color {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.swatch-info {
  flex: 1;
}

.swatch-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
  text-transform: capitalize;
}

.theme-dark .swatch-name {
  color: #e0e0e0;
}

.swatch-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.theme-dark .swatch-value {
  color: #aaa;
}

.swatch-accessibility {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  border-radius: 0.2rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.theme-color-swatch .copy-color-btn {
  position: static;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  opacity: 1;
  flex-shrink: 0;
}

.theme-dark .theme-color-swatch .copy-color-btn {
  background: #4a4a4a;
  border-color: #606060;
}

/* Responsive Design */
@media (max-width: 768px) {
  .theme-preview-container {
    padding: 1rem;
  }
  
  .theme-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .dashboard-preview {
    flex-direction: column;
  }
  
  .preview-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .nav-links {
    flex-direction: column;
    gap: 1rem;
  }
  
  .hero h1 {
    font-size: 2rem;
  }
  
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .color-swatches {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 2rem 1rem;
  }
  
  .hero h1 {
    font-size: 1.5rem;
  }
  
  .theme-color-swatch {
    flex-direction: column;
    text-align: center;
  }
  
  .swatch-color {
    width: 4rem;
    height: 4rem;
  }
}`;
  }

  protected generateThemePreviewJavaScript(
    data: ThemePreviewVisualizationData
  ): string {
    return `/* Enhanced Theme Preview JavaScript */
(function() {
  'use strict';
  
  const themeData = ${JSON.stringify(data)};
  
  // Utility functions
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      return new Promise((resolve, reject) => {
        try {
          document.execCommand('copy');
          textArea.remove();
          resolve();
        } catch (err) {
          textArea.remove();
          reject(err);
        }
      });
    }
  }
  
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.textContent = message;
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: \${type === 'success' ? '#22c55e' : '#ef4444'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  function generateThemeCSS(themeColors) {
    let css = ':root {\\n';
    Object.entries(themeColors).forEach(([name, colorData]) => {
      const cssName = name.toLowerCase().replace(/\\s+/g, '-');
      css += \`  --color-\${cssName}: \${colorData.hex};\\n\`;
    });
    css += '}\\n\\n';
    
    // Add utility classes
    css += '/* Theme utility classes */\\n';
    Object.entries(themeColors).forEach(([name]) => {
      const cssName = name.toLowerCase().replace(/\\s+/g, '-');
      css += \`.bg-\${cssName} { background-color: var(--color-\${cssName}); }\\n\`;
      css += \`.text-\${cssName} { color: var(--color-\${cssName}); }\\n\`;
      css += \`.border-\${cssName} { border-color: var(--color-\${cssName}); }\\n\`;
    });
    
    return css;
  }
  
  function generateThemeSCSS(themeColors) {
    let scss = '// Theme color variables\\n';
    Object.entries(themeColors).forEach(([name, colorData]) => {
      const scssName = name.toLowerCase().replace(/\\s+/g, '-');
      scss += \`$color-\${scssName}: \${colorData.hex};\\n\`;
    });
    
    scss += '\\n// Theme color map\\n$theme-colors: (\\n';
    Object.entries(themeColors).forEach(([name], index, array) => {
      const scssName = name.toLowerCase().replace(/\\s+/g, '-');
      scss += \`  "\${scssName}": $color-\${scssName}\`;
      if (index < array.length - 1) scss += ',';
      scss += '\\n';
    });
    scss += ');\\n';
    
    return scss;
  }
  
  function generateThemeJSON(themeColors) {
    const themeObject = {};
    Object.entries(themeColors).forEach(([name, colorData]) => {
      themeObject[name] = {
        hex: colorData.hex,
        rgb: colorData.rgb,
        hsl: colorData.hsl,
        accessibility: colorData.accessibility
      };
    });
    
    return JSON.stringify({
      name: 'Generated Theme',
      colors: themeObject,
      metadata: {
        generated: new Date().toISOString(),
        previewType: themeData.previewType,
        colorCount: Object.keys(themeColors).length
      }
    }, null, 2);
  }
  
  // Initialize theme preview functionality
  function initializeThemePreview() {
    const themeContainer = document.querySelector('.theme-preview-container');
    if (!themeContainer) return;
    
    // Preview type selector
    const previewTypeSelect = document.getElementById('preview-type');
    if (previewTypeSelect) {
      previewTypeSelect.addEventListener('change', (e) => {
        const newType = e.target.value;
        // In a real implementation, this would regenerate the preview
        showNotification(\`Switched to \${newType} preview\`);
      });
    }
    
    // Viewport controls
    const viewportButtons = document.querySelectorAll('.viewport-btn');
    const previewFrame = document.querySelector('.theme-preview-frame');
    
    viewportButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        viewportButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update preview frame class
        const viewport = button.dataset.viewport;
        if (previewFrame) {
          previewFrame.className = \`theme-preview-frame \${themeData.previewType} \${viewport}\`;
        }
        
        showNotification(\`Switched to \${viewport} view\`);
      });
      
      // Keyboard support
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
    
    // Copy color functionality
    const copyColorButtons = document.querySelectorAll('.copy-color-btn');
    copyColorButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const color = button.dataset.color;
        
        try {
          await copyToClipboard(color);
          showNotification(\`Copied \${color} to clipboard\`);
        } catch (err) {
          showNotification('Failed to copy color', 'error');
        }
      });
    });
    
    // Theme color swatch interactions
    const themeColorSwatches = document.querySelectorAll('.theme-color-swatch');
    themeColorSwatches.forEach(swatch => {
      swatch.addEventListener('click', async () => {
        const color = swatch.dataset.color;
        try {
          await copyToClipboard(color);
          showNotification(\`Copied \${color} to clipboard\`);
        } catch (err) {
          showNotification('Failed to copy color', 'error');
        }
      });
      
      // Keyboard navigation
      swatch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          swatch.click();
        }
        
        // Arrow key navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          const swatches = Array.from(document.querySelectorAll('.theme-color-swatch'));
          const currentIndex = swatches.indexOf(swatch);
          let nextIndex = currentIndex;
          
          const columns = Math.floor(themeContainer.offsetWidth / 220); // Approximate swatch width
          
          switch (e.key) {
            case 'ArrowLeft':
              nextIndex = Math.max(0, currentIndex - 1);
              break;
            case 'ArrowRight':
              nextIndex = Math.min(swatches.length - 1, currentIndex + 1);
              break;
            case 'ArrowUp':
              nextIndex = Math.max(0, currentIndex - columns);
              break;
            case 'ArrowDown':
              nextIndex = Math.min(swatches.length - 1, currentIndex + columns);
              break;
          }
          
          if (nextIndex !== currentIndex && swatches[nextIndex]) {
            swatches[nextIndex].focus();
          }
        }
      });
    });
    
    // Interactive elements in preview
    const previewButtons = document.querySelectorAll('.cta-button, .btn, .preview-button');
    previewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Preview button clicked');
      });
    });
    
    const previewLinks = document.querySelectorAll('.nav-links a, .sidebar-nav a');
    previewLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification(\`Navigation: \${link.textContent}\`);
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + C to copy theme as CSS
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        const css = generateThemeCSS(themeData.themeColors);
        copyToClipboard(css).then(() => {
          showNotification('Copied theme CSS to clipboard');
        }).catch(() => {
          showNotification('Failed to copy theme CSS', 'error');
        });
      }
      
      // Ctrl/Cmd + Shift + S to copy theme as SCSS
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        const scss = generateThemeSCSS(themeData.themeColors);
        copyToClipboard(scss).then(() => {
          showNotification('Copied theme SCSS to clipboard');
        }).catch(() => {
          showNotification('Failed to copy theme SCSS', 'error');
        });
      }
      
      // Ctrl/Cmd + Shift + J to copy theme as JSON
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        const json = generateThemeJSON(themeData.themeColors);
        copyToClipboard(json).then(() => {
          showNotification('Copied theme JSON to clipboard');
        }).catch(() => {
          showNotification('Failed to copy theme JSON', 'error');
        });
      }
      
      // Number keys 1-4 to switch viewport
      if (['1', '2', '3', '4'].includes(e.key) && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        const viewportIndex = parseInt(e.key) - 1;
        const viewportButton = viewportButtons[viewportIndex];
        if (viewportButton) {
          viewportButton.click();
        }
      }
    });
    
    // Accessibility enhancements
    const interactiveElements = document.querySelectorAll('[role="button"], button, a, input, select, textarea');
    interactiveElements.forEach(element => {
      if (!element.hasAttribute('tabindex') && element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA' && element.tagName !== 'SELECT') {
        element.setAttribute('tabindex', '0');
      }
    });
    
    // Add skip link for keyboard navigation
    const skipLink = document.createElement('a');
    skipLink.href = '#theme-colors-panel';
    skipLink.textContent = 'Skip to theme colors';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = \`
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 1000;
      border-radius: 4px;
    \`;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add ID to theme colors panel for skip link
    const themeColorsPanel = document.querySelector('.theme-colors-panel');
    if (themeColorsPanel) {
      themeColorsPanel.id = 'theme-colors-panel';
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemePreview);
  } else {
    initializeThemePreview();
  }
  
  console.log('Enhanced theme preview loaded for:', themeData.previewType);
})();`;
  }
}
