/**
 * Performance wrapper for MCP Color Server tools
 * Integrates caching, monitoring, and resource management
 */

import { ToolHandler, ToolResponse, ErrorResponse } from '../types/index';
import { logger } from './logger';
import { performanceMonitor } from './performance-monitor';
import { cacheManager } from './cache-manager';
import { resourceManager } from './resource-manager';

export interface PerformanceConfig {
  enableCaching: boolean;
  cacheType: string;
  cacheTTL?: number;
  enableResourceChecks: boolean;
  enableMonitoring: boolean;
  timeoutMs?: number;
}

export class PerformanceWrapper {
  public static wrap(
    tool: ToolHandler,
    config: PerformanceConfig
  ): ToolHandler {
    return {
      ...tool,
      handler: async (
        params: unknown
      ): Promise<ToolResponse | ErrorResponse> => {
        const operationId = performanceMonitor.startOperation(tool.name);
        let cacheHit = false;

        try {
          // Check resource availability
          if (config.enableResourceChecks) {
            const allowed = await resourceManager.shouldAllowRequest(tool.name);
            if (!allowed) {
              return {
                success: false,
                error: {
                  code: 'RESOURCE_LIMIT_EXCEEDED',
                  message: 'Server is under high load, please try again later',
                  suggestions: [
                    'Wait a few moments and retry',
                    'Reduce the complexity of your request',
                    'Try a simpler operation first',
                  ],
                },
                metadata: {
                  execution_time:
                    Date.now() - parseInt(operationId.split('_')[1] || '0'),
                  tool: tool.name,
                  timestamp: new Date().toISOString(),
                  accessibility_notes: [],
                  recommendations: [
                    'Consider reducing request complexity during high load',
                  ],
                },
              };
            }

            // Check if operation is allowed under current resource constraints
            if (!resourceManager.isOperationAllowed(tool.name)) {
              return {
                success: false,
                error: {
                  code: 'OPERATION_DISABLED',
                  message:
                    'This operation is temporarily disabled due to resource constraints',
                  suggestions: [
                    'Try a less resource-intensive operation',
                    'Wait for server load to decrease',
                    'Use cached results if available',
                  ],
                },
                metadata: {
                  execution_time:
                    Date.now() - parseInt(operationId.split('_')[1] || '0'),
                  tool: tool.name,
                  timestamp: new Date().toISOString(),
                  accessibility_notes: [],
                  recommendations: [
                    'Consider using alternative operations during high load',
                  ],
                },
              };
            }
          }

          // Check cache first
          let result: ToolResponse | ErrorResponse | null = null;
          let cacheKey = '';

          if (config.enableCaching) {
            cacheKey = cacheManager.generateCacheKey(tool.name, params);
            result = cacheManager.get<ToolResponse | ErrorResponse>(
              config.cacheType,
              cacheKey
            );

            if (result) {
              cacheHit = true;
              logger.debug(`Cache hit for ${tool.name}`, { tool: tool.name });

              // Update metadata with current execution info
              if (result.success) {
                (result as ToolResponse).metadata = {
                  ...result.metadata,
                  execution_time:
                    Date.now() - parseInt(operationId.split('_')[1] || '0'),
                  timestamp: new Date().toISOString(),
                };
              }

              performanceMonitor.endOperation(
                operationId,
                tool.name,
                true,
                true
              );
              return result;
            }
          }

          // Apply quality settings based on resource pressure
          let adjustedParams = params;
          if (config.enableResourceChecks) {
            const qualitySettings = resourceManager.getQualitySettings(
              tool.name
            );
            adjustedParams = this.applyQualitySettings(
              params as Record<string, unknown>,
              qualitySettings
            );
          }

          // Execute the tool with timeout
          const timeoutMs = config.timeoutMs || 30000;
          let timeoutId: ReturnType<typeof setTimeout> | undefined;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error(`Operation timeout after ${timeoutMs}ms`));
            }, timeoutMs);
          });

          try {
            result = await Promise.race([
              tool.handler(adjustedParams),
              timeoutPromise,
            ]);
          } finally {
            // Clear the timeout to prevent hanging handles
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }

          // Cache successful results
          if (config.enableCaching && result.success) {
            cacheManager.set(config.cacheType, cacheKey, result);
          }

          performanceMonitor.endOperation(
            operationId,
            tool.name,
            result.success,
            false
          );
          return result;
        } catch (error) {
          performanceMonitor.endOperation(
            operationId,
            tool.name,
            false,
            cacheHit
          );

          logger.error(`Tool execution failed: ${tool.name}`, {
            tool: tool.name,
            error: error as Error,
          });

          // Check if it's a timeout error
          const isTimeout =
            error instanceof Error && error.message.includes('timeout');

          return {
            success: false,
            error: {
              code: isTimeout ? 'TIMEOUT' : 'EXECUTION_ERROR',
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
              details:
                process.env['NODE_ENV'] === 'development'
                  ? (error as Error).stack
                  : undefined,
              suggestions: [
                'Check your input parameters',
                'Try again with simpler parameters',
                'Contact support if the problem persists',
              ],
            },
            metadata: {
              execution_time:
                Date.now() - parseInt(operationId.split('_')[1] || '0'),
              tool: tool.name,
              timestamp: new Date().toISOString(),
              accessibility_notes: [],
              recommendations: [],
            },
          };
        }
      },
    };
  }

  private static applyQualitySettings(
    params: Record<string, unknown>,
    qualitySettings: Record<string, unknown>
  ): Record<string, unknown> {
    if (!params || typeof params !== 'object') {
      return params;
    }

    const adjustedParams = { ...params };

    // Apply quality degradation based on resource pressure
    if (qualitySettings['imageQuality']) {
      if (
        adjustedParams['quality'] &&
        qualitySettings['imageQuality'] === 'low'
      ) {
        adjustedParams['quality'] = 'draft';
      } else if (
        adjustedParams['quality'] &&
        qualitySettings['imageQuality'] === 'medium'
      ) {
        adjustedParams['quality'] = 'standard';
      }
    }

    if (qualitySettings['resolution']) {
      if (
        adjustedParams['resolution'] &&
        (adjustedParams['resolution'] as number) >
          (qualitySettings['resolution'] as number)
      ) {
        adjustedParams['resolution'] = qualitySettings['resolution'];
      }
    }

    if (qualitySettings['maxColors']) {
      if (
        adjustedParams['count'] &&
        (adjustedParams['count'] as number) >
          (qualitySettings['maxColors'] as number)
      ) {
        adjustedParams['count'] = qualitySettings['maxColors'];
      }
      if (
        adjustedParams['color_count'] &&
        (adjustedParams['color_count'] as number) >
          (qualitySettings['maxColors'] as number)
      ) {
        adjustedParams['color_count'] = qualitySettings['maxColors'];
      }
    }

    if (qualitySettings['disableAnimations']) {
      if (adjustedParams['animation'] !== undefined) {
        adjustedParams['animation'] = false;
      }
    }

    if (qualitySettings['disableInteractivity']) {
      if (adjustedParams['interactive'] !== undefined) {
        adjustedParams['interactive'] = false;
      }
    }

    return adjustedParams;
  }

  public static createConfig(
    toolName: string,
    overrides: Partial<PerformanceConfig> = {}
  ): PerformanceConfig {
    // Default configurations based on tool type
    const defaultConfigs: Record<string, Partial<PerformanceConfig>> = {
      // Color conversion tools - fast operations, cache heavily
      convert_color: {
        enableCaching: true,
        cacheType: 'color_conversion',
        enableResourceChecks: false,
        timeoutMs: 5000,
      },
      analyze_color: {
        enableCaching: true,
        cacheType: 'analysis',
        enableResourceChecks: false,
        timeoutMs: 10000,
      },

      // Palette generation - moderate caching
      generate_harmony_palette: {
        enableCaching: true,
        cacheType: 'palette_generation',
        enableResourceChecks: true,
        timeoutMs: 15000,
      },
      generate_contextual_palette: {
        enableCaching: true,
        cacheType: 'palette_generation',
        enableResourceChecks: true,
        timeoutMs: 20000,
      },

      // Visualization tools - heavy caching, resource checks
      create_palette_html: {
        enableCaching: true,
        cacheType: 'visualization',
        enableResourceChecks: true,
        timeoutMs: 30000,
      },
      create_palette_png: {
        enableCaching: true,
        cacheType: 'visualization',
        enableResourceChecks: true,
        timeoutMs: 30000,
      },
      create_color_wheel_html: {
        enableCaching: true,
        cacheType: 'visualization',
        enableResourceChecks: true,
        timeoutMs: 25000,
      },

      // Default configuration
      default: {
        enableCaching: true,
        cacheType: 'default',
        enableResourceChecks: true,
        enableMonitoring: true,
        timeoutMs: 20000,
      },
    };

    const baseConfig = defaultConfigs[toolName] || defaultConfigs['default'];

    return {
      enableCaching: true,
      cacheType: 'default',
      enableResourceChecks: true,
      enableMonitoring: true,
      timeoutMs: 20000,
      ...baseConfig,
      ...overrides,
    };
  }
}

// Utility function to wrap multiple tools at once
export function wrapToolsWithPerformance(
  tools: ToolHandler[],
  configOverrides: Record<string, Partial<PerformanceConfig>> = {}
): ToolHandler[] {
  return tools.map(tool => {
    const config = PerformanceWrapper.createConfig(
      tool.name,
      configOverrides[tool.name] || {}
    );

    return PerformanceWrapper.wrap(tool, config);
  });
}

// Export performance monitoring utilities for tools
export { performanceMonitor, cacheManager, resourceManager };
