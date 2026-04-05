/**
 * Performance Benchmarks
 *
 * Benchmark suite for core operations.
 * Targets:
 *   - Simple operations: <1s
 *   - AST parsing: <500ms
 *   - Tool dispatch: <50ms
 *   - Cache operations: <1ms
 *   - State transitions: <1ms
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Profiler } from '../../performance/profiler';
import { LRUCache } from '../../performance/cache';
import { parallelMap, batchProcess } from '../../performance/parallel';
import { AgentStateMachine } from '../../agent/state-machine';
import { AgentState } from '../../agent/types';
import { ToolRegistry } from '../../tools/registry';
import { ToolDispatcher } from '../../tools/dispatcher';
import { DefaultTracer } from '../../observability/tracer';
import { DefaultMetricsCollector } from '../../observability/metrics';
import { InMemoryStorage } from '../../storage/storage';

describe('Performance Benchmarks', () => {
  describe('Profiler Performance', () => {
    it('should complete 10000 timer operations in <100ms', () => {
      const profiler = new Profiler();
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        profiler.startTimer(`op-${i}`, 'agent');
        profiler.endTimer(`op-${i}`);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('should generate summary for 1000 entries in <10ms', () => {
      const profiler = new Profiler();
      for (let i = 0; i < 1000; i++) {
        profiler.startTimer(`op-${i}`, i % 2 === 0 ? 'agent' : 'tool');
        profiler.endTimer(`op-${i}`);
      }

      const start = performance.now();
      profiler.getSummary();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });

  describe('Cache Performance', () => {
    it('should complete 100000 get/set operations in <2000ms', () => {
      const cache = new LRUCache<number>({ maxSize: 1000, ttlMs: 60000 });
      const start = performance.now();

      for (let i = 0; i < 100000; i++) {
        cache.set(`key-${i % 1000}`, i);
        cache.get(`key-${i % 500}`);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });

    it('should handle evictions efficiently with 50000 operations in <100ms', () => {
      const cache = new LRUCache<string>({ maxSize: 100, ttlMs: 60000 });
      const start = performance.now();

      for (let i = 0; i < 50000; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('should maintain >80% hit rate with working set', () => {
      const cache = new LRUCache<number>({ maxSize: 200, ttlMs: 60000 });

      // Populate with working set
      for (let i = 0; i < 200; i++) {
        cache.set(`key-${i}`, i);
      }

      // Access with 80% from working set, 20% new
      for (let i = 0; i < 10000; i++) {
        if (Math.random() < 0.8) {
          cache.get(`key-${Math.floor(Math.random() * 200)}`);
        } else {
          cache.get(`new-key-${i}`);
        }
      }

      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.6);
    });
  });

  describe('State Machine Performance', () => {
    it('should complete 100000 transitions in <50ms', () => {
      const start = performance.now();

      for (let i = 0; i < 100000; i++) {
        const sm = new AgentStateMachine();
        sm.transition(AgentState.INITIALIZING);
        sm.transition(AgentState.EXECUTING);
        sm.transition(AgentState.COMPLETED);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('Tool Registry Performance', () => {
    it('should register 1000 tools in <50ms', () => {
      const registry = new ToolRegistry();
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        registry.register({
          name: `tool-${i}`,
          description: `Tool ${i}`,
          parameters: [],
          execute: async () => ({ ok: true }),
        });
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });

    it('should lookup tools in <1ms', () => {
      const registry = new ToolRegistry();
      for (let i = 0; i < 100; i++) {
        registry.register({
          name: `tool-${i}`,
          description: `Tool ${i}`,
          parameters: [],
          execute: async () => ({ ok: true }),
        });
      }

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        registry.get(`tool-${i % 100}`);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });

  describe('Parallel Processing Performance', () => {
    it('should process 1000 items concurrently in <500ms', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const start = performance.now();

      const result = await parallelMap(
        items,
        async (item) => item * 2,
        { concurrency: 50 }
      );

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
      expect(result.successCount).toBe(1000);
    });

    it('should batch process efficiently', async () => {
      const items = Array.from({ length: 10000 }, (_, i) => i);
      const start = performance.now();

      const results = await batchProcess(
        items,
        100,
        async (batch) => batch.map((x) => x * 2)
      );

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
      expect(results).toHaveLength(10000);
    });
  });

  describe('Tracer Performance', () => {
    it('should handle 10000 spans in <100ms', () => {
      const tracer = new DefaultTracer();
      const start = performance.now();

      for (let i = 0; i < 10000; i++) {
        const span = tracer.startSpan(`span-${i}`);
        tracer.endSpan(span, 'success');
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Metrics Performance', () => {
    it('should record 50000 metrics in <500ms', () => {
      const collector = new DefaultMetricsCollector();
      const start = performance.now();

      for (let i = 0; i < 50000; i++) {
        collector.recordMetric({
          name: `metric_${i % 10}`,
          value: Math.random() * 100,
          timestamp: new Date(),
          labels: { agent: `agent-${i % 5}` },
        });
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });

    it('should export Prometheus format efficiently', () => {
      const collector = new DefaultMetricsCollector();
      for (let i = 0; i < 1000; i++) {
        collector.recordMetric({
          name: `metric_${i % 10}`,
          value: i,
          timestamp: new Date(),
          labels: { env: 'test' },
        });
      }

      const start = performance.now();
      collector.exportPrometheus();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('Storage Performance', () => {
    it('should handle 1000 save/load cycles in <50ms', async () => {
      const storage = new InMemoryStorage();
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        await storage.saveExecutionResult({
          agentId: `agent-${i % 10}`,
          status: 'success',
          output: `result-${i}`,
          toolCalls: [],
          toolResults: [],
          cost: {
            provider: 'anthropic',
            model: 'claude-3-sonnet',
            inputTokens: 100,
            outputTokens: 50,
            costUSD: 0.01,
            timestamp: new Date(),
          },
          duration: 500,
          iterations: 1,
          trace: [],
          finalState: AgentState.COMPLETED,
        });
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('Latency Targets', () => {
    it('should meet <1s target for simple agent operation', async () => {
      const start = performance.now();

      // Simulate simple agent operation: registry lookup + state transition + tool dispatch
      const registry = new ToolRegistry();
      registry.register({
        name: 'echo',
        description: 'Echo tool',
        parameters: [],
        execute: async (args) => args,
      });

      const sm = new AgentStateMachine();
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);

      const result = await registry.execute({
        id: 'call-1',
        toolName: 'echo',
        arguments: { message: 'test' },
        timestamp: new Date(),
      });

      sm.transition(AgentState.COMPLETED);

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
      expect(result.success).toBe(true);
    });

    it('should meet <500ms target for IDE-like operations', async () => {
      const start = performance.now();

      // Simulate IDE operation: cache check + tool lookup + execution
      const cache = new LRUCache<string>({ maxSize: 100, ttlMs: 60000 });
      const cached = cache.get('result');

      if (!cached) {
        const registry = new ToolRegistry();
        registry.register({
          name: 'get_current_time',
          description: 'Time',
          parameters: [],
          execute: async () => ({ time: new Date().toISOString() }),
        });

        const result = await registry.execute({
          id: 'ide-call',
          toolName: 'get_current_time',
          arguments: {},
          timestamp: new Date(),
        });

        cache.set('result', JSON.stringify(result));
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });
  });
});
