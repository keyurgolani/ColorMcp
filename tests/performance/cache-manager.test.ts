/**
 * Cache manager tests
 */

import { cacheManager, LRUCache } from '../../src/utils/cache-manager';
import { securityAuditor } from '../../src/security/security-audit';
import { rateLimiter } from '../../src/security/rate-limiter';
import { performanceMonitor } from '../../src/utils/performance-monitor';
import { resourceManager } from '../../src/utils/resource-manager';

describe('CacheManager', () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  afterEach(() => {
    cacheManager.clear();
  });

  afterAll(() => {
    // Clean up intervals and timers
    cacheManager.destroy();
    securityAuditor.destroy();
    rateLimiter.destroy();
    performanceMonitor.destroy();
    resourceManager.destroy();
  });

  describe('Cache Key Generation', () => {
    test('should generate consistent cache keys for same parameters', () => {
      const params1 = { color: '#FF0000', format: 'rgb' };
      const params2 = { format: 'rgb', color: '#FF0000' }; // Different order

      const key1 = cacheManager.generateCacheKey('convert_color', params1);
      const key2 = cacheManager.generateCacheKey('convert_color', params2);

      expect(key1).toBe(key2);
    });

    test('should generate different keys for different parameters', () => {
      const params1 = { color: '#FF0000', format: 'rgb' };
      const params2 = { color: '#00FF00', format: 'rgb' };

      const key1 = cacheManager.generateCacheKey('convert_color', params1);
      const key2 = cacheManager.generateCacheKey('convert_color', params2);

      expect(key1).not.toBe(key2);
    });

    test('should handle complex nested objects', () => {
      const params = {
        palette: ['#FF0000', '#00FF00', '#0000FF'],
        options: {
          layout: 'grid',
          size: { width: 400, height: 300 },
          interactive: true,
        },
      };

      const key = cacheManager.generateCacheKey('create_palette_html', params);
      expect(key).toMatch(/^create_palette_html:[a-z0-9]+$/);
    });
  });

  describe('Cache Operations', () => {
    test('should store and retrieve cached values', () => {
      const key = cacheManager.generateCacheKey('test_operation', {
        param: 'value',
      });
      const value = { result: 'test_result', success: true };

      cacheManager.set('test_cache', key, value);
      const retrieved = cacheManager.get('test_cache', key);

      expect(retrieved).toEqual(value);
    });

    test('should return null for non-existent keys', () => {
      const result = cacheManager.get('test_cache', 'non_existent_key');
      expect(result).toBeNull();
    });

    test('should check if key exists', () => {
      const key = cacheManager.generateCacheKey('test_operation', {
        param: 'value',
      });

      expect(cacheManager.has('test_cache', key)).toBe(false);

      cacheManager.set('test_cache', key, { data: 'test' });
      expect(cacheManager.has('test_cache', key)).toBe(true);
    });

    test('should delete cached values', () => {
      const key = cacheManager.generateCacheKey('test_operation', {
        param: 'value',
      });
      cacheManager.set('test_cache', key, { data: 'test' });

      expect(cacheManager.has('test_cache', key)).toBe(true);

      const deleted = cacheManager.delete('test_cache', key);
      expect(deleted).toBe(true);
      expect(cacheManager.has('test_cache', key)).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    test('should provide cache statistics', () => {
      const key1 = cacheManager.generateCacheKey('operation1', {
        param: 'value1',
      });
      const key2 = cacheManager.generateCacheKey('operation2', {
        param: 'value2',
      });

      cacheManager.set('test_cache', key1, { data: 'test1' });
      cacheManager.set('test_cache', key2, { data: 'test2' });

      const stats = cacheManager.getStats();
      expect(stats['test_cache']).toBeDefined();
      expect(stats['test_cache']?.entryCount).toBe(2);
      expect(stats['test_cache']?.totalSize).toBeGreaterThan(0);
    });

    test('should track total cache size and entries', () => {
      cacheManager.set('cache1', 'key1', { data: 'test1' });
      cacheManager.set('cache2', 'key2', { data: 'test2' });

      const totalSize = cacheManager.getTotalSize();
      const totalEntries = cacheManager.getTotalEntries();

      expect(totalSize).toBeGreaterThan(0);
      expect(totalEntries).toBe(2);
    });
  });

  describe('Cache Types', () => {
    test('should handle different cache types independently', () => {
      cacheManager.set('color_conversion', 'key1', { result: 'conversion' });
      cacheManager.set('palette_generation', 'key1', { result: 'palette' });

      const conversion = cacheManager.get('color_conversion', 'key1');
      const palette = cacheManager.get('palette_generation', 'key1');

      expect((conversion as any)?.result).toBe('conversion');
      expect((palette as any)?.result).toBe('palette');
    });

    test('should clear specific cache types', () => {
      cacheManager.set('cache1', 'key1', { data: 'test1' });
      cacheManager.set('cache2', 'key2', { data: 'test2' });

      cacheManager.clear('cache1');

      expect(cacheManager.has('cache1', 'key1')).toBe(false);
      expect(cacheManager.has('cache2', 'key2')).toBe(true);
    });
  });
});

describe('LRUCache', () => {
  let cache: LRUCache<any>;

  beforeEach(() => {
    cache = new LRUCache({
      maxSize: 1024, // 1KB
      maxEntries: 5,
      ttl: 1000, // 1 second
      cleanupInterval: 100, // 100ms
    });
  });

  describe('LRU Eviction', () => {
    test('should evict least recently used items when max entries exceeded', () => {
      // Fill cache to capacity
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, { data: `value${i}` });
      }

      // Access key0 to make it recently used
      cache.get('key0');

      // Add one more item, should evict key1 (least recently used)
      cache.set('key5', { data: 'value5' });

      expect(cache.has('key0')).toBe(true); // Recently accessed
      expect(cache.has('key1')).toBe(false); // Should be evicted
      expect(cache.has('key5')).toBe(true); // Newly added
    });

    test('should evict items when max size exceeded', () => {
      // Add large items that exceed size limit
      const largeData = 'x'.repeat(300); // 300 bytes each

      cache.set('key1', { data: largeData });
      cache.set('key2', { data: largeData });
      cache.set('key3', { data: largeData });
      cache.set('key4', { data: largeData }); // This should trigger eviction

      const stats = cache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(1024);
      expect(stats.evictions).toBeGreaterThan(0);
    });
  });

  describe('TTL Expiration', () => {
    test('should expire items after TTL', async () => {
      cache.set('test_key', { data: 'test_value' });
      expect(cache.has('test_key')).toBe(true);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cache.has('test_key')).toBe(false);
    });

    test('should return null for expired items', async () => {
      cache.set('test_key', { data: 'test_value' });

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = cache.get('test_key');
      expect(result).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    test('should track hits and misses', () => {
      cache.set('key1', { data: 'value1' });

      // Hit
      cache.get('key1');

      // Miss
      cache.get('non_existent_key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    test('should track cache size and entry count', () => {
      cache.set('key1', { data: 'value1' });
      cache.set('key2', { data: 'value2' });

      const stats = cache.getStats();
      expect(stats.entryCount).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });
});
