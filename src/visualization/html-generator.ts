/**
 * HTML visualization generator using Handlebars templates
 */

import * as Handlebars from 'handlebars';
// Import types for color visualization

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
  private templates: Map<string, Handlebars.TemplateDelegate<unknown>> =
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

    // Helper for calculating X position on color wheel
    Handlebars.registerHelper('calculateX', (hue: number, size: number) => {
      const radius = (size / 2) * 0.8; // 80% of radius for positioning
      const angle = (hue - 90) * (Math.PI / 180); // Convert to radians, adjust for top position
      return size / 2 + radius * Math.cos(angle);
    });

    // Helper for calculating Y position on color wheel
    Handlebars.registerHelper('calculateY', (hue: number, size: number) => {
      const radius = (size / 2) * 0.8; // 80% of radius for positioning
      const angle = (hue - 90) * (Math.PI / 180); // Convert to radians, adjust for top position
      return size / 2 + radius * Math.sin(angle);
    });

    // Helper for checking if array includes value
    Handlebars.registerHelper('includes', (array: string[], value: string) => {
      return array && array.includes(value);
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
            <div class="metadata">
                <span class="color-count">{{metadata.colorCount}} colors</span>
                <time class="timestamp">{{metadata.timestamp}}</time>
            </div>
        </header>
        
        <main class="visualization-content">
            {{{content}}}
        </main>
        
        {{#if options.interactive}}
        <footer class="visualization-footer">
            <div class="controls">
                <button id="copy-palette" class="control-button" aria-label="Copy palette to clipboard">
                    Copy Palette
                </button>
                {{#if options.exportFormats}}
                <div class="export-controls">
                    <label for="export-format">Export as:</label>
                    <select id="export-format" aria-label="Select export format">
                        {{#each options.exportFormats}}
                        <option value="{{this}}">{{this}}</option>
                        {{/each}}
                    </select>
                    <button id="export-palette" class="control-button">Export</button>
                </div>
                {{/if}}
            </div>
        </footer>
        {{/if}}
    </div>
    
    {{#if options.interactive}}
    <script>
        {{{javascript}}}
    </script>
    {{/if}}
</body>
</html>`;

    this.templates.set('base', Handlebars.compile(baseTemplate));

    // Palette content template
    const paletteContentTemplate = `
<div class="palette-container {{layoutClass options.layout}} {{sizeClass options.size}}" 
     role="group" 
     aria-label="Color palette with {{colors.length}} colors">
    
    {{#each colors}}
    <div class="color-swatch" 
         role="button" 
         tabindex="0"
         data-color="{{hex}}"
         data-rgb="{{rgb}}"
         data-hsl="{{hsl}}"
         aria-label="Color swatch: {{#if name}}{{name}} {{/if}}{{hex}}"
         {{#if ../options.accessibilityInfo}}
         aria-describedby="color-info-{{@index}}"
         {{/if}}>
        
        <div class="color-display" 
             style="background-color: {{hex}}; color: {{textColor hex}};">
            {{#if ../options.showValues}}
            <div class="color-values">
                <span class="hex-value">{{hex}}</span>
                {{#if ../options.showNames}}
                {{#if name}}
                <span class="color-name">{{name}}</span>
                {{/if}}
                {{/if}}
            </div>
            {{/if}}
        </div>
        
        {{#if ../options.accessibilityInfo}}
        <div id="color-info-{{@index}}" class="accessibility-info">
            {{#if accessibility}}
            <span class="contrast-ratio">Contrast: {{formatContrast accessibility.contrastRatio}}</span>
            <span class="wcag-badge {{accessibilityClass accessibility.wcagAA accessibility.wcagAAA}}">
                {{accessibilityBadge accessibility.wcagAA accessibility.wcagAAA}}
            </span>
            {{/if}}
        </div>
        {{/if}}
        
        <div class="color-details" hidden>
            <dl>
                <dt>HEX</dt><dd>{{hex}}</dd>
                <dt>RGB</dt><dd>{{rgb}}</dd>
                <dt>HSL</dt><dd>{{hsl}}</dd>
                {{#if name}}<dt>Name</dt><dd>{{name}}</dd>{{/if}}
            </dl>
        </div>
    </div>
    {{/each}}
</div>`;

    this.templates.set(
      'palette-content',
      Handlebars.compile(paletteContentTemplate)
    );

    // Color wheel content template
    const colorWheelContentTemplate = `
<div class="color-wheel-container" 
     role="group" 
     aria-label="Interactive color wheel">
    
    <div class="color-wheel-wrapper">
        <svg class="color-wheel-svg" 
             width="{{size}}" 
             height="{{size}}" 
             viewBox="0 0 {{size}} {{size}}"
             role="img"
             aria-label="{{type}} color wheel with {{highlightColors.length}} highlighted colors">
            
            <!-- Color wheel background -->
            <defs>
                <radialGradient id="wheel-gradient-{{type}}" cx="50%" cy="50%" r="50%">
                    {{#if (eq type 'hsl')}}
                    <stop offset="0%" stop-color="white" />
                    <stop offset="100%" stop-color="transparent" />
                    {{/if}}
                </radialGradient>
            </defs>
            
            <!-- Wheel segments -->
            <g class="wheel-segments" transform="translate({{math size '/2'}}, {{math size '/2'}})">
                <!-- Generated wheel segments will be inserted here by JavaScript -->
            </g>
            
            <!-- Harmony lines -->
            {{#if showHarmony}}
            <g class="harmony-lines" transform="translate({{math size '/2'}}, {{math size '/2'}})">
                <!-- Harmony relationship lines will be drawn here -->
            </g>
            {{/if}}
            
            <!-- Highlight colors -->
            {{#each highlightColors}}
            <circle class="highlight-color" 
                    cx="{{calculateX hue ../size}}" 
                    cy="{{calculateY hue ../size}}" 
                    r="8" 
                    fill="{{hex}}" 
                    stroke="white" 
                    stroke-width="2"
                    data-color="{{hex}}"
                    data-hue="{{hue}}"
                    tabindex="0"
                    role="button"
                    aria-label="Highlighted color {{hex}}">
            </circle>
            {{/each}}
            
            <!-- Center point -->
            <circle class="wheel-center" 
                    cx="{{math size '/2'}}" 
                    cy="{{math size '/2'}}" 
                    r="4" 
                    fill="var(--color-text)" />
        </svg>
        
        {{#if interactive}}
        <div class="wheel-controls">
            <div class="selected-color-display" id="selected-color">
                <div class="color-preview" style="background-color: #808080;"></div>
                <div class="color-info">
                    <span class="color-value">#808080</span>
                    <span class="color-coordinates">H: 0°, S: 0%, L: 50%</span>
                </div>
            </div>
        </div>
        {{/if}}
    </div>
    
    {{#if showHarmony}}
    <div class="harmony-info">
        <h3>Color Harmony: {{harmonyType}}</h3>
        <div class="harmony-colors" id="harmony-colors">
            <!-- Harmony colors will be populated by JavaScript -->
        </div>
    </div>
    {{/if}}
</div>`;

    this.templates.set(
      'color-wheel-content',
      Handlebars.compile(colorWheelContentTemplate)
    );

    // Gradient content template
    const gradientContentTemplate = `
<div class="gradient-container" 
     role="group" 
     aria-label="Gradient preview and controls">
    
    <div class="gradient-preview-section">
        {{#each previewShapes}}
        <div class="gradient-preview gradient-preview-{{this}}" 
             style="background: {{../gradientCSS}};"
             role="img"
             aria-label="Gradient preview in {{this}} shape">
            {{#if (eq this 'text')}}
            <span class="gradient-text">Sample Text</span>
            {{/if}}
            {{#if (eq this 'button')}}
            <button class="gradient-button">Sample Button</button>
            {{/if}}
        </div>
        {{/each}}
    </div>
    
    {{#if showCSSCode}}
    <div class="css-code-section">
        <h3>CSS Code</h3>
        <pre class="css-code" role="region" aria-label="CSS gradient code">
            <code>background: {{gradientCSS}};</code>
        </pre>
        <button class="copy-css-button" data-css="{{gradientCSS}}" aria-label="Copy CSS code to clipboard">
            Copy CSS
        </button>
    </div>
    {{/if}}
    
    {{#if interactiveControls}}
    <div class="gradient-controls">
        <h3>Gradient Controls</h3>
        <div class="control-group">
            <label for="gradient-angle">Angle:</label>
            <input type="range" id="gradient-angle" min="0" max="360" value="90" aria-label="Gradient angle">
            <span class="angle-value">90°</span>
        </div>
    </div>
    {{/if}}
</div>`;

    this.templates.set(
      'gradient-content',
      Handlebars.compile(gradientContentTemplate)
    );

    // Theme preview content template
    const themePreviewContentTemplate = `
<div class="theme-preview-container {{previewType}}-preview" 
     role="group" 
     aria-label="Theme preview showing {{metadata.colorCount}} colors in {{previewType}} context">
    
    {{#if (eq previewType 'website')}}
    <div class="website-mockup">
        {{#if (includes components 'header')}}
        <header class="mockup-header" style="background-color: {{themeColors.primary.hex}}; color: {{themeColors.text.hex}};">
            <div class="header-content">
                <h1 class="logo">Brand Name</h1>
                <nav class="main-nav">
                    <a href="#" style="color: {{themeColors.text.hex}};">Home</a>
                    <a href="#" style="color: {{themeColors.text.hex}};">About</a>
                    <a href="#" style="color: {{themeColors.text.hex}};">Services</a>
                    <a href="#" style="color: {{themeColors.text.hex}};">Contact</a>
                </nav>
            </div>
        </header>
        {{/if}}
        
        <main class="mockup-main" style="background-color: {{themeColors.background.hex}}; color: {{themeColors.text.hex}};">
            {{#if (includes components 'content')}}
            <section class="hero-section" style="background-color: {{themeColors.surface.hex}};">
                <h2>Welcome to Our Website</h2>
                <p>This is a preview of how your theme colors look in a real website context.</p>
                {{#if (includes components 'buttons')}}
                <div class="button-group">
                    <button class="btn-primary" style="background-color: {{themeColors.primary.hex}}; color: {{textColor themeColors.primary.hex}};">
                        Primary Action
                    </button>
                    {{#if themeColors.secondary}}
                    <button class="btn-secondary" style="background-color: {{themeColors.secondary.hex}}; color: {{textColor themeColors.secondary.hex}};">
                        Secondary Action
                    </button>
                    {{/if}}
                </div>
                {{/if}}
            </section>
            
            <section class="content-section">
                <div class="content-grid">
                    {{#if (includes components 'cards')}}
                    <div class="card" style="background-color: {{themeColors.surface.hex}}; border-color: {{themeColors.border.hex}};">
                        <h3>Feature Card</h3>
                        <p>This card demonstrates how your theme colors work together in content areas.</p>
                        {{#if themeColors.accent}}
                        <span class="accent-text" style="color: {{themeColors.accent.hex}};">Accent Color</span>
                        {{/if}}
                    </div>
                    {{/if}}
                    
                    {{#if (includes components 'forms')}}
                    <div class="form-section" style="background-color: {{themeColors.surface.hex}};">
                        <h3>Contact Form</h3>
                        <form class="sample-form">
                            <input type="text" placeholder="Your Name" style="border-color: {{themeColors.border.hex}}; background-color: {{themeColors.background.hex}};">
                            <input type="email" placeholder="Your Email" style="border-color: {{themeColors.border.hex}}; background-color: {{themeColors.background.hex}};">
                            <textarea placeholder="Your Message" style="border-color: {{themeColors.border.hex}}; background-color: {{themeColors.background.hex}};"></textarea>
                            <button type="submit" style="background-color: {{themeColors.primary.hex}}; color: {{textColor themeColors.primary.hex}};">
                                Send Message
                            </button>
                        </form>
                    </div>
                    {{/if}}
                </div>
            </section>
            {{/if}}
        </main>
        
        {{#if (includes components 'footer')}}
        <footer class="mockup-footer" style="background-color: {{themeColors.surface.hex}}; color: {{themeColors.text.hex}};">
            <p>&copy; 2024 Brand Name. All rights reserved.</p>
        </footer>
        {{/if}}
    </div>
    {{/if}}
    
    {{#if (eq previewType 'mobile_app')}}
    <div class="mobile-mockup">
        <div class="mobile-frame">
            {{#if (includes components 'header')}}
            <div class="mobile-header" style="background-color: {{themeColors.primary.hex}}; color: {{textColor themeColors.primary.hex}};">
                <button class="back-button">←</button>
                <h1>App Title</h1>
                <button class="menu-button">☰</button>
            </div>
            {{/if}}
            
            <div class="mobile-content" style="background-color: {{themeColors.background.hex}};">
                {{#if (includes components 'cards')}}
                <div class="mobile-card" style="background-color: {{themeColors.surface.hex}};">
                    <h3>Mobile Card</h3>
                    <p style="color: {{themeColors.text.hex}};">Content optimized for mobile viewing</p>
                    {{#if themeColors.accent}}
                    <span class="status-badge" style="background-color: {{themeColors.accent.hex}}; color: {{textColor themeColors.accent.hex}};">
                        Active
                    </span>
                    {{/if}}
                </div>
                {{/if}}
                
                {{#if (includes components 'buttons')}}
                <div class="mobile-actions">
                    <button class="mobile-btn-primary" style="background-color: {{themeColors.primary.hex}}; color: {{textColor themeColors.primary.hex}};">
                        Primary Action
                    </button>
                    {{#if themeColors.secondary}}
                    <button class="mobile-btn-secondary" style="background-color: {{themeColors.secondary.hex}}; color: {{textColor themeColors.secondary.hex}};">
                        Secondary
                    </button>
                    {{/if}}
                </div>
                {{/if}}
            </div>
        </div>
    </div>
    {{/if}}
    
    {{#if (eq previewType 'dashboard')}}
    <div class="dashboard-mockup">
        {{#if (includes components 'sidebar')}}
        <aside class="dashboard-sidebar" style="background-color: {{themeColors.surface.hex}};">
            <div class="sidebar-header" style="background-color: {{themeColors.primary.hex}};">
                <h2 style="color: {{textColor themeColors.primary.hex}};">Dashboard</h2>
            </div>
            <nav class="sidebar-nav">
                <a href="#" class="nav-item active" style="background-color: {{themeColors.accent.hex}}; color: {{textColor themeColors.accent.hex}};">
                    Overview
                </a>
                <a href="#" class="nav-item" style="color: {{themeColors.text.hex}};">Analytics</a>
                <a href="#" class="nav-item" style="color: {{themeColors.text.hex}};">Reports</a>
                <a href="#" class="nav-item" style="color: {{themeColors.text.hex}};">Settings</a>
            </nav>
        </aside>
        {{/if}}
        
        <main class="dashboard-main" style="background-color: {{themeColors.background.hex}};">
            {{#if (includes components 'header')}}
            <header class="dashboard-header" style="background-color: {{themeColors.surface.hex}}; border-bottom-color: {{themeColors.border.hex}};">
                <h1 style="color: {{themeColors.text.hex}};">Dashboard Overview</h1>
                <div class="header-actions">
                    {{#if (includes components 'buttons')}}
                    <button style="background-color: {{themeColors.primary.hex}}; color: {{textColor themeColors.primary.hex}};">
                        New Report
                    </button>
                    {{/if}}
                </div>
            </header>
            {{/if}}
            
            {{#if (includes components 'cards')}}
            <div class="dashboard-grid">
                <div class="metric-card" style="background-color: {{themeColors.surface.hex}};">
                    <h3 style="color: {{themeColors.text.hex}};">Total Users</h3>
                    <div class="metric-value" style="color: {{themeColors.primary.hex}};">12,345</div>
                </div>
                <div class="metric-card" style="background-color: {{themeColors.surface.hex}};">
                    <h3 style="color: {{themeColors.text.hex}};">Revenue</h3>
                    <div class="metric-value" style="color: {{themeColors.success.hex}};">$45,678</div>
                </div>
                <div class="metric-card" style="background-color: {{themeColors.surface.hex}};">
                    <h3 style="color: {{themeColors.text.hex}};">Conversion</h3>
                    <div class="metric-value" style="color: {{themeColors.accent.hex}};">3.2%</div>
                </div>
            </div>
            {{/if}}
        </main>
    </div>
    {{/if}}
    
    {{#if (eq previewType 'components')}}
    <div class="components-showcase">
        <div class="component-grid">
            {{#if (includes components 'buttons')}}
            <div class="component-section">
                <h3>Buttons</h3>
                <div class="button-samples">
                    <button style="background-color: {{themeColors.primary.hex}}; color: {{textColor themeColors.primary.hex}};">Primary</button>
                    {{#if themeColors.secondary}}
                    <button style="background-color: {{themeColors.secondary.hex}}; color: {{textColor themeColors.secondary.hex}};">Secondary</button>
                    {{/if}}
                    {{#if themeColors.success}}
                    <button style="background-color: {{themeColors.success.hex}}; color: {{textColor themeColors.success.hex}};">Success</button>
                    {{/if}}
                    {{#if themeColors.warning}}
                    <button style="background-color: {{themeColors.warning.hex}}; color: {{textColor themeColors.warning.hex}};">Warning</button>
                    {{/if}}
                    {{#if themeColors.error}}
                    <button style="background-color: {{themeColors.error.hex}}; color: {{textColor themeColors.error.hex}};">Error</button>
                    {{/if}}
                </div>
            </div>
            {{/if}}
            
            {{#if (includes components 'cards')}}
            <div class="component-section">
                <h3>Cards</h3>
                <div class="card-samples">
                    <div class="sample-card" style="background-color: {{themeColors.surface.hex}}; border-color: {{themeColors.border.hex}};">
                        <h4 style="color: {{themeColors.text.hex}};">Card Title</h4>
                        <p style="color: {{themeColors.text.hex}};">Card content with theme colors</p>
                    </div>
                </div>
            </div>
            {{/if}}
            
            {{#if (includes components 'forms')}}
            <div class="component-section">
                <h3>Form Elements</h3>
                <div class="form-samples">
                    <input type="text" placeholder="Text Input" style="border-color: {{themeColors.border.hex}}; background-color: {{themeColors.background.hex}};">
                    <select style="border-color: {{themeColors.border.hex}}; background-color: {{themeColors.background.hex}};">
                        <option>Select Option</option>
                    </select>
                    <textarea placeholder="Textarea" style="border-color: {{themeColors.border.hex}}; background-color: {{themeColors.background.hex}};"></textarea>
                </div>
            </div>
            {{/if}}
        </div>
    </div>
    {{/if}}
    
    {{#if interactive}}
    <div class="theme-controls">
        <h3>Theme Colors</h3>
        <div class="color-palette-display">
            {{#each themeColors}}
            <div class="theme-color-item" 
                 data-color="{{hex}}"
                 data-name="{{name}}"
                 tabindex="0"
                 role="button"
                 aria-label="Theme color {{name}}: {{hex}}">
                <div class="color-swatch" style="background-color: {{hex}};"></div>
                <div class="color-info">
                    <span class="color-name">{{name}}</span>
                    <span class="color-value">{{hex}}</span>
                    {{#if accessibility}}
                    <span class="accessibility-badge {{accessibilityClass accessibility.wcagAA accessibility.wcagAAA}}">
                        {{accessibilityBadge accessibility.wcagAA accessibility.wcagAAA}}
                    </span>
                    {{/if}}
                </div>
            </div>
            {{/each}}
        </div>
    </div>
    {{/if}}
</div>`;

    this.templates.set(
      'theme-preview-content',
      Handlebars.compile(themePreviewContentTemplate)
    );
  }

  public generatePaletteHTML(data: PaletteVisualizationData): string {
    const content = this.templates.get('palette-content')!(data);
    const css = this.generateCSS();
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

  private generateCSS(): string {
    return `
/* CSS Reset and Base Styles */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* CSS Custom Properties */
:root {
    --color-primary: #2563eb;
    --color-secondary: #64748b;
    --color-background: #ffffff;
    --color-surface: #f8fafc;
    --color-text: #1e293b;
    --color-text-secondary: #64748b;
    --color-border: #e2e8f0;
    --color-focus: #2563eb;
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --border-radius: 0.5rem;
    --border-radius-sm: 0.25rem;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --transition: all 0.2s ease-in-out;
}

/* Dark theme */
.theme-dark {
    --color-background: #0f172a;
    --color-surface: #1e293b;
    --color-text: #f1f5f9;
    --color-text-secondary: #94a3b8;
    --color-border: #334155;
}

/* Base Typography */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: var(--color-text);
    background-color: var(--color-background);
}

/* Visualization Container */
.visualization-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-lg);
    min-height: 100vh;
}

/* Header Styles */
.visualization-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
}

.visualization-header h1 {
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
    color: var(--color-text);
}

.description {
    font-size: 1.125rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);
}

.metadata {
    display: flex;
    justify-content: center;
    gap: var(--spacing-lg);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
}

/* Palette Container Layouts */
.palette-container {
    display: grid;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
}

/* Horizontal Layout */
.palette-layout-horizontal {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    max-width: 100%;
}

/* Vertical Layout */
.palette-layout-vertical {
    grid-template-columns: 1fr;
    max-width: 300px;
    margin: 0 auto;
}

/* Grid Layout */
.palette-layout-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

/* Circular Layout */
.palette-layout-circular {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-md);
}

.palette-layout-circular .color-swatch {
    border-radius: 50%;
    aspect-ratio: 1;
}

/* Size Variations */
.palette-size-small .color-swatch {
    min-height: 80px;
}

.palette-size-medium .color-swatch {
    min-height: 120px;
}

.palette-size-large .color-swatch {
    min-height: 160px;
}

/* Color Swatch Styles */
.color-swatch {
    position: relative;
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
    cursor: pointer;
    border: 2px solid transparent;
    background: var(--color-surface);
}

.color-swatch:hover,
.color-swatch:focus {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    outline: none;
    border-color: var(--color-focus);
}

.color-swatch:focus {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
}

.color-display {
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--spacing-sm);
    position: relative;
}

.color-values {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
    backdrop-filter: blur(4px);
}

.hex-value {
    display: block;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-weight: 600;
}

.color-name {
    display: block;
    font-size: 0.6875rem;
    opacity: 0.9;
    margin-top: var(--spacing-xs);
}

/* Accessibility Information */
.accessibility-info {
    position: absolute;
    top: var(--spacing-xs);
    right: var(--spacing-xs);
    display: flex;
    gap: var(--spacing-xs);
    font-size: 0.625rem;
}

.contrast-ratio {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 4px;
    border-radius: var(--border-radius-sm);
    font-weight: 500;
}

.wcag-badge {
    padding: 2px 4px;
    border-radius: var(--border-radius-sm);
    font-weight: 600;
    text-transform: uppercase;
}

.accessibility-aaa {
    background: #10b981;
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

/* Footer Controls */
.visualization-footer {
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-lg);
    text-align: center;
}

.controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-md);
}

.export-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.control-button {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.control-button:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
}

.control-button:focus {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
}

#export-format {
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .visualization-container {
        padding: var(--spacing-md);
    }
    
    .palette-layout-horizontal {
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    }
    
    .metadata {
        flex-direction: column;
        gap: var(--spacing-sm);
    }
    
    .controls {
        flex-direction: column;
    }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
    .color-swatch {
        border: 2px solid var(--color-text);
    }
    
    .control-button {
        border: 2px solid currentColor;
    }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
    * {
        transition: none !important;
        animation: none !important;
    }
}

/* Print Styles */
@media print {
    .visualization-footer {
        display: none;
    }
    
    .color-swatch {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #000;
    }
}

/* Screen Reader Only */
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
`;
  }

  private generateColorWheelCSS(): string {
    return `
/* Color Wheel Specific Styles */
.color-wheel-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
}

.color-wheel-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
}

.color-wheel-svg {
    border-radius: 50%;
    box-shadow: var(--shadow-md);
    background: var(--color-surface);
    cursor: crosshair;
}

.wheel-segments path {
    stroke: none;
    transition: var(--transition);
}

.wheel-segments path:hover {
    stroke: var(--color-text);
    stroke-width: 1;
}

.highlight-color {
    cursor: pointer;
    transition: var(--transition);
}

.highlight-color:hover,
.highlight-color:focus {
    r: 10;
    stroke-width: 3;
    outline: none;
}

.wheel-center {
    pointer-events: none;
}

.wheel-controls {
    display: flex;
    justify-content: center;
    width: 100%;
}

.selected-color-display {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--color-surface);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-sm);
}

.color-preview {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius);
    border: 2px solid var(--color-border);
}

.color-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.color-value {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-weight: 600;
    font-size: 0.875rem;
}

.color-coordinates {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
}

.harmony-info {
    text-align: center;
    max-width: 600px;
}

.harmony-info h3 {
    margin-bottom: var(--spacing-md);
    color: var(--color-text);
}

.harmony-colors {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
}

.harmony-color {
    width: 60px;
    height: 60px;
    border-radius: var(--border-radius);
    border: 2px solid var(--color-border);
    cursor: pointer;
    transition: var(--transition);
    position: relative;
}

.harmony-color:hover {
    transform: scale(1.1);
    box-shadow: var(--shadow-md);
}

.harmony-color::after {
    content: attr(data-color);
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.625rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    color: var(--color-text-secondary);
}

.harmony-lines line {
    stroke: var(--color-primary);
    stroke-width: 2;
    stroke-dasharray: 5,5;
    opacity: 0.7;
}

/* Responsive Design */
@media (max-width: 768px) {
    .color-wheel-svg {
        width: 300px;
        height: 300px;
    }
    
    .selected-color-display {
        flex-direction: column;
        text-align: center;
    }
}

${this.generateCSS()}
`;
  }

  private generateGradientCSS(data: GradientVisualizationData): string {
    let css = `
/* Gradient Visualization Styles */
.gradient-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    padding: var(--spacing-lg);
}

.gradient-preview-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
}

.gradient-preview {
    min-height: 150px;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.gradient-preview-rectangle {
    aspect-ratio: 16/9;
}

.gradient-preview-circle {
    aspect-ratio: 1;
    border-radius: 50%;
}

.gradient-preview-text {
    font-size: 2rem;
    font-weight: bold;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
}

.gradient-text {
    font-size: 2rem;
    font-weight: bold;
    color: white;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.gradient-button {
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    border-radius: var(--border-radius);
    font-size: 1rem;
    font-weight: 600;
    color: white;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
}

.gradient-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}`;

    // Only include CSS code section styles if needed
    if (data.showCSSCode) {
      css += `

.css-code-section {
    background: var(--color-surface);
    padding: var(--spacing-lg);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
}

.css-code-section h3 {
    margin-bottom: var(--spacing-md);
    color: var(--color-text);
}

.css-code {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    padding: var(--spacing-md);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    overflow-x: auto;
    margin-bottom: var(--spacing-md);
}

.copy-css-button {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: var(--transition);
}

.copy-css-button:hover {
    background: #1d4ed8;
}`;
    }

    // Only include gradient controls styles if needed
    if (data.interactiveControls) {
      css += `

.gradient-controls {
    background: var(--color-surface);
    padding: var(--spacing-lg);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
}

.gradient-controls h3 {
    margin-bottom: var(--spacing-md);
    color: var(--color-text);
}

.control-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}

.control-group label {
    min-width: 80px;
    font-weight: 500;
}

.control-group input[type="range"] {
    flex: 1;
    margin: 0 var(--spacing-sm);
}

.angle-value {
    min-width: 40px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
}`;
    }

    css += `

/* Responsive Design */
@media (max-width: 768px) {
    .gradient-preview-section {
        grid-template-columns: 1fr;
    }`;

    if (data.interactiveControls) {
      css += `
    
    .control-group {
        flex-direction: column;
        align-items: stretch;
    }
    
    .control-group label {
        min-width: auto;
    }`;
    }

    css += `
}

${this.generateCSS()}
`;

    return css;
  }

  private generateJavaScript(): string {
    return `
// Color Palette Visualization JavaScript
(function() {
    'use strict';
    
    let selectedSwatch = null;
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializePaletteVisualization();
        setupAccessibility();
        setupCopyFunctionality();
    });
    
    function initializePaletteVisualization() {
        const container = document.querySelector('.palette-container');
        const swatches = document.querySelectorAll('.color-swatch');
        const copyButton = document.getElementById('copy-palette');
        const exportButton = document.getElementById('export-palette');
        const exportFormat = document.getElementById('export-format');
        
        // Add keyboard navigation
        setupKeyboardNavigation(swatches);
        
        // Add click handlers for color swatches
        swatches.forEach(function(swatch, index) {
            swatch.addEventListener('click', function() {
                handleSwatchClick(swatch, index);
            });
            
            swatch.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSwatchClick(swatch, index);
                }
            });
        });
        
        // Copy palette functionality
        if (copyButton) {
            copyButton.addEventListener('click', function() {
                copyPaletteToClipboard();
            });
        }
        
        // Export functionality
        if (exportButton && exportFormat) {
            exportButton.addEventListener('click', function() {
                exportPalette(exportFormat.value);
            });
        }
        
        // Add ARIA live region for announcements
        createAriaLiveRegion();
    }
    
    function setupKeyboardNavigation(swatches) {
        swatches.forEach(function(swatch, index) {
            swatch.addEventListener('keydown', function(e) {
                let targetIndex = index;
                
                switch(e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        targetIndex = (index + 1) % swatches.length;
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        targetIndex = (index - 1 + swatches.length) % swatches.length;
                        break;
                    case 'Home':
                        e.preventDefault();
                        targetIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        targetIndex = swatches.length - 1;
                        break;
                    default:
                        return;
                }
                
                swatches[targetIndex].focus();
            });
        });
    }
    
    function handleSwatchClick(swatch, index) {
        const colorData = {
            hex: swatch.dataset.color,
            rgb: swatch.dataset.rgb,
            hsl: swatch.dataset.hsl
        };
        
        // Copy color to clipboard
        copyColorToClipboard(colorData.hex);
        
        // Show color details
        toggleColorDetails(swatch);
        
        // Announce to screen readers
        announceToScreenReader('Color ' + colorData.hex + ' copied to clipboard');
        
        // Visual feedback
        showCopyFeedback(swatch);
    }
    
    function copyColorToClipboard(color) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(color).catch(function(err) {
                console.warn('Failed to copy color to clipboard:', err);
                fallbackCopyToClipboard(color);
            });
        } else {
            fallbackCopyToClipboard(color);
        }
    }
    
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.warn('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    function toggleColorDetails(swatch) {
        const details = swatch.querySelector('.color-details');
        if (details) {
            const isHidden = details.hasAttribute('hidden');
            
            // Hide all other details first
            document.querySelectorAll('.color-details').forEach(function(detail) {
                detail.setAttribute('hidden', '');
            });
            
            // Toggle current details
            if (isHidden) {
                details.removeAttribute('hidden');
            }
        }
    }
    
    function showCopyFeedback(swatch) {
        const originalTransform = swatch.style.transform;
        swatch.style.transform = 'scale(0.95)';
        
        setTimeout(function() {
            swatch.style.transform = originalTransform;
        }, 150);
    }
    
    function copyPaletteToClipboard() {
        const swatches = document.querySelectorAll('.color-swatch');
        const colors = Array.from(swatches).map(function(swatch) {
            return swatch.dataset.color;
        });
        
        const paletteText = colors.join(', ');
        copyColorToClipboard(paletteText);
        announceToScreenReader('Entire palette copied to clipboard');
    }
    
    function exportPalette(format) {
        const swatches = document.querySelectorAll('.color-swatch');
        const colors = Array.from(swatches).map(function(swatch) {
            return {
                hex: swatch.dataset.color,
                rgb: swatch.dataset.rgb,
                hsl: swatch.dataset.hsl
            };
        });
        
        let exportData = '';
        
        switch(format) {
            case 'hex':
                exportData = colors.map(function(c) { return c.hex; }).join('\\n');
                break;
            case 'rgb':
                exportData = colors.map(function(c) { return c.rgb; }).join('\\n');
                break;
            case 'hsl':
                exportData = colors.map(function(c) { return c.hsl; }).join('\\n');
                break;
            case 'css':
                exportData = generateCSSExport(colors);
                break;
            case 'json':
                exportData = JSON.stringify(colors, null, 2);
                break;
            default:
                exportData = colors.map(function(c) { return c.hex; }).join('\\n');
        }
        
        downloadFile(exportData, 'palette.' + (format === 'css' ? 'css' : 'txt'));
        announceToScreenReader('Palette exported as ' + format);
    }
    
    function generateCSSExport(colors) {
        let css = ':root {\\n';
        colors.forEach(function(color, index) {
            css += '  --color-' + (index + 1) + ': ' + color.hex + ';\\n';
        });
        css += '}';
        return css;
    }
    
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }
    
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }
    
    // Handle focus management for modal-like behavior
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Hide all color details
            document.querySelectorAll('.color-details').forEach(function(detail) {
                detail.setAttribute('hidden', '');
            });
        }
    });
    
})();
`;
  }

  private generateColorWheelJavaScript(
    data: ColorWheelVisualizationData
  ): string {
    return `
// Color Wheel Visualization JavaScript
(function() {
    'use strict';
    
    const wheelData = ${JSON.stringify(data)};
    let selectedColor = { h: 0, s: 50, l: 50 };
    
    document.addEventListener('DOMContentLoaded', function() {
        initializeColorWheel();
    });
    
    function initializeColorWheel() {
        const svg = document.querySelector('.color-wheel-svg');
        const wheelSegments = document.querySelector('.wheel-segments');
        
        if (!svg || !wheelSegments) return;
        
        // Generate color wheel segments
        generateWheelSegments(wheelSegments);
        
        // Add event listeners
        svg.addEventListener('click', handleWheelClick);
        svg.addEventListener('mousemove', handleWheelHover);
        
        // Initialize harmony display if enabled
        if (wheelData.showHarmony) {
            updateHarmonyDisplay();
        }
        
        // Add keyboard navigation
        setupWheelKeyboardNavigation();
        
        // Add ARIA live region
        createAriaLiveRegion();
    }
    
    function generateWheelSegments(container) {
        const centerX = wheelData.size / 2;
        const centerY = wheelData.size / 2;
        const outerRadius = (wheelData.size / 2) * 0.9;
        const innerRadius = (wheelData.size / 2) * 0.2;
        
        // Generate segments based on wheel type
        const segments = wheelData.type === 'hsl' ? 360 : 360;
        const segmentAngle = 360 / segments;
        
        for (let i = 0; i < segments; i++) {
            const hue = i * segmentAngle;
            const startAngle = (hue - segmentAngle / 2) * Math.PI / 180;
            const endAngle = (hue + segmentAngle / 2) * Math.PI / 180;
            
            // Create path for segment
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            const x1 = centerX + innerRadius * Math.cos(startAngle);
            const y1 = centerY + innerRadius * Math.sin(startAngle);
            const x2 = centerX + outerRadius * Math.cos(startAngle);
            const y2 = centerY + outerRadius * Math.sin(startAngle);
            const x3 = centerX + outerRadius * Math.cos(endAngle);
            const y3 = centerY + outerRadius * Math.sin(endAngle);
            const x4 = centerX + innerRadius * Math.cos(endAngle);
            const y4 = centerY + innerRadius * Math.sin(endAngle);
            
            const pathData = \`M \${x1} \${y1} L \${x2} \${y2} A \${outerRadius} \${outerRadius} 0 0 1 \${x3} \${y3} L \${x4} \${y4} A \${innerRadius} \${innerRadius} 0 0 0 \${x1} \${y1} Z\`;
            
            path.setAttribute('d', pathData);
            path.setAttribute('fill', getColorForHue(hue));
            path.setAttribute('data-hue', hue.toString());
            path.setAttribute('tabindex', '0');
            path.setAttribute('role', 'button');
            path.setAttribute('aria-label', \`Hue \${Math.round(hue)} degrees\`);
            
            container.appendChild(path);
        }
    }
    
    function getColorForHue(hue) {
        switch (wheelData.type) {
            case 'hsl':
                return \`hsl(\${hue}, 100%, 50%)\`;
            case 'hsv':
                return hsvToHex(hue, 100, 100);
            case 'rgb':
                return hslToHex(hue, 100, 50);
            default:
                return \`hsl(\${hue}, 100%, 50%)\`;
        }
    }
    
    function handleWheelClick(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = event.clientX - rect.left - centerX;
        const y = event.clientY - rect.top - centerY;
        
        const angle = Math.atan2(y, x) * 180 / Math.PI;
        const hue = (angle + 360 + 90) % 360; // Adjust for top being 0 degrees
        const distance = Math.sqrt(x * x + y * y);
        const maxRadius = Math.min(centerX, centerY) * 0.9;
        
        if (distance <= maxRadius && distance >= maxRadius * 0.2) {
            const saturation = Math.min(100, (distance / maxRadius) * 100);
            selectedColor = { h: hue, s: saturation, l: 50 };
            updateSelectedColorDisplay();
            
            if (wheelData.showHarmony) {
                updateHarmonyDisplay();
            }
            
            announceToScreenReader(\`Selected color: hue \${Math.round(hue)} degrees, saturation \${Math.round(saturation)}%\`);
        }
    }
    
    function handleWheelHover(event) {
        // Add hover effects and preview
        const target = event.target;
        if (target.tagName === 'path') {
            const hue = parseFloat(target.getAttribute('data-hue'));
            // Could show preview here
        }
    }
    
    function updateSelectedColorDisplay() {
        const colorDisplay = document.getElementById('selected-color');
        if (!colorDisplay) return;
        
        const preview = colorDisplay.querySelector('.color-preview');
        const value = colorDisplay.querySelector('.color-value');
        const coordinates = colorDisplay.querySelector('.color-coordinates');
        
        const color = \`hsl(\${selectedColor.h}, \${selectedColor.s}%, \${selectedColor.l}%)\`;
        const hex = hslToHex(selectedColor.h, selectedColor.s, selectedColor.l);
        
        if (preview) preview.style.backgroundColor = color;
        if (value) value.textContent = hex;
        if (coordinates) coordinates.textContent = \`H: \${Math.round(selectedColor.h)}°, S: \${Math.round(selectedColor.s)}%, L: \${Math.round(selectedColor.l)}%\`;
    }
    
    function updateHarmonyDisplay() {
        const harmonyContainer = document.getElementById('harmony-colors');
        if (!harmonyContainer || !wheelData.harmonyType) return;
        
        const harmonyColors = calculateHarmonyColors(selectedColor.h, wheelData.harmonyType);
        harmonyContainer.innerHTML = '';
        
        harmonyColors.forEach(function(hue, index) {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'harmony-color';
            colorDiv.style.backgroundColor = \`hsl(\${hue}, \${selectedColor.s}%, \${selectedColor.l}%)\`;
            colorDiv.setAttribute('data-color', hslToHex(hue, selectedColor.s, selectedColor.l));
            colorDiv.setAttribute('tabindex', '0');
            colorDiv.setAttribute('role', 'button');
            colorDiv.setAttribute('aria-label', \`Harmony color \${index + 1}: \${hslToHex(hue, selectedColor.s, selectedColor.l)}\`);
            
            colorDiv.addEventListener('click', function() {
                copyColorToClipboard(this.getAttribute('data-color'));
                announceToScreenReader(\`Copied \${this.getAttribute('data-color')} to clipboard\`);
            });
            
            harmonyContainer.appendChild(colorDiv);
        });
    }
    
    function calculateHarmonyColors(baseHue, harmonyType) {
        const colors = [baseHue];
        
        switch (harmonyType) {
            case 'complementary':
                colors.push((baseHue + 180) % 360);
                break;
            case 'triadic':
                colors.push((baseHue + 120) % 360);
                colors.push((baseHue + 240) % 360);
                break;
            case 'analogous':
                colors.push((baseHue + 30) % 360);
                colors.push((baseHue - 30 + 360) % 360);
                break;
            case 'split_complementary':
                colors.push((baseHue + 150) % 360);
                colors.push((baseHue + 210) % 360);
                break;
            case 'tetradic':
                colors.push((baseHue + 90) % 360);
                colors.push((baseHue + 180) % 360);
                colors.push((baseHue + 270) % 360);
                break;
        }
        
        return colors;
    }
    
    function setupWheelKeyboardNavigation() {
        const paths = document.querySelectorAll('.wheel-segments path');
        paths.forEach(function(path, index) {
            path.addEventListener('keydown', function(e) {
                let targetIndex = index;
                
                switch(e.key) {
                    case 'ArrowRight':
                        e.preventDefault();
                        targetIndex = (index + 1) % paths.length;
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        targetIndex = (index - 1 + paths.length) % paths.length;
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        path.click();
                        break;
                    default:
                        return;
                }
                
                if (targetIndex !== index) {
                    paths[targetIndex].focus();
                }
            });
        });
    }
    
    // Utility functions
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
    
    function copyColorToClipboard(color) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(color).catch(function(err) {
                console.warn('Failed to copy color to clipboard:', err);
            });
        }
    }
    
    function createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }
    
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }
    
})();
`;
  }

  private generateGradientJavaScript(data: GradientVisualizationData): string {
    return `
// Gradient Visualization JavaScript
(function() {
    'use strict';
    
    const gradientData = ${JSON.stringify(data)};
    
    document.addEventListener('DOMContentLoaded', function() {
        initializeGradientVisualization();
    });
    
    function initializeGradientVisualization() {
        // Add copy CSS functionality
        const copyButton = document.querySelector('.copy-css-button');
        if (copyButton) {
            copyButton.addEventListener('click', function() {
                const css = this.getAttribute('data-css');
                copyToClipboard(css);
                announceToScreenReader('CSS code copied to clipboard');
            });
        }
        
        // Add interactive controls
        if (gradientData.interactiveControls) {
            setupGradientControls();
        }
        
        // Add ARIA live region
        createAriaLiveRegion();
    }
    
    function setupGradientControls() {
        const angleSlider = document.getElementById('gradient-angle');
        const angleValue = document.querySelector('.angle-value');
        
        if (angleSlider && angleValue) {
            angleSlider.addEventListener('input', function() {
                const angle = this.value;
                angleValue.textContent = angle + '°';
                updateGradientPreviews(angle);
            });
        }
    }
    
    function updateGradientPreviews(angle) {
        const previews = document.querySelectorAll('.gradient-preview');
        const originalCSS = gradientData.gradientCSS;
        
        // Update linear gradients with new angle
        const updatedCSS = originalCSS.replace(/linear-gradient\\([^,]+,/, \`linear-gradient(\${angle}deg,\`);
        
        previews.forEach(function(preview) {
            preview.style.background = updatedCSS;
        });
        
        // Update CSS code display
        const codeElement = document.querySelector('.css-code code');
        if (codeElement) {
            codeElement.textContent = \`background: \${updatedCSS};\`;
        }
        
        // Update copy button data
        const copyButton = document.querySelector('.copy-css-button');
        if (copyButton) {
            copyButton.setAttribute('data-css', updatedCSS);
        }
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(function(err) {
                console.warn('Failed to copy to clipboard:', err);
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
        }
    }
    
    function fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.warn('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    function createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }
    
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }
    
})();
`;
  }

  private generateThemePreviewCSS(
    _data: ThemePreviewVisualizationData
  ): string {
    return `
/* Theme Preview Specific Styles */
.theme-preview-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
}

/* Website Preview Styles */
.website-preview .website-mockup {
    min-height: 600px;
    display: flex;
    flex-direction: column;
}

.mockup-header {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
}

.main-nav {
    display: flex;
    gap: var(--spacing-lg);
}

.main-nav a {
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
}

.main-nav a:hover {
    opacity: 0.8;
}

.mockup-main {
    flex: 1;
    padding: var(--spacing-xl);
}

.hero-section {
    text-align: center;
    padding: var(--spacing-xl);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-xl);
}

.hero-section h2 {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
}

.hero-section p {
    font-size: 1.125rem;
    margin-bottom: var(--spacing-lg);
    opacity: 0.9;
}

.button-group {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
    padding: var(--spacing-sm) var(--spacing-lg);
    border: none;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
}

.btn-primary:hover, .btn-secondary:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
}

.card {
    padding: var(--spacing-lg);
    border-radius: var(--border-radius);
    border: 1px solid;
    box-shadow: var(--shadow-sm);
}

.card h3 {
    margin-bottom: var(--spacing-md);
}

.accent-text {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.form-section {
    padding: var(--spacing-lg);
    border-radius: var(--border-radius);
}

.sample-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.sample-form input,
.sample-form textarea {
    padding: var(--spacing-sm);
    border: 1px solid;
    border-radius: var(--border-radius);
    font-size: 1rem;
}

.sample-form button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
}

.mockup-footer {
    padding: var(--spacing-lg);
    text-align: center;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* Mobile Preview Styles */
.mobile-preview .mobile-mockup {
    display: flex;
    justify-content: center;
    padding: var(--spacing-lg);
}

.mobile-frame {
    width: 320px;
    height: 568px;
    border: 8px solid #333;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
}

.mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    font-weight: 600;
}

.back-button, .menu-button {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
}

.mobile-content {
    padding: var(--spacing-md);
    height: calc(100% - 60px);
    overflow-y: auto;
}

.mobile-card {
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-md);
    box-shadow: var(--shadow-sm);
}

.status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.mobile-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.mobile-btn-primary, .mobile-btn-secondary {
    padding: var(--spacing-sm);
    border: none;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
}

/* Dashboard Preview Styles */
.dashboard-preview .dashboard-mockup {
    display: grid;
    grid-template-columns: 250px 1fr;
    min-height: 600px;
}

.dashboard-sidebar {
    border-right: 1px solid var(--color-border);
}

.sidebar-header {
    padding: var(--spacing-md);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
    margin: 0;
    font-size: 1.25rem;
}

.sidebar-nav {
    padding: var(--spacing-md) 0;
}

.nav-item {
    display: block;
    padding: var(--spacing-sm) var(--spacing-md);
    text-decoration: none;
    transition: var(--transition);
}

.nav-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.nav-item.active {
    font-weight: 600;
}

.dashboard-main {
    display: flex;
    flex-direction: column;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid;
}

.dashboard-header h1 {
    margin: 0;
    font-size: 1.5rem;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
}

.metric-card {
    padding: var(--spacing-lg);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-sm);
    text-align: center;
}

.metric-card h3 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
}

.metric-value {
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
}

/* Components Preview Styles */
.components-preview .components-showcase {
    padding: var(--spacing-lg);
}

.component-grid {
    display: grid;
    gap: var(--spacing-xl);
}

.component-section h3 {
    margin-bottom: var(--spacing-md);
    color: var(--color-text);
}

.button-samples {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
}

.button-samples button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
}

.button-samples button:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

.card-samples {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
}

.sample-card {
    padding: var(--spacing-md);
    border: 1px solid;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-sm);
}

.sample-card h4 {
    margin: 0 0 var(--spacing-sm) 0;
}

.form-samples {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    max-width: 300px;
}

.form-samples input,
.form-samples select,
.form-samples textarea {
    padding: var(--spacing-sm);
    border: 1px solid;
    border-radius: var(--border-radius);
    font-size: 1rem;
}

/* Theme Controls */
.theme-controls {
    margin-top: var(--spacing-xl);
    padding: var(--spacing-lg);
    background: var(--color-surface);
    border-radius: var(--border-radius);
}

.theme-controls h3 {
    margin-bottom: var(--spacing-md);
    color: var(--color-text);
}

.color-palette-display {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
}

.theme-color-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: var(--transition);
}

.theme-color-item:hover,
.theme-color-item:focus {
    box-shadow: var(--shadow-sm);
    outline: none;
    border-color: var(--color-focus);
}

.color-swatch {
    width: 40px;
    height: 40px;
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
    flex-shrink: 0;
}

.color-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.color-name {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: capitalize;
}

.color-value {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 768px) {
    .dashboard-mockup {
        grid-template-columns: 1fr;
    }
    
    .dashboard-sidebar {
        order: 2;
        border-right: none;
        border-top: 1px solid var(--color-border);
    }
    
    .header-content {
        flex-direction: column;
        gap: var(--spacing-md);
    }
    
    .main-nav {
        justify-content: center;
    }
    
    .button-group {
        flex-direction: column;
        align-items: center;
    }
    
    .color-palette-display {
        grid-template-columns: 1fr;
    }
}

${this.generateCSS()}
`;
  }

  private generateThemePreviewJavaScript(
    data: ThemePreviewVisualizationData
  ): string {
    return `
// Theme Preview Visualization JavaScript
(function() {
    'use strict';
    
    const themeData = ${JSON.stringify(data)};
    
    document.addEventListener('DOMContentLoaded', function() {
        initializeThemePreview();
        setupAccessibility();
        setupCopyFunctionality();
    });
    
    function initializeThemePreview() {
        // Add interactive features to theme color items
        const colorItems = document.querySelectorAll('.theme-color-item');
        colorItems.forEach(function(item) {
            item.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                const name = this.getAttribute('data-name');
                copyColorToClipboard(color, name);
            });
            
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
        
        // Add hover effects to interactive elements
        setupHoverEffects();
        
        // Create ARIA live region for announcements
        createAriaLiveRegion();
    }
    
    function setupAccessibility() {
        // Ensure all interactive elements have proper ARIA labels
        const buttons = document.querySelectorAll('button');
        buttons.forEach(function(button) {
            if (!button.getAttribute('aria-label') && button.textContent) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });
        
        // Add keyboard navigation for mockup elements
        const focusableElements = document.querySelectorAll('button, [tabindex="0"]');
        focusableElements.forEach(function(element, index) {
            element.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    // Let default tab behavior work
                    return;
                }
                
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % focusableElements.length;
                    focusableElements[nextIndex].focus();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + focusableElements.length) % focusableElements.length;
                    focusableElements[prevIndex].focus();
                }
            });
        });
    }
    
    function setupCopyFunctionality() {
        // Add copy functionality to all color elements
        const colorElements = document.querySelectorAll('[data-color]');
        colorElements.forEach(function(element) {
            // Add visual indicator for copyable elements
            element.style.cursor = 'pointer';
            element.title = 'Click to copy color value';
        });
    }
    
    function setupHoverEffects() {
        // Add subtle hover effects to demonstrate interactivity
        const interactiveElements = document.querySelectorAll('button, .theme-color-item, .nav-item');
        interactiveElements.forEach(function(element) {
            element.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
            });
            
            element.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }
    
    function copyColorToClipboard(color, name) {
        const textToCopy = color;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(function() {
                showCopyFeedback(\`Copied \${name || 'color'}: \${color}\`);
                announceToScreenReader(\`Copied \${name || 'color'} \${color} to clipboard\`);
            }).catch(function(err) {
                console.warn('Failed to copy to clipboard:', err);
                fallbackCopyToClipboard(textToCopy, name);
            });
        } else {
            fallbackCopyToClipboard(textToCopy, name);
        }
    }
    
    function fallbackCopyToClipboard(text, name) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopyFeedback(\`Copied \${name || 'color'}: \${text}\`);
            announceToScreenReader(\`Copied \${name || 'color'} \${text} to clipboard\`);
        } catch (err) {
            console.warn('Fallback copy failed:', err);
            showCopyFeedback('Failed to copy color');
        }
        
        document.body.removeChild(textArea);
    }
    
    function showCopyFeedback(message) {
        // Remove any existing feedback
        const existingFeedback = document.querySelector('.copy-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.className = 'copy-feedback';
        feedback.textContent = message;
        feedback.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-primary, #2563eb);
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            animation: slideInFadeOut 3s ease-in-out forwards;
            pointer-events: none;
        \`;
        
        document.body.appendChild(feedback);
        
        setTimeout(function() {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 3000);
    }
    
    function createAriaLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }
    
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = \`
        @keyframes slideInFadeOut {
            0% {
                opacity: 0;
                transform: translateX(100%);
            }
            15% {
                opacity: 1;
                transform: translateX(0);
            }
            85% {
                opacity: 1;
                transform: translateX(0);
            }
            100% {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        
        .theme-color-item:focus {
            outline: 2px solid var(--color-focus, #2563eb);
            outline-offset: 2px;
        }
        
        button:focus {
            outline: 2px solid var(--color-focus, #2563eb);
            outline-offset: 2px;
        }
        
        .nav-item:focus {
            outline: 2px solid var(--color-focus, #2563eb);
            outline-offset: 2px;
        }
    \`;
    document.head.appendChild(style);
    
})();
`;
  }
}
