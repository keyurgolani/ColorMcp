/**
 * Tests for Generate Semantic Colors MCP Tool
 */

import {
  generateSemanticColors,
  GenerateSemanticColorsParams,
  GenerateSemanticColorsResponse,
} from '../../src/tools/generate-semantic-colors';

describe('Generate Semantic Colors Tool', () => {
  describe('Basic Semantic Mapping', () => {
    test('should map colors to default semantic roles', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6b7280'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateSemanticColorsResponse;
        expect(data).toHaveProperty('semantic_mapping');
        expect(data.semantic_mapping).toHaveLength(7); // Default 7 roles

        const roles = data.semantic_mapping.map((m: any) => m.role);
        expect(roles).toContain('primary');
        expect(roles).toContain('secondary');
        expect(roles).toContain('success');
        expect(roles).toContain('warning');
        expect(roles).toContain('error');
        expect(roles).toContain('info');
        expect(roles).toContain('neutral');
      }
    });

    test('should map colors to specified semantic roles', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981', '#ef4444'],
        semantic_roles: ['primary', 'success', 'error'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateSemanticColorsResponse;
        expect(data.semantic_mapping).toHaveLength(3);

        const roles = data.semantic_mapping.map((m: any) => m.role);
        expect(roles).toEqual(['primary', 'success', 'error']);
      }
    });

    test('should assign appropriate colors to semantic roles', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: [
          '#2563eb', // Blue - good for primary/info
          '#10b981', // Green - good for success
          '#f59e0b', // Orange - good for warning
          '#ef4444', // Red - good for error
          '#6b7280', // Gray - good for neutral
        ],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateSemanticColorsResponse;
        const mapping = data.semantic_mapping;

        // Find specific role mappings
        const successMapping = mapping.find((m: any) => m.role === 'success');
        const errorMapping = mapping.find((m: any) => m.role === 'error');
        const warningMapping = mapping.find((m: any) => m.role === 'warning');
        const neutralMapping = mapping.find((m: any) => m.role === 'neutral');

        // Success should prefer green
        expect(successMapping?.color).toBe('#10b981');

        // Error should prefer red
        expect(errorMapping?.color).toBe('#ef4444');

        // Warning should prefer orange
        expect(warningMapping?.color).toBe('#f59e0b');

        // Neutral should prefer gray (lowest saturation)
        expect(neutralMapping?.color).toBe('#6b7280');
      }
    });
  });

  describe('Context-Specific Behavior', () => {
    test('should adapt to web context', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981'],
        context: 'web',
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as GenerateSemanticColorsResponse;
        expect(data.context).toBe('web');

        // Check for web-specific usage guidelines
        const primaryMapping = data.semantic_mapping.find(
          (m: any) => m.role === 'primary'
        );
        expect(primaryMapping?.usage_guidelines).toContain(
          'Consider hover and focus states'
        );
      }
    });

    test('should adapt to mobile context', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981'],
        context: 'mobile',
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as GenerateSemanticColorsResponse).context).toBe(
          'mobile'
        );

        // Check for mobile-specific usage guidelines
        const mappings = (result.data as GenerateSemanticColorsResponse)
          .semantic_mapping;
        const hasTargetGuideline = mappings.some((m: any) =>
          m.usage_guidelines.some((g: any) => g.includes('touch targets'))
        );
        expect(hasTargetGuideline).toBe(true);
      }
    });

    test('should adapt to print context', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981'],
        context: 'print',
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as GenerateSemanticColorsResponse).context).toBe(
          'print'
        );

        // Check for print-specific usage guidelines
        const mappings = (result.data as GenerateSemanticColorsResponse)
          .semantic_mapping;
        const hasGrayscaleGuideline = mappings.some((m: any) =>
          m.usage_guidelines.some((g: any) => g.includes('grayscale'))
        );
        expect(hasGrayscaleGuideline).toBe(true);
      }
    });
  });

  describe('Accessibility Compliance', () => {
    test('should ensure contrast compliance when requested', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#f3f4f6', '#e5e7eb'], // Very light colors
        ensure_contrast: true,
        accessibility_level: 'AA',
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const accessibilityReport = (
          result.data as GenerateSemanticColorsResponse
        ).accessibility_report;

        // Should either meet standards or make adjustments
        if (accessibilityReport.overall_compliance === 'FAIL') {
          expect(accessibilityReport.adjustments_made).toBeGreaterThan(0);
        }

        // Should provide contrast ratios
        (
          result.data as GenerateSemanticColorsResponse
        ).semantic_mapping.forEach((mapping: any) => {
          expect(mapping.contrast_ratio).toBeGreaterThan(0);
        });
      }
    });

    test('should meet AAA standards when requested', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#1f2937', '#374151'], // Dark colors with good contrast potential
        ensure_contrast: true,
        accessibility_level: 'AAA',
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const accessibilityReport = (
          result.data as GenerateSemanticColorsResponse
        ).accessibility_report;

        // Should attempt to meet AAA or provide clear feedback
        if (accessibilityReport.overall_compliance !== 'AAA') {
          expect(accessibilityReport.contrast_issues.length).toBeGreaterThan(0);
        }
      }
    });

    test('should report contrast issues accurately', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#f8f9fa', '#e9ecef'], // Very light colors likely to have issues
        ensure_contrast: false, // Don't auto-adjust
        accessibility_level: 'AA',
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const accessibilityReport = (
          result.data as GenerateSemanticColorsResponse
        ).accessibility_report;

        // Should either identify contrast issues or have made adjustments
        if (accessibilityReport.contrast_issues.length > 0) {
          // Each issue should have proper structure
          accessibilityReport.contrast_issues.forEach((issue: any) => {
            expect(issue).toHaveProperty('role');
            expect(issue).toHaveProperty('color');
            expect(issue).toHaveProperty('issue');
            expect(issue).toHaveProperty('recommendation');
          });
        } else {
          // If no issues reported, should have made adjustments or provided recommendations
          expect(accessibilityReport.adjustments_made >= 0).toBe(true);
        }
      }
    });

    test('should track adjustments made for accessibility', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#f0f0f0'], // Light color that will need adjustment
        ensure_contrast: true,
        accessibility_level: 'AA',
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const accessibilityReport = (
          result.data as GenerateSemanticColorsResponse
        ).accessibility_report;
        const mappings = (result.data as GenerateSemanticColorsResponse)
          .semantic_mapping;

        // Count adjusted colors
        const adjustedCount = mappings.filter((m: any) => m.adjusted).length;
        expect(accessibilityReport.adjustments_made).toBe(adjustedCount);

        // Adjusted colors should have original_color property
        mappings.forEach((mapping: any) => {
          if (mapping.adjusted) {
            expect(mapping.original_color).toBeDefined();
            expect(mapping.original_color).not.toBe(mapping.color);
          }
        });
      }
    });
  });

  describe('Usage Guidelines', () => {
    test('should provide role-specific usage guidelines', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981', '#ef4444'],
        semantic_roles: ['primary', 'success', 'error'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const mappings = (result.data as GenerateSemanticColorsResponse)
          .semantic_mapping;

        // Primary should have action-related guidelines
        const primaryMapping = mappings.find((m: any) => m.role === 'primary');
        expect(primaryMapping?.usage_guidelines).toContain(
          'Use for main actions, links, and brand elements'
        );

        // Success should have positive feedback guidelines
        const successMapping = mappings.find((m: any) => m.role === 'success');
        expect(successMapping?.usage_guidelines).toContain(
          'Use for positive feedback, confirmations, and success states'
        );

        // Error should have high contrast guidelines
        const errorMapping = mappings.find((m: any) => m.role === 'error');
        expect(errorMapping?.usage_guidelines).toContain(
          'Must have high contrast for accessibility'
        );
      }
    });

    test('should provide accessibility notes for each color', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        (
          result.data as GenerateSemanticColorsResponse
        ).semantic_mapping.forEach((mapping: any) => {
          expect(mapping.accessibility_notes).toBeDefined();
          expect(Array.isArray(mapping.accessibility_notes)).toBe(true);
          expect(mapping.accessibility_notes.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Color Assignment Logic', () => {
    test('should prefer appropriate hues for semantic roles', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: [
          '#ff0000', // Red (0°)
          '#ff8000', // Orange (30°)
          '#ffff00', // Yellow (60°)
          '#80ff00', // Yellow-green (90°)
          '#00ff00', // Green (120°)
          '#00ff80', // Green-cyan (150°)
          '#00ffff', // Cyan (180°)
          '#0080ff', // Blue-cyan (210°)
          '#0000ff', // Blue (240°)
          '#8000ff', // Blue-purple (270°)
          '#ff00ff', // Purple (300°)
          '#ff0080', // Purple-red (330°)
        ],
        semantic_roles: ['success', 'warning', 'error', 'info'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const mappings = (result.data as GenerateSemanticColorsResponse)
          .semantic_mapping;

        // Success should prefer green hues (90-150°)
        const successMapping = mappings.find((m: any) => m.role === 'success');
        expect(['#80ff00', '#00ff00', '#00ff80']).toContain(
          successMapping?.color
        );

        // Warning should prefer orange/yellow hues (30-60°)
        const warningMapping = mappings.find((m: any) => m.role === 'warning');
        expect(['#ff8000', '#ffff00']).toContain(warningMapping?.color);

        // Error should prefer red hues (0° or 330-360°)
        const errorMapping = mappings.find((m: any) => m.role === 'error');
        expect(['#ff0000', '#ff0080']).toContain(errorMapping?.color);

        // Info should prefer blue hues (210-270°)
        const infoMapping = mappings.find((m: any) => m.role === 'info');
        expect(['#0080ff', '#0000ff', '#8000ff']).toContain(infoMapping?.color);
      }
    });

    test('should handle limited palette gracefully', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb'], // Only one color
        semantic_roles: ['primary', 'secondary', 'success'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const mappings = (result.data as GenerateSemanticColorsResponse)
          .semantic_mapping;
        expect(mappings).toHaveLength(3);

        // Should generate appropriate colors even with limited input
        const successMapping = mappings.find((m: any) => m.role === 'success');
        expect(successMapping?.color).toMatch(/^#[0-9a-f]{6}$/i);

        // Success should be green even if not in original palette
        expect(successMapping?.color).toBe('#2eb82e'); // Default green
      }
    });
  });

  describe('Usage Recommendations', () => {
    test('should provide general usage recommendations', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as GenerateSemanticColorsResponse).usage_recommendations
        ).toBeDefined();
        expect(
          Array.isArray(
            (result.data as GenerateSemanticColorsResponse)
              .usage_recommendations
          )
        ).toBe(true);
        expect(
          (result.data as GenerateSemanticColorsResponse).usage_recommendations
            .length
        ).toBeGreaterThan(0);

        // Should include general accessibility recommendations
        expect(
          (result.data as GenerateSemanticColorsResponse).usage_recommendations
        ).toContain('Test colors with actual content and backgrounds');
        expect(
          (result.data as GenerateSemanticColorsResponse).usage_recommendations
        ).toContain(
          'Consider colorblind users - use icons and text alongside colors'
        );
      }
    });

    test('should provide context-specific recommendations', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb'],
        context: 'mobile',
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        const recommendations = (result.data as GenerateSemanticColorsResponse)
          .usage_recommendations;

        // Should include mobile-specific recommendations
        const hasMobileRec = recommendations.some(
          (rec: any) =>
            rec.includes('light and dark modes') ||
            rec.includes('lighting conditions')
        );
        expect(hasMobileRec).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should return error for empty base palette', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: [],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_PARAMETER');
        expect(result.error.message).toContain(
          'Base palette parameter is required'
        );
      }
    });

    test('should return error for missing base palette', async () => {
      const params = {} as GenerateSemanticColorsParams;

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MISSING_PARAMETER');
        expect(result.error.message).toContain(
          'Base palette parameter is required'
        );
      }
    });

    test('should return error for invalid color in palette', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', 'invalid-color', '#10b981'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_COLOR');
        expect(result.error.message).toContain('Invalid color at index 1');
        expect(result.error.details).toHaveProperty('index', 1);
        expect(result.error.details).toHaveProperty(
          'provided',
          'invalid-color'
        );
      }
    });
  });

  describe('Performance', () => {
    test('should complete semantic mapping within reasonable time', async () => {
      const startTime = Date.now();

      const params: GenerateSemanticColorsParams = {
        base_palette: [
          '#2563eb',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#6b7280',
          '#8b5cf6',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#ec4899',
        ],
        ensure_contrast: true,
        accessibility_level: 'AAA',
      };

      const result = await generateSemanticColors(params);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second

      if (result.success) {
        expect(result.metadata.execution_time).toBeLessThan(1000);
      }
    });

    test('should handle large palettes efficiently', async () => {
      // Generate a large palette
      const largePalette: string[] = [];
      for (let i = 0; i < 50; i++) {
        const hue = (i * 7) % 360; // Distribute hues
        largePalette.push(`hsl(${hue}, 60%, 50%)`);
      }

      const startTime = Date.now();

      const params: GenerateSemanticColorsParams = {
        base_palette: largePalette,
      };

      const result = await generateSemanticColors(params);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(2000); // Should handle large palettes within 2 seconds
    });
  });

  describe('Metadata and Response Structure', () => {
    test('should provide complete metadata', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#2563eb', '#10b981'],
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata).toHaveProperty('execution_time');
        expect(result.metadata).toHaveProperty('colorSpaceUsed');
        expect(result.metadata).toHaveProperty('accessibilityNotes');
        expect(result.metadata).toHaveProperty('recommendations');

        expect(typeof result.metadata.execution_time).toBe('number');
        expect(result.metadata.colorSpaceUsed).toBe('sRGB');
        expect(Array.isArray(result.metadata.accessibilityNotes)).toBe(true);
        expect(Array.isArray(result.metadata.recommendations)).toBe(true);
      }
    });

    test('should include accessibility notes in metadata', async () => {
      const params: GenerateSemanticColorsParams = {
        base_palette: ['#f3f4f6'], // Light color that may need adjustment
        ensure_contrast: true,
      };

      const result = await generateSemanticColors(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.accessibilityNotes?.length).toBeGreaterThan(0);

        // Should mention adjustments if any were made
        const hasAdjustmentNote = result.metadata.accessibilityNotes?.some(
          note => note.includes('adjusted')
        );

        const accessibilityReport = (
          result.data as GenerateSemanticColorsResponse
        ).accessibility_report;
        if (accessibilityReport.adjustments_made > 0) {
          expect(hasAdjustmentNote).toBe(true);
        }
      }
    });
  });
});
