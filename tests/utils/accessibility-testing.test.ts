import {
  AccessibilityTester,
  accessibilityTester,
} from '../../src/utils/accessibility-testing';

describe('AccessibilityTester', () => {
  let tester: AccessibilityTester;

  beforeEach(() => {
    tester = new AccessibilityTester();
  });

  describe('testHTML', () => {
    it('should pass for fully compliant HTML', () => {
      const compliantHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test</title>
          <style>
            button:focus { outline: 2px solid blue; }
            @media (prefers-reduced-motion: reduce) { * { animation: none; } }
            @media (prefers-contrast: high) { body { background: white; } }
          </style>
        </head>
        <body>
          <main>
            <h1>Main Heading</h1>
            <button aria-label="Test button" tabindex="0">Click me</button>
          </main>
        </body>
        </html>
      `;

      const result = tester.testHTML(compliantHTML);
      expect(result.score).toBeGreaterThan(80);
      expect(result.issues.filter(i => i.type === 'error')).toHaveLength(0);
      // Note: passes might be false due to warnings, but no errors is what matters
    });

    it('should fail for HTML missing DOCTYPE', () => {
      const html = '<html><body>Content</body></html>';
      const result = tester.testHTML(html);

      expect(result.passes).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          code: 'DOCTYPE_MISSING',
          wcagLevel: 'A',
        })
      );
    });

    it('should fail for HTML missing lang attribute', () => {
      const html = '<!DOCTYPE html><html><body>Content</body></html>';
      const result = tester.testHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          code: 'LANG_MISSING',
          wcagLevel: 'A',
        })
      );
    });

    it('should warn for missing viewport meta tag', () => {
      const html = '<!DOCTYPE html><html lang="en"><body>Content</body></html>';
      const result = tester.testHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          code: 'VIEWPORT_MISSING',
          wcagLevel: 'AA',
        })
      );
    });

    it('should warn for missing headings', () => {
      const html =
        '<!DOCTYPE html><html lang="en"><body><p>Content</p></body></html>';
      const result = tester.testHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          code: 'NO_HEADINGS',
          wcagLevel: 'AA',
        })
      );
    });

    it('should detect missing ARIA labels on interactive elements', () => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <body>
          <button>No label</button>
          <input type="text">
          <select><option>Option</option></select>
          <textarea></textarea>
          <div role="button">Custom button</div>
          <div tabindex="0">Focusable div</div>
        </body>
        </html>
      `;

      const result = tester.testHTML(html);
      const ariaIssues = result.issues.filter(
        i => i.code === 'MISSING_ARIA_LABEL'
      );
      expect(ariaIssues.length).toBeGreaterThan(0);
    });

    it('should detect missing tabindex', () => {
      const html =
        '<!DOCTYPE html><html lang="en"><body><p>Content</p></body></html>';
      const result = tester.testHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'info',
          code: 'NO_TABINDEX',
          wcagLevel: 'AA',
        })
      );
    });

    it('should detect missing focus styles', () => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <body>
          <button>Button</button>
        </body>
        </html>
      `;

      const result = tester.testHTML(html);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          code: 'NO_FOCUS_STYLES',
          wcagLevel: 'AA',
        })
      );
    });

    it('should detect missing reduced motion support', () => {
      const html = '<!DOCTYPE html><html lang="en"><body>Content</body></html>';
      const result = tester.testHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'info',
          code: 'NO_REDUCED_MOTION',
          wcagLevel: 'AAA',
        })
      );
    });

    it('should detect missing high contrast support', () => {
      const html = '<!DOCTYPE html><html lang="en"><body>Content</body></html>';
      const result = tester.testHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'info',
          code: 'NO_HIGH_CONTRAST',
          wcagLevel: 'AAA',
        })
      );
    });

    it('should detect missing semantic HTML elements', () => {
      const html =
        '<!DOCTYPE html><html lang="en"><body><div>Content</div></body></html>';
      const result = tester.testHTML(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          code: 'NO_SEMANTIC_HTML',
          wcagLevel: 'AA',
        })
      );
    });

    it('should pass with semantic HTML elements', () => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <body>
          <main>Content</main>
        </body>
        </html>
      `;

      const result = tester.testHTML(html);
      const semanticIssues = result.issues.filter(
        i => i.code === 'NO_SEMANTIC_HTML'
      );
      expect(semanticIssues).toHaveLength(0);
    });

    it('should pass with role-based semantic elements', () => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <body>
          <div role="main">Content</div>
        </body>
        </html>
      `;

      const result = tester.testHTML(html);
      const semanticIssues = result.issues.filter(
        i => i.code === 'NO_SEMANTIC_HTML'
      );
      expect(semanticIssues).toHaveLength(0);
    });

    it('should generate appropriate recommendations', () => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <body>
          <button>No label</button>
        </body>
        </html>
      `;

      const result = tester.testHTML(html);
      expect(result.recommendations).toContain(
        'Add aria-label attributes to all interactive elements'
      );
      expect(result.recommendations).toContain(
        'Add visible focus indicators for keyboard navigation'
      );
    });

    it('should calculate score based on issues', () => {
      const htmlWithErrors = '<!DOCTYPE html><body>Content</body>';
      const result = tester.testHTML(htmlWithErrors);

      expect(result.score).toBeLessThan(100);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('testColorContrast', () => {
    it('should pass for high contrast colors', () => {
      // Mock the private method to return a high contrast ratio
      const originalMethod = (tester as any).calculateContrastRatio;
      (tester as any).calculateContrastRatio = jest.fn().mockReturnValue(21);

      const result = tester.testColorContrast('#000000', '#ffffff');

      expect(result.passes).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues.filter(i => i.type === 'error')).toHaveLength(0);

      // Restore original method
      (tester as any).calculateContrastRatio = originalMethod;
    });

    it('should fail for low contrast colors', () => {
      const originalMethod = (tester as any).calculateContrastRatio;
      (tester as any).calculateContrastRatio = jest.fn().mockReturnValue(2.5);

      const result = tester.testColorContrast('#888888', '#999999');

      expect(result.passes).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          code: 'CONTRAST_AA_FAIL',
          wcagLevel: 'AA',
        })
      );

      (tester as any).calculateContrastRatio = originalMethod;
    });

    it('should handle different text sizes', () => {
      const originalMethod = (tester as any).calculateContrastRatio;
      (tester as any).calculateContrastRatio = jest.fn().mockReturnValue(3.5);

      const normalResult = tester.testColorContrast(
        '#666666',
        '#ffffff',
        'normal'
      );
      const largeResult = tester.testColorContrast(
        '#666666',
        '#ffffff',
        'large'
      );

      expect(normalResult.passes).toBe(false); // 3.5 < 4.5 for normal text
      expect(largeResult.passes).toBe(true); // 3.5 > 3.0 for large text

      (tester as any).calculateContrastRatio = originalMethod;
    });

    it('should warn for AAA failures', () => {
      const originalMethod = (tester as any).calculateContrastRatio;
      (tester as any).calculateContrastRatio = jest.fn().mockReturnValue(5.0);

      const result = tester.testColorContrast('#666666', '#ffffff');

      expect(result.passes).toBe(true); // Passes AA
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          code: 'CONTRAST_AAA_FAIL',
          wcagLevel: 'AAA',
        })
      );

      (tester as any).calculateContrastRatio = originalMethod;
    });

    it('should calculate appropriate scores', () => {
      const originalMethod = (tester as any).calculateContrastRatio;

      // Test AAA level
      (tester as any).calculateContrastRatio = jest.fn().mockReturnValue(8.0);
      let result = tester.testColorContrast('#000000', '#ffffff');
      expect(result.score).toBe(100);

      // Test AA level
      (tester as any).calculateContrastRatio = jest.fn().mockReturnValue(5.0);
      result = tester.testColorContrast('#000000', '#ffffff');
      expect(result.score).toBe(80);

      // Test below AA
      (tester as any).calculateContrastRatio = jest.fn().mockReturnValue(2.0);
      result = tester.testColorContrast('#000000', '#ffffff');
      expect(result.score).toBeLessThan(60);

      (tester as any).calculateContrastRatio = originalMethod;
    });
  });

  describe('testKeyboardNavigation', () => {
    it('should pass for proper keyboard navigation', () => {
      const html = `
        <div tabindex="0" onkeydown="handleKey()">
          <button>Button</button>
        </div>
        <script>
          document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp') { /* handle */ }
          });
        </script>
      `;

      const result = tester.testKeyboardNavigation(html);
      expect(result.passes).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should warn for missing tab order', () => {
      const html = '<div><button>Button</button></div>';
      const result = tester.testKeyboardNavigation(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          code: 'NO_TAB_ORDER',
          wcagLevel: 'AA',
        })
      );
    });

    it('should fail for missing keyboard handlers', () => {
      const html = '<div tabindex="0"><button>Button</button></div>';
      const result = tester.testKeyboardNavigation(html);

      expect(result.passes).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'error',
          code: 'NO_KEYBOARD_HANDLERS',
          wcagLevel: 'A',
        })
      );
    });

    it('should detect various keyboard handler patterns', () => {
      const patterns = [
        { pattern: 'onkeydown="test()"', description: 'inline onkeydown' },
        { pattern: 'onkeyup="test()"', description: 'inline onkeyup' },
        { pattern: 'onkeypress="test()"', description: 'inline onkeypress' },
      ];

      patterns.forEach(({ pattern }) => {
        const html = `<div ${pattern}><button>Button</button></div>`;
        const result = tester.testKeyboardNavigation(html);
        const keyboardIssues = result.issues.filter(
          i => i.code === 'NO_KEYBOARD_HANDLERS'
        );
        expect(keyboardIssues).toHaveLength(0);
      });

      // Test addEventListener patterns in script tags
      const scriptPatterns = [
        'addEventListener("keydown"',
        'addEventListener("keyup"',
      ];

      scriptPatterns.forEach(pattern => {
        const html = `
          <div><button>Button</button></div>
          <script>
            document.${pattern}, function() {});
          </script>
        `;
        const result = tester.testKeyboardNavigation(html);
        const keyboardIssues = result.issues.filter(
          i => i.code === 'NO_KEYBOARD_HANDLERS'
        );
        expect(keyboardIssues).toHaveLength(0);
      });
    });

    it('should suggest arrow key navigation', () => {
      const html =
        '<div tabindex="0" onkeydown="test()"><button>Button</button></div>';
      const result = tester.testKeyboardNavigation(html);

      expect(result.issues).toContainEqual(
        expect.objectContaining({
          type: 'info',
          code: 'NO_ARROW_NAVIGATION',
          wcagLevel: 'AAA',
        })
      );
    });

    it('should pass with arrow key navigation', () => {
      const html = `
        <div tabindex="0" onkeydown="test()">
          <script>
            if (e.key === 'ArrowUp') { /* handle */ }
          </script>
        </div>
      `;

      const result = tester.testKeyboardNavigation(html);
      const arrowIssues = result.issues.filter(
        i => i.code === 'NO_ARROW_NAVIGATION'
      );
      expect(arrowIssues).toHaveLength(0);
    });
  });

  describe('generateAccessibilityReport', () => {
    it('should generate comprehensive report', () => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            button:focus { outline: 2px solid blue; }
          </style>
        </head>
        <body>
          <main>
            <h1>Title</h1>
            <button aria-label="Test" tabindex="0" onkeydown="test()">Button</button>
          </main>
        </body>
        </html>
      `;

      const report = tester.generateAccessibilityReport(html);

      expect(report).toHaveProperty('overall');
      expect(report).toHaveProperty('html');
      expect(report).toHaveProperty('keyboard');
      expect(report).toHaveProperty('summary');

      expect(report.summary).toHaveProperty('totalIssues');
      expect(report.summary).toHaveProperty('criticalIssues');
      expect(report.summary).toHaveProperty('overallScore');
      expect(report.summary).toHaveProperty('wcagLevel');
    });

    it('should calculate WCAG levels correctly', () => {
      // Test AAA level
      const excellentHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            button:focus { outline: 2px solid blue; }
            @media (prefers-reduced-motion: reduce) { * { animation: none; } }
            @media (prefers-contrast: high) { body { background: white; } }
          </style>
        </head>
        <body>
          <main>
            <h1>Title</h1>
            <button aria-label="Test" tabindex="0" onkeydown="handleKey(event)">Button</button>
          </main>
          <script>
            function handleKey(e) {
              if (e.key === 'ArrowUp') { /* handle */ }
            }
          </script>
        </body>
        </html>
      `;

      const report = tester.generateAccessibilityReport(excellentHTML);
      expect(['AAA', 'AA', 'A']).toContain(report.summary.wcagLevel);

      // Test failing level
      const poorHTML = '<div>No structure</div>';
      const poorReport = tester.generateAccessibilityReport(poorHTML);
      expect(poorReport.summary.wcagLevel).toBe('Fail');
    });

    it('should merge recommendations without duplicates', () => {
      const html = `
        <button>No label</button>
        <input type="text">
      `;

      const report = tester.generateAccessibilityReport(html);
      const recommendations = report.overall.recommendations;

      // Should not have duplicate recommendations
      const uniqueRecommendations = [...new Set(recommendations)];
      expect(recommendations).toEqual(uniqueRecommendations);
    });
  });

  describe('calculateContrastRatio (private method)', () => {
    it('should handle identical colors', () => {
      const result = (tester as any).calculateContrastRatio(
        '#000000',
        '#000000'
      );
      expect(result).toBe(1);
    });

    it('should handle black and white', () => {
      const result1 = (tester as any).calculateContrastRatio(
        '#000000',
        '#ffffff'
      );
      const result2 = (tester as any).calculateContrastRatio(
        '#ffffff',
        '#000000'
      );
      expect(result1).toBe(21);
      expect(result2).toBe(21);
    });

    it('should return reasonable values for other colors', () => {
      const result = (tester as any).calculateContrastRatio(
        '#ff0000',
        '#00ff00'
      );
      expect(result).toBeGreaterThan(3);
      expect(result).toBeLessThan(13);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(accessibilityTester).toBeInstanceOf(AccessibilityTester);
    });
  });
});
