/**
 * Resource manager tests
 */

import {
  ResourceManager,
  resourceManager,
} from '../../src/utils/resource-manager';
import { securityAuditor } from '../../src/security/security-audit';
import { rateLimiter } from '../../src/security/rate-limiter';
import { performanceMonitor } from '../../src/utils/performance-monitor';
import { cacheManager } from '../../src/utils/cache-manager';

// Mock global.gc for testing
const mockGc = jest.fn();
(global as any).gc = mockGc;

describe('ResourceManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up intervals and timers
    resourceManager.destroy();
    securityAuditor.destroy();
    rateLimiter.destroy();
    performanceMonitor.destroy();
    cacheManager.destroy();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = ResourceManager.getInstance();
      const instance2 = ResourceManager.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(resourceManager);
    });
  });

  describe('Resource Usage Monitoring', () => {
    test('should get current resource usage', () => {
      const usage = resourceManager.getCurrentUsage();

      expect(usage.memoryUsage).toBeGreaterThan(0);
      expect(usage.concurrentRequests).toBeGreaterThanOrEqual(0);
      expect(usage.cacheSize).toBeGreaterThanOrEqual(0);
    });

    test('should determine degradation strategy based on usage', () => {
      const lowUsage = {
        memoryUsage: 100 * 1024 * 1024, // 100MB
        concurrentRequests: 5,
        cacheSize: 50 * 1024 * 1024, // 50MB
      };

      const strategy = resourceManager.getDegradationStrategy(lowUsage);
      expect(strategy.level).toBe('none');
      expect(strategy.actions).toHaveLength(0);
    });

    test('should suggest light degradation for moderate usage', () => {
      const moderateUsage = {
        memoryUsage: 650 * 1024 * 1024, // 650MB (65% of 1GB limit)
        concurrentRequests: 30,
        cacheSize: 300 * 1024 * 1024, // 300MB
      };

      const strategy = resourceManager.getDegradationStrategy(moderateUsage);
      expect(strategy.level).toBe('light');
      expect(strategy.actions.length).toBeGreaterThan(0);
      expect(strategy.actions).toContain('throttle_requests');
    });

    test('should suggest moderate degradation for high usage', () => {
      const highUsage = {
        memoryUsage: 800 * 1024 * 1024, // 800MB (80% of 1GB limit)
        concurrentRequests: 40,
        cacheSize: 400 * 1024 * 1024, // 400MB
      };

      const strategy = resourceManager.getDegradationStrategy(highUsage);
      expect(strategy.level).toBe('moderate');
      expect(strategy.actions).toContain('queue_requests');
      expect(strategy.actions).toContain('clear_old_cache_entries');
    });

    test('should suggest aggressive degradation for critical usage', () => {
      const criticalUsage = {
        memoryUsage: 950 * 1024 * 1024, // 950MB (95% of 1GB limit)
        concurrentRequests: 48,
        cacheSize: 500 * 1024 * 1024, // 500MB
      };

      const strategy = resourceManager.getDegradationStrategy(criticalUsage);
      expect(strategy.level).toBe('aggressive');
      expect(strategy.actions).toContain('reject_new_requests');
      expect(strategy.actions).toContain('clear_all_caches');
      expect(strategy.actions).toContain('force_garbage_collection');
    });

    test('should handle edge case at exact thresholds', () => {
      const exactThreshold = {
        memoryUsage: 614.4 * 1024 * 1024, // Exactly 60% of 1GB
        concurrentRequests: 30,
        cacheSize: 300 * 1024 * 1024,
      };

      const strategy = resourceManager.getDegradationStrategy(exactThreshold);
      expect(strategy.level).toBe('light');
    });
  });

  describe('Request Management', () => {
    test('should allow requests under normal conditions', async () => {
      const allowed =
        await resourceManager.shouldAllowRequest('test_operation');
      expect(allowed).toBe(true);
    });

    test('should reject requests under aggressive degradation', async () => {
      // Mock getCurrentUsage to return high usage
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 950 * 1024 * 1024,
        concurrentRequests: 48,
        cacheSize: 500 * 1024 * 1024,
      });

      const allowed =
        await resourceManager.shouldAllowRequest('test_operation');
      expect(allowed).toBe(false);

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });

    test('should queue requests under moderate degradation', async () => {
      // Mock getCurrentUsage to return moderate usage
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 800 * 1024 * 1024,
        concurrentRequests: 40,
        cacheSize: 400 * 1024 * 1024,
      });

      const promise = resourceManager.shouldAllowRequest('test_operation');

      // Should be queued, so we need to wait a bit and then reduce pressure
      setTimeout(() => {
        resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
          memoryUsage: 100 * 1024 * 1024,
          concurrentRequests: 5,
          cacheSize: 50 * 1024 * 1024,
        });
      }, 100);

      const allowed = await promise;
      expect(allowed).toBe(true);

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    }, 10000);

    test('should throttle requests under light degradation', async () => {
      // Mock getCurrentUsage to return light usage
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 650 * 1024 * 1024,
        concurrentRequests: 30,
        cacheSize: 300 * 1024 * 1024,
      });

      const startTime = Date.now();
      const allowed =
        await resourceManager.shouldAllowRequest('test_operation');
      const endTime = Date.now();

      expect(allowed).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Should have delay (allow some tolerance)

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });

    test('should provide quality settings based on resource pressure', () => {
      // Ensure getCurrentUsage returns a complete object
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 100 * 1024 * 1024,
        concurrentRequests: 5,
        cacheSize: 50 * 1024 * 1024,
      });

      const settings = resourceManager.getQualitySettings('create_palette_png');

      expect(settings).toHaveProperty('imageQuality');
      expect(settings).toHaveProperty('resolution');
      expect(settings).toHaveProperty('maxColors');
      expect(settings).toHaveProperty('disableAnimations');
      expect(settings).toHaveProperty('disableInteractivity');

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });

    test('should provide degraded quality settings under pressure', () => {
      // Mock getCurrentUsage to return high usage
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;

      // Test aggressive degradation
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 950 * 1024 * 1024,
        concurrentRequests: 48,
        cacheSize: 500 * 1024 * 1024,
      });

      const aggressiveSettings =
        resourceManager.getQualitySettings('test_operation');
      expect(aggressiveSettings['imageQuality']).toBe('low');
      expect(aggressiveSettings['resolution']).toBe(72);
      expect(aggressiveSettings['maxColors']).toBe(5);
      expect(aggressiveSettings['disableAnimations']).toBe(true);
      expect(aggressiveSettings['disableInteractivity']).toBe(true);

      // Test moderate degradation
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 800 * 1024 * 1024,
        concurrentRequests: 40,
        cacheSize: 400 * 1024 * 1024,
      });

      const moderateSettings =
        resourceManager.getQualitySettings('test_operation');
      expect(moderateSettings['imageQuality']).toBe('medium');
      expect(moderateSettings['resolution']).toBe(150);
      expect(moderateSettings['maxColors']).toBe(10);

      // Test light degradation
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 650 * 1024 * 1024,
        concurrentRequests: 30,
        cacheSize: 300 * 1024 * 1024,
      });

      const lightSettings =
        resourceManager.getQualitySettings('test_operation');
      expect(lightSettings['imageQuality']).toBe('medium');
      expect(lightSettings['resolution']).toBe(150);
      expect(lightSettings['maxColors']).toBe(20);

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });

    test('should check if operations are allowed', () => {
      // Ensure getCurrentUsage returns a complete object
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 100 * 1024 * 1024,
        concurrentRequests: 5,
        cacheSize: 50 * 1024 * 1024,
      });

      const allowed = resourceManager.isOperationAllowed('convert_color');
      expect(typeof allowed).toBe('boolean');
      expect(allowed).toBe(true);

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });

    test('should disallow expensive operations under aggressive degradation', () => {
      // Mock getCurrentUsage to return high usage
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 950 * 1024 * 1024,
        concurrentRequests: 48,
        cacheSize: 500 * 1024 * 1024,
      });

      const expensiveOperations = [
        'create_palette_png',
        'create_gradient_png',
        'create_color_comparison_png',
        'extract_palette_from_image',
      ];

      expensiveOperations.forEach(operation => {
        const allowed = resourceManager.isOperationAllowed(operation);
        expect(allowed).toBe(false);
      });

      // Non-expensive operations should still be allowed
      const allowed = resourceManager.isOperationAllowed('convert_color');
      expect(allowed).toBe(true);

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });
  });

  describe('Resource Status', () => {
    test('should provide comprehensive resource status', () => {
      // Ensure getCurrentUsage returns a complete object
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 100 * 1024 * 1024,
        concurrentRequests: 5,
        cacheSize: 50 * 1024 * 1024,
      });

      const status = resourceManager.getResourceStatus();

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('usage');
      expect(status).toHaveProperty('strategy');
      expect(['healthy', 'warning', 'critical']).toContain(status.status);

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });

    test('should return correct status levels', () => {
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;

      // Test healthy status
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 100 * 1024 * 1024,
        concurrentRequests: 5,
        cacheSize: 50 * 1024 * 1024,
      });

      let status = resourceManager.getResourceStatus();
      expect(status.status).toBe('healthy');

      // Test warning status
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 650 * 1024 * 1024,
        concurrentRequests: 30,
        cacheSize: 300 * 1024 * 1024,
      });

      status = resourceManager.getResourceStatus();
      expect(status.status).toBe('warning');

      // Test critical status
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 950 * 1024 * 1024,
        concurrentRequests: 48,
        cacheSize: 500 * 1024 * 1024,
      });

      status = resourceManager.getResourceStatus();
      expect(status.status).toBe('critical');

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });
  });

  describe('Cleanup Operations', () => {
    test('should perform cleanup without errors', async () => {
      await expect(resourceManager.cleanup()).resolves.not.toThrow();
    });

    test('should call garbage collection during cleanup', async () => {
      await resourceManager.cleanup();
      expect(mockGc).toHaveBeenCalled();
    });

    test('should handle cleanup when gc is not available', async () => {
      const originalGc = (global as any).gc;
      delete (global as any).gc;

      await expect(resourceManager.cleanup()).resolves.not.toThrow();

      // Restore gc
      (global as any).gc = originalGc;
    });

    test('should clear request queue overflow during cleanup', async () => {
      // Access private requestQueue to simulate overflow
      const manager = resourceManager as any;

      // Add many requests to simulate overflow
      for (let i = 0; i < 150; i++) {
        manager.requestQueue.push({
          resolve: jest.fn(),
          reject: jest.fn(),
        });
      }

      await resourceManager.cleanup();

      // Should keep only first 50 requests
      expect(manager.requestQueue.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Private Methods', () => {
    test('should handle queue processing', async () => {
      const manager = resourceManager as any;

      // Mock low resource usage for processing
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 100 * 1024 * 1024,
        concurrentRequests: 5,
        cacheSize: 50 * 1024 * 1024,
      });

      // Add a request to the queue
      const mockResolve = jest.fn();
      const mockReject = jest.fn();
      manager.requestQueue.push({ resolve: mockResolve, reject: mockReject });

      // Process the queue
      await manager.processQueue();

      expect(mockResolve).toHaveBeenCalledWith(true);
      expect(mockReject).not.toHaveBeenCalled();

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    });

    test('should handle queue timeout', async () => {
      const manager = resourceManager as any;

      // Mock high resource usage to prevent processing
      const originalGetCurrentUsage = resourceManager.getCurrentUsage;
      resourceManager.getCurrentUsage = jest.fn().mockReturnValue({
        memoryUsage: 950 * 1024 * 1024,
        concurrentRequests: 48,
        cacheSize: 500 * 1024 * 1024,
      });

      const promise = manager.queueRequest();

      // Should timeout after 30 seconds, but we'll test with a shorter timeout
      await expect(promise).rejects.toThrow('Request timeout in queue');

      // Restore original method
      resourceManager.getCurrentUsage = originalGetCurrentUsage;
    }, 35000);
  });
});
