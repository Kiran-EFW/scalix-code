/**
 * End-to-End Pipeline Tests
 *
 * Tests the complete flow from agent creation through execution,
 * tool dispatch, storage, observability, and result collection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentExecutor } from '../../agent/executor';
import { AgentStateMachine } from '../../agent/state-machine';
import { AgentState } from '../../agent/types';
import { ToolRegistry } from '../../tools/registry';
import { DefaultTracer } from '../../observability/tracer';
import { DefaultMetricsCollector } from '../../observability/metrics';
import { InMemoryStorage } from '../../storage/storage';
import { LRUCache } from '../../performance/cache';
import { Profiler } from '../../performance/profiler';
import { PluginLoader, createPlugin } from '../../plugins/loader';
import { WorkflowCoordinator } from '../../orchestration/coordinator';

describe('E2E: Full Agent Pipeline', () => {
  let registry: ToolRegistry;
  let tracer: DefaultTracer;
  let metrics: DefaultMetricsCollector;
  let storage: InMemoryStorage;

  beforeEach(() => {
    registry = new ToolRegistry();
    tracer = new DefaultTracer();
    metrics = new DefaultMetricsCollector();
    storage = new InMemoryStorage();
  });

  describe('Tool Registry + Dispatch + Execution', () => {
    it('should register, dispatch, and execute tools end-to-end', async () => {
      // Register tools
      registry.register({
        name: 'add',
        description: 'Add two numbers',
        parameters: [
          { name: 'a', type: 'number', description: 'First number', required: true },
          { name: 'b', type: 'number', description: 'Second number', required: true },
        ],
        execute: async (args) => ({
          sum: (args.a as number) + (args.b as number),
        }),
      });

      registry.register({
        name: 'multiply',
        description: 'Multiply two numbers',
        parameters: [
          { name: 'a', type: 'number', description: 'First number', required: true },
          { name: 'b', type: 'number', description: 'Second number', required: true },
        ],
        execute: async (args) => ({
          product: (args.a as number) * (args.b as number),
        }),
      });

      // Execute tools
      const addResult = await registry.execute({
        id: 'call-1',
        toolName: 'add',
        arguments: { a: 5, b: 3 },
        timestamp: new Date(),
      });

      const multiplyResult = await registry.execute({
        id: 'call-2',
        toolName: 'multiply',
        arguments: { a: 4, b: 7 },
        timestamp: new Date(),
      });

      expect(addResult.success).toBe(true);
      expect((addResult.result as any).sum).toBe(8);
      expect(multiplyResult.success).toBe(true);
      expect((multiplyResult.result as any).product).toBe(28);
    });
  });

  describe('Storage + Observability Pipeline', () => {
    it('should trace, record metrics, and store results end-to-end', async () => {
      // Start tracing
      const rootSpan = tracer.startSpan('e2e-test');

      // Simulate agent execution
      const toolSpan = tracer.startSpan('tool-execute', { toolName: 'echo' });

      registry.register({
        name: 'echo',
        description: 'Echo',
        parameters: [],
        execute: async (args) => args,
      });

      const result = await registry.execute({
        id: 'call-1',
        toolName: 'echo',
        arguments: { message: 'hello' },
        timestamp: new Date(),
      });

      tracer.endSpan(toolSpan, 'success');

      // Record metrics
      metrics.recordToolMetrics('echo', toolSpan.duration, result.success);
      metrics.recordAgentMetrics('test-agent', 100, 1, 500, 200, 0.01, 'success');

      // Store results
      await storage.saveExecutionResult({
        agentId: 'test-agent',
        status: 'success',
        output: JSON.stringify(result.result),
        toolCalls: [],
        toolResults: [],
        cost: {
          provider: 'anthropic',
          model: 'claude-3-sonnet',
          inputTokens: 500,
          outputTokens: 200,
          costUSD: 0.01,
          timestamp: new Date(),
        },
        duration: 100,
        iterations: 1,
        trace: [rootSpan],
        finalState: AgentState.COMPLETED,
      });

      tracer.endSpan(rootSpan, 'success');

      // Verify everything was recorded
      const traces = tracer.getTraces();
      expect(traces).toHaveLength(2);

      const allMetrics = metrics.getMetrics();
      expect(allMetrics.length).toBeGreaterThan(0);

      const storedResults = await storage.loadExecutionResults('test-agent');
      expect(storedResults).toHaveLength(1);
      expect(storedResults[0].status).toBe('success');
    });
  });

  describe('Cache Integration', () => {
    it('should cache tool results and serve from cache', async () => {
      const cache = new LRUCache<unknown>({ maxSize: 100, ttlMs: 60000 });
      let executionCount = 0;

      registry.register({
        name: 'expensive-op',
        description: 'Expensive operation',
        parameters: [],
        execute: async (args) => {
          executionCount++;
          return { result: 'computed', count: executionCount };
        },
      });

      // First call - cache miss
      const cacheKey = 'expensive-op:{}';
      let result = cache.get(cacheKey);
      if (!result) {
        const toolResult = await registry.execute({
          id: 'call-1',
          toolName: 'expensive-op',
          arguments: {},
          timestamp: new Date(),
        });
        result = toolResult.result;
        cache.set(cacheKey, result);
      }

      // Second call - cache hit
      const cached = cache.get(cacheKey);
      expect(cached).toBeDefined();
      expect(executionCount).toBe(1);

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Plugin System Integration', () => {
    it('should load plugin and use its tools', async () => {
      const loader = new PluginLoader();

      const plugin = createPlugin({
        name: 'math-plugin',
        version: '1.0.0',
        description: 'Math operations plugin',
      });

      // Add getCommands to the plugin
      (plugin as any).getCommands = () => [
        {
          name: 'square',
          description: 'Square a number',
          execute: async (args: any) => ({ result: args.n * args.n }),
        },
      ];

      await loader.load(plugin);

      // Verify plugin is loaded
      const loaded = loader.getPlugin('math-plugin');
      expect(loaded).toBeDefined();

      // Get commands from plugin
      const commands = loader.getAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0].name).toBe('square');

      // Execute command
      const result = await commands[0].execute({ n: 5 });
      expect(result).toEqual({ result: 25 });
    });
  });

  describe('Profiling Integration', () => {
    it('should profile complete operation pipeline', async () => {
      const profiler = new Profiler();

      // Profile registry setup
      await profiler.measure('registry-setup', 'system', async () => {
        registry.register({
          name: 'profiled-tool',
          description: 'A profiled tool',
          parameters: [],
          execute: async () => ({ ok: true }),
        });
      });

      // Profile tool execution
      await profiler.measure('tool-execution', 'tool', async () => {
        await registry.execute({
          id: 'profiled-call',
          toolName: 'profiled-tool',
          arguments: {},
          timestamp: new Date(),
        });
      });

      // Profile storage
      await profiler.measure('storage-save', 'io', async () => {
        await storage.saveExecutionResult({
          agentId: 'profiled-agent',
          status: 'success',
          output: 'done',
          toolCalls: [],
          toolResults: [],
          cost: {
            provider: 'anthropic',
            model: 'claude-3-sonnet',
            inputTokens: 0,
            outputTokens: 0,
            costUSD: 0,
            timestamp: new Date(),
          },
          duration: 10,
          iterations: 1,
          trace: [],
          finalState: AgentState.COMPLETED,
        });
      });

      const summary = profiler.getSummary();
      expect(summary.entryCount).toBe(3);
      expect(summary.byCategory).toHaveProperty('system');
      expect(summary.byCategory).toHaveProperty('tool');
      expect(summary.byCategory).toHaveProperty('io');
      expect(summary.totalDuration).toBeLessThan(1000);
    });
  });

  describe('State Machine + Execution Flow', () => {
    it('should follow correct state transitions through full lifecycle', () => {
      const sm = new AgentStateMachine();

      // Full lifecycle
      expect(sm.getState()).toBe(AgentState.IDLE);
      expect(sm.isTerminal()).toBe(false);

      sm.transition(AgentState.INITIALIZING);
      expect(sm.getState()).toBe(AgentState.INITIALIZING);

      sm.transition(AgentState.EXECUTING);
      expect(sm.getState()).toBe(AgentState.EXECUTING);

      // Tool call cycle
      sm.transition(AgentState.WAITING);
      expect(sm.getState()).toBe(AgentState.WAITING);

      sm.transition(AgentState.EXECUTING);
      expect(sm.getState()).toBe(AgentState.EXECUTING);

      // Pause/resume
      sm.transition(AgentState.PAUSED);
      expect(sm.getState()).toBe(AgentState.PAUSED);

      sm.transition(AgentState.EXECUTING);
      expect(sm.getState()).toBe(AgentState.EXECUTING);

      // Complete
      sm.transition(AgentState.COMPLETED);
      expect(sm.getState()).toBe(AgentState.COMPLETED);
      expect(sm.isTerminal()).toBe(true);

      // Reset and restart
      sm.transition(AgentState.IDLE);
      expect(sm.isTerminal()).toBe(false);
    });
  });

  describe('Error Recovery Pipeline', () => {
    it('should handle tool errors gracefully and record them', async () => {
      registry.register({
        name: 'failing-tool',
        description: 'A tool that fails',
        parameters: [],
        execute: async () => {
          throw new Error('Tool execution failed');
        },
      });

      const span = tracer.startSpan('error-test');

      const result = await registry.execute({
        id: 'fail-call',
        toolName: 'failing-tool',
        arguments: {},
        timestamp: new Date(),
      });

      tracer.endSpan(span, result.success ? 'success' : 'error');
      metrics.recordToolMetrics('failing-tool', span.duration, result.success);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('failed');

      const spans = tracer.getTraces();
      expect(spans[0].status).toBe('error');

      const toolMetrics = metrics.getMetricsByLabel('status', 'failure');
      expect(toolMetrics.length).toBeGreaterThan(0);
    });
  });
});
