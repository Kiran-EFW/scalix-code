/**
 * Parallel Processing Utilities
 *
 * Execute operations in parallel with concurrency control,
 * batching, and error handling.
 */

export interface ParallelOptions {
  concurrency: number;
  timeout?: number;
  onProgress?: (completed: number, total: number) => void;
  abortSignal?: AbortSignal;
}

export interface BatchResult<T> {
  results: T[];
  errors: Array<{ index: number; error: Error }>;
  duration: number;
  successCount: number;
  failureCount: number;
}

/**
 * Execute tasks in parallel with concurrency control
 */
export async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: ParallelOptions
): Promise<BatchResult<R>> {
  const { concurrency, timeout, onProgress, abortSignal } = options;
  const startTime = performance.now();
  const results: R[] = new Array(items.length);
  const errors: Array<{ index: number; error: Error }> = [];
  let completed = 0;
  let activeCount = 0;
  let nextIndex = 0;

  return new Promise((resolve) => {
    const checkDone = () => {
      if (completed === items.length) {
        resolve({
          results,
          errors,
          duration: performance.now() - startTime,
          successCount: items.length - errors.length,
          failureCount: errors.length,
        });
      }
    };

    const processNext = () => {
      while (activeCount < concurrency && nextIndex < items.length) {
        if (abortSignal?.aborted) {
          // Mark remaining as errors
          for (let i = nextIndex; i < items.length; i++) {
            errors.push({ index: i, error: new Error('Aborted') });
            completed++;
          }
          nextIndex = items.length;
          checkDone();
          return;
        }

        const index = nextIndex++;
        activeCount++;

        const taskPromise = timeout
          ? Promise.race([
              fn(items[index], index),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Task timeout: ${timeout}ms`)), timeout)
              ),
            ])
          : fn(items[index], index);

        taskPromise
          .then((result) => {
            results[index] = result;
          })
          .catch((error) => {
            errors.push({
              index,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          })
          .finally(() => {
            activeCount--;
            completed++;
            onProgress?.(completed, items.length);
            processNext();
            checkDone();
          });
      }
    };

    if (items.length === 0) {
      resolve({
        results: [],
        errors: [],
        duration: 0,
        successCount: 0,
        failureCount: 0,
      });
      return;
    }

    processNext();
  });
}

/**
 * Execute independent tasks in parallel with concurrency limit
 */
export async function parallelExecute<T>(
  tasks: Array<() => Promise<T>>,
  options: ParallelOptions
): Promise<BatchResult<T>> {
  return parallelMap(tasks, (task) => task(), options);
}

/**
 * Process items in batches
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  fn: (batch: T[], batchIndex: number) => Promise<R[]>,
  onBatchComplete?: (batchIndex: number, totalBatches: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);
    const batchResults = await fn(batch, batchIndex);
    results.push(...batchResults);
    onBatchComplete?.(batchIndex, totalBatches);
  }

  return results;
}

/**
 * Debounce an async function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: NodeJS.Timeout | null = null;
  let pendingResolve: ((value: any) => void) | null = null;
  let pendingReject: ((error: any) => void) | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timer) clearTimeout(timer);

    return new Promise((resolve, reject) => {
      pendingResolve = resolve;
      pendingReject = reject;

      timer = setTimeout(async () => {
        try {
          const result = await fn(...args);
          pendingResolve?.(result);
        } catch (error) {
          pendingReject?.(error);
        }
      }, delayMs);
    });
  };
}

/**
 * Throttle an async function
 */
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let lastCall = 0;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now();
    const elapsed = now - lastCall;

    if (elapsed >= intervalMs) {
      lastCall = now;
      return fn(...args);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        setTimeout(async () => {
          lastCall = Date.now();
          pendingPromise = null;
          try {
            resolve(await fn(...args));
          } catch (error) {
            reject(error);
          }
        }, intervalMs - elapsed);
      });
    }

    return pendingPromise;
  };
}
