/**
 * Resource management and graceful degradation for the MCP Color Server
 */

import { logger } from './logger';
import { performanceMonitor } from './performance-monitor';
import { cacheManager } from './cache-manager';

export interface ResourceLimits {
  maxMemoryUsage: number; // bytes
  maxConcurrentRequests: number;
  maxRequestDuration: number; // milliseconds
  maxCacheSize: number; // bytes
}

export interface ResourceUsage {
  memoryUsage: number;
  concurrentRequests: number;
  cacheSize: number;
  cpuUsage?: number;
}

export interface DegradationStrategy {
  level: 'none' | 'light' | 'moderate' | 'aggressive';
  actions: string[];
}

export class ResourceManager {
  private static instance: ResourceManager;
  private requestQueue: Array<{ resolve: Function; reject: Function }> = [];
  private processingQueue = false;
  private resourceMonitoringInterval: ReturnType<typeof setInterval> | null =
    null;

  private readonly limits: ResourceLimits = {
    maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
    maxConcurrentRequests: 50,
    maxRequestDuration: 30000, // 30 seconds
    maxCacheSize: 512 * 1024 * 1024, // 512MB
  };

  private constructor() {
    // Only start resource monitoring in non-test environments
    const isTestEnvironment =
      process.env['NODE_ENV'] === 'test' ||
      process.env['JEST_WORKER_ID'] !== undefined ||
      process.env['CI'] === 'true' ||
      typeof jest !== 'undefined' ||
      (typeof global !== 'undefined' && 'jest' in global);

    if (!isTestEnvironment) {
      this.startResourceMonitoring();
    }
  }

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  private startResourceMonitoring(): void {
    this.resourceMonitoringInterval = setInterval(() => {
      this.checkResourceUsage();
    }, 10000); // Check every 10 seconds
  }

  private checkResourceUsage(): void {
    const usage = this.getCurrentUsage();
    const degradationStrategy = this.getDegradationStrategy(usage);

    if (degradationStrategy.level !== 'none') {
      logger.warn(`Resource pressure detected: ${degradationStrategy.level}`, {
        memoryUsage: Math.round(usage.memoryUsage / 1024 / 1024),
        concurrentRequests: usage.concurrentRequests,
        cacheSize: Math.round(usage.cacheSize / 1024 / 1024),
      });

      this.applyDegradationStrategy(degradationStrategy);
    }
  }

  public getCurrentUsage(): ResourceUsage {
    const memUsage = process.memoryUsage();
    const stats = performanceMonitor.getStats();

    return {
      memoryUsage: memUsage.heapUsed,
      concurrentRequests: stats.concurrentRequests,
      cacheSize: cacheManager.getTotalSize(),
    };
  }

  public getDegradationStrategy(usage: ResourceUsage): DegradationStrategy {
    const memoryPressure = usage.memoryUsage / this.limits.maxMemoryUsage;
    const concurrentPressure =
      usage.concurrentRequests / this.limits.maxConcurrentRequests;
    const cachePressure = usage.cacheSize / this.limits.maxCacheSize;

    const maxPressure = Math.max(
      memoryPressure,
      concurrentPressure,
      cachePressure
    );

    if (maxPressure >= 0.9) {
      return {
        level: 'aggressive',
        actions: [
          'reject_new_requests',
          'clear_all_caches',
          'force_garbage_collection',
          'reduce_quality_settings',
          'disable_non_essential_features',
        ],
      };
    } else if (maxPressure >= 0.75) {
      return {
        level: 'moderate',
        actions: [
          'queue_requests',
          'clear_old_cache_entries',
          'reduce_cache_sizes',
          'lower_quality_settings',
          'disable_expensive_operations',
        ],
      };
    } else if (maxPressure >= 0.6) {
      return {
        level: 'light',
        actions: [
          'throttle_requests',
          'cleanup_expired_cache',
          'suggest_garbage_collection',
        ],
      };
    }

    return {
      level: 'none',
      actions: [],
    };
  }

  private applyDegradationStrategy(strategy: DegradationStrategy): void {
    logger.info(`Applying degradation strategy: ${strategy.level}`, {
      actions: strategy.actions,
    });

    for (const action of strategy.actions) {
      switch (action) {
        case 'reject_new_requests':
          // This would be handled in the request processing logic
          break;

        case 'queue_requests':
          // Requests are queued automatically when limits are reached
          break;

        case 'throttle_requests':
          // Implemented in shouldAllowRequest method
          break;

        case 'clear_all_caches':
          cacheManager.clear();
          logger.info('Cleared all caches due to resource pressure');
          break;

        case 'clear_old_cache_entries':
          // Cache cleanup is handled automatically by LRU eviction
          break;

        case 'reduce_cache_sizes':
          // This would require reconfiguring cache limits
          break;

        case 'force_garbage_collection':
          if (global.gc) {
            global.gc();
            logger.info('Forced garbage collection');
          }
          break;

        case 'suggest_garbage_collection':
          if (global.gc) {
            global.gc();
          }
          break;

        case 'reduce_quality_settings':
        case 'lower_quality_settings':
          // This would be handled by individual tools
          break;

        case 'disable_non_essential_features':
        case 'disable_expensive_operations':
          // This would be handled by individual tools
          break;

        default:
          logger.warn(`Unknown degradation action: ${action}`);
      }
    }
  }

  public async shouldAllowRequest(operation: string): Promise<boolean> {
    const usage = this.getCurrentUsage();
    const strategy = this.getDegradationStrategy(usage);

    // Reject requests under aggressive degradation
    if (strategy.level === 'aggressive') {
      logger.warn(
        `Rejecting request for ${operation} due to resource pressure`
      );
      return false;
    }

    // Queue requests under moderate degradation
    if (strategy.level === 'moderate') {
      return this.queueRequest();
    }

    // Throttle requests under light degradation
    if (strategy.level === 'light') {
      // Add small delay to throttle requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
  }

  private async queueRequest(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Set up timeout that can be cleared
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout in queue'));
      }, 30000);

      // Wrap resolve and reject to clear timeout
      const wrappedResolve = (value: boolean) => {
        clearTimeout(timeoutId);
        resolve(value);
      };

      const wrappedReject = (error: Error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      this.requestQueue.push({
        resolve: wrappedResolve,
        reject: wrappedReject,
      });

      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue) return;

    this.processingQueue = true;

    while (this.requestQueue.length > 0) {
      const usage = this.getCurrentUsage();
      const strategy = this.getDegradationStrategy(usage);

      // Stop processing if we're still under pressure
      if (strategy.level === 'aggressive' || strategy.level === 'moderate') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Process next request
      const request = this.requestQueue.shift();
      if (request) {
        request.resolve(true);
      }

      // Small delay between processing requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.processingQueue = false;
  }

  public getQualitySettings(_operation: string): Record<string, unknown> {
    const usage = this.getCurrentUsage();
    const strategy = this.getDegradationStrategy(usage);

    // Return degraded quality settings based on resource pressure
    switch (strategy.level) {
      case 'aggressive':
        return {
          imageQuality: 'low',
          resolution: 72,
          maxColors: 5,
          disableAnimations: true,
          disableInteractivity: true,
        };

      case 'moderate':
        return {
          imageQuality: 'medium',
          resolution: 150,
          maxColors: 10,
          disableAnimations: true,
          disableInteractivity: false,
        };

      case 'light':
        return {
          imageQuality: 'medium',
          resolution: 150,
          maxColors: 20,
          disableAnimations: false,
          disableInteractivity: false,
        };

      default:
        return {
          imageQuality: 'high',
          resolution: 300,
          maxColors: 50,
          disableAnimations: false,
          disableInteractivity: false,
        };
    }
  }

  public isOperationAllowed(operation: string): boolean {
    const usage = this.getCurrentUsage();
    const strategy = this.getDegradationStrategy(usage);

    // Disable expensive operations under high resource pressure
    const expensiveOperations = [
      'create_palette_png',
      'create_gradient_png',
      'create_color_comparison_png',
      'extract_palette_from_image',
    ];

    if (
      strategy.level === 'aggressive' &&
      expensiveOperations.includes(operation)
    ) {
      return false;
    }

    return true;
  }

  public getResourceStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    usage: ResourceUsage;
    strategy: DegradationStrategy;
  } {
    const usage = this.getCurrentUsage();
    const strategy = this.getDegradationStrategy(usage);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (strategy.level === 'light' || strategy.level === 'moderate') {
      status = 'warning';
    } else if (strategy.level === 'aggressive') {
      status = 'critical';
    }

    return {
      status,
      usage,
      strategy,
    };
  }

  public async cleanup(): Promise<void> {
    logger.info('Performing resource cleanup');

    // Clear expired cache entries
    // This is handled automatically by the cache manager

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clear request queue if it's too large
    if (this.requestQueue.length > 100) {
      const rejected = this.requestQueue.splice(50); // Keep only first 50
      rejected.forEach(req => {
        req.reject(new Error('Request queue overflow'));
      });
      logger.warn(
        `Rejected ${rejected.length} queued requests due to overflow`
      );
    }
  }

  public destroy(): void {
    if (this.resourceMonitoringInterval) {
      clearInterval(this.resourceMonitoringInterval);
      this.resourceMonitoringInterval = null;
    }

    // Reject any pending requests
    this.requestQueue.forEach(req => {
      req.reject(new Error('ResourceManager destroyed'));
    });
    this.requestQueue = [];

    // @ts-ignore - We need to reset the instance for testing
    ResourceManager.instance = undefined;
  }
}

// Export singleton instance
export const resourceManager = ResourceManager.getInstance();
