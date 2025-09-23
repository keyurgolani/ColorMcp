/**
 * Tests for rate limiting
 */

import { rateLimiter } from '../../src/security/rate-limiter';
import { securityAuditor } from '../../src/security/security-audit';
import { performanceMonitor } from '../../src/utils/performance-monitor';
import { resourceManager } from '../../src/utils/resource-manager';
import { cacheManager } from '../../src/utils/cache-manager';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset rate limiter state
    rateLimiter.reset();
  });

  afterAll(() => {
    // Clean up intervals and timers
    rateLimiter.destroy();
    securityAuditor.destroy();
    performanceMonitor.destroy();
    resourceManager.destroy();
    cacheManager.destroy();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limits', () => {
      const result = rateLimiter.checkRateLimit('convert_color', 'test-client');

      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(999); // 1000 - 1
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should track requests per client', () => {
      rateLimiter.checkRateLimit('convert_color', 'client1');
      rateLimiter.checkRateLimit('convert_color', 'client2');

      const result1 = rateLimiter.checkRateLimit('convert_color', 'client1');
      const result2 = rateLimiter.checkRateLimit('convert_color', 'client2');

      expect(result1.remainingRequests).toBe(998); // 1000 - 2
      expect(result2.remainingRequests).toBe(998); // 1000 - 2
    });

    it('should block requests when limit is exceeded', () => {
      // Use a low-limit operation for testing
      const operation = 'extract_palette_from_image'; // 10 requests per minute

      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        const result = rateLimiter.checkRateLimit(operation, 'test-client');
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const blockedResult = rateLimiter.checkRateLimit(
        operation,
        'test-client'
      );
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remainingRequests).toBe(0);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    it('should reset window after expiration', async () => {
      // Use custom config with short window for testing
      const customConfig = { windowMs: 100, maxRequests: 2 };

      // Make 2 requests (the limit)
      rateLimiter.checkRateLimit('test_operation', 'test-client', customConfig);
      rateLimiter.checkRateLimit('test_operation', 'test-client', customConfig);

      // 3rd request should be blocked
      let result = rateLimiter.checkRateLimit(
        'test_operation',
        'test-client',
        customConfig
      );
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      result = rateLimiter.checkRateLimit(
        'test_operation',
        'test-client',
        customConfig
      );
      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(1);
    });

    it('should use default limits for unknown operations', () => {
      const result = rateLimiter.checkRateLimit(
        'unknown_operation',
        'test-client'
      );

      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(49); // 50 - 1 (default limit)
    });

    it('should handle different rate limits for different operations', () => {
      // High-limit operation
      const convertResult = rateLimiter.checkRateLimit(
        'convert_color',
        'test-client'
      );
      expect(convertResult.remainingRequests).toBe(999); // 1000 - 1

      // Low-limit operation
      const pngResult = rateLimiter.checkRateLimit(
        'create_palette_png',
        'test-client'
      );
      expect(pngResult.remainingRequests).toBe(19); // 20 - 1
    });
  });

  describe('getRemainingRequests', () => {
    it('should return correct remaining requests', () => {
      rateLimiter.checkRateLimit('convert_color', 'test-client');
      rateLimiter.checkRateLimit('convert_color', 'test-client');

      const remaining = rateLimiter.getRemainingRequests(
        'convert_color',
        'test-client'
      );
      expect(remaining).toBe(998); // 1000 - 2
    });

    it('should return max requests for new clients', () => {
      const remaining = rateLimiter.getRemainingRequests(
        'convert_color',
        'new-client'
      );
      expect(remaining).toBe(1000);
    });
  });

  describe('getResetTime', () => {
    it('should return reset time for active windows', () => {
      rateLimiter.checkRateLimit('convert_color', 'test-client');
      const resetTime = rateLimiter.getResetTime(
        'convert_color',
        'test-client'
      );

      expect(resetTime).toBeGreaterThan(Date.now());
    });

    it('should return null for inactive windows', () => {
      const resetTime = rateLimiter.getResetTime('convert_color', 'new-client');
      expect(resetTime).toBeNull();
    });
  });

  describe('updateLimits', () => {
    it('should update limits for specific operations', () => {
      rateLimiter.updateLimits('test_operation', {
        maxRequests: 5,
        windowMs: 60000,
      });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkRateLimit(
          'test_operation',
          'test-client'
        );
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const blockedResult = rateLimiter.checkRateLimit(
        'test_operation',
        'test-client'
      );
      expect(blockedResult.allowed).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return statistics about rate limiting', () => {
      rateLimiter.checkRateLimit('convert_color', 'client1');
      rateLimiter.checkRateLimit('convert_color', 'client1');
      rateLimiter.checkRateLimit('analyze_color', 'client2');

      const stats = rateLimiter.getStats();

      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.activeWindows).toBeGreaterThan(0);
      expect(stats.topOperations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            operation: 'convert_color',
            requests: 2,
          }),
          expect.objectContaining({
            operation: 'analyze_color',
            requests: 1,
          }),
        ])
      );
    });
  });

  describe('reset', () => {
    it('should reset all rate limits', () => {
      rateLimiter.checkRateLimit('convert_color', 'test-client');
      rateLimiter.reset();

      const stats = rateLimiter.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.activeWindows).toBe(0);
    });

    it('should reset specific operation', () => {
      rateLimiter.checkRateLimit('convert_color', 'test-client');
      rateLimiter.checkRateLimit('analyze_color', 'test-client');

      rateLimiter.reset('convert_color');

      const convertRemaining = rateLimiter.getRemainingRequests(
        'convert_color',
        'test-client'
      );
      const analyzeRemaining = rateLimiter.getRemainingRequests(
        'analyze_color',
        'test-client'
      );

      expect(convertRemaining).toBe(1000); // Reset to max
      expect(analyzeRemaining).toBe(499); // Still has used request
    });

    it('should reset specific client for operation', () => {
      rateLimiter.checkRateLimit('convert_color', 'client1');
      rateLimiter.checkRateLimit('convert_color', 'client2');

      rateLimiter.reset('convert_color', 'client1');

      const client1Remaining = rateLimiter.getRemainingRequests(
        'convert_color',
        'client1'
      );
      const client2Remaining = rateLimiter.getRemainingRequests(
        'convert_color',
        'client2'
      );

      expect(client1Remaining).toBe(1000); // Reset to max
      expect(client2Remaining).toBe(999); // Still has used request
    });
  });
});
