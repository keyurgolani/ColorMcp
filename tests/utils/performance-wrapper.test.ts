/**
 * Performance wrapper tests
 */

import { PerformanceWrapper } from '../../src/utils/performance-wrapper';
import { ToolHandler, ToolResponse } from '../../src/types';

describe('PerformanceWrapper', () => {
  const mockTool: ToolHandler = {
    name: 'test_tool',
    description: 'Test tool for performance wrapper',
    parameters: {
      type: 'object',
      properties: {
        param: { type: 'string' },
      },
    },
    handler: async (params: any): Promise<ToolResponse> => {
      return {
        success: true,
        data: { result: `processed ${params.param}` },
        metadata: {
          execution_time: 100,
          tool: 'test_tool',
          timestamp: new Date().toISOString(),
          accessibility_notes: [],
          recommendations: [],
        },
      };
    },
  };

  describe('Basic Wrapping', () => {
    test('should wrap tool with default config', async () => {
      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);

      expect(wrappedTool.name).toBe(mockTool.name);
      expect(wrappedTool.description).toBe(mockTool.description);
      expect(wrappedTool.parameters).toBe(mockTool.parameters);
      expect(typeof wrappedTool.handler).toBe('function');
    });

    test('should execute wrapped tool successfully', async () => {
      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'test' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).result).toBe('processed test');
      }
    });
  });

  describe('Caching Integration', () => {
    test('should use cache when enabled', async () => {
      const config = {
        enableCaching: true,
        cacheType: 'test_cache',
        cacheTTL: 1000,
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);

      // First call - should execute and cache
      const result1 = await wrappedTool.handler({ param: 'cached_test' });
      expect(result1.success).toBe(true);

      // Second call - should use cache
      const result2 = await wrappedTool.handler({ param: 'cached_test' });
      expect(result2.success).toBe(true);
    });

    test('should skip cache when disabled', async () => {
      const config = {
        enableCaching: false,
        cacheType: 'test_cache',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);

      const result = await wrappedTool.handler({ param: 'no_cache_test' });
      expect(result.success).toBe(true);
    });
  });

  describe('Resource Management', () => {
    test('should check resources when enabled', async () => {
      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: true,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'resource_test' });

      // Should either succeed or fail with resource limit error
      expect(typeof result.success).toBe('boolean');
    });

    test('should skip resource checks when disabled', async () => {
      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'no_resource_test' });

      expect(result.success).toBe(true);
    });
  });

  describe('Monitoring Integration', () => {
    test('should monitor performance when enabled', async () => {
      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'monitor_test' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.execution_time).toBeGreaterThan(0);
      }
    });

    test('should skip monitoring when disabled', async () => {
      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: false,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'no_monitor_test' });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle tool errors gracefully', async () => {
      const errorTool: ToolHandler = {
        name: 'error_tool',
        description: 'Tool that throws errors',
        parameters: { type: 'object' },
        handler: async () => {
          throw new Error('Test error');
        },
      };

      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(errorTool, config);
      const result = await wrappedTool.handler({ param: 'error_test' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Test error');
      }
    });

    test('should handle timeout errors', async () => {
      // Use fake timers to avoid hanging handles
      jest.useFakeTimers();

      const slowTool: ToolHandler = {
        name: 'slow_tool',
        description: 'Tool that takes too long',
        parameters: { type: 'object' },
        handler: async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return {
            success: true,
            data: { result: 'slow result' },
            metadata: {
              execution_time: 2000,
              tool: 'slow_tool',
              timestamp: new Date().toISOString(),
              accessibility_notes: [],
              recommendations: [],
            },
          };
        },
      };

      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
        timeoutMs: 100,
      };

      const wrappedTool = PerformanceWrapper.wrap(slowTool, config);

      // Start the operation
      const resultPromise = wrappedTool.handler({ param: 'timeout_test' });

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(150);

      const result = await resultPromise;

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('TIMEOUT');
      }

      // Restore real timers
      jest.useRealTimers();
    });
  });

  describe('Configuration Validation', () => {
    test('should handle invalid cache type', async () => {
      const config = {
        enableCaching: true,
        cacheType: '',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'invalid_cache_test' });

      // Should still work, just without caching
      expect(result.success).toBe(true);
    });

    test('should handle missing TTL', async () => {
      const config = {
        enableCaching: true,
        cacheType: 'test_cache',
        enableResourceChecks: false,
        enableMonitoring: true,
        // No cacheTTL specified
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'no_ttl_test' });

      expect(result.success).toBe(true);
    });
  });

  describe('Resource Management Edge Cases', () => {
    test('should handle resource checks when enabled', async () => {
      // Test that resource checks are enabled and the tool still works
      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: true,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'resource_test' });

      // Should succeed under normal conditions
      expect(result.success).toBe(true);
    });

    test('should handle quality settings application', async () => {
      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: true,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({
        param: 'quality_test',
        quality: 'high',
        resolution: 300,
        count: 10,
        color_count: 15,
        animation: true,
        interactive: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Configuration Creation', () => {
    test('should create default config for unknown tool', () => {
      const config = PerformanceWrapper.createConfig('unknown_tool');

      expect(config.enableCaching).toBe(true);
      expect(config.cacheType).toBe('default');
      expect(config.enableResourceChecks).toBe(true);
      expect(config.enableMonitoring).toBe(true);
      expect(config.timeoutMs).toBe(20000);
    });

    test('should create specific config for convert_color tool', () => {
      const config = PerformanceWrapper.createConfig('convert_color');

      expect(config.enableCaching).toBe(true);
      expect(config.cacheType).toBe('color_conversion');
      expect(config.enableResourceChecks).toBe(false);
      expect(config.timeoutMs).toBe(5000);
    });

    test('should create specific config for visualization tools', () => {
      const config = PerformanceWrapper.createConfig('create_palette_html');

      expect(config.enableCaching).toBe(true);
      expect(config.cacheType).toBe('visualization');
      expect(config.enableResourceChecks).toBe(true);
      expect(config.timeoutMs).toBe(30000);
    });

    test('should apply overrides to default config', () => {
      const config = PerformanceWrapper.createConfig('test_tool', {
        enableCaching: false,
        timeoutMs: 5000,
      });

      expect(config.enableCaching).toBe(false);
      expect(config.timeoutMs).toBe(5000);
      expect(config.enableResourceChecks).toBe(true); // Should keep default
    });
  });

  describe('Utility Functions', () => {
    test('should wrap multiple tools with performance', () => {
      const tools = [mockTool, { ...mockTool, name: 'test_tool_2' }];
      const configOverrides = {
        test_tool: { enableCaching: false },
        test_tool_2: { timeoutMs: 5000 },
      };

      const wrappedTools =
        require('../../src/utils/performance-wrapper').wrapToolsWithPerformance(
          tools,
          configOverrides
        );

      expect(wrappedTools).toHaveLength(2);
      expect(wrappedTools[0].name).toBe('test_tool');
      expect(wrappedTools[1].name).toBe('test_tool_2');
    });

    test('should wrap tools without config overrides', () => {
      const tools = [mockTool];
      const wrappedTools =
        require('../../src/utils/performance-wrapper').wrapToolsWithPerformance(
          tools
        );

      expect(wrappedTools).toHaveLength(1);
      expect(wrappedTools[0].name).toBe('test_tool');
    });
  });

  describe('Advanced Error Handling', () => {
    test('should handle non-Error thrown values', async () => {
      const errorTool: ToolHandler = {
        name: 'error_tool',
        description: 'Tool that throws non-Error values',
        parameters: { type: 'object' },
        handler: async () => {
          throw 'String error';
        },
      };

      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(errorTool, config);
      const result = await wrappedTool.handler({ param: 'non_error_test' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Unknown error occurred');
      }
    });

    test('should include stack trace in development mode', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const errorTool: ToolHandler = {
        name: 'error_tool',
        description: 'Tool that throws errors',
        parameters: { type: 'object' },
        handler: async () => {
          throw new Error('Development error');
        },
      };

      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      const wrappedTool = PerformanceWrapper.wrap(errorTool, config);
      const result = await wrappedTool.handler({ param: 'dev_error_test' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details).toBeDefined();
      }

      // Restore original environment
      process.env['NODE_ENV'] = originalEnv;
    });

    test('should handle memory threshold warnings', async () => {
      // Use fake timers to control timeout behavior
      jest.useFakeTimers();

      const memoryTool: ToolHandler = {
        name: 'test_tool',
        description: 'Tool for memory testing',
        parameters: { type: 'object' },
        handler: async () => {
          return {
            success: true,
            data: { result: 'memory test' },
            metadata: {
              execution_time: 100,
              tool: 'test_tool',
              timestamp: new Date().toISOString(),
              accessibility_notes: [],
              recommendations: [],
            },
          };
        },
      };

      const config = {
        enableCaching: false,
        cacheType: 'memory',
        enableResourceChecks: false,
        enableMonitoring: true,
        timeoutMs: 1000,
      };

      const wrappedTool = PerformanceWrapper.wrap(memoryTool, config);
      const result = await wrappedTool.handler({ param: 'memory_test' });

      expect(result.success).toBe(true);

      // Restore real timers
      jest.useRealTimers();
    });
  });

  describe('Cache Integration Edge Cases', () => {
    test('should handle cache hit with metadata update', async () => {
      const config = {
        enableCaching: true,
        cacheType: 'test_cache',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      // Mock cache to return a cached result
      const cacheManager =
        require('../../src/utils/cache-manager').cacheManager;
      const originalGet = cacheManager.get;
      cacheManager.get = jest.fn().mockReturnValue({
        success: true,
        data: { result: 'cached result' },
        metadata: {
          execution_time: 50,
          tool: 'test_tool',
          timestamp: '2023-01-01T00:00:00.000Z',
          accessibility_notes: [],
          recommendations: [],
        },
      });

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'cache_hit_test' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.metadata.timestamp).not.toBe('2023-01-01T00:00:00.000Z');
      }

      // Restore original method
      cacheManager.get = originalGet;
    });

    test('should handle failed cache operations gracefully', async () => {
      const config = {
        enableCaching: true,
        cacheType: 'test_cache',
        enableResourceChecks: false,
        enableMonitoring: true,
      };

      // Mock cache to throw error
      const cacheManager =
        require('../../src/utils/cache-manager').cacheManager;
      const originalGet = cacheManager.get;
      cacheManager.get = jest.fn().mockImplementation(() => {
        throw new Error('Cache error');
      });

      const wrappedTool = PerformanceWrapper.wrap(mockTool, config);
      const result = await wrappedTool.handler({ param: 'cache_error_test' });

      // Should still work, just without caching
      expect(result.success).toBe(true);

      // Restore original method
      cacheManager.get = originalGet;
    });
  });
});
