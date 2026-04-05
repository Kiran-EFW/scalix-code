/**
 * Performance Module
 *
 * Profiling, caching, and parallel processing utilities
 */

export { Profiler, globalProfiler } from './profiler';
export type { ProfileEntry, ProfileSummary, CategorySummary, BottleneckEntry } from './profiler';

export { LRUCache, createASTCache, createDependencyCache } from './cache';
export type { CacheEntry, CacheStats, CacheOptions } from './cache';

export { parallelMap, parallelExecute, batchProcess, debounceAsync, throttleAsync } from './parallel';
export type { ParallelOptions, BatchResult } from './parallel';
