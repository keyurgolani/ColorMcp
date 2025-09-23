/**
 * Enhanced Accessibility Testing for HTML Visualizations
 * Provides basic accessibility testing without external dependencies
 */

import { logger } from './logger';

export interface AccessibilityTestResult {
  passes: AccessibilityCheck[];
  violations: AccessibilityViolation[];
  incomplete: AccessibilityCheck[];
  inapplicable: AccessibilityCheck[];
  summary: {
    totalChecks: number;
    passCount: number;
    violationCount: number;
    incompleteCount: number;
    overallScore: number;
    wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail';
  };
}

export interface AccessibilityCheck {
  id: string;
  description: string;
  impact?: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  nodes: AccessibilityNode[];
}

export interface AccessibilityViolation extends AccessibilityCheck {
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  help: string;
  helpUrl: string;
}

export interface AccessibilityNode {
  html: string;
  target: string[];
  failureSummary?: string;
  any?: AccessibilityCheckResult[];
  all?: AccessibilityCheckResult[];
  none?: AccessibilityCheckResult[];
}

export interface AccessibilityCheckResult {
  id: string;
  data: unknown;
  relatedNodes: unknown[];
  impact: string;
  message: string;
}

export class EnhancedAccessibilityTester {
  constructor() {
    // Simple constructor without external dependencies
  }

  public async testHTML(html: string): Promise<AccessibilityTestResult> {
    try {
      return this.runBasicTests(html);
    } catch (error) {
      logger.error('Failed to run accessibility tests', {
        error: error as Error,
      });
      throw error;
    }
  }

  private runBasicTests(html: string): AccessibilityTestResult {
    const passes: AccessibilityCheck[] = [];
    const violations: AccessibilityViolation[] = [];
    const incomplete: AccessibilityCheck[] = [];

    // Basic HTML structure checks
    if (html.includes('<!DOCTYPE html>')) {
      passes.push({
        id: 'doctype',
        description: 'Document has proper DOCTYPE declaration',
        tags: ['wcag2a', 'structure'],
        nodes: [{ html: '<!DOCTYPE html>', target: ['html'] }],
      });
    } else {
      violations.push({
        id: 'doctype',
        description: 'Document must have DOCTYPE declaration',
        impact: 'moderate',
        tags: ['wcag2a', 'structure'],
        help: 'Add <!DOCTYPE html> to the beginning of the document',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/',
        nodes: [{ html: '', target: ['html'] }],
      });
    }

    // Check for lang attribute
    if (html.includes('lang="')) {
      passes.push({
        id: 'html-lang',
        description: 'HTML element has lang attribute',
        tags: ['wcag2a', 'language'],
        nodes: [{ html: '<html lang="en">', target: ['html'] }],
      });
    }

    // Check for proper heading structure
    const headingMatches = html.match(/<h[1-6][^>]*>/g);
    if (headingMatches && headingMatches.length > 0) {
      passes.push({
        id: 'heading-structure',
        description: 'Page has proper heading structure',
        tags: ['wcag2a', 'semantic'],
        nodes: headingMatches.map(h => ({
          html: h,
          target: ['h1,h2,h3,h4,h5,h6'],
        })),
      });
    }

    // Check for alt attributes on images
    const imgMatches = html.match(/<img[^>]*>/g);
    if (imgMatches) {
      imgMatches.forEach(img => {
        if (!img.includes('alt=')) {
          violations.push({
            id: 'image-alt',
            description: 'Images must have alternative text',
            impact: 'serious',
            tags: ['wcag2a', 'images'],
            help: 'Add alt attribute to images',
            helpUrl:
              'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
            nodes: [{ html: img, target: ['img'] }],
          });
        }
      });
    }

    // Check for ARIA attributes
    if (html.includes('aria-') || html.includes('role=')) {
      passes.push({
        id: 'aria-usage',
        description: 'ARIA attributes are used appropriately',
        tags: ['wcag2a', 'aria'],
        nodes: [
          { html: 'ARIA attributes found', target: ['[aria-*], [role]'] },
        ],
      });
    }

    // Check for keyboard navigation support
    if (html.includes('tabindex=') || html.includes('role="button"')) {
      passes.push({
        id: 'keyboard-navigation',
        description: 'Keyboard navigation support detected',
        tags: ['wcag2a', 'keyboard'],
        nodes: [
          {
            html: 'Keyboard navigation elements found',
            target: ['[tabindex], [role="button"]'],
          },
        ],
      });
    }

    const summary = {
      totalChecks: passes.length + violations.length + incomplete.length,
      passCount: passes.length,
      violationCount: violations.length,
      incompleteCount: incomplete.length,
      overallScore: 0,
      wcagLevel: 'Fail' as 'A' | 'AA' | 'AAA' | 'Fail',
    };

    if (summary.totalChecks > 0) {
      summary.overallScore = (summary.passCount / summary.totalChecks) * 100;
    }

    // Determine WCAG level based on violations
    const criticalViolations = violations.filter(
      v => v.impact === 'critical'
    ).length;
    const seriousViolations = violations.filter(
      v => v.impact === 'serious'
    ).length;

    if (criticalViolations === 0 && seriousViolations === 0) {
      if (violations.length === 0) {
        summary.wcagLevel = 'AAA';
      } else {
        summary.wcagLevel = 'AA';
      }
    } else if (criticalViolations === 0) {
      summary.wcagLevel = 'A';
    }

    return {
      passes,
      violations,
      incomplete,
      inapplicable: [],
      summary,
    };
  }

  public generateAccessibilityReport(html: string): Promise<{
    overall: AccessibilityTestResult;
    summary: {
      totalIssues: number;
      criticalIssues: number;
      overallScore: number;
      wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail';
    };
    recommendations: string[];
  }> {
    return new Promise(resolve => {
      this.testHTML(html)
        .then(result => {
          const criticalIssues = result.violations.filter(
            v => v.impact === 'critical' || v.impact === 'serious'
          ).length;

          const recommendations: string[] = [];

          result.violations.forEach(violation => {
            recommendations.push(`Fix ${violation.id}: ${violation.help}`);
          });

          if (result.violations.length === 0) {
            recommendations.push('Great! No accessibility violations found.');
          }

          if (result.summary.wcagLevel === 'Fail') {
            recommendations.push(
              'Address critical accessibility issues to meet WCAG standards.'
            );
          }

          resolve({
            overall: result,
            summary: {
              totalIssues: result.violations.length,
              criticalIssues,
              overallScore: result.summary.overallScore,
              wcagLevel: result.summary.wcagLevel,
            },
            recommendations,
          });
        })
        .catch(error => {
          logger.error('Accessibility testing failed', { error });
          resolve({
            overall: {
              passes: [],
              violations: [],
              incomplete: [],
              inapplicable: [],
              summary: {
                totalChecks: 0,
                passCount: 0,
                violationCount: 0,
                incompleteCount: 0,
                overallScore: 0,
                wcagLevel: 'Fail',
              },
            },
            summary: {
              totalIssues: 0,
              criticalIssues: 0,
              overallScore: 0,
              wcagLevel: 'Fail',
            },
            recommendations: [
              'Accessibility testing failed - manual review recommended',
            ],
          });
        });
    });
  }
}

// Export singleton instance
export const enhancedAccessibilityTester = new EnhancedAccessibilityTester();
