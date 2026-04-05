/**
 * Agent Executor Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentExecutor } from './executor';
import { AgentStateMachine } from './state-machine';
import type { AgentConfig } from './types';
import {
  createMockLLMProvider,
  createMockStorage,
  createMockLogger,
  createMockTracer,
  createMockMetricsCollector,
} from '@scalix/testing/mocks';

describe('AgentExecutor', () => {
  let executor: AgentExecutor;
  let config: AgentConfig;
  let mocks: ReturnType<typeof setupMocks>;

  function setupMocks() {
    return {
      llmProvider: createMockLLMProvider(),
      storage: createMockStorage(),
      logger: createMockLogger(),
      tracer: createMockTracer(),
      metrics: createMockMetricsCollector(),
    };
  }

  beforeEach(() => {
    mocks = setupMocks();
    config = {
      id: 'test-agent',
      name: 'Test Agent',
      model: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
      },
    };

    executor = new AgentExecutor(config, {
      llmProvider: mocks.llmProvider,
      storage: mocks.storage,
      logger: mocks.logger,
      tracer: mocks.tracer,
      metrics: mocks.metrics,
    });
  });

  describe('initialization', () => {
    it('should initialize with valid config', () => {
      expect(executor).toBeDefined();
      expect(executor.config.id).toBe('test-agent');
    });

    it('should initialize state machine', () => {
      const state = executor.getState();
      expect(state).toBe('IDLE');
    });

    it('should initialize with default maxIterations', () => {
      expect(executor.config.maxIterations || 10).toBeGreaterThan(0);
    });
  });

  describe('execution', () => {
    it('should execute with simple input', async () => {
      const result = await executor.execute('Hello, agent!');
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.executionId).toBeDefined();
    });

    it('should track execution duration', async () => {
      const result = await executor.execute('Test input');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should call LLM provider', async () => {
      await executor.execute('Test input');
      expect(mocks.llmProvider.call).toHaveBeenCalled();
    });

    it('should increment iterations', async () => {
      const result = await executor.execute('Test input');
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should calculate cost', async () => {
      const result = await executor.execute('Test input');
      expect(result.cost).toBeDefined();
      expect(result.cost.inputTokens).toBeGreaterThanOrEqual(0);
      expect(result.cost.outputTokens).toBeGreaterThanOrEqual(0);
      expect(result.cost.costUSD).toBeGreaterThanOrEqual(0);
    });
  });

  describe('state transitions', () => {
    it('should transition from IDLE to EXECUTING', async () => {
      const executePromise = executor.execute('Test input');
      // Allow state to transition
      await new Promise((resolve) => setTimeout(resolve, 10));
      const state = executor.getState();
      expect(['EXECUTING', 'COMPLETED']).toContain(state);
      await executePromise;
    });

    it('should transition to COMPLETED after execution', async () => {
      await executor.execute('Test input');
      const state = executor.getState();
      expect(state).toBe('COMPLETED');
    });
  });

  describe('error handling', () => {
    it('should handle LLM provider errors gracefully', async () => {
      const errorProvider = createMockLLMProvider({
        call: vi.fn(async () => {
          throw new Error('LLM error');
        }),
      });

      executor = new AgentExecutor(config, {
        llmProvider: errorProvider,
        storage: mocks.storage,
        logger: mocks.logger,
        tracer: mocks.tracer,
        metrics: mocks.metrics,
      });

      const result = await executor.execute('Test input');
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should timeout when execution takes too long', async () => {
      config.timeout = 10; // 10ms timeout
      executor = new AgentExecutor(config, {
        llmProvider: mocks.llmProvider,
        storage: mocks.storage,
        logger: mocks.logger,
        tracer: mocks.tracer,
        metrics: mocks.metrics,
      });

      const result = await executor.execute('Test input');
      expect(result.status).toBe('failed');
      expect(result.error).toContain('timeout');
    });
  });

  describe('memory management', () => {
    it('should save memory after execution', async () => {
      await executor.execute('Test input');
      expect(mocks.storage.saveMemory).toHaveBeenCalled();
    });

    it('should load memory before execution', async () => {
      mocks.storage.loadMemory.mockResolvedValueOnce({ previousData: true });
      await executor.execute('Test input');
      expect(mocks.storage.loadMemory).toHaveBeenCalledWith('test-agent');
    });
  });
});
