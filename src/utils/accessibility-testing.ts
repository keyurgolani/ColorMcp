/**
 * Comprehensive accessibility testing utilities for HTML visualizations
 */

export interface AccessibilityTestResult {
  passes: boolean;
  score: number;
  issues: AccessibilityIssue[];
  recommendations: string[];
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  element?: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

export class AccessibilityTester {
  /**
   * Test HTML content for accessibility compliance
   */
  public testHTML(html: string): AccessibilityTestResult {
    const issues: AccessibilityIssue[] = [];
    const recommendations: string[] = [];

    // Test 1: Check for proper DOCTYPE
    if (!html.includes('<!DOCTYPE html>')) {
      issues.push({
        type: 'error',
        code: 'DOCTYPE_MISSING',
        message: 'HTML5 DOCTYPE declaration is missing',
        wcagLevel: 'A',
      });
    }

    // Test 2: Check for lang attribute
    if (!html.includes('<html lang=')) {
      issues.push({
        type: 'error',
        code: 'LANG_MISSING',
        message: 'HTML lang attribute is missing',
        wcagLevel: 'A',
      });
    }

    // Test 3: Check for viewport meta tag
    if (!html.includes('name="viewport"')) {
      issues.push({
        type: 'warning',
        code: 'VIEWPORT_MISSING',
        message: 'Viewport meta tag is missing for responsive design',
        wcagLevel: 'AA',
      });
    }

    // Test 4: Check for proper heading hierarchy
    const headingMatches = html.match(/<h[1-6][^>]*>/g) || [];
    if (headingMatches.length === 0) {
      issues.push({
        type: 'warning',
        code: 'NO_HEADINGS',
        message: 'No heading elements found',
        wcagLevel: 'AA',
      });
    }

    // Test 5: Check for ARIA labels on interactive elements
    // Check for button elements
    const buttonMatches = html.match(/<button[^>]*>/gi) || [];
    buttonMatches.forEach(match => {
      if (
        !match.includes('aria-label=') &&
        !match.includes('aria-labelledby=')
      ) {
        issues.push({
          type: 'warning',
          code: 'MISSING_ARIA_LABEL',
          message: `Button element missing aria-label: ${match.substring(0, 50)}...`,
          element: 'button',
          wcagLevel: 'AA',
        });
      }
    });

    // Check for input elements
    const inputMatches = html.match(/<input[^>]*>/gi) || [];
    inputMatches.forEach(match => {
      if (
        !match.includes('aria-label=') &&
        !match.includes('aria-labelledby=') &&
        !match.includes('id=') // inputs can be labeled by associated labels
      ) {
        issues.push({
          type: 'warning',
          code: 'MISSING_ARIA_LABEL',
          message: `Input element missing aria-label: ${match.substring(0, 50)}...`,
          element: 'input',
          wcagLevel: 'AA',
        });
      }
    });

    // Check for elements with role="button"
    const roleButtonMatches = html.match(/role=["']button["'][^>]*>/gi) || [];
    roleButtonMatches.forEach(match => {
      if (
        !match.includes('aria-label=') &&
        !match.includes('aria-labelledby=')
      ) {
        issues.push({
          type: 'warning',
          code: 'MISSING_ARIA_LABEL',
          message: `Element with role="button" missing aria-label: ${match.substring(0, 50)}...`,
          element: '[role="button"]',
          wcagLevel: 'AA',
        });
      }
    });

    // Test 6: Check for keyboard navigation support
    if (!html.includes('tabindex=')) {
      issues.push({
        type: 'info',
        code: 'NO_TABINDEX',
        message: 'No explicit tab order defined',
        wcagLevel: 'AA',
      });
    }

    // Test 7: Check for focus indicators in CSS
    if (!html.includes(':focus') && !html.includes(':focus-visible')) {
      issues.push({
        type: 'error',
        code: 'NO_FOCUS_STYLES',
        message: 'No focus styles defined for keyboard navigation',
        wcagLevel: 'AA',
      });
    }

    // Test 8: Check for reduced motion support
    if (!html.includes('prefers-reduced-motion')) {
      issues.push({
        type: 'info',
        code: 'NO_REDUCED_MOTION',
        message:
          'No reduced motion support for users with vestibular disorders',
        wcagLevel: 'AAA',
      });
    }

    // Test 9: Check for high contrast mode support
    if (!html.includes('prefers-contrast')) {
      issues.push({
        type: 'info',
        code: 'NO_HIGH_CONTRAST',
        message: 'No high contrast mode support',
        wcagLevel: 'AAA',
      });
    }

    // Test 10: Check for semantic HTML elements
    const semanticElements = [
      'main',
      'header',
      'nav',
      'section',
      'article',
      'aside',
      'footer',
    ];
    const hasSemanticElements = semanticElements.some(
      element =>
        html.includes(`<${element}`) || html.includes(`role="${element}"`)
    );

    if (!hasSemanticElements) {
      issues.push({
        type: 'warning',
        code: 'NO_SEMANTIC_HTML',
        message: 'No semantic HTML elements found',
        wcagLevel: 'AA',
      });
    }

    // Generate recommendations based on issues
    if (issues.some(issue => issue.code === 'MISSING_ARIA_LABEL')) {
      recommendations.push(
        'Add aria-label attributes to all interactive elements'
      );
    }

    if (issues.some(issue => issue.code === 'NO_FOCUS_STYLES')) {
      recommendations.push(
        'Add visible focus indicators for keyboard navigation'
      );
    }

    if (issues.some(issue => issue.code === 'NO_REDUCED_MOTION')) {
      recommendations.push('Add support for users who prefer reduced motion');
    }

    if (issues.some(issue => issue.code === 'NO_HIGH_CONTRAST')) {
      recommendations.push(
        'Add high contrast mode support for better visibility'
      );
    }

    // Calculate accessibility score
    const errorCount = issues.filter(issue => issue.type === 'error').length;
    const warningCount = issues.filter(
      issue => issue.type === 'warning'
    ).length;

    const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5);
    const passes = errorCount === 0 && warningCount <= 2;

    return {
      passes,
      score,
      issues,
      recommendations,
    };
  }

  /**
   * Test color contrast ratios for accessibility
   */
  public testColorContrast(
    foreground: string,
    background: string,
    textSize: 'normal' | 'large' = 'normal'
  ): AccessibilityTestResult {
    const issues: AccessibilityIssue[] = [];
    const recommendations: string[] = [];

    // Calculate contrast ratio (simplified - would use actual color calculation in real implementation)
    const contrastRatio = this.calculateContrastRatio(foreground, background);

    const aaThreshold = textSize === 'large' ? 3.0 : 4.5;
    const aaaThreshold = textSize === 'large' ? 4.5 : 7.0;

    if (contrastRatio < aaThreshold) {
      issues.push({
        type: 'error',
        code: 'CONTRAST_AA_FAIL',
        message: `Contrast ratio ${contrastRatio.toFixed(2)}:1 fails WCAG AA (requires ${aaThreshold}:1)`,
        wcagLevel: 'AA',
      });
      recommendations.push('Increase color contrast to meet WCAG AA standards');
    }

    if (contrastRatio < aaaThreshold) {
      issues.push({
        type: 'warning',
        code: 'CONTRAST_AAA_FAIL',
        message: `Contrast ratio ${contrastRatio.toFixed(2)}:1 fails WCAG AAA (requires ${aaaThreshold}:1)`,
        wcagLevel: 'AAA',
      });
      recommendations.push(
        'Consider increasing contrast for WCAG AAA compliance'
      );
    }

    const score =
      contrastRatio >= aaaThreshold
        ? 100
        : contrastRatio >= aaThreshold
          ? 80
          : Math.max(0, (contrastRatio / aaThreshold) * 60);

    return {
      passes: contrastRatio >= aaThreshold,
      score,
      issues,
      recommendations,
    };
  }

  /**
   * Test keyboard navigation functionality
   */
  public testKeyboardNavigation(html: string): AccessibilityTestResult {
    const issues: AccessibilityIssue[] = [];
    const recommendations: string[] = [];

    // Check for tabindex attributes
    const tabindexElements = (html.match(/tabindex="[^"]*"/g) || []).length;

    // Check for keyboard event handlers
    const keyboardHandlers = [
      /onkeydown/i,
      /onkeyup/i,
      /onkeypress/i,
      /addEventListener\s*\(\s*["']keydown["']/i,
      /addEventListener\s*\(\s*["']keyup["']/i,
      /addEventListener\s*\(\s*["']keypress["']/i,
    ];

    const hasKeyboardHandlers = keyboardHandlers.some(handler =>
      handler.test(html)
    );

    if (tabindexElements === 0) {
      issues.push({
        type: 'warning',
        code: 'NO_TAB_ORDER',
        message: 'No explicit tab order defined',
        wcagLevel: 'AA',
      });
    }

    if (!hasKeyboardHandlers) {
      issues.push({
        type: 'error',
        code: 'NO_KEYBOARD_HANDLERS',
        message: 'No keyboard event handlers found',
        wcagLevel: 'A',
      });
      recommendations.push(
        'Add keyboard event handlers for interactive elements'
      );
    }

    // Check for arrow key navigation
    if (!html.includes('ArrowUp') && !html.includes('ArrowDown')) {
      issues.push({
        type: 'info',
        code: 'NO_ARROW_NAVIGATION',
        message: 'No arrow key navigation implemented',
        wcagLevel: 'AAA',
      });
      recommendations.push(
        'Consider adding arrow key navigation for grid layouts'
      );
    }

    const errorCount = issues.filter(issue => issue.type === 'error').length;
    const score = errorCount === 0 ? 100 : Math.max(0, 100 - errorCount * 25);

    return {
      passes: errorCount === 0,
      score,
      issues,
      recommendations,
    };
  }

  /**
   * Generate comprehensive accessibility report
   */
  public generateAccessibilityReport(html: string): {
    overall: AccessibilityTestResult;
    html: AccessibilityTestResult;
    keyboard: AccessibilityTestResult;
    summary: {
      totalIssues: number;
      criticalIssues: number;
      overallScore: number;
      wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail';
    };
  } {
    const htmlTest = this.testHTML(html);
    const keyboardTest = this.testKeyboardNavigation(html);

    const allIssues = [...htmlTest.issues, ...keyboardTest.issues];
    const allRecommendations = [
      ...new Set([
        ...htmlTest.recommendations,
        ...keyboardTest.recommendations,
      ]),
    ];

    const criticalIssues = allIssues.filter(
      issue => issue.type === 'error'
    ).length;
    const totalIssues = allIssues.length;
    const overallScore = Math.round((htmlTest.score + keyboardTest.score) / 2);

    let wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail' = 'Fail';
    if (criticalIssues === 0) {
      if (overallScore >= 95) wcagLevel = 'AAA';
      else if (overallScore >= 80) wcagLevel = 'AA';
      else wcagLevel = 'A';
    }

    const overall: AccessibilityTestResult = {
      passes: criticalIssues === 0,
      score: overallScore,
      issues: allIssues,
      recommendations: allRecommendations,
    };

    return {
      overall,
      html: htmlTest,
      keyboard: keyboardTest,
      summary: {
        totalIssues,
        criticalIssues,
        overallScore,
        wcagLevel,
      },
    };
  }

  /**
   * Simplified contrast ratio calculation
   * In a real implementation, this would use proper color space calculations
   */
  private calculateContrastRatio(
    foreground: string,
    background: string
  ): number {
    // This is a simplified calculation for demonstration
    // Real implementation would parse colors and calculate luminance properly

    // For now, return a mock value based on color similarity
    if (foreground === background) return 1;
    if (foreground === '#000000' && background === '#ffffff') return 21;
    if (foreground === '#ffffff' && background === '#000000') return 21;

    // Mock calculation - in real implementation would use proper luminance formula
    return Math.random() * 10 + 3; // Random value between 3-13 for testing
  }
}

export const accessibilityTester = new AccessibilityTester();
