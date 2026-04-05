/**
 * Test Mocks & Stubs
 *
 * Mock implementations for testing components in isolation
 */

import { vi } from 'vitest';
import type {
  Agent,
  ExecutionResult,
  LLMProvider,
  LLMResponse,
  Logger,
  Tracer,
  MetricsCollector,
  Storage,
} from '@scalix/core';

/**
 * Mock LLM Provider
 */
export function createMockLLMProvider(overrides?: Partial<LLMProvider>): LLMProvider {
  return {
    call: vi.fn(async () => {
      // Add a small delay to simulate real LLM behavior
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        content: 'Mock LLM response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
      } as LLMResponse;
    }),
    ...overrides,
  };
}

/**
 * Mock Logger
 */
export function createMockLogger(overrides?: Partial<Logger>): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    getLogs: vi.fn(() => []),
    getLogsByLevel: vi.fn(() => []),
    exportJSON: vi.fn(() => ({
      logs: [],
    })),
    ...overrides,
  };
}

/**
 * Mock Tracer
 */
export function createMockTracer(overrides?: Partial<Tracer>): Tracer {
  return {
    startSpan: vi.fn(async () => ({
      spanId: 'mock-span',
      traceId: 'mock-trace',
      name: 'mock',
      status: 'success',
      duration: 100,
      parentId: undefined,
      startTime: new Date(),
      attributes: {},
      events: [],
      recordEvent: vi.fn(),
    })),
    getTraces: vi.fn(() => []),
    getTracesByTraceId: vi.fn(() => []),
    exportJSON: vi.fn(() => ({
      traces: [],
    })),
    clear: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock Metrics Collector
 */
export function createMockMetricsCollector(
  overrides?: Partial<MetricsCollector>
): MetricsCollector {
  return {
    recordAgentMetrics: vi.fn(),
    recordToolMetrics: vi.fn(),
    getMetrics: vi.fn(() => []),
    getSummary: vi.fn(() => ({
      totalMetrics: 0,
      byType: {},
    })),
    exportPrometheus: vi.fn(() => ''),
    exportJSON: vi.fn(() => ({
      metrics: [],
    })),
    clear: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock Storage
 */
export function createMockStorage(overrides?: Partial<Storage>): Storage {
  const memoryStore = new Map<string, any>();
  const executionStore = new Map<string, any[]>();
  const checkpointStore = new Map<string, any>();

  return {
    saveMemory: vi.fn(async (agentId, memory) => {
      memoryStore.set(agentId, memory);
    }),
    loadMemory: vi.fn(async (agentId) => {
      return memoryStore.get(agentId) || null;
    }),
    deleteMemory: vi.fn(async (agentId) => {
      memoryStore.delete(agentId);
    }),
    saveExecutionResult: vi.fn(async (agentId, result) => {
      const key = agentId;
      if (!executionStore.has(key)) {
        executionStore.set(key, []);
      }
      executionStore.get(key)!.push(result);
    }),
    loadExecutionResults: vi.fn(async (agentId) => {
      return executionStore.get(agentId) || [];
    }),
    saveCheckpoint: vi.fn(async (agentId, checkpoint) => {
      checkpointStore.set(agentId, checkpoint);
    }),
    loadCheckpoint: vi.fn(async (agentId) => {
      return checkpointStore.get(agentId) || null;
    }),
    deleteCheckpoint: vi.fn(async (agentId) => {
      checkpointStore.delete(agentId);
    }),
    health: vi.fn(async () => true),
    getStats: vi.fn(() => ({
      agents: memoryStore.size,
      executions: Array.from(executionStore.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
      checkpoints: checkpointStore.size,
    })),
    clear: vi.fn(() => {
      memoryStore.clear();
      executionStore.clear();
      checkpointStore.clear();
    }),
    ...overrides,
  };
}

/**
 * Mock execution result builder
 */
export function createMockExecutionResult(overrides?: Partial<ExecutionResult>): ExecutionResult {
  return {
    executionId: 'mock-exec-' + Math.random().toString(36).substring(7),
    agentId: 'mock-agent',
    status: 'completed',
    output: 'Mock execution output',
    error: null,
    duration: 100,
    iterations: 1,
    toolCalls: [],
    cost: {
      inputTokens: 100,
      outputTokens: 50,
      costUSD: 0.001,
    },
    trace: [],
    ...overrides,
  };
}

/**
 * Create a mock agent
 */
export function createMockAgent(overrides?: Partial<Agent>): Agent {
  const agentId = overrides?.id || 'mock-agent';
  const agentName = overrides?.name || 'Mock Agent';

  return {
    id: agentId,
    name: agentName,
    config: {
      id: agentId,
      name: agentName,
      model: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
      },
      tools: [],
      systemPrompt: 'You are a helpful assistant.',
      ...overrides?.config,
    },
    execute: vi.fn(async (input: string) => createMockExecutionResult({ agentId })),
    getMemory: vi.fn(async () => null),
    saveMemory: vi.fn(async () => {}),
    setState: vi.fn(),
    getState: vi.fn(() => 'IDLE'),
    ...overrides,
  };
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert function was called with specific arguments
 */
export function assertCalledWith<T extends any[]>(
  fn: ReturnType<typeof vi.fn>,
  args: T
): boolean {
  return fn.mock.calls.some((callArgs) => JSON.stringify(callArgs) === JSON.stringify(args));
}

/**
 * Get the last call arguments
 */
export function getLastCallArgs(fn: ReturnType<typeof vi.fn>): any[] {
  const calls = fn.mock.calls;
  return calls.length > 0 ? calls[calls.length - 1] : [];
}

/**
 * Create a test agent context
 */
export function createTestContext() {
  return {
    logger: createMockLogger(),
    tracer: createMockTracer(),
    metrics: createMockMetricsCollector(),
    storage: createMockStorage(),
    llmProvider: createMockLLMProvider(),
  };
}
