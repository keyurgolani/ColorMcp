/**
 * Performance monitoring and metrics collection for the MCP Color Server
 */

import { logger } from './logger';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  memoryUsage: number;
  timestamp: Date;
  success: boolean;
  cacheHit?: boolean;
  concurrentRequests?: number;
}

export interface PerformanceThresholds {
  [operation: string]: {
    maxDuration: number;
    maxMemory: number;
  };
}

export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  memoryUsage: {
    current: number;
    peak: number;
    average: number;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  concurrentRequests: number;
  errorRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeRequests: Set<string> = new Set();
  private peakMemoryUsage = process.memoryUsage().heapUsed;
  private totalRequests = 0;
  private totalErrors = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private memoryMonitoringInterval: ReturnType<typeof setInterval> | null =
    null;

  // Performance thresholds based on requirements
  private readonly thresholds: PerformanceThresholds = {
    convert_color: { maxDuration: 100, maxMemory: 10 * 1024 * 1024 }, // 10MB
    analyze_color: { maxDuration: 300, maxMemory: 20 * 1024 * 1024 }, // 20MB
    generate_harmony_palette: { maxDuration: 500, maxMemory: 50 * 1024 * 1024 }, // 50MB
    generate_contextual_palette: {
      maxDuration: 1000,
      maxMemory: 75 * 1024 * 1024,
    }, // 75MB
    create_palette_html: { maxDuration: 2000, maxMemory: 100 * 1024 * 1024 }, // 100MB
    create_palette_png: { maxDuration: 2000, maxMemory: 100 * 1024 * 1024 }, // 100MB
    create_color_wheel_html: { maxDuration: 1500, maxMemory: 75 * 1024 * 1024 }, // 75MB
    create_gradient_html: { maxDuration: 1000, maxMemory: 50 * 1024 * 1024 }, // 50MB
    create_theme_preview_html: {
      maxDuration: 2000,
      maxMemory: 100 * 1024 * 1024,
    }, // 100MB
    default: { maxDuration: 1000, maxMemory: 50 * 1024 * 1024 }, // Default limits
  };

  private constructor() {
    // Only start memory monitoring in non-test environments
    // Check both NODE_ENV and Jest environment
    const isTestEnvironment =
      process.env['NODE_ENV'] === 'test' ||
      process.env['JEST_WORKER_ID'] !== undefined ||
      process.env['CI'] === 'true' ||
      typeof jest !== 'undefined' ||
      (typeof global !== 'undefined' && 'jest' in global);

    if (!isTestEnvironment) {
      this.startMemoryMonitoring();
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startMemoryMonitoring(): void {
    this.memoryMonitoringInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const currentMemory = memUsage.heapUsed;

      if (currentMemory > this.peakMemoryUsage) {
        this.peakMemoryUsage = currentMemory;
      }

      // Trigger garbage collection hint if memory usage is high
      if (currentMemory > 500 * 1024 * 1024) {
        // 500MB
        this.triggerGarbageCollection();
      }
    }, 5000); // Check every 5 seconds
  }

  private triggerGarbageCollection(): void {
    if (global.gc) {
      logger.debug('Triggering garbage collection due to high memory usage');
      global.gc();
    }
  }

  public startOperation(operation: string): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeRequests.add(operationId);
    this.totalRequests++;

    logger.debug(`Started operation: ${operation}`, {
      tool: operation,
      concurrentRequests: this.activeRequests.size,
    });

    return operationId;
  }

  public endOperation(
    operationId: string,
    operation: string,
    success: boolean,
    cacheHit = false
  ): void {
    this.activeRequests.delete(operationId);

    // Extract timestamp from operationId (format: operation_timestamp_randomId)
    const parts = operationId.split('_');
    const startTimeStr = parts[parts.length - 2]; // timestamp is second to last
    const startTime = startTimeStr ? parseInt(startTimeStr, 10) : Date.now();
    const duration = isNaN(startTime) ? 0 : Math.max(0, Date.now() - startTime);
    const memoryUsage = process.memoryUsage().heapUsed;

    // Update peak memory usage
    if (memoryUsage > this.peakMemoryUsage) {
      this.peakMemoryUsage = memoryUsage;
    }

    // Update cache statistics
    if (cacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    if (!success) {
      this.totalErrors++;
    }

    const metric: PerformanceMetric = {
      operation,
      duration,
      memoryUsage,
      timestamp: new Date(),
      success,
      cacheHit,
      concurrentRequests: this.activeRequests.size + 1, // +1 because we just removed this one
    };

    // Store metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(metric);

    // Keep only last 1000 metrics per operation to prevent memory leaks
    if (operationMetrics.length > 1000) {
      operationMetrics.splice(0, operationMetrics.length - 1000);
    }

    // Check thresholds and log warnings
    this.checkThresholds(operation, metric);

    logger.debug(`Completed operation: ${operation}`, {
      tool: operation,
      executionTime: duration,
    });
  }

  private checkThresholds(operation: string, metric: PerformanceMetric): void {
    const threshold = this.thresholds[operation] || this.thresholds['default'];

    if (threshold && metric.duration > threshold.maxDuration) {
      logger.warn(`Operation ${operation} exceeded duration threshold`, {
        tool: operation,
        executionTime: metric.duration,
      });
    }

    if (threshold && metric.memoryUsage > threshold.maxMemory) {
      logger.warn(`Operation ${operation} exceeded memory threshold`, {
        tool: operation,
      });
    }

    // Check concurrent request limits
    if (metric.concurrentRequests && metric.concurrentRequests > 50) {
      logger.warn(
        `High concurrent request count: ${metric.concurrentRequests}`,
        {
          tool: operation,
        }
      );
    }
  }

  public getStats(): PerformanceStats {
    const allMetrics = Array.from(this.metrics.values()).flat();
    const successfulMetrics = allMetrics.filter(m => m.success);

    const averageResponseTime =
      successfulMetrics.length > 0
        ? successfulMetrics.reduce((sum, m) => sum + m.duration, 0) /
          successfulMetrics.length
        : 0;

    const averageMemory =
      successfulMetrics.length > 0
        ? successfulMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) /
          successfulMetrics.length
        : 0;

    const currentMemory = process.memoryUsage().heapUsed;
    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const hitRate =
      totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;

    return {
      totalRequests: this.totalRequests,
      averageResponseTime,
      memoryUsage: {
        current: currentMemory,
        peak: this.peakMemoryUsage,
        average: averageMemory,
      },
      cacheStats: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate,
      },
      concurrentRequests: this.activeRequests.size,
      errorRate:
        this.totalRequests > 0 ? this.totalErrors / this.totalRequests : 0,
    };
  }

  public getOperationStats(operation: string): PerformanceMetric[] {
    return this.metrics.get(operation) || [];
  }

  public shouldThrottle(): boolean {
    // Throttle if we have too many concurrent requests
    return this.activeRequests.size >= 50;
  }

  public getMemoryPressure(): 'low' | 'medium' | 'high' {
    const currentMemory = process.memoryUsage().heapUsed;
    const maxMemory = 1024 * 1024 * 1024; // 1GB

    if (currentMemory > maxMemory * 0.8) {
      return 'high';
    } else if (currentMemory > maxMemory * 0.6) {
      return 'medium';
    }
    return 'low';
  }

  public reset(): void {
    this.metrics.clear();
    this.activeRequests.clear();
    this.peakMemoryUsage = process.memoryUsage().heapUsed;
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  public destroy(): void {
    if (this.memoryMonitoringInterval) {
      clearInterval(this.memoryMonitoringInterval);
      this.memoryMonitoringInterval = null;
    }
    this.reset();
    // @ts-ignore - We need to reset the instance for testing
    PerformanceMonitor.instance = undefined;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
