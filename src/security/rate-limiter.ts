/**
 * Rate limiting for expensive operations
 */

import { logger } from '../utils/logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (operation: string, clientId?: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  // Default rate limits for different operations
  private readonly defaultLimits: Record<string, RateLimitConfig> = {
    // Color conversion operations - high limit
    convert_color: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000,
    },
    analyze_color: {
      windowMs: 60 * 1000,
      maxRequests: 500,
    },

    // Palette generation - moderate limit
    generate_harmony_palette: {
      windowMs: 60 * 1000,
      maxRequests: 100,
    },
    generate_contextual_palette: {
      windowMs: 60 * 1000,
      maxRequests: 50,
    },
    generate_algorithmic_palette: {
      windowMs: 60 * 1000,
      maxRequests: 50,
    },

    // Image processing - low limit (expensive)
    extract_palette_from_image: {
      windowMs: 60 * 1000,
      maxRequests: 10,
    },

    // Visualization generation - moderate limit
    create_palette_html: {
      windowMs: 60 * 1000,
      maxRequests: 100,
    },
    create_color_wheel_html: {
      windowMs: 60 * 1000,
      maxRequests: 50,
    },
    create_gradient_html: {
      windowMs: 60 * 1000,
      maxRequests: 100,
    },
    create_theme_preview_html: {
      windowMs: 60 * 1000,
      maxRequests: 50,
    },

    // PNG generation - low limit (very expensive)
    create_palette_png: {
      windowMs: 60 * 1000,
      maxRequests: 20,
    },
    create_gradient_png: {
      windowMs: 60 * 1000,
      maxRequests: 15,
    },
    create_color_comparison_png: {
      windowMs: 60 * 1000,
      maxRequests: 10,
    },

    // Accessibility tools - moderate limit
    check_contrast: {
      windowMs: 60 * 1000,
      maxRequests: 200,
    },
    simulate_colorblindness: {
      windowMs: 60 * 1000,
      maxRequests: 100,
    },
    optimize_for_accessibility: {
      windowMs: 60 * 1000,
      maxRequests: 50,
    },

    // Utility operations - high limit
    mix_colors: {
      windowMs: 60 * 1000,
      maxRequests: 200,
    },
    generate_color_variations: {
      windowMs: 60 * 1000,
      maxRequests: 100,
    },
    sort_colors: {
      windowMs: 60 * 1000,
      maxRequests: 200,
    },
    analyze_color_collection: {
      windowMs: 60 * 1000,
      maxRequests: 100,
    },

    // Default limit for unknown operations
    default: {
      windowMs: 60 * 1000,
      maxRequests: 50,
    },
  };

  private constructor() {
    // Only start cleanup in non-test environments
    const isTestEnvironment =
      process.env['NODE_ENV'] === 'test' ||
      process.env['JEST_WORKER_ID'] !== undefined ||
      process.env['CI'] === 'true' ||
      typeof jest !== 'undefined' ||
      (typeof global !== 'undefined' && 'jest' in global);

    if (!isTestEnvironment) {
      this.cleanupInterval = setInterval(
        () => {
          this.cleanup();
        },
        5 * 60 * 1000
      );
    }
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public checkRateLimit(
    operation: string,
    clientId = 'default',
    customConfig?: Partial<RateLimitConfig>
  ): RateLimitResult {
    const config = {
      ...this.getConfigForOperation(operation),
      ...customConfig,
    };

    const key = config.keyGenerator
      ? config.keyGenerator(operation, clientId)
      : `${operation}:${clientId}`;

    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      // First request for this key
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      });

      logger.debug(`Rate limit initialized for ${operation}`, {
        tool: operation,
        remainingRequests: config.maxRequests - 1,
      });

      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    // Check if the window has expired
    if (now >= entry.resetTime) {
      // Reset the window
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      });

      logger.debug(`Rate limit window reset for ${operation}`, {
        tool: operation,
        remainingRequests: config.maxRequests - 1,
      });

      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    // Check if limit is exceeded
    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      logger.warn(`Rate limit exceeded for ${operation}`, {
        tool: operation,
        clientId,
        count: entry.count,
        limit: config.maxRequests,
        retryAfter,
      });

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    const remainingRequests = config.maxRequests - entry.count;

    logger.debug(`Rate limit check passed for ${operation}`, {
      tool: operation,
      count: entry.count,
      remainingRequests,
    });

    return {
      allowed: true,
      remainingRequests,
      resetTime: entry.resetTime,
    };
  }

  private getConfigForOperation(operation: string): RateLimitConfig {
    const config = this.defaultLimits[operation];
    if (config) {
      return config;
    }
    const defaultConfig = this.defaultLimits['default'];
    if (defaultConfig) {
      return defaultConfig;
    }
    // Fallback config if default is not found
    return {
      windowMs: 60 * 1000,
      maxRequests: 50,
    };
  }

  public updateLimits(
    operation: string,
    config: Partial<RateLimitConfig>
  ): void {
    this.defaultLimits[operation] = {
      ...this.getConfigForOperation(operation),
      ...config,
    };

    logger.info(`Updated rate limits for ${operation}`, {
      tool: operation,
      config,
    });
  }

  public getRemainingRequests(operation: string, clientId = 'default'): number {
    const config = this.getConfigForOperation(operation);
    const key = `${operation}:${clientId}`;
    const entry = this.store.get(key);

    if (!entry) {
      return config.maxRequests;
    }

    const now = Date.now();
    if (now >= entry.resetTime) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  public getResetTime(operation: string, clientId = 'default'): number | null {
    const key = `${operation}:${clientId}`;
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now >= entry.resetTime) {
      return null;
    }

    return entry.resetTime;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  public getStats(): {
    totalEntries: number;
    activeWindows: number;
    topOperations: Array<{ operation: string; requests: number }>;
  } {
    const now = Date.now();
    const operationCounts: Record<string, number> = {};
    let activeWindows = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now < entry.resetTime) {
        activeWindows++;
        const operation = key.split(':')[0];
        if (operation) {
          operationCounts[operation] =
            (operationCounts[operation] || 0) + entry.count;
        }
      }
    }

    const topOperations = Object.entries(operationCounts)
      .map(([operation, requests]) => ({ operation, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    return {
      totalEntries: this.store.size,
      activeWindows,
      topOperations,
    };
  }

  public reset(operation?: string, clientId?: string): void {
    if (operation && clientId) {
      const key = `${operation}:${clientId}`;
      this.store.delete(key);
      logger.info(`Reset rate limit for ${operation}:${clientId}`);
    } else if (operation) {
      // Reset all entries for this operation
      const keysToDelete = Array.from(this.store.keys()).filter(key =>
        key.startsWith(`${operation}:`)
      );
      keysToDelete.forEach(key => this.store.delete(key));
      logger.info(`Reset rate limits for operation ${operation}`);
    } else {
      // Reset all
      this.store.clear();
      logger.info('Reset all rate limits');
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
    // @ts-ignore - We need to reset the instance for testing
    RateLimiter.instance = undefined;
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();
