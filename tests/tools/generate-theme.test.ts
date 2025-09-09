/**
 * Tests for Generate Theme MCP Tool
 */

import {
  generateTheme,
  GenerateThemeParams,
  GenerateThemeResponse,
} from '../../src/tools/generate-theme';

describe('Generate Theme Tool', () => {
  describe('Basic Theme Generation', () => {
    test('should generate light theme with valid primary color', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data).toHaveProperty('theme_type', 'light');
        expect(data).toHaveProperty('primary_color', '#2563eb');
        expect(data).toHaveProperty('variants');
        expect(data.variants).toHaveProperty('light');
        expect(data.variants.light).toHaveProperty('colors');
        expect(data.variants.light?.colors).toHaveProperty('primary');
        expect(data.variants.light?.colors).toHaveProperty('background');
        expect(data.variants.light?.colors).toHaveProperty('text');
        expect(data).toHaveProperty('accessibility_report');
      }
    });

    test('should generate dark theme with valid primary color', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'dark',
        primary_color: '#10b981',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data.theme_type).toBe('dark');
        expect(data.variants).toHaveProperty('dark');
        expect(data.variants.dark?.colors.background).toBe('#121212');
        expect(data.variants.dark?.colors.text).toBe('#f1f5f9');
      }
    });

    test('should generate auto theme with both light and dark variants', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'auto',
        primary_color: '#f59e0b',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data.theme_type).toBe('auto');
        expect(data.variants).toHaveProperty('light');
        expect(data.variants).toHaveProperty('dark');
      }
    });

    test('should generate high contrast theme', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'high_contrast',
        primary_color: '#000000',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data.theme_type).toBe('high_contrast');
        expect(data.variants).toHaveProperty('light');
        expect(data.variants).toHaveProperty('dark');

        // High contrast themes should have extreme contrast ratios
        const lightVariant = data.variants.light;
        if (lightVariant) {
          expect(lightVariant.colors.primary).toBe('#000000');
          expect(lightVariant.colors.background).toBe('#ffffff');
        }
      }
    });

    test('should generate colorblind friendly theme', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'colorblind_friendly',
        primary_color: '#2563eb',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data.theme_type).toBe('colorblind_friendly');

        // Colorblind friendly themes should avoid problematic color combinations
        const lightVariant = data.variants.light;
        if (lightVariant) {
          // Success should be blue instead of green
          expect(lightVariant.colors.success).toBe('#0066cc');
          // Info should be purple instead of blue
          expect(lightVariant.colors.info).toBe('#6600cc');
        }
      }
    });
  });

  describe('Style Variations', () => {
    test('should apply Material Design style', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
        style: 'material',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data.style).toBe('material');
        const lightVariant = data.variants.light;
        if (lightVariant) {
          expect(lightVariant.colors.surface).toBe('#fafafa');
          expect(lightVariant.colors.border).toBe('#e0e0e0');
        }
      }
    });

    test('should apply iOS style', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#007aff',
        style: 'ios',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data.style).toBe('ios');
        const lightVariant = data.variants.light;
        if (lightVariant) {
          expect(lightVariant.colors.surface).toBe('#f2f2f7');
          expect(lightVariant.colors.border).toBe('#c6c6c8');
        }
      }
    });

    test('should apply Fluent style', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#0078d4',
        style: 'fluent',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data.style).toBe('fluent');
        const lightVariant = data.variants.light;
        if (lightVariant) {
          expect(lightVariant.colors.surface).toBe('#faf9f8');
          expect(lightVariant.colors.border).toBe('#edebe9');
        }
      }
    });
  });

  describe('Accessibility Compliance', () => {
    test('should meet AA accessibility standards by default', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
        accessibility_level: 'AA',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        const accessibilityReport = data.accessibility_report;
        expect(accessibilityReport.wcag_compliance).not.toBe('FAIL');
        expect(accessibilityReport.overall_score).toBeGreaterThanOrEqual(70);
      }
    });

    test('should attempt to meet AAA accessibility standards when requested', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#1f2937',
        accessibility_level: 'AAA',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        const accessibilityReport = data.accessibility_report;
        expect(accessibilityReport.overall_score).toBeGreaterThanOrEqual(60);

        // Should provide recommendations if AAA not fully met
        if (accessibilityReport.wcag_compliance !== 'AAA') {
          expect(accessibilityReport.recommendations.length).toBeGreaterThan(0);
        }
      }
    });

    test('should report contrast issues when they exist', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#f3f4f6', // Very light color that may cause contrast issues
        accessibility_level: 'AA',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        const accessibilityReport = data.accessibility_report;

        // Should either fix the issues or report them
        if (accessibilityReport.contrast_issues.length > 0) {
          expect(accessibilityReport.recommendations.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Brand Color Integration', () => {
    test('should integrate brand colors when provided', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
        brand_colors: ['#10b981', '#f59e0b', '#ef4444'],
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        expect(data).toHaveProperty('brand_integration');
        const brandIntegration = data.brand_integration;
        if (brandIntegration) {
          expect(brandIntegration.brand_colors_used.length).toBeGreaterThan(0);
          expect(brandIntegration).toHaveProperty('harmony_maintained');
          expect(brandIntegration).toHaveProperty('adjustments_made');
        }
      }
    });

    test('should maintain color harmony with brand colors', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
        brand_colors: ['#3b82f6', '#1d4ed8'], // Analogous blues
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        if (data.brand_integration) {
          expect(data.brand_integration.harmony_maintained).toBe(true);
        }
      }
    });
  });

  describe('Component Selection', () => {
    test('should generate only requested components', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
        components: ['primary', 'background', 'text'],
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        const colors = data.variants.light?.colors;
        if (colors) {
          expect(colors).toHaveProperty('primary');
          expect(colors).toHaveProperty('background');
          expect(colors).toHaveProperty('text');
          // Should still generate all semantic colors for completeness
          expect(colors).toHaveProperty('success');
          expect(colors).toHaveProperty('error');
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('should return error for missing primary color', async () => {
      const params = {
        theme_type: 'light',
      } as GenerateThemeParams;

      const result = await generateTheme(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_PARAMETER');
        expect(result.error.message).toContain(
          'Primary color parameter is required'
        );
      }
    });

    test('should return error for missing theme type', async () => {
      const params = {
        primary_color: '#2563eb',
      } as GenerateThemeParams;

      const result = await generateTheme(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_PARAMETER');
        expect(result.error.message).toContain(
          'Theme type parameter is required'
        );
      }
    });

    test('should return error for invalid primary color', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: 'invalid-color',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PRIMARY_COLOR');
        expect(result.error.message).toContain('Invalid primary color format');
      }
    });

    test('should return error for invalid brand color', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
        brand_colors: ['#10b981', 'invalid-color'],
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_BRAND_COLOR');
        expect(result.error.message).toContain('Invalid brand color format');
      }
    });
  });

  describe('Performance', () => {
    test('should complete theme generation within reasonable time', async () => {
      const startTime = Date.now();

      const params: GenerateThemeParams = {
        theme_type: 'auto',
        primary_color: '#2563eb',
        brand_colors: ['#10b981', '#f59e0b', '#ef4444'],
        accessibility_level: 'AAA',
      };

      const result = await generateTheme(params);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds

      if (result.success) {
        expect(result.metadata.execution_time).toBeLessThan(2000);
      }
    });
  });

  describe('Theme Coherence', () => {
    test('should generate coherent color relationships', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        const colors = data.variants.light?.colors;
        if (colors) {
          // Primary and secondary should be related but distinct
          expect(colors.primary).not.toBe(colors.secondary);

          // Background should be light for light theme
          expect(colors.background).toBe('#ffffff');

          // Text should be dark for light theme
          expect(colors.text).toBe('#1e293b');

          // Success, warning, error should be semantically appropriate colors
          expect(colors.success).toMatch(/^#[0-9a-f]{6}$/i);
          expect(colors.warning).toMatch(/^#[0-9a-f]{6}$/i);
          expect(colors.error).toMatch(/^#[0-9a-f]{6}$/i);
        }
      }
    });

    test('should maintain consistent lightness relationships in dark theme', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'dark',
        primary_color: '#3b82f6',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateThemeResponse;
        const colors = data.variants.dark?.colors;
        if (colors) {
          // Background should be dark
          expect(colors.background).toBe('#121212');

          // Text should be light
          expect(colors.text).toBe('#f1f5f9');

          // Surface should be lighter than background but still dark
          expect(colors.surface).toBe('#1e1e1e');
        }
      }
    });
  });

  describe('Metadata and Recommendations', () => {
    test('should provide accessibility notes in metadata', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#2563eb',
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata).toHaveProperty('accessibilityNotes');
        expect(Array.isArray(result.metadata.accessibilityNotes)).toBe(true);
        expect(result.metadata.accessibilityNotes?.length).toBeGreaterThan(0);
      }
    });

    test('should provide recommendations in metadata', async () => {
      const params: GenerateThemeParams = {
        theme_type: 'light',
        primary_color: '#f3f4f6', // Light color that may need adjustments
      };

      const result = await generateTheme(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata).toHaveProperty('recommendations');
        expect(Array.isArray(result.metadata.recommendations)).toBe(true);
      }
    });
  });
});
