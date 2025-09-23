/**
 * Performance monitor tests
 */

import { performanceMonitor } from '../../src/utils/performance-monitor';
import { securityAuditor } from '../../src/security/security-audit';
import { rateLimiter } from '../../src/security/rate-limiter';
import { resourceManager } from '../../src/utils/resource-manager';
import { cacheManager } from '../../src/utils/cache-manager';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.reset();
  });

  afterEach(() => {
    performanceMonitor.reset();
  });

  afterAll(() => {
    // Clean up intervals and timers
    performanceMonitor.destroy();
    securityAuditor.destroy();
    rateLimiter.destroy();
    resourceManager.destroy();
    cacheManager.destroy();
  });

  describe('Operation Tracking', () => {
    test('should track operation start and end', async () => {
      const operationId = performanceMonitor.startOperation('test_operation');
      expect(operationId).toMatch(/^test_operation_\d+_[a-z0-9]+$/);

      // Simulate some work with a longer delay
      await new Promise(resolve => setTimeout(resolve, 50));

      performanceMonitor.endOperation(operationId, 'test_operation', true);

      const stats = performanceMonitor.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });

    test('should track multiple concurrent operations', () => {
      const op1 = performanceMonitor.startOperation('operation_1');
      const op2 = performanceMonitor.startOperation('operation_2');
      const op3 = performanceMonitor.startOperation('operation_3');

      const stats = performanceMonitor.getStats();
      expect(stats.concurrentRequests).toBe(3);

      performanceMonitor.endOperation(op1, 'operation_1', true);
      performanceMonitor.endOperation(op2, 'operation_2', true);
      performanceMonitor.endOperation(op3, 'operation_3', true);

      const finalStats = performanceMonitor.getStats();
      expect(finalStats.totalRequests).toBe(3);
      expect(finalStats.concurrentRequests).toBe(0);
    });

    test('should track cache hits and misses', () => {
      const op1 = performanceMonitor.startOperation('cached_operation');
      performanceMonitor.endOperation(op1, 'cached_operation', true, false); // Cache miss

      const op2 = performanceMonitor.startOperation('cached_operation');
      performanceMonitor.endOperation(op2, 'cached_operation', true, true); // Cache hit

      const stats = performanceMonitor.getStats();
      expect(stats.cacheStats.hits).toBe(1);
      expect(stats.cacheStats.misses).toBe(1);
      expect(stats.cacheStats.hitRate).toBe(0.5);
    });

    test('should track error rates', () => {
      const op1 = performanceMonitor.startOperation('failing_operation');
      performanceMonitor.endOperation(op1, 'failing_operation', false); // Failed

      const op2 = performanceMonitor.startOperation('successful_operation');
      performanceMonitor.endOperation(op2, 'successful_operation', true); // Success

      const stats = performanceMonitor.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.errorRate).toBe(0.5);
    });
  });

  describe('Memory Monitoring', () => {
    test('should track memory usage', () => {
      const stats = performanceMonitor.getStats();
      expect(stats.memoryUsage.current).toBeGreaterThan(0);
      expect(stats.memoryUsage.peak).toBeGreaterThan(0);
    });

    test('should detect memory pressure levels', () => {
      const lowPressure = performanceMonitor.getMemoryPressure();
      expect(['low', 'medium', 'high']).toContain(lowPressure);
    });
  });

  describe('Throttling', () => {
    test('should not throttle under normal load', () => {
      expect(performanceMonitor.shouldThrottle()).toBe(false);
    });

    test('should throttle under high concurrent load', () => {
      // Start many operations to simulate high load
      const operations = [];
      for (let i = 0; i < 55; i++) {
        operations.push(performanceMonitor.startOperation(`load_test_${i}`));
      }

      expect(performanceMonitor.shouldThrottle()).toBe(true);

      // Clean up
      operations.forEach((op, i) => {
        performanceMonitor.endOperation(op, `load_test_${i}`, true);
      });
    });
  });

  describe('Operation Statistics', () => {
    test('should provide operation-specific statistics', () => {
      const op1 = performanceMonitor.startOperation('specific_operation');
      performanceMonitor.endOperation(op1, 'specific_operation', true);

      const operationStats =
        performanceMonitor.getOperationStats('specific_operation');
      expect(operationStats).toHaveLength(1);
      expect(operationStats[0]?.operation).toBe('specific_operation');
      expect(operationStats[0]?.success).toBe(true);
    });

    test('should limit stored metrics to prevent memory leaks', () => {
      // Generate more than 1000 metrics for a single operation
      for (let i = 0; i < 1200; i++) {
        const op = performanceMonitor.startOperation('memory_test');
        performanceMonitor.endOperation(op, 'memory_test', true);
      }

      const operationStats =
        performanceMonitor.getOperationStats('memory_test');
      expect(operationStats.length).toBeLessThanOrEqual(1000);
    });
  });
});
