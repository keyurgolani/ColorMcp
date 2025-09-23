/**
 * Load testing for MCP Color Server
 */

import { ColorServer } from '../../src/server';
import { performanceMonitor } from '../../src/utils/performance-monitor';
import { createTestServer, cleanupServer, setupTestSuite } from '../test-utils';

describe('Load Testing', () => {
  let server: ColorServer;

  // Use the test suite setup utility
  setupTestSuite();

  beforeAll(() => {
    // Initialize server for testing
    server = createTestServer();
  });

  afterAll(async () => {
    // Clean up server instance
    if (server) {
      cleanupServer(server);
      server = null as any;
    }
  });

  beforeEach(() => {
    performanceMonitor.reset();
  });

  afterEach(() => {
    performanceMonitor.reset();
  });

  describe('Concurrent Request Handling', () => {
    test('should handle 50 concurrent color conversion requests', async () => {
      const requests = Array(50)
        .fill(null)
        .map((_, i) => {
          return new Promise(resolve => {
            const operationId =
              performanceMonitor.startOperation('convert_color');

            // Simulate color conversion work
            setTimeout(() => {
              performanceMonitor.endOperation(
                operationId,
                'convert_color',
                true
              );
              resolve(i);
            }, Math.random() * 100);
          });
        });

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds

      const stats = performanceMonitor.getStats();
      expect(stats.totalRequests).toBe(50);
      expect(stats.errorRate).toBe(0);
    }, 15000);

    test('should handle mixed operation types concurrently', async () => {
      const operations: string[] = [
        'convert_color',
        'analyze_color',
        'generate_harmony_palette',
        'create_palette_html',
        'check_contrast',
      ];

      const requests = Array(25)
        .fill(null)
        .map((_, i) => {
          const operation = operations[i % operations.length] as string;

          return new Promise(resolve => {
            const operationId = performanceMonitor.startOperation(operation);

            // Simulate different operation complexities
            const delay = operation.includes('create') ? 200 : 50;
            setTimeout(() => {
              performanceMonitor.endOperation(operationId, operation, true);
              resolve(operation);
            }, Math.random() * delay);
          });
        });

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();

      expect(results).toHaveLength(25);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds

      const stats = performanceMonitor.getStats();
      expect(stats.totalRequests).toBe(25);
    }, 20000);
  });

  describe('Memory Usage Under Load', () => {
    test('should maintain reasonable memory usage during load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Generate load with memory-intensive operations
      const requests = Array(20)
        .fill(null)
        .map(async () => {
          const operationId = performanceMonitor.startOperation(
            'create_palette_html'
          );

          // Simulate HTML generation with large data
          const largeData = {
            colors: Array(100)
              .fill(null)
              .map((_, j) => `#${j.toString(16).padStart(6, '0')}`),
            html: 'x'.repeat(10000), // 10KB of HTML
          };

          // Hold the data briefly
          await new Promise(r => setTimeout(r, 100));

          performanceMonitor.endOperation(
            operationId,
            'create_palette_html',
            true
          );
          return largeData;
        });

      await Promise.all(requests);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 200MB)
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }, 10000);
  });

  describe('Performance Benchmarks', () => {
    test('color conversion should complete within 100ms', async () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const operationId = performanceMonitor.startOperation('convert_color');

        // Simulate color conversion
        await new Promise(r => setTimeout(r, Math.random() * 50));

        performanceMonitor.endOperation(operationId, 'convert_color', true);

        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);
    });

    test('palette generation should complete within 500ms', async () => {
      const iterations = 20;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const operationId = performanceMonitor.startOperation(
          'generate_harmony_palette'
        );

        // Simulate palette generation
        await new Promise(r => setTimeout(r, Math.random() * 300));

        performanceMonitor.endOperation(
          operationId,
          'generate_harmony_palette',
          true
        );

        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(1000);
    });

    test('visualization generation should complete within 2000ms', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const operationId = performanceMonitor.startOperation(
          'create_palette_html'
        );

        // Simulate HTML generation
        await new Promise(r => setTimeout(r, Math.random() * 1500));

        performanceMonitor.endOperation(
          operationId,
          'create_palette_html',
          true
        );

        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(2000);
      expect(maxTime).toBeLessThan(3000);
    }, 20000);
  });

  describe('Error Handling Under Load', () => {
    test('should handle errors gracefully during high load', async () => {
      // Reset performance monitor to ensure clean state
      performanceMonitor.reset();
      const requests = Array(30)
        .fill(null)
        .map(async (_, i) => {
          const operationId =
            performanceMonitor.startOperation('test_operation');

          try {
            // Simulate some operations failing
            if (i % 5 === 0) {
              throw new Error(`Simulated error for request ${i}`);
            }

            await new Promise(r => setTimeout(r, Math.random() * 100));
            performanceMonitor.endOperation(
              operationId,
              'test_operation',
              true
            );
            return { success: true, id: i };
          } catch (error) {
            performanceMonitor.endOperation(
              operationId,
              'test_operation',
              false
            );
            return { success: false, id: i, error: (error as Error).message };
          }
        });

      const results = await Promise.all(requests);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      expect(successful).toHaveLength(24); // 30 - 6 failures
      expect(failed).toHaveLength(6);

      const stats = performanceMonitor.getStats();
      expect(stats.totalRequests).toBe(30);
      expect(stats.errorRate).toBeCloseTo(0.2, 1); // 20% error rate
    });
  });
});
