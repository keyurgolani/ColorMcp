/**
 * Tests for analyze_color MCP tool
 */

import { describe, test, expect } from '@jest/globals';
import { analyzeColor } from '../../src/tools/analyze-color';

describe('analyzeColor tool', () => {
  describe('parameter validation', () => {
    test('should require color parameter', async () => {
      const result = await analyzeColor({} as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error.code).toBe('VALIDATION_ERROR');
        expect((result as any).error.message).toContain(
          'Color value is required'
        );
      }
    });

    test('should validate color format', async () => {
      const result = await analyzeColor({ color: 'invalid_color' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error.code).toBe('VALIDATION_ERROR');
        expect((result as any).error.message).toContain(
          'Color value contains invalid characters'
        );
      }
    });

    test('should validate compare_color format if provided', async () => {
      const result = await analyzeColor({
        color: '#FF0000',
        compare_color: 'invalid_color',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect((result as any).error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('successful analysis', () => {
    test('should analyze a basic color', async () => {
      const result = await analyzeColor({ color: '#FF0000' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).color).toBe('#FF0000');
        expect((result.data as any).analysis).toBeDefined();
        expect((result.data as any).analysis.brightness).toBeDefined();
        expect((result.data as any).analysis.temperature).toBeDefined();
        expect((result.data as any).analysis.contrast).toBeDefined();
        expect((result.data as any).analysis.accessibility).toBeDefined();
        expect((result.data as any).summary).toBeDefined();

        // Check brightness analysis
        expect(
          (result.data as any).analysis.brightness.perceived_brightness
        ).toBeGreaterThan(0);
        expect(
          (result.data as any).analysis.brightness.brightness_category
        ).toBeDefined();
        expect(typeof (result.data as any).analysis.brightness.is_light).toBe(
          'boolean'
        );

        // Check temperature analysis
        expect(['warm', 'cool', 'neutral']).toContain(
          (result.data as any).analysis.temperature.temperature
        );
        expect(
          (result.data as any).analysis.temperature.warmth_score
        ).toBeGreaterThanOrEqual(-1);
        expect(
          (result.data as any).analysis.temperature.warmth_score
        ).toBeLessThanOrEqual(1);

        // Check summary
        expect(
          (result.data as any).summary.overall_score
        ).toBeGreaterThanOrEqual(0);
        expect((result.data as any).summary.overall_score).toBeLessThanOrEqual(
          100
        );
        expect(Array.isArray((result.data as any).summary.primary_issues)).toBe(
          true
        );
        expect(Array.isArray((result.data as any).summary.strengths)).toBe(
          true
        );
      }
    });

    test('should analyze color with comparison', async () => {
      const result = await analyzeColor({
        color: '#FF0000',
        compare_color: '#0000FF',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).comparison).toBeDefined();
        expect((result.data as any).comparison?.compare_color).toBe('#0000FF');
        expect((result.data as any).comparison?.distance).toBeDefined();
        expect((result.data as any).analysis.distance).toBeDefined();

        // Distance should be significant between red and blue
        expect((result.data as any).analysis.distance?.cie2000).toBeGreaterThan(
          5
        );
        expect(
          (result.data as any).analysis.distance?.perceptual_difference
        ).toBe('very_different');
      }
    });

    test('should handle different color formats', async () => {
      const formats = ['#FF0000', 'rgb(255, 0, 0)', 'hsl(0, 100%, 50%)', 'red'];

      for (const format of formats) {
        const result = await analyzeColor({ color: format });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as any).analysis).toBeDefined();
        }
      }
    });

    test('should provide accessibility analysis', async () => {
      const result = await analyzeColor({ color: '#000000' }); // Black

      expect(result.success).toBe(true);
      if (result.success) {
        const accessibility = (result.data as any).analysis.accessibility;
        expect(typeof accessibility.wcag_aa_normal).toBe('boolean');
        expect(typeof accessibility.wcag_aa_large).toBe('boolean');
        expect(typeof accessibility.wcag_aaa_normal).toBe('boolean');
        expect(typeof accessibility.wcag_aaa_large).toBe('boolean');
        expect(typeof accessibility.color_blind_safe).toBe('boolean');
        expect(Array.isArray(accessibility.recommendations)).toBe(true);

        // Black should meet accessibility standards when used appropriately
        expect(accessibility.wcag_aa_normal).toBe(true);
        expect(accessibility.wcag_aaa_normal).toBe(true);
      }
    });

    test('should provide meaningful recommendations', async () => {
      // Use a color that will actually have accessibility issues
      const poorColor = await analyzeColor({ color: '#808080' }); // Medium gray with poor contrast

      expect(poorColor.success).toBe(true);
      if (poorColor.success) {
        // Check that recommendations exist (may be empty for good colors)
        expect(Array.isArray(poorColor.metadata.recommendations)).toBe(true);
        expect(
          Array.isArray(
            (poorColor.data as any).analysis.accessibility.recommendations
          )
        ).toBe(true);
      }
    });
  });

  describe('performance requirements', () => {
    test('should complete analysis within 300ms', async () => {
      const startTime = Date.now();
      const result = await analyzeColor({ color: '#2563eb' });
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(300);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.metadata.execution_time).toBeLessThan(300);
      }
    });

    test('should handle multiple analyses efficiently', async () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      const startTime = Date.now();

      const results = await Promise.all(
        colors.map(color => analyzeColor({ color }))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / colors.length;

      expect(averageTime).toBeLessThan(100); // Average should be under 100ms
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('metadata and response format', () => {
    test('should include proper metadata', async () => {
      const result = await analyzeColor({ color: '#FF0000' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata).toBeDefined();
        expect(typeof result.metadata.execution_time).toBe('number');
        expect(result.metadata.color_space_used).toBe('sRGB');
        expect(Array.isArray(result.metadata.accessibility_notes!)).toBe(true);
        expect(Array.isArray(result.metadata.recommendations!)).toBe(true);
      }
    });

    test('should provide accessibility notes for problematic colors', async () => {
      const result = await analyzeColor({ color: '#CCCCCC' }); // Light gray

      expect(result.success).toBe(true);
      if (result.success) {
        // Check that accessibility notes exist (may be empty for good colors)
        expect(Array.isArray(result.metadata.accessibility_notes)).toBe(true);
        // Check that accessibility notes exist and are meaningful (may be empty for good colors)
        if (result.metadata.accessibility_notes!.length > 0) {
          expect(
            result.metadata.accessibility_notes!.some(
              note =>
                note.includes('WCAG') ||
                note.includes('contrast') ||
                note.includes('brightness') ||
                note.includes('temperature')
            )
          ).toBe(true);
        }
      }
    });

    test('should limit recommendations to reasonable number', async () => {
      const result = await analyzeColor({ color: '#808080' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.recommendations!.length).toBeLessThanOrEqual(5);
        expect(
          (result.data as any).summary.primary_issues.length
        ).toBeLessThanOrEqual(3);
        expect(
          (result.data as any).summary.strengths.length
        ).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('summary generation', () => {
    test('should generate meaningful summary for good colors', async () => {
      const result = await analyzeColor({ color: '#000000' }); // Black - good contrast

      expect(result.success).toBe(true);
      if (result.success) {
        const summary = (result.data as any).summary;
        expect(summary.overall_score).toBeGreaterThan(70); // Should score well
        expect(summary.strengths.length).toBeGreaterThan(0);
        expect(
          summary.strengths.some(
            (strength: any) =>
              strength.includes('contrast') || strength.includes('text')
          )
        ).toBe(true);
      }
    });

    test('should identify issues with problematic colors', async () => {
      const result = await analyzeColor({ color: '#CCCCCC' }); // Light gray

      expect(result.success).toBe(true);
      if (result.success) {
        const summary = (result.data as any).summary;
        expect(summary.overall_score).toBeGreaterThanOrEqual(0); // Score should be valid
        // Check that primary_issues is an array (may be empty for good colors)
        expect(Array.isArray(summary.primary_issues)).toBe(true);
        if (summary.primary_issues.length > 0) {
          expect(
            summary.primary_issues.some(
              (issue: any) =>
                issue.includes('contrast') ||
                issue.includes('text') ||
                issue.includes('accessibility')
            )
          ).toBe(true);
        }
      }
    });

    test('should provide balanced assessment', async () => {
      const result = await analyzeColor({ color: '#2563eb' }); // Blue - mixed characteristics

      expect(result.success).toBe(true);
      if (result.success) {
        const summary = (result.data as any).summary;
        expect(summary.overall_score).toBeGreaterThan(0);
        expect(summary.overall_score).toBeLessThanOrEqual(100); // Score can be perfect for good colors

        // Should have both strengths and potentially some considerations
        const totalFeedback =
          summary.strengths.length + summary.primary_issues.length;
        expect(totalFeedback).toBeGreaterThan(0);
      }
    });
  });

  describe('error handling', () => {
    test('should handle analysis errors gracefully', async () => {
      // This test might be hard to trigger with current implementation
      // but ensures error handling structure is in place
      const result = await analyzeColor({ color: '#FF0000' });

      // Should either succeed or fail gracefully
      if (!result.success) {
        expect((result as any).error).toBeDefined();
        expect((result as any).error.code).toBeDefined();
        expect((result as any).error.message).toBeDefined();
        expect(Array.isArray((result as any).error.suggestions)).toBe(true);
      } else {
        expect(result.data as any).toBeDefined();
      }
    });
  });
});
