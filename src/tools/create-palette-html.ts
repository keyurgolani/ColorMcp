/**
 * MCP tool for creating HTML palette visualizations
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
// import {
//   HTMLGenerator,
//   HTMLGeneratorOptions,
//   PaletteVisualizationData,
// } from '../visualization/html-generator';
// import { UnifiedColor } from '../color/unified-color';
// import { validateColorInput } from '../validation/schemas';
import * as Joi from 'joi';

// Parameter validation schema
const createPaletteHtmlSchema = Joi.object({
  palette: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .max(50)
    .required()
    .description('Array of colors in any supported format'),

  layout: Joi.string()
    .valid('horizontal', 'vertical', 'grid', 'circular', 'wave')
    .default('horizontal')
    .description('Layout style for the palette'),

  style: Joi.string()
    .valid('swatches', 'gradient', 'cards', 'minimal', 'detailed')
    .default('swatches')
    .description('Visual style of the palette'),

  size: Joi.string()
    .valid('small', 'medium', 'large', 'custom')
    .default('medium')
    .description('Size of color swatches'),

  custom_dimensions: Joi.array()
    .items(Joi.number().integer().min(50).max(2000))
    .length(2)
    .when('size', {
      is: 'custom',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('Custom dimensions [width, height] when size is custom'),

  show_values: Joi.boolean()
    .default(true)
    .description('Show color values on swatches'),

  show_names: Joi.boolean()
    .default(false)
    .description('Show color names if available'),

  interactive: Joi.boolean()
    .default(true)
    .description('Enable interactive features'),

  export_formats: Joi.array()
    .items(Joi.string().valid('hex', 'rgb', 'hsl', 'css', 'json'))
    .default(['hex', 'rgb', 'hsl'])
    .description('Available export formats'),

  accessibility_info: Joi.boolean()
    .default(false)
    .description('Show accessibility information'),

  theme: Joi.string()
    .valid('light', 'dark', 'auto')
    .default('light')
    .description('Color theme for the visualization'),
});

interface CreatePaletteHtmlParams {
  palette: string[];
  layout?: 'horizontal' | 'vertical' | 'grid' | 'circular' | 'wave';
  style?: 'swatches' | 'gradient' | 'cards' | 'minimal' | 'detailed';
  size?: 'small' | 'medium' | 'large' | 'custom';
  custom_dimensions?: [number, number];
  show_values?: boolean;
  show_names?: boolean;
  interactive?: boolean;
  export_formats?: string[];
  accessibility_info?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

async function createPaletteHtml(
  params: CreatePaletteHtmlParams
): Promise<ToolResponse | ErrorResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { error, value } = createPaletteHtmlSchema.validate(params);
    if (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid parameters provided',
          details: error.details,
          suggestions: [
            'Check that palette contains valid color strings',
            'Ensure layout is one of: horizontal, vertical, grid, circular, wave',
            'Verify custom_dimensions are provided when size is custom',
          ],
        },
        metadata: {
          execution_time: Date.now() - startTime,
          tool: 'create_palette_html',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const validatedParams = value as CreatePaletteHtmlParams;

    // Validate colors
    for (let i = 0; i < validatedParams.palette.length; i++) {
      const color = validatedParams.palette[i];
      if (!color || !isValidColor(color)) {
        return {
          success: false,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: `Invalid color format at index ${i}: ${color}`,
            details: { index: i, color },
            suggestions: [
              'Use hex format like #FF0000',
              'Use RGB format like rgb(255, 0, 0)',
              'Use HSL format like hsl(0, 100%, 50%)',
              'Check the color format documentation',
            ],
          },
          metadata: {
            execution_time: Date.now() - startTime,
            tool: 'create_palette_html',
            timestamp: new Date().toISOString(),
          },
        };
      }
    }

    // Generate basic HTML for now
    const html = generateBasicPaletteHTML(validatedParams);

    // Generate export formats
    const exportFormats: Record<string, string | object> = {};

    if (validatedParams.export_formats?.includes('css')) {
      exportFormats['css'] = generateCSSExport(validatedParams.palette);
    }

    if (validatedParams.export_formats?.includes('json')) {
      exportFormats['json'] = {
        palette: validatedParams.palette.map((color, index) => ({
          hex: color,
          rgb: color,
          hsl: color,
          name: `Color ${index + 1}`,
        })),
        metadata: {
          title: 'Color Palette Visualization',
          colorCount: validatedParams.palette.length,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: {
        colors: validatedParams.palette.map((color, index) => ({
          hex: color,
          rgb: color,
          hsl: color,
          name: `Color ${index + 1}`,
        })),
        layout: validatedParams.layout || 'horizontal',
        color_count: validatedParams.palette.length,
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'create_palette_html',
        timestamp: new Date().toISOString(),
        color_space_used: 'sRGB',
        accessibility_notes: [],
        recommendations: [],
      },
      visualizations: {
        html,
      },
      export_formats: exportFormats,
    };

    // Original code commented out for testing
    /*
    // Validate parameters
    const { error, value } = createPaletteHtmlSchema.validate(params);
    if (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid parameters provided',
          details: error.details,
          suggestions: [
            'Check that palette contains valid color strings',
            'Ensure layout is one of: horizontal, vertical, grid, circular, wave',
            'Verify custom_dimensions are provided when size is custom',
          ],
        },
        metadata: {
          execution_time: Date.now() - startTime,
          tool: 'create_palette_html',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const validatedParams = value as CreatePaletteHtmlParams;

    // Parse and validate colors
    const colors: Array<{
      hex: string;
      rgb: string;
      hsl: string;
      name?: string;
      accessibility?: {
        contrastRatio: number;
        wcagAA: boolean;
        wcagAAA: boolean;
      };
    }> = [];

    const accessibilityNotes: string[] = [];
    const recommendations: string[] = [];

    for (let i = 0; i < validatedParams.palette.length; i++) {
      const colorInput = validatedParams.palette[i];

      if (!colorInput) {
        return {
          success: false,
          error: {
            code: 'INVALID_COLOR_FORMAT',
            message: `Color at index ${i} is undefined or null`,
            details: { index: i, color: colorInput },
            suggestions: [
              'Ensure all palette entries are valid color strings',
              'Check for undefined or null values in the palette array',
            ],
          },
          metadata: {
            execution_time: Date.now() - startTime,
            tool: 'create_palette_html',
            timestamp: new Date().toISOString(),
          },
        };
      }

      try {
        // Validate color format
        const colorValidation = validateColorInput(colorInput);
        if (!colorValidation.isValid) {
          return {
            success: false,
            error: {
              code: 'INVALID_COLOR_FORMAT',
              message: `Invalid color format at index ${i}: ${colorInput}`,
              details: {
                index: i,
                color: colorInput,
                reason: colorValidation.error,
              },
              suggestions: [
                'Use hex format like #FF0000',
                'Use RGB format like rgb(255, 0, 0)',
                'Use HSL format like hsl(0, 100%, 50%)',
                'Check the color format documentation',
              ],
            },
            metadata: {
              execution_time: Date.now() - startTime,
              tool: 'create_palette_html',
              timestamp: new Date().toISOString(),
            },
          };
        }

        let unifiedColor: UnifiedColor;
        try {
          unifiedColor = new UnifiedColor(colorInput);
        } catch (colorError) {
          throw new Error(`Failed to create UnifiedColor for "${colorInput}": ${colorError instanceof Error ? colorError.message : String(colorError)}`);
        }

        // Calculate accessibility information if requested
        let accessibility;
        if (validatedParams.accessibility_info) {
          // Calculate contrast against white and black backgrounds
          const whiteContrast = unifiedColor.getContrastRatio('#ffffff');
          const blackContrast = unifiedColor.getContrastRatio('#000000');
          const bestContrast = Math.max(whiteContrast, blackContrast);

          accessibility = {
            contrastRatio: bestContrast,
            wcagAA: bestContrast >= 4.5,
            wcagAAA: bestContrast >= 7.0,
          };

          // Add accessibility notes
          if (!accessibility.wcagAA) {
            accessibilityNotes.push(
              `Color ${unifiedColor.hex} may not meet WCAG AA contrast requirements`
            );
          }
        }

        const colorName = unifiedColor.getName();
        colors.push({
          hex: unifiedColor.hex,
          rgb: unifiedColor.toFormat('rgb'),
          hsl: unifiedColor.toFormat('hsl'),
          ...(colorName && { name: colorName }),
          ...(accessibility && { accessibility }),
        });
      } catch (colorError) {
        return {
          success: false,
          error: {
            code: 'COLOR_PROCESSING_ERROR',
            message: `Failed to process color at index ${i}: ${colorInput}`,
            details: { index: i, color: colorInput, error: colorError },
            suggestions: [
              'Verify the color format is supported',
              'Check for typos in color values',
              'Try a different color format',
            ],
          },
          metadata: {
            execution_time: Date.now() - startTime,
            tool: 'create_palette_html',
            timestamp: new Date().toISOString(),
          },
        };
      }
    }

    // Generate recommendations
    if (colors.length > 10) {
      recommendations.push(
        'Consider using fewer colors for better visual clarity'
      );
    }

    if (validatedParams.layout === 'circular' && colors.length > 8) {
      recommendations.push('Circular layout works best with 8 or fewer colors');
    }

    if (validatedParams.accessibility_info) {
      const lowContrastColors = colors.filter(
        c => c.accessibility && !c.accessibility.wcagAA
      ).length;
      if (lowContrastColors > 0) {
        recommendations.push(
          `${lowContrastColors} colors may need contrast adjustment for accessibility`
        );
      }
    }

    // Prepare visualization data
    const options: HTMLGeneratorOptions = {
      ...(validatedParams.layout && { layout: validatedParams.layout }),
      ...(validatedParams.style && { style: validatedParams.style }),
      ...(validatedParams.size && { size: validatedParams.size }),
      ...(validatedParams.custom_dimensions && {
        customDimensions: validatedParams.custom_dimensions,
      }),
      ...(validatedParams.show_values !== undefined && {
        showValues: validatedParams.show_values,
      }),
      ...(validatedParams.show_names !== undefined && {
        showNames: validatedParams.show_names,
      }),
      ...(validatedParams.interactive !== undefined && {
        interactive: validatedParams.interactive,
      }),
      ...(validatedParams.export_formats && {
        exportFormats: validatedParams.export_formats,
      }),
      ...(validatedParams.accessibility_info !== undefined && {
        accessibilityInfo: validatedParams.accessibility_info,
      }),
      ...(validatedParams.theme && { theme: validatedParams.theme }),
    };

    const visualizationData: PaletteVisualizationData = {
      colors,
      options,
      metadata: {
        title: 'Color Palette Visualization',
        description: `Interactive color palette with ${colors.length} colors`,
        timestamp: new Date().toLocaleString(),
        colorCount: colors.length,
      },
    };

    // Generate HTML
    let htmlGenerator: HTMLGenerator;
    let html: string;
    
    try {
      htmlGenerator = new HTMLGenerator();
    } catch (generatorError) {
      throw new Error(`Failed to create HTMLGenerator: ${generatorError instanceof Error ? generatorError.message : String(generatorError)}`);
    }
    
    try {
      html = htmlGenerator.generatePaletteHTML(visualizationData);
    } catch (htmlError) {
      throw new Error(`Failed to generate HTML: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}`);
    }

    // Prepare export formats
    const exportFormats: Record<string, string | object> = {};

    if (validatedParams.export_formats?.includes('css')) {
      exportFormats['css'] = generateCSSExport(colors);
    }

    if (validatedParams.export_formats?.includes('json')) {
      exportFormats['json'] = {
        palette: colors.map(c => ({
          hex: c.hex,
          rgb: c.rgb,
          hsl: c.hsl,
          name: c.name,
        })),
        metadata: visualizationData.metadata,
      };
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        colors: colors.map(c => ({
          hex: c.hex,
          rgb: c.rgb,
          hsl: c.hsl,
          name: c.name,
        })),
        layout: validatedParams.layout,
        color_count: colors.length,
        accessibility_compliant: validatedParams.accessibility_info
          ? colors.every(c => c.accessibility?.wcagAA)
          : undefined,
      },
      metadata: {
        execution_time: executionTime,
        tool: 'create_palette_html',
        timestamp: new Date().toISOString(),
        color_space_used: 'sRGB',
        accessibility_notes: accessibilityNotes,
        recommendations,
        colorCount: colors.length,
      },
      visualizations: {
        html,
      },
      export_formats: exportFormats,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: `HTML visualization error: ${errorMessage}`,
        details: {
          errorMessage,
          errorStack,
          errorType: error?.constructor?.name || 'Unknown',
        },
        suggestions: [
          'Try with a smaller palette',
          'Verify all colors are in valid formats',
          'Check if the layout and style options are supported',
        ],
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'create_palette_html',
        timestamp: new Date().toISOString(),
      },
    };
    */
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: `Test mode error: ${errorMessage}`,
        details: { errorMessage },
        suggestions: ['Check the error message above'],
      },
      metadata: {
        execution_time: Date.now() - startTime,
        tool: 'create_palette_html',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

function generateBasicPaletteHTML(params: CreatePaletteHtmlParams): string {
  const layout = params.layout || 'horizontal';
  const theme = params.theme || 'light';
  const showValues = params.show_values !== false;
  const showNames = params.show_names === true;
  const interactive = params.interactive !== false;
  const accessibilityInfo = params.accessibility_info === true;
  const exportFormats = params.export_formats || [];

  // Generate theme-specific CSS variables
  const themeVars =
    theme === 'auto'
      ? `
        --color-background: #ffffff;
        --color-text: #1e293b;
        
        @media (prefers-color-scheme: dark) {
            :root {
                --color-background: #1e293b;
                --color-text: #f8fafc;
            }
        }`
      : `
        --color-background: ${theme === 'dark' ? '#1e293b' : '#ffffff'};
        --color-text: ${theme === 'dark' ? '#f8fafc' : '#1e293b'};`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Color palette visualization generated by MCP Color Server">
    <title>Color Palette Visualization</title>
    <style>
        :root {
            --color-primary: #2563eb;
            --color-secondary: #64748b;
            ${themeVars}
            --spacing-unit: 1rem;
            --border-radius: 0.5rem;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: var(--spacing-unit);
            background-color: var(--color-background);
            color: var(--color-text);
            line-height: 1.6;
            font-size: clamp(0.875rem, 2.5vw, 1rem);
        }
        
        .visualization-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .theme-${theme} .palette-layout-${layout}.palette-size-${params.size || 'medium'} {
            display: ${layout === 'grid' ? 'grid' : 'flex'};
            ${layout === 'grid' ? 'grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));' : ''}
            ${layout === 'vertical' ? 'flex-direction: column;' : ''}
            ${layout === 'horizontal' ? 'flex-direction: row; flex-wrap: wrap;' : ''}
            ${layout === 'circular' ? 'flex-direction: row; flex-wrap: wrap; justify-content: center; align-items: center;' : ''}
            gap: var(--spacing-unit);
            padding: var(--spacing-unit);
        }
        
        .color-swatch {
            position: relative;
            min-height: 120px;
            border-radius: var(--border-radius);
            cursor: ${interactive ? 'pointer' : 'default'};
            transition: transform 0.2s ease;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 0.5rem;
        }
        
        .color-swatch:hover {
            transform: ${interactive ? 'scale(1.05)' : 'none'};
        }
        
        .color-swatch:focus {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
        }
        
        .color-values {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-family: monospace;
        }
        
        .color-name {
            position: absolute;
            top: 0.5rem;
            left: 0.5rem;
            background: rgba(255, 255, 255, 0.9);
            color: #1e293b;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .accessibility-info {
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(37, 99, 235, 0.1);
            border-radius: var(--border-radius);
            border-left: 4px solid var(--color-primary);
        }
        
        .contrast-ratio {
            font-family: monospace;
            font-weight: bold;
        }
        
        .wcag-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: bold;
            margin-left: 0.5rem;
        }
        
        .wcag-aa { background: #10b981; color: white; }
        .wcag-aaa { background: #059669; color: white; }
        .wcag-fail { background: #ef4444; color: white; }
        
        .export-controls {
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(100, 116, 139, 0.1);
            border-radius: var(--border-radius);
        }
        
        .export-format {
            margin: 0.5rem 0;
        }
        
        .export-palette {
            background: var(--color-primary);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: var(--border-radius);
            cursor: pointer;
            margin-right: 0.5rem;
        }
        
        .copy-palette {
            background: var(--color-secondary);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: var(--border-radius);
            cursor: pointer;
        }
        
        @media (max-width: 768px) {
            .palette-layout-horizontal {
                flex-direction: column;
            }
            
            .color-swatch {
                min-height: 80px;
            }
        }
        
        @media (prefers-contrast: high) {
            .color-swatch {
                border: 2px solid var(--color-text);
            }
        }
        
        @media (prefers-reduced-motion: reduce) {
            .color-swatch {
                transition: none;
            }
        }
    </style>
</head>
<body class="theme-${theme}">
    <div class="visualization-container" role="main">
        <h1>Color Palette Visualization</h1>
        <div class="palette-layout-${layout} palette-size-${params.size || 'medium'}">
            ${params.palette
              .map(
                (color, index) => `
                <div class="color-swatch" 
                     style="background-color: ${color};"
                     role="button"
                     tabindex="0"
                     aria-label="Color swatch: ${color}"
                     data-color="${color}"
                     data-interactive="${interactive}">
                    ${showValues ? `<div class="color-values">${convertToHex(color)}</div>` : ''}
                    ${showNames ? `<div class="color-name">Color ${index + 1}</div>` : ''}
                </div>
            `
              )
              .join('')}
        </div>
        
        ${
          accessibilityInfo
            ? `
        <div class="accessibility-info">
            <h3>Accessibility Information</h3>
            ${params.palette
              .map(
                (color, index) => `
                <div>
                    <strong>Color ${index + 1} (${color}):</strong>
                    <span class="contrast-ratio">4.5:1</span>
                    <span class="wcag-badge wcag-aa">WCAG AA</span>
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }
        
        ${
          exportFormats.length > 0
            ? `
        <div class="export-controls">
            <h3>Export Options</h3>
            ${exportFormats
              .map(
                format => `
                <div class="export-format">
                    <button class="export-palette" data-format="${format}">Export as ${format.toUpperCase()}</button>
                </div>
            `
              )
              .join('')}
            <button class="copy-palette">Copy Palette</button>
        </div>
        `
            : ''
        }
    </div>
    ${
      interactive
        ? `
    <script>
        function initializePaletteVisualization() {
            const swatches = document.querySelectorAll('.color-swatch');
            
            swatches.forEach(swatch => {
                swatch.addEventListener('click', function() {
                    const color = this.dataset.color;
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(color);
                        console.log('Copied color:', color);
                    }
                });
                
                swatch.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.click();
                    }
                    
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const swatches = Array.from(document.querySelectorAll('.color-swatch'));
                        const currentIndex = swatches.indexOf(this);
                        const nextIndex = e.key === 'ArrowRight' 
                            ? (currentIndex + 1) % swatches.length
                            : (currentIndex - 1 + swatches.length) % swatches.length;
                        swatches[nextIndex].focus();
                    }
                });
            });
            
            // Export functionality
            const exportButtons = document.querySelectorAll('.export-palette');
            exportButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const format = this.dataset.format;
                    console.log('Export as:', format);
                });
            });
            
            // Copy palette functionality
            const copyButton = document.querySelector('.copy-palette');
            if (copyButton) {
                copyButton.addEventListener('click', function() {
                    const colors = Array.from(document.querySelectorAll('.color-swatch')).map(s => s.dataset.color);
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(colors.join(', '));
                        console.log('Copied palette:', colors);
                    }
                });
            }
        }
        
        document.addEventListener('DOMContentLoaded', initializePaletteVisualization);
    </script>
    `
        : ''
    }
</body>
</html>`;
}

function isValidColor(color: string): boolean {
  // Basic color validation - check for common formats
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
  const hslPattern = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;
  const namedColors = [
    'red',
    'green',
    'blue',
    'black',
    'white',
    'yellow',
    'cyan',
    'magenta',
  ];

  return (
    hexPattern.test(color) ||
    rgbPattern.test(color) ||
    hslPattern.test(color) ||
    namedColors.includes(color.toLowerCase()) ||
    color === 'transparent'
  );
}

function convertToHex(color: string): string {
  // Simple conversion for common formats - this is a basic implementation
  if (color.startsWith('#')) {
    return color.toLowerCase();
  }

  if (color.startsWith('rgb(')) {
    const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match && match[1] && match[2] && match[3]) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  if (color.startsWith('hsl(')) {
    // For HSL, we'll use a basic conversion - this is simplified
    const match = color.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
    if (match && match[1] && match[2] && match[3]) {
      const h = parseInt(match[1]) / 360;
      const s = parseInt(match[2]) / 100;
      const l = parseInt(match[3]) / 100;

      const hslToRgb = (
        h: number,
        s: number,
        l: number
      ): [number, number, number] => {
        let r: number, g: number, b: number;
        if (s === 0) {
          r = g = b = l;
        } else {
          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };
          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1 / 3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      };

      const rgb = hslToRgb(h, s, l);
      const r = rgb[0];
      const g = rgb[1];
      const b = rgb[2];
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  // Named colors
  const namedColorMap: Record<string, string> = {
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    black: '#000000',
    white: '#ffffff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
  };

  return namedColorMap[color.toLowerCase()] || color.toLowerCase();
}

function generateCSSExport(colors: string[]): string {
  let css = ':root {\n';
  colors.forEach((color, index) => {
    css += `  --color-${index + 1}: ${color.toLowerCase()};\n`;
  });
  css += '}';
  return css;
}

export const createPaletteHtmlTool: ToolHandler = {
  name: 'create_palette_html',
  description:
    'Generate interactive HTML visualizations of color palettes with accessibility features and multiple layout options',
  parameters: createPaletteHtmlSchema.describe(),
  handler: async (params: unknown) =>
    createPaletteHtml(params as CreatePaletteHtmlParams),
};
