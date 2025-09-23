/**
 * Tests for security middleware
 */

import { securityMiddleware } from '../../src/security/security-middleware';
import { rateLimiter } from '../../src/security/rate-limiter';
import { securityAuditor } from '../../src/security/security-audit';
import { performanceMonitor } from '../../src/utils/performance-monitor';
import { resourceManager } from '../../src/utils/resource-manager';
import { cacheManager } from '../../src/utils/cache-manager';

describe('SecurityMiddleware', () => {
  beforeEach(() => {
    // Reset security components
    rateLimiter.reset();
    securityAuditor.reset();
    // Also reset performance monitor and clear caches to avoid interference
    performanceMonitor.reset();
    cacheManager.clear();
  });

  afterAll(() => {
    // Clean up intervals and timers
    securityAuditor.destroy();
    rateLimiter.destroy();
    performanceMonitor.destroy();
    resourceManager.destroy();
    cacheManager.destroy();
  });

  describe('checkSecurity', () => {
    it('should allow valid requests', async () => {
      const context = {
        operation: 'convert_color',
        clientId: 'test-client',
        parameters: {
          color: '#FF0000',
          output_format: 'rgb',
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedParameters).toEqual(context.parameters);
    });

    it('should block requests that exceed rate limits', async () => {
      const context = {
        operation: 'extract_palette_from_image', // Low limit operation
        clientId: 'test-client',
        parameters: {
          image_url: 'https://example.com/image.jpg',
        },
      };

      // Exhaust the rate limit (10 requests)
      for (let i = 0; i < 10; i++) {
        await securityMiddleware.checkSecurity(context);
      }

      // 11th request should be blocked
      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(false);
      expect(
        result.errors.some(error => error.includes('Rate limit exceeded'))
      ).toBe(true);
      expect(result.rateLimitInfo?.retryAfter).toBeGreaterThan(0);
    });

    it('should sanitize color inputs', async () => {
      const context = {
        operation: 'convert_color',
        clientId: 'test-client',
        parameters: {
          color: '<script>alert(1)</script>#FF0000',
          output_format: 'rgb',
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(true);
      expect(result.warnings).toContain("Color input 'color' was sanitized.");
      expect(result.sanitizedParameters?.['color']).toBe('#FF0000');
    });

    it('should sanitize URLs', async () => {
      const context = {
        operation: 'extract_palette_from_image',
        clientId: 'test-client',
        parameters: {
          image_url: 'javascript:alert(1)',
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(false);
      expect(result.errors).toContain(
        "URL 'image_url' contains security risks and was blocked."
      );
    });

    it('should sanitize color arrays', async () => {
      const context = {
        operation: 'create_palette_html',
        clientId: 'test-client',
        parameters: {
          palette: ['#FF0000', '<script>alert(1)</script>#00FF00', '#0000FF'],
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(true);
      expect(result.warnings).toContain(
        "Color in array 'palette[1]' was sanitized."
      );
      expect(result.sanitizedParameters?.['palette']).toEqual([
        '#FF0000',
        '#00FF00',
        '#0000FF',
      ]);
    });

    it('should validate numeric parameters', async () => {
      const context = {
        operation: 'convert_color',
        clientId: 'test-client',
        parameters: {
          color: '#FF0000',
          output_format: 'rgb',
          precision: -5, // Invalid negative precision
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(false);
      expect(result.errors).toContain(
        "Numeric parameter 'precision' is out of acceptable range."
      );
    });

    it('should detect suspicious activity', async () => {
      const context = {
        operation: 'convert_color',
        clientId: 'suspicious-client',
        parameters: {
          color: '<script>alert("xss")</script>javascript:void(0)',
          output_format: 'rgb',
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.warnings).toContain(
        'Suspicious activity detected - request monitored.'
      );
    });

    it('should block critical suspicious activity', async () => {
      // Simulate high-risk activity by making many requests quickly
      const clientId = 'attacker';

      // Pre-populate with many events to trigger critical threshold
      for (let i = 0; i < 150; i++) {
        securityAuditor.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          operation: 'convert_color',
          clientId,
          details: { attempt: i },
        });
      }

      const context = {
        operation: 'convert_color',
        clientId,
        parameters: {
          color: '<script>alert("critical")</script>',
          output_format: 'rgb',
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(false);
      expect(result.errors).toContain(
        'Request blocked due to suspicious activity.'
      );
    });

    it('should validate required parameters', async () => {
      const context = {
        operation: 'convert_color',
        clientId: 'test-client',
        parameters: {
          // Missing required 'color' parameter
          output_format: 'rgb',
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(false);
      expect(result.errors).toContain("Required parameter 'color' is missing");
    });

    it('should validate image dimensions', async () => {
      const context = {
        operation: 'create_palette_png',
        clientId: 'test-client',
        parameters: {
          palette: ['#FF0000'],
          dimensions: [50000, 50000], // Too large
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(false);
      expect(result.errors).toContain(
        'Image dimensions too large (max 10000x10000)'
      );
    });

    it('should limit palette sizes', async () => {
      const context = {
        operation: 'generate_harmony_palette',
        clientId: 'test-client',
        parameters: {
          base_color: '#FF0000',
          harmony_type: 'complementary',
          count: 100, // Too many colors
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(false);
      expect(result.errors).toContain('Palette size too large (max 50 colors)');
    });

    it('should handle HTML content sanitization', async () => {
      const context = {
        operation: 'create_theme_preview_html',
        clientId: 'test-client',
        parameters: {
          theme_colors: { primary: '#FF0000' },
          html_content: '<div onclick="alert(1)">Content</div>',
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(true);
      expect(result.warnings).toContain(
        "HTML content 'html_content' was sanitized."
      );
    });

    it('should handle security check errors gracefully', async () => {
      // Mock an error in the security check process
      const originalCheckSecurity = securityMiddleware.checkSecurity;

      // Temporarily replace with error-throwing version
      (securityMiddleware as any).sanitizeParameters = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));

      const context = {
        operation: 'convert_color',
        clientId: 'test-client',
        parameters: {
          color: '#FF0000',
          output_format: 'rgb',
        },
      };

      const result = await securityMiddleware.checkSecurity(context);

      expect(result.allowed).toBe(false);
      expect(result.errors).toContain(
        'Security check failed due to internal error.'
      );

      // Restore original method
      (securityMiddleware as any).sanitizeParameters = originalCheckSecurity;
    });
  });

  describe('getSecurityHeaders', () => {
    it('should return appropriate security headers', () => {
      const headers = securityMiddleware.getSecurityHeaders();

      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(headers).toHaveProperty(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      );
      expect(headers).toHaveProperty('Permissions-Policy');

      // Check CSP contains important directives
      expect(headers['Content-Security-Policy']).toContain(
        "default-src 'self'"
      );
      expect(headers['Content-Security-Policy']).toContain(
        "script-src 'self' 'unsafe-inline'"
      );
    });
  });
});
