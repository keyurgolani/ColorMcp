/**
 * Multi-level caching system for the MCP Color Server
 * Implements memory cache with LRU eviction and intelligent cache key generation
 */

import { logger } from './logger';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Map<string, number>(); // key -> access order
  private currentAccessOrder = 0;
  private totalSize = 0;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(private config: CacheConfig) {
    // Only start periodic cleanup in non-test environments
    const isTestEnvironment =
      process.env['NODE_ENV'] === 'test' ||
      process.env['JEST_WORKER_ID'] !== undefined ||
      process.env['CI'] === 'true' ||
      typeof jest !== 'undefined' ||
      (typeof global !== 'undefined' && 'jest' in global);

    if (!isTestEnvironment) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, config.cleanupInterval);
    }
  }

  private estimateSize(value: T): number {
    try {
      // Rough estimation of object size in bytes
      const jsonString = JSON.stringify(value);
      return jsonString.length * 2; // UTF-16 encoding
    } catch {
      // Fallback for non-serializable objects
      return 1024; // 1KB default
    }
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find the least recently used entry
    let lruKey = '';
    let lruAccessOrder = Infinity;

    for (const [key, accessOrder] of this.accessOrder) {
      if (accessOrder < lruAccessOrder) {
        lruAccessOrder = accessOrder;
        lruKey = key;
      }
    }

    if (lruKey) {
      const entry = this.cache.get(lruKey);
      if (entry) {
        this.totalSize -= entry.size;
        this.stats.evictions++;
      }
      this.cache.delete(lruKey);
      this.accessOrder.delete(lruKey);

      logger.debug(`Evicted LRU cache entry: ${lruKey}`);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.ttl) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        this.totalSize -= entry.size;
      }
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    if (expiredKeys.length > 0) {
      logger.debug(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }

    // Evict entries if we're over limits
    while (
      this.cache.size > this.config.maxEntries ||
      this.totalSize > this.config.maxSize
    ) {
      this.evictLRU();
    }
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.totalSize -= entry.size;
      this.stats.misses++;
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.accessOrder.set(key, this.currentAccessOrder++);

    this.stats.hits++;
    return entry.value;
  }

  public set(key: string, value: T): void {
    const size = this.estimateSize(value);

    // Check if we need to make room
    while (
      this.cache.size >= this.config.maxEntries ||
      this.totalSize + size > this.config.maxSize
    ) {
      this.evictLRU();
    }

    // Remove existing entry if it exists
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.totalSize -= existingEntry.size;
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, this.currentAccessOrder++);
    this.totalSize += size;
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.totalSize -= entry.size;
      return false;
    }

    return true;
  }

  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      this.accessOrder.delete(key);
      return this.cache.delete(key);
    }
    return false;
  }

  public clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.totalSize = 0;
    this.currentAccessOrder = 0;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  public getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      totalSize: this.totalSize,
      entryCount: this.cache.size,
      evictions: this.stats.evictions,
    };
  }

  public getSize(): number {
    return this.totalSize;
  }

  public getEntryCount(): number {
    return this.cache.size;
  }
}

export class CacheManager {
  private static instance: CacheManager;
  private caches = new Map<string, LRUCache<unknown>>();

  // Default cache configurations for different operation types
  private readonly cacheConfigs = {
    color_conversion: {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 10000,
      ttl: 60 * 60 * 1000, // 1 hour
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
    },
    palette_generation: {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxEntries: 1000,
      ttl: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
    },
    visualization: {
      maxSize: 200 * 1024 * 1024, // 200MB
      maxEntries: 500,
      ttl: 15 * 60 * 1000, // 15 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
    },
    analysis: {
      maxSize: 25 * 1024 * 1024, // 25MB
      maxEntries: 5000,
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      cleanupInterval: 10 * 60 * 1000, // 10 minutes
    },
    default: {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      ttl: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
    },
  };

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private getCache<T>(cacheType: string): LRUCache<T> {
    if (!this.caches.has(cacheType)) {
      const config =
        this.cacheConfigs[cacheType as keyof typeof this.cacheConfigs] ||
        this.cacheConfigs.default;

      this.caches.set(cacheType, new LRUCache<T>(config));
      logger.debug(`Created cache for type: ${cacheType}`);
    }

    return this.caches.get(cacheType)! as LRUCache<T>;
  }

  public generateCacheKey(operation: string, params: unknown): string {
    try {
      // Create a deterministic cache key from operation and parameters
      const sortedParams = this.sortObjectKeys(params);
      const paramString = JSON.stringify(sortedParams);

      // Use a simple hash function for shorter keys
      const hash = this.simpleHash(paramString);
      return `${operation}:${hash}`;
    } catch (error) {
      // Fallback to timestamp-based key if serialization fails
      logger.warn('Failed to generate cache key, using fallback', {
        error: error as Error,
      });
      return `${operation}:${Date.now()}:${Math.random()}`;
    }
  }

  private sortObjectKeys(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sorted: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .forEach(key => {
        sorted[key] = this.sortObjectKeys(
          (obj as Record<string, unknown>)[key]
        );
      });

    return sorted;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  public get<T>(cacheType: string, key: string): T | null {
    const cache = this.getCache<T>(cacheType);
    const result = cache.get(key);

    if (result !== null) {
      logger.debug(`Cache hit for ${cacheType}:${key}`);
    }

    return result;
  }

  public set<T>(cacheType: string, key: string, value: T): void {
    const cache = this.getCache<T>(cacheType);
    cache.set(key, value);
    logger.debug(`Cached result for ${cacheType}:${key}`);
  }

  public has(cacheType: string, key: string): boolean {
    const cache = this.getCache(cacheType);
    return cache.has(key);
  }

  public delete(cacheType: string, key: string): boolean {
    const cache = this.getCache(cacheType);
    return cache.delete(key);
  }

  public clear(cacheType?: string): void {
    if (cacheType) {
      const cache = this.caches.get(cacheType);
      if (cache) {
        cache.clear();
        logger.info(`Cleared cache for type: ${cacheType}`);
      }
    } else {
      for (const cache of this.caches.values()) {
        cache.clear();
      }
      logger.info('Cleared all caches');
    }
  }

  public getStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};

    for (const [cacheType, cache] of this.caches) {
      stats[cacheType] = cache.getStats();
    }

    return stats;
  }

  public getTotalSize(): number {
    let totalSize = 0;
    for (const cache of this.caches.values()) {
      totalSize += cache.getSize();
    }
    return totalSize;
  }

  public getTotalEntries(): number {
    let totalEntries = 0;
    for (const cache of this.caches.values()) {
      totalEntries += cache.getEntryCount();
    }
    return totalEntries;
  }

  // Intelligent cache warming for frequently used operations
  public async warmCache(
    operation: string,
    commonParams: unknown[]
  ): Promise<void> {
    logger.info(`Warming cache for operation: ${operation}`);

    // This would be implemented by specific tools to pre-populate cache
    // with commonly requested color conversions, palettes, etc.
    for (const params of commonParams) {
      const key = this.generateCacheKey(operation, params);
      // Tools would call this to pre-populate their caches
      logger.debug(`Generated cache key for warming: ${key}`);
    }
  }

  public destroy(): void {
    // Destroy all individual caches
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    this.caches.clear();
    // @ts-ignore - We need to reset the instance for testing
    CacheManager.instance = undefined;
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
