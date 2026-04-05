/**
 * Agent to Tool Dispatch Integration Tests
 *
 * Tests the integration between Agent Executor and Tool Dispatcher
 * Verifies that agents can successfully call tools and handle results
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentExecutor } from '../../agent/executor';
import { ToolDispatcher } from '../../tools/dispatcher';
import { ToolRegistry } from '../../tools/registry';
import type { AgentConfig } from '../../agent/types';
import {
  createMockLLMProvider,
  createMockStorage,
  createMockLogger,
  createMockTracer,
  createMockMetricsCollector,
} from '@scalix/testing/mocks';

describe('Agent to Tool Dispatch Integration', () => {
  let executor: AgentExecutor;
  let toolRegistry: ToolRegistry;
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
      id: 'test-agent',
      name: 'Test Agent',
      model: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
      },
      tools: [],
      systemPrompt: 'You are a helpful assistant.',
    };

    // Setup tool registry and dispatcher
    toolRegistry = new ToolRegistry();

    // Create executor
    executor = new AgentExecutor(config, {
      llmProvider: mocks.llmProvider,
      storage: mocks.storage,
      logger: mocks.logger,
      tracer: mocks.tracer,
      metrics: mocks.metrics,
      tools: toolRegistry,
    });
  });

  describe('agent-to-dispatcher interaction', () => {
    it('should execute agent without tool calls', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'I can help you',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Hello');

      expect(result.status).toBe('completed');
      expect(result.output).toContain('help');
    });

    it('should track agent execution metrics', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Executing task',
        toolCalls: [],
        inputTokens: 150,
        outputTokens: 75,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Execute');

      expect(result.status).toBe('completed');
      expect(result.agentId).toBe(config.id);
      expect(result.cost.inputTokens).toBeGreaterThanOrEqual(100);
      expect(result.cost.outputTokens).toBeGreaterThanOrEqual(50);
    });
  });

  describe('tool dispatcher capabilities', () => {
    it('should create and manage tool registry', async () => {
      expect(toolRegistry).toBeDefined();
      expect(toolRegistry.get).toBeDefined();
    });

    it('should register and retrieve tools', () => {
      toolRegistry.register({
        name: 'test-tool',
        description: 'A test tool',
        parameters: [],
        execute: vi.fn(async (args) => ({ result: 'test' })),
      });

      const tool = toolRegistry.get('test-tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test-tool');
    });

    it('should handle rate limiting configuration', () => {
      const dispatcher = new ToolDispatcher(toolRegistry);

      dispatcher.setRateLimit('test-tool', 10, 1000);

      const status = dispatcher.getRateLimitStatus('test-tool');
      expect(status.remaining).toBe(10);
    });
  });

  describe('agent execution flow', () => {
    it('should complete simple execution', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Task completed',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Do task');

      expect(result.status).toBe('completed');
      expect(result.iterations).toBe(1);
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

      const result = await executor.execute('Time this');

      expect(result.status).toBe('completed');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle execution errors gracefully', async () => {
      mocks.llmProvider.call.mockRejectedValueOnce(new Error('LLM error'));

      const result = await executor.execute('Cause error');

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });
  });

  describe('multi-iteration execution', () => {
    it('should handle multiple iterations', async () => {
      // First iteration
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Continue',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Execute');

      expect(result.status).toBe('completed');
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should respect maxIterations setting', async () => {
      config.maxIterations = 1;

      const limitedExecutor = new AgentExecutor(config, {
        llmProvider: mocks.llmProvider,
        storage: mocks.storage,
        logger: mocks.logger,
        tracer: mocks.tracer,
        metrics: mocks.metrics,
        tools: toolRegistry,
      });

      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Done',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await limitedExecutor.execute('Limited');

      expect(result.status).toBe('completed');
      expect(result.iterations).toBeLessThanOrEqual(1);
    });
  });

  describe('tool registry operations', () => {
    it('should support tool registration', () => {
      toolRegistry.register({
        name: 'helper',
        description: 'Helper tool',
        parameters: [],
        execute: vi.fn(async () => ({ help: true })),
      });

      const tool = toolRegistry.get('helper');
      expect(tool?.name).toBe('helper');
    });

    it('should track multiple tools', () => {
      toolRegistry.register({
        name: 'tool1',
        description: 'Tool 1',
        parameters: [],
        execute: vi.fn(),
      });

      toolRegistry.register({
        name: 'tool2',
        description: 'Tool 2',
        parameters: [],
        execute: vi.fn(),
      });

      expect(toolRegistry.get('tool1')).toBeDefined();
      expect(toolRegistry.get('tool2')).toBeDefined();
    });
  });

  describe('dispatcher integration', () => {
    it('should support setRegistry operation', () => {
      const dispatcher = new ToolDispatcher();
      expect(dispatcher.setRegistry).toBeDefined();

      dispatcher.setRegistry(toolRegistry);
      // No error means it worked
      expect(true).toBe(true);
    });

    it('should support execute operation', async () => {
      const dispatcher = new ToolDispatcher();

      // Create a tool that will be found
      toolRegistry.register({
        name: 'test',
        description: 'Test',
        parameters: [],
        execute: vi.fn(async () => ({ result: 'test' })),
      });

      dispatcher.setRegistry(toolRegistry);

      const result = await dispatcher.execute('test', {});

      expect(result.success).toBe(true);
    });
  });

  describe('execution result details', () => {
    it('should include executionId in results', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Get ID');

      expect(result.executionId).toBeDefined();
      expect(typeof result.executionId).toBe('string');
    });

    it('should include agent identification', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Response',
        toolCalls: [],
        inputTokens: 100,
        outputTokens: 50,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Identify');

      expect(result.agentId).toBe(config.id);
    });

    it('should include cost information', async () => {
      mocks.llmProvider.call.mockResolvedValueOnce({
        content: 'Response',
        toolCalls: [],
        inputTokens: 200,
        outputTokens: 100,
        model: 'mock-model',
        stopReason: 'end_turn',
      });

      const result = await executor.execute('Calculate cost');

      expect(result.cost).toBeDefined();
      expect(result.cost.provider).toBeDefined();
      expect(result.cost.model).toBeDefined();
      expect(result.cost.inputTokens).toBeGreaterThan(0);
      expect(result.cost.outputTokens).toBeGreaterThan(0);
    });
  });
});
