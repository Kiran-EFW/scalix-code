/**
 * Profiler Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Profiler, globalProfiler } from './profiler';

describe('Profiler', () => {
  let profiler: Profiler;

  beforeEach(() => {
    profiler = new Profiler();
  });

  describe('timer operations', () => {
    it('should start and end a timer', () => {
      profiler.startTimer('test-op', 'agent');
      const entry = profiler.endTimer('test-op');

      expect(entry).not.toBeNull();
      expect(entry!.name).toBe('test-op');
      expect(entry!.category).toBe('agent');
      expect(entry!.duration).toBeGreaterThanOrEqual(0);
    });

    it('should return null for non-existent timer', () => {
      const entry = profiler.endTimer('nonexistent');
      expect(entry).toBeNull();
    });

    it('should track memory usage', () => {
      profiler.startTimer('mem-test', 'system');
      const entry = profiler.endTimer('mem-test');

      expect(entry!.memoryBefore).toBeGreaterThanOrEqual(0);
      expect(entry!.memoryAfter).toBeGreaterThanOrEqual(0);
    });

    it('should store metadata', () => {
      profiler.startTimer('meta-test', 'tool', { toolName: 'ast-parser' });
      const entry = profiler.endTimer('meta-test');

      expect(entry!.metadata).toEqual({ toolName: 'ast-parser' });
    });

    it('should not record when disabled', () => {
      profiler.setEnabled(false);
      profiler.startTimer('disabled-test', 'agent');
      const entry = profiler.endTimer('disabled-test');

      expect(entry).toBeNull();
      expect(profiler.getEntries()).toHaveLength(0);
    });
  });

  describe('measure', () => {
    it('should measure async operations', async () => {
      const result = await profiler.measure('async-op', 'io', async () => {
        return 42;
      });

      expect(result).toBe(42);
      expect(profiler.getEntries()).toHaveLength(1);
      expect(profiler.getEntries()[0].name).toBe('async-op');
    });

    it('should measure sync operations', () => {
      const result = profiler.measureSync('sync-op', 'system', () => {
        return 'hello';
      });

      expect(result).toBe('hello');
      expect(profiler.getEntries()).toHaveLength(1);
    });

    it('should record entry even on error', async () => {
      await expect(
        profiler.measure('error-op', 'agent', async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');

      expect(profiler.getEntries()).toHaveLength(1);
    });

    it('should record sync entry even on error', () => {
      expect(() =>
        profiler.measureSync('sync-error', 'tool', () => {
          throw new Error('sync error');
        })
      ).toThrow('sync error');

      expect(profiler.getEntries()).toHaveLength(1);
    });
  });

  describe('getEntries', () => {
    it('should return all entries', () => {
      profiler.startTimer('op1', 'agent');
      profiler.endTimer('op1');
      profiler.startTimer('op2', 'tool');
      profiler.endTimer('op2');

      expect(profiler.getEntries()).toHaveLength(2);
    });

    it('should filter by category', () => {
      profiler.startTimer('agent-op', 'agent');
      profiler.endTimer('agent-op');
      profiler.startTimer('tool-op', 'tool');
      profiler.endTimer('tool-op');
      profiler.startTimer('agent-op2', 'agent');
      profiler.endTimer('agent-op2');

      expect(profiler.getEntriesByCategory('agent')).toHaveLength(2);
      expect(profiler.getEntriesByCategory('tool')).toHaveLength(1);
    });
  });

  describe('getSummary', () => {
    it('should return empty summary for no entries', () => {
      const summary = profiler.getSummary();

      expect(summary.totalDuration).toBe(0);
      expect(summary.entryCount).toBe(0);
      expect(summary.bottlenecks).toHaveLength(0);
    });

    it('should generate summary with category breakdowns', () => {
      profiler.startTimer('agent-op', 'agent');
      profiler.endTimer('agent-op');
      profiler.startTimer('tool-op', 'tool');
      profiler.endTimer('tool-op');

      const summary = profiler.getSummary();

      expect(summary.entryCount).toBe(2);
      expect(summary.byCategory).toHaveProperty('agent');
      expect(summary.byCategory).toHaveProperty('tool');
      expect(summary.byCategory['agent'].count).toBe(1);
    });

    it('should calculate percentiles', () => {
      for (let i = 0; i < 10; i++) {
        profiler.startTimer(`op-${i}`, 'agent');
        profiler.endTimer(`op-${i}`);
      }

      const summary = profiler.getSummary();

      expect(summary.p50).toBeGreaterThanOrEqual(0);
      expect(summary.p95).toBeGreaterThanOrEqual(summary.p50);
      expect(summary.p99).toBeGreaterThanOrEqual(summary.p95);
    });

    it('should identify bottlenecks', async () => {
      await profiler.measure('fast-op', 'agent', async () => {
        // fast
      });
      await profiler.measure('slow-op', 'io', async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const summary = profiler.getSummary();

      expect(summary.bottlenecks.length).toBeGreaterThan(0);
      expect(summary.bottlenecks[0].name).toBe('slow-op');
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      profiler.startTimer('op1', 'agent');
      profiler.endTimer('op1');

      profiler.clear();

      expect(profiler.getEntries()).toHaveLength(0);
    });
  });

  describe('globalProfiler', () => {
    it('should be a singleton', () => {
      expect(globalProfiler).toBeInstanceOf(Profiler);
    });
  });
});
