/**
 * Parallel Processing Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { parallelMap, parallelExecute, batchProcess } from './parallel';

describe('parallelMap', () => {
  it('should process all items', async () => {
    const items = [1, 2, 3, 4, 5];
    const result = await parallelMap(
      items,
      async (item) => item * 2,
      { concurrency: 2 }
    );

    expect(result.results).toEqual([2, 4, 6, 8, 10]);
    expect(result.successCount).toBe(5);
    expect(result.failureCount).toBe(0);
  });

  it('should handle empty input', async () => {
    const result = await parallelMap(
      [],
      async (item: number) => item * 2,
      { concurrency: 2 }
    );

    expect(result.results).toEqual([]);
    expect(result.successCount).toBe(0);
  });

  it('should respect concurrency limit', async () => {
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const items = [1, 2, 3, 4, 5];
    await parallelMap(
      items,
      async (item) => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise((r) => setTimeout(r, 10));
        currentConcurrent--;
        return item;
      },
      { concurrency: 2 }
    );

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it('should handle errors without stopping', async () => {
    const items = [1, 2, 3];
    const result = await parallelMap(
      items,
      async (item) => {
        if (item === 2) throw new Error('fail');
        return item * 10;
      },
      { concurrency: 1 }
    );

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(1);
    expect(result.errors[0].index).toBe(1);
    expect(result.results[0]).toBe(10);
    expect(result.results[2]).toBe(30);
  });

  it('should call onProgress callback', async () => {
    const onProgress = vi.fn();
    const items = [1, 2, 3];

    await parallelMap(
      items,
      async (item) => item,
      { concurrency: 1, onProgress }
    );

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenCalledWith(3, 3);
  });

  it('should handle timeout per task', async () => {
    const items = [1, 2];
    const result = await parallelMap(
      items,
      async (item) => {
        if (item === 2) {
          await new Promise((r) => setTimeout(r, 200));
        }
        return item;
      },
      { concurrency: 2, timeout: 50 }
    );

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
  });

  it('should track duration', async () => {
    const result = await parallelMap(
      [1],
      async (item) => item,
      { concurrency: 1 }
    );

    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should abort on signal', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await parallelMap(
      [1, 2, 3],
      async (item) => item,
      { concurrency: 1, abortSignal: controller.signal }
    );

    expect(result.failureCount).toBeGreaterThan(0);
  });
});

describe('parallelExecute', () => {
  it('should execute task functions', async () => {
    const tasks = [
      async () => 'a',
      async () => 'b',
      async () => 'c',
    ];

    const result = await parallelExecute(tasks, { concurrency: 2 });

    expect(result.results).toEqual(['a', 'b', 'c']);
    expect(result.successCount).toBe(3);
  });
});

describe('batchProcess', () => {
  it('should process items in batches', async () => {
    const items = [1, 2, 3, 4, 5];
    const results = await batchProcess(
      items,
      2,
      async (batch) => batch.map((x) => x * 10)
    );

    expect(results).toEqual([10, 20, 30, 40, 50]);
  });

  it('should handle last partial batch', async () => {
    const items = [1, 2, 3];
    const batchSizes: number[] = [];

    await batchProcess(
      items,
      2,
      async (batch, index) => {
        batchSizes.push(batch.length);
        return batch;
      }
    );

    expect(batchSizes).toEqual([2, 1]);
  });

  it('should call onBatchComplete', async () => {
    const onBatchComplete = vi.fn();

    await batchProcess(
      [1, 2, 3, 4],
      2,
      async (batch) => batch,
      onBatchComplete
    );

    expect(onBatchComplete).toHaveBeenCalledTimes(2);
    expect(onBatchComplete).toHaveBeenCalledWith(0, 2);
    expect(onBatchComplete).toHaveBeenCalledWith(1, 2);
  });

  it('should handle empty input', async () => {
    const results = await batchProcess([], 2, async (batch) => batch);
    expect(results).toEqual([]);
  });
});
