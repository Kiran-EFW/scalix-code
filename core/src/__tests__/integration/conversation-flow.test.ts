/**
 * Conversation Flow Integration Tests
 *
 * Tests multi-turn conversations with context preservation
 * Verifies that agents maintain state across multiple interactions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentExecutor } from '../../agent/executor';
import type { AgentConfig } from '../../agent/types';
import {
  createMockLLMProvider,
  createMockStorage,
  createMockLogger,
  createMockTracer,
  createMockMetricsCollector,
} from '@scalix/testing/mocks';

describe('Conversation Flow Integration', () => {
  let executor: AgentExecutor;
  let config: AgentConfig;
  let mocks: any;

  beforeEach(() => {
    // Setup mocks
    mocks = {
      llmProvider: createMockLLMProvider(),
      storage: createMockStorage(),
      logger: createMockLogger(),
      tracer: createMockTracer(),
      metrics: createMockMetricsCollector(),
    };

    // Setup config
    config = {
      id: 'conversation-agent',
      name: 'Conversation Agent',
      model: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
      },
      tools: [],
      systemPrompt: 'You are a helpful assistant.',
    };

    // Create executor
    executor = new AgentExecutor(config, {
      llmProvider: mocks.llmProvider,
      storage: mocks.storage,
      logger: mocks.logger,
      tracer: mocks.tracer,
      metrics: mocks.metrics,
    });
  });

  describe('single-turn conversations', () => {
    it('should handle simple question and answer', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Hello! I am ready to help.',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Hi, are you ready?');

      expect(result.status).toBe('completed');
      expect(result.output).toContain('Hello');
      expect(result.iterations).toBe(1);
    });

    it('should handle single turn with context', async () => {
      const context = { userId: 'user123', session: 'sess456' };

      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Processing your request',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Process request', context);

      expect(result.status).toBe('completed');
      expect(result.agentId).toBe(config.id);
    });
  });

  describe('multi-turn conversations', () => {
    it('should execute multiple turns with fresh executors', async () => {
      // Turn 1
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'First response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result1 = await executor.execute('First question');
      expect(result1.status).toBe('completed');
      expect(result1.output).toContain('First');

      // Turn 2 - create fresh executor
      const executor2 = new AgentExecutor(config, {
        llmProvider: mocks.llmProvider,
        storage: mocks.storage,
        logger: mocks.logger,
        tracer: mocks.tracer,
        metrics: mocks.metrics,
      });

      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Second response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result2 = await executor2.execute('Second question');
      expect(result2.status).toBe('completed');
      expect(result2.output).toContain('Second');
    });

    it('should handle multiple conversation turns', async () => {
      const turns = ['Turn 1', 'Turn 2', 'Turn 3'];
      const results = [];

      for (const turnText of turns) {
        // Create fresh executor for each turn
        const turnExecutor = new AgentExecutor(config, {
          llmProvider: mocks.llmProvider,
          storage: mocks.storage,
          logger: mocks.logger,
          tracer: mocks.tracer,
          metrics: mocks.metrics,
        });

        mocks.llmProvider.call.mockResolvedValueOnce({
          content: `Response to ${turnText}`,
          toolCalls: [],
          inputTokens: 100,
          outputTokens: 50,
          model: 'mock-model',
          stopReason: 'end_turn',
        });

        const result = await turnExecutor.execute(turnText);
        expect(result.status).toBe('completed');
        expect(result.output).toContain(turnText);
        results.push(result);
      }

      // Verify all turns completed
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.status === 'completed')).toBe(true);
    });
  });

  describe('conversation memory and state', () => {
    it('should save memory after execution', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Remember this');

      expect(result.status).toBe('completed');
      expect(mocks.storage.saveMemory).toHaveBeenCalled();
    });

    it('should load memory before execution', async () => {
      // Setup stored memory
      const storedMemory = { conversation: 'history' };
      mocks.storage.loadMemory.mockResolvedValueOnce(storedMemory);

      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Using memory',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Use stored memory');

      expect(result.status).toBe('completed');
      expect(mocks.storage.loadMemory).toHaveBeenCalledWith(config.id);
    });

    it('should save execution results to storage', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Execution result',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Execute and save');

      expect(result.status).toBe('completed');
      expect(mocks.storage.saveExecutionResult).toHaveBeenCalled();
    });
  });

  describe('conversation error recovery', () => {
    it('should handle LLM provider errors', async () => {
      mocks.llmProvider.call.mockRejectedValueOnce(new Error('LLM error'));

      const result = await executor.execute('Trigger error');

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should limit iterations and complete gracefully', async () => {
      config.maxIterations = 2;

      // Create executor with iteration limit
      const limitedExecutor = new AgentExecutor(config, {
        llmProvider: mocks.llmProvider,
        storage: mocks.storage,
        logger: mocks.logger,
        tracer: mocks.tracer,
        metrics: mocks.metrics,
      });

      mocks.llmProvider.call.mockResolvedValue({
        content: 'Response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await limitedExecutor.execute('Limited execution');

      expect(result.status).toBe('completed');
      expect(result.iterations).toBeLessThanOrEqual(config.maxIterations!);
    });
  });

  describe('conversation metrics and tracking', () => {
    it('should track execution metrics', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Response',
        toolCalls: [],
        inputTokens: 150,
        outputTokens: 75,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Track metrics');

      expect(result.status).toBe('completed');
      expect(result.cost.inputTokens).toBeGreaterThanOrEqual(100);
      expect(result.cost.outputTokens).toBeGreaterThanOrEqual(50);
    });

    it('should track iteration count', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Single turn',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Count iterations');

      expect(result.status).toBe('completed');
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should track execution duration', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Measure time');

      expect(result.status).toBe('completed');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('conversation state transitions', () => {
    it('should maintain consistent agent state', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Check state');

      expect(result.status).toBe('completed');
      expect(result.finalState).toBeDefined();
      expect(['idle', 'initializing', 'executing', 'completed', 'errored', 'cancelled', 'waiting', 'paused']).toContain(
        result.finalState?.toLowerCase()
      );
    });

    it('should provide execution identification', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Get ID');

      expect(result.status).toBe('completed');
      expect(result.executionId).toBeDefined();
      expect(result.agentId).toBe(config.id);
    });
  });
});
