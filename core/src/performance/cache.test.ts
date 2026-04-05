/**
 * LRU Cache Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LRUCache, createASTCache, createDependencyCache } from './cache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>({
      maxSize: 3,
      ttlMs: 60000,
    });
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check key existence', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size).toBe(0);
    });

    it('should report correct size', () => {
      expect(cache.size).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
    });

    it('should return all keys', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      expect(cache.keys()).toContain('a');
      expect(cache.keys()).toContain('b');
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry at capacity', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      cache.set('d', '4'); // Should evict 'a'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe('2');
      expect(cache.get('d')).toBe('4');
    });

    it('should update access order on get', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      cache.get('a'); // Touch 'a', making 'b' the LRU
      cache.set('d', '4'); // Should evict 'b'

      expect(cache.get('a')).toBe('1');
      expect(cache.get('b')).toBeUndefined();
    });

    it('should update existing key without eviction', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      cache.set('a', 'updated'); // Update existing, no eviction

      expect(cache.size).toBe(3);
      expect(cache.get('a')).toBe('updated');
    });

    it('should call onEvict callback', () => {
      const onEvict = vi.fn();
      const evictCache = new LRUCache<string>({
        maxSize: 2,
        ttlMs: 60000,
        onEvict,
      });

      evictCache.set('a', '1');
      evictCache.set('b', '2');
      evictCache.set('c', '3'); // Evicts 'a'

      expect(onEvict).toHaveBeenCalledWith('a', '1');
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      const shortTtlCache = new LRUCache<string>({
        maxSize: 10,
        ttlMs: 50,
      });

      shortTtlCache.set('key', 'value');
      expect(shortTtlCache.get('key')).toBe('value');

      // Fast-forward time
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      expect(shortTtlCache.get('key')).toBeUndefined();

      vi.useRealTimers();
    });

    it('should not return expired entries with has()', () => {
      const shortTtlCache = new LRUCache<string>({
        maxSize: 10,
        ttlMs: 50,
      });

      shortTtlCache.set('key', 'value');
      expect(shortTtlCache.has('key')).toBe(true);

      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      expect(shortTtlCache.has('key')).toBe(false);

      vi.useRealTimers();
    });

    it('should prune expired entries', () => {
      const shortTtlCache = new LRUCache<string>({
        maxSize: 10,
        ttlMs: 50,
      });

      shortTtlCache.set('a', '1');
      shortTtlCache.set('b', '2');

      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      const pruned = shortTtlCache.prune();
      expect(pruned).toBe(2);
      expect(shortTtlCache.size).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it('should track evictions', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      cache.set('d', '4'); // 1 eviction

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });

    it('should report correct stats shape', () => {
      const stats = cache.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('entries');
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('key', 'cached');
      const factory = vi.fn(async () => 'new');

      const result = await cache.getOrSet('key', factory);

      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache if missing', async () => {
      const result = await cache.getOrSet('key', async () => 'computed');

      expect(result).toBe('computed');
      expect(cache.get('key')).toBe('computed');
    });

    it('should work synchronously', () => {
      const result = cache.getOrSetSync('key', () => 'sync-value');

      expect(result).toBe('sync-value');
      expect(cache.get('key')).toBe('sync-value');
    });
  });

  describe('factory functions', () => {
    it('should create AST cache with correct defaults', () => {
      const astCache = createASTCache();
      expect(astCache).toBeInstanceOf(LRUCache);
    });

    it('should create dependency cache with correct defaults', () => {
      const depCache = createDependencyCache();
      expect(depCache).toBeInstanceOf(LRUCache);
    });
  });
});
