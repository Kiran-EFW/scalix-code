/**
 * Performance Profiler
 *
 * Profile agent execution, tool dispatch, and system operations.
 * Captures timing data, memory usage, and bottleneck analysis.
 */

export interface ProfileEntry {
  name: string;
  category: 'agent' | 'tool' | 'llm' | 'io' | 'cache' | 'system';
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  metadata?: Record<string, unknown>;
}

export interface ProfileSummary {
  totalDuration: number;
  entryCount: number;
  byCategory: Record<string, CategorySummary>;
  bottlenecks: BottleneckEntry[];
  memoryPeak: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface CategorySummary {
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  percentage: number;
}

export interface BottleneckEntry {
  name: string;
  category: string;
  duration: number;
  percentage: number;
}

/**
 * Performance profiler for tracking execution timing
 */
export class Profiler {
  private entries: ProfileEntry[] = [];
  private activeTimers = new Map<string, { startTime: number; memoryBefore: number; category: ProfileEntry['category']; metadata?: Record<string, unknown> }>();
  private enabled = true;
  private maxEntries = 10000;

  /**
   * Enable or disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Start a profiling timer
   */
  startTimer(name: string, category: ProfileEntry['category'], metadata?: Record<string, unknown>): string {
    if (!this.enabled) return name;

    const memoryBefore = this.getMemoryUsage();
    this.activeTimers.set(name, {
      startTime: performance.now(),
      memoryBefore,
      category,
      metadata,
    });

    return name;
  }

  /**
   * End a profiling timer and record the entry
   */
  endTimer(name: string): ProfileEntry | null {
    if (!this.enabled) return null;

    const timer = this.activeTimers.get(name);
    if (!timer) return null;

    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsage();

    const entry: ProfileEntry = {
      name,
      category: timer.category,
      startTime: timer.startTime,
      endTime,
      duration: endTime - timer.startTime,
      memoryBefore: timer.memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - timer.memoryBefore,
      metadata: timer.metadata,
    };

    this.entries.push(entry);
    this.activeTimers.delete(name);

    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    return entry;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    name: string,
    category: ProfileEntry['category'],
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startTimer(name, category, metadata);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  /**
   * Measure a sync operation
   */
  measureSync<T>(
    name: string,
    category: ProfileEntry['category'],
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.startTimer(name, category, metadata);
    try {
      const result = fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  /**
   * Get all profile entries
   */
  getEntries(): ProfileEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries by category
   */
  getEntriesByCategory(category: ProfileEntry['category']): ProfileEntry[] {
    return this.entries.filter((e) => e.category === category);
  }

  /**
   * Generate a profile summary
   */
  getSummary(): ProfileSummary {
    if (this.entries.length === 0) {
      return {
        totalDuration: 0,
        entryCount: 0,
        byCategory: {},
        bottlenecks: [],
        memoryPeak: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const totalDuration = this.entries.reduce((sum, e) => sum + e.duration, 0);
    const sorted = [...this.entries].sort((a, b) => a.duration - b.duration);
    const durations = sorted.map((e) => e.duration);

    // Category summaries
    const byCategory: Record<string, CategorySummary> = {};
    const categories = new Set(this.entries.map((e) => e.category));

    for (const category of categories) {
      const catEntries = this.entries.filter((e) => e.category === category);
      const catDurations = catEntries.map((e) => e.duration);
      const catTotal = catDurations.reduce((a, b) => a + b, 0);

      byCategory[category] = {
        count: catEntries.length,
        totalDuration: catTotal,
        avgDuration: catTotal / catEntries.length,
        minDuration: Math.min(...catDurations),
        maxDuration: Math.max(...catDurations),
        percentage: (catTotal / totalDuration) * 100,
      };
    }

    // Top bottlenecks (slowest 10 entries)
    const bottlenecks = [...this.entries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map((e) => ({
        name: e.name,
        category: e.category,
        duration: e.duration,
        percentage: (e.duration / totalDuration) * 100,
      }));

    // Memory peak
    const memoryPeak = Math.max(...this.entries.map((e) => e.memoryAfter));

    return {
      totalDuration,
      entryCount: this.entries.length,
      byCategory,
      bottlenecks,
      memoryPeak,
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.activeTimers.clear();
  }

  /**
   * Get current memory usage in bytes
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

/**
 * Global profiler instance
 */
export const globalProfiler = new Profiler();
