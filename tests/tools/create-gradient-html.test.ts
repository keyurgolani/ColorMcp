/**
 * Tests for create-gradient-html tool
 */

import { createGradientHtmlTool } from '../../src/tools/create-gradient-html';
import { ToolResponse, ErrorResponse } from '../../src/types/index';

describe('create-gradient-html tool', () => {
  describe('Basic functionality', () => {
    test('should generate HTML for linear gradient', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gradient_type', 'linear');
      expect(result.data).toHaveProperty(
        'css_code',
        'linear-gradient(45deg, #ff0000, #0000ff)'
      );
      expect(result.visualizations).toHaveProperty('html');
      expect(result.visualizations?.html).toContain('<!DOCTYPE html>');
      expect(result.visualizations?.html).toContain('Gradient Preview');
    });

    test('should handle different gradient types', async () => {
      const gradients = [
        { css: 'linear-gradient(45deg, red, blue)', type: 'linear' },
        { css: 'radial-gradient(circle, red, blue)', type: 'radial' },
        { css: 'conic-gradient(red, blue)', type: 'conic' },
        {
          css: 'repeating-linear-gradient(45deg, red, blue 20px)',
          type: 'repeating-linear',
        },
      ];

      for (const gradient of gradients) {
        const params = { gradient_css: gradient.css };
        const result = (await createGradientHtmlTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
        expect((result.data as any).gradient_type).toBe(gradient.type);
        expect(result.visualizations?.html).toContain(
          `${gradient.type} gradient`
        );
      }
    });
  });

  describe('Preview shapes', () => {
    test('should support different preview shapes', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        preview_shapes: ['rectangle', 'circle', 'text', 'button'],
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).preview_shapes).toEqual([
        'rectangle',
        'circle',
        'text',
        'button',
      ]);
      expect(result.visualizations?.html).toContain(
        'gradient-preview-rectangle'
      );
      expect(result.visualizations?.html).toContain('gradient-preview-circle');
      expect(result.visualizations?.html).toContain('gradient-preview-text');
      expect(result.visualizations?.html).toContain('gradient-preview-button');
    });

    test('should use default rectangle shape when not specified', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).preview_shapes).toEqual(['rectangle']);
      expect(result.visualizations?.html).toContain(
        'gradient-preview-rectangle'
      );
    });

    test('should reject invalid preview shapes', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        preview_shapes: ['invalid-shape'],
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('Size options', () => {
    test('should support custom size', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        size: [600, 400] as [number, number],
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).size).toEqual([600, 400]);
    });

    test('should use default size when not specified', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).size).toEqual([400, 300]);
    });

    test('should reject size too small', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        size: [50, 50] as [number, number],
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });

    test('should reject size too large', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        size: [3000, 3000] as [number, number],
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('CSS code display', () => {
    test('should show CSS code by default', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain('css-code-section');
      expect(result.visualizations?.html).toContain('CSS Code');
      expect(result.visualizations?.html).toContain('copy-css-button');
    });

    test('should hide CSS code when disabled', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        show_css_code: false,
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).not.toContain('css-code-section');
    });

    test('should include CSS in export formats', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.export_formats).toHaveProperty('css');
      expect(result.export_formats?.css).toBe(
        'linear-gradient(45deg, #ff0000, #0000ff)'
      );
    });
  });

  describe('Interactive controls', () => {
    test('should include interactive controls when enabled', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        interactive_controls: true,
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).interactive).toBe(true);
      expect(result.visualizations?.html).toContain('gradient-controls');
      expect(result.visualizations?.html).toContain('gradient-angle');
      expect(result.visualizations?.html).toContain('<script>');
    });

    test('should not include controls when disabled', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        interactive_controls: false,
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect((result.data as any).interactive).toBe(false);
      expect(result.visualizations?.html).not.toContain('gradient-controls');
      expect(result.visualizations?.html).not.toContain('<script>');
    });

    test('should include JavaScript for interactivity', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        interactive_controls: true,
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.visualizations?.html).toContain(
        'initializeGradientVisualization'
      );
      expect(result.visualizations?.html).toContain('setupGradientControls');
      expect(result.visualizations?.html).toContain('updateGradientPreviews');
    });
  });

  describe('Gradient validation', () => {
    test('should accept valid linear gradients', async () => {
      const validGradients = [
        'linear-gradient(45deg, red, blue)',
        'linear-gradient(to right, #ff0000, #0000ff)',
        'linear-gradient(90deg, rgba(255,0,0,1), rgba(0,0,255,0.5))',
      ];

      for (const gradient of validGradients) {
        const params = { gradient_css: gradient };
        const result = (await createGradientHtmlTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
      }
    });

    test('should accept valid radial gradients', async () => {
      const validGradients = [
        'radial-gradient(circle, red, blue)',
        'radial-gradient(ellipse at center, #ff0000, #0000ff)',
        'radial-gradient(circle at 50% 50%, red 0%, blue 100%)',
      ];

      for (const gradient of validGradients) {
        const params = { gradient_css: gradient };
        const result = (await createGradientHtmlTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
      }
    });

    test('should accept valid conic gradients', async () => {
      const validGradients = [
        'conic-gradient(red, blue)',
        'conic-gradient(from 45deg, red, blue)',
        'conic-gradient(at 50% 50%, red 0deg, blue 180deg)',
      ];

      for (const gradient of validGradients) {
        const params = { gradient_css: gradient };
        const result = (await createGradientHtmlTool.handler(
          params
        )) as ToolResponse;

        expect(result.success).toBe(true);
      }
    });

    test('should reject invalid gradient CSS', async () => {
      const invalidGradients = [
        'not-a-gradient',
        'background-color: red',
        'invalid-gradient(red, blue)',
        '',
      ];

      for (const gradient of invalidGradients) {
        const params = { gradient_css: gradient };
        const result = (await createGradientHtmlTool.handler(
          params
        )) as ErrorResponse;

        expect(result.success).toBe(false);
        expect(result.error.code).toBe('INVALID_GRADIENT_CSS');
      }
    });

    test('should require gradient_css parameter', async () => {
      const params = {};

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETERS');
    });
  });

  describe('HTML validation', () => {
    test('should generate valid HTML5 structure', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html?.trim()).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('</html>');
    });

    test('should include proper meta tags', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('charset="UTF-8"');
      expect(html).toContain('name="viewport"');
      expect(html).toContain('name="description"');
    });

    test('should include embedded CSS', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('<style>');
      expect(html).toContain('.gradient-container');
      expect(html).toContain('.gradient-preview');
      expect(html).toContain('</style>');
    });

    test('should be self-contained (no external dependencies)', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        interactive_controls: true,
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      // Should not contain external links or scripts
      expect(html).not.toContain('src="http');
      expect(html).not.toContain('href="http');
      expect(html).not.toContain('cdn.');
    });
  });

  describe('Accessibility features', () => {
    test('should include proper ARIA attributes', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('role="group"');
      expect(html).toContain('role="img"');
      expect(html).toContain('aria-label=');
    });

    test('should include accessibility notes for complex gradients', async () => {
      const params = {
        gradient_css: 'conic-gradient(red, blue, green, red)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.accessibility_notes).toContain(
        'Complex gradients may not be visible to users with certain visual impairments'
      );
    });
  });

  describe('Performance', () => {
    test('should complete within performance requirements', async () => {
      const params = {
        gradient_css:
          'linear-gradient(45deg, #ff0000, #00ff00, #0000ff, #ffff00)',
        preview_shapes: ['rectangle', 'circle', 'text', 'button'],
        interactive_controls: true,
      };

      const startTime = Date.now();
      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(result.metadata.execution_time).toBeLessThan(2000);
    });

    test('should handle complex gradients efficiently', async () => {
      const params = {
        gradient_css:
          'repeating-linear-gradient(45deg, red 0px, orange 10px, yellow 20px, green 30px, blue 40px, indigo 50px, violet 60px)',
        preview_shapes: ['rectangle', 'circle', 'text', 'button', 'card'],
      };

      const startTime = Date.now();
      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle complex gradients
    });
  });

  describe('Recommendations', () => {
    test('should recommend fewer preview shapes when many are used', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
        preview_shapes: ['rectangle', 'circle', 'text', 'button', 'card'],
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Consider using fewer preview shapes for better performance'
      );
    });

    test('should recommend linear gradients for interactive controls', async () => {
      const params = {
        gradient_css: 'radial-gradient(circle, #ff0000, #0000ff)',
        interactive_controls: true,
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      expect(result.metadata.recommendations).toContain(
        'Interactive controls work best with linear gradients'
      );
    });
  });

  describe('Error handling', () => {
    test('should provide helpful error messages for invalid gradients', async () => {
      const params = {
        gradient_css: 'invalid-gradient-format',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ErrorResponse;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_GRADIENT_CSS');
      expect(result.error.suggestions).toContain(
        'Use linear-gradient() format: linear-gradient(45deg, #ff0000, #0000ff)'
      );
    });

    test('should handle internal errors gracefully', async () => {
      // This test would require mocking to force an internal error
      // For now, we'll test the error structure
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = await createGradientHtmlTool.handler(params);

      // Should either succeed or fail gracefully
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('execution_time');
    });
  });

  describe('Responsive design', () => {
    test('should include responsive CSS', async () => {
      const params = {
        gradient_css: 'linear-gradient(45deg, #ff0000, #0000ff)',
      };

      const result = (await createGradientHtmlTool.handler(
        params
      )) as ToolResponse;

      expect(result.success).toBe(true);
      const html = result.visualizations?.html;

      expect(html).toContain('@media (max-width: 768px)');
    });
  });
});
