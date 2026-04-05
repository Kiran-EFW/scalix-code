/**
 * LRU Cache with TTL
 *
 * Used for caching AST parse results, dependency analysis,
 * and other expensive computations.
 */

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
  entries: number;
}

export interface CacheOptions {
  maxSize: number;
  ttlMs: number;
  onEvict?: (key: string, value: unknown) => void;
}

/**
 * LRU cache with TTL support
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private stats = { hits: 0, misses: 0, evictions: 0 };
  private maxSize: number;
  private ttlMs: number;
  private onEvict?: (key: string, value: unknown) => void;

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize;
    this.ttlMs = options.ttlMs;
    this.onEvict = options.onEvict;
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update access tracking
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;
    this.moveToFront(key);
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, size = 1): void {
    // If key exists, update it
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.lastAccessedAt = Date.now();
      entry.size = size;
      this.moveToFront(key);
      return;
    }

    // Evict if at capacity
    while (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      size,
    };

    this.cache.set(key, entry);
    this.accessOrder.unshift(key);
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.onEvict?.(key, entry.value);
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    return true;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      entries: this.cache.size,
    };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return [...this.cache.keys()];
  }

  /**
   * Get current size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.createdAt > this.ttlMs) {
        this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet(key: string, factory: () => Promise<T>, size = 1): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    this.set(key, value, size);
    return value;
  }

  /**
   * Get or set synchronously
   */
  getOrSetSync(key: string, factory: () => T, size = 1): T {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = factory();
    this.set(key, value, size);
    return value;
  }

  /**
   * Move a key to the front of the access order
   */
  private moveToFront(key: string): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.unshift(key);
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    const lruKey = this.accessOrder.pop();
    if (lruKey) {
      const entry = this.cache.get(lruKey);
      if (entry) {
        this.onEvict?.(lruKey, entry.value);
      }
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }
}

/**
 * Create a cache for AST parse results
 */
export function createASTCache(): LRUCache<unknown> {
  return new LRUCache<unknown>({
    maxSize: 500,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a cache for dependency analysis results
 */
export function createDependencyCache(): LRUCache<unknown> {
  return new LRUCache<unknown>({
    maxSize: 100,
    ttlMs: 10 * 60 * 1000, // 10 minutes
  });
}
