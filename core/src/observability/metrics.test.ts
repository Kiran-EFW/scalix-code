/**
 * Metrics Collector Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultMetricsCollector, NoOpMetricsCollector } from './metrics';

describe('DefaultMetricsCollector', () => {
  let collector: DefaultMetricsCollector;

  beforeEach(() => {
    collector = new DefaultMetricsCollector();
  });

  describe('recordMetric', () => {
    it('should record a metric', () => {
      collector.recordMetric({
        name: 'test_metric',
        value: 42,
        timestamp: new Date(),
        labels: { env: 'test' },
      });

      expect(collector.getMetrics()).toHaveLength(1);
    });

    it('should handle metrics without unit', () => {
      collector.recordMetric({
        name: 'count',
        value: 1,
        timestamp: new Date(),
        labels: {},
      });

      expect(collector.getMetrics()[0].name).toBe('count');
    });
  });

  describe('getMetrics', () => {
    it('should return all recorded metrics', () => {
      for (let i = 0; i < 5; i++) {
        collector.recordMetric({
          name: `metric_${i}`,
          value: i,
          timestamp: new Date(),
          labels: {},
        });
      }

      expect(collector.getMetrics()).toHaveLength(5);
    });

    it('should return a copy of metrics', () => {
      collector.recordMetric({
        name: 'test',
        value: 1,
        timestamp: new Date(),
        labels: {},
      });

      const metrics1 = collector.getMetrics();
      const metrics2 = collector.getMetrics();
      expect(metrics1).not.toBe(metrics2);
    });
  });

  describe('getMetricsByName', () => {
    it('should filter by name', () => {
      collector.recordMetric({
        name: 'cpu',
        value: 50,
        timestamp: new Date(),
        labels: {},
      });
      collector.recordMetric({
        name: 'memory',
        value: 70,
        timestamp: new Date(),
        labels: {},
      });
      collector.recordMetric({
        name: 'cpu',
        value: 55,
        timestamp: new Date(),
        labels: {},
      });

      expect(collector.getMetricsByName('cpu')).toHaveLength(2);
      expect(collector.getMetricsByName('memory')).toHaveLength(1);
    });
  });

  describe('getMetricsByLabel', () => {
    it('should filter by label', () => {
      collector.recordMetric({
        name: 'duration',
        value: 100,
        timestamp: new Date(),
        labels: { agentId: 'agent-1' },
      });
      collector.recordMetric({
        name: 'duration',
        value: 200,
        timestamp: new Date(),
        labels: { agentId: 'agent-2' },
      });

      expect(collector.getMetricsByLabel('agentId', 'agent-1')).toHaveLength(1);
    });
  });

  describe('getSummary', () => {
    it('should return null for unknown metric', () => {
      expect(collector.getSummary('nonexistent')).toBeNull();
    });

    it('should calculate correct summary', () => {
      const values = [10, 20, 30, 40, 50];
      for (const v of values) {
        collector.recordMetric({
          name: 'latency',
          value: v,
          timestamp: new Date(),
          labels: {},
        });
      }

      const summary = collector.getSummary('latency')!;
      expect(summary.count).toBe(5);
      expect(summary.min).toBe(10);
      expect(summary.max).toBe(50);
      expect(summary.avg).toBe(30);
      expect(summary.sum).toBe(150);
    });
  });

  describe('clear', () => {
    it('should remove all metrics', () => {
      collector.recordMetric({
        name: 'test',
        value: 1,
        timestamp: new Date(),
        labels: {},
      });

      collector.clear();
      expect(collector.getMetrics()).toHaveLength(0);
    });
  });

  describe('exportPrometheus', () => {
    it('should export in Prometheus format', () => {
      collector.recordMetric({
        name: 'http_requests_total',
        value: 42,
        timestamp: new Date(),
        labels: { method: 'GET', path: '/api' },
      });

      const output = collector.exportPrometheus();
      expect(output).toContain('# HELP http_requests_total');
      expect(output).toContain('# TYPE http_requests_total gauge');
      expect(output).toContain('method="GET"');
      expect(output).toContain('42');
    });

    it('should handle metrics without labels', () => {
      collector.recordMetric({
        name: 'uptime',
        value: 3600,
        timestamp: new Date(),
        labels: {},
      });

      const output = collector.exportPrometheus();
      expect(output).toContain('uptime 3600');
    });
  });

  describe('exportJSON', () => {
    it('should export as JSON object', () => {
      collector.recordMetric({
        name: 'test',
        value: 1,
        timestamp: new Date(),
        labels: {},
      });

      const json = collector.exportJSON() as any;
      expect(json.metrics).toHaveLength(1);
      expect(json.totalCount).toBe(1);
      expect(json.names).toContain('test');
    });
  });

  describe('recordAgentMetrics', () => {
    it('should record all agent-related metrics', () => {
      collector.recordAgentMetrics('agent-1', 500, 3, 1000, 500, 0.05, 'success');

      const metrics = collector.getMetrics();
      const metricNames = metrics.map((m) => m.name);

      expect(metricNames).toContain('agent_execution_duration_ms');
      expect(metricNames).toContain('agent_iterations');
      expect(metricNames).toContain('agent_input_tokens');
      expect(metricNames).toContain('agent_output_tokens');
      expect(metricNames).toContain('agent_cost_usd');
      expect(metricNames).toContain('agent_execution_count');
    });
  });

  describe('recordToolMetrics', () => {
    it('should record tool execution metrics', () => {
      collector.recordToolMetrics('echo', 15, true);

      const metrics = collector.getMetrics();
      expect(metrics).toHaveLength(2);
      expect(metrics[0].labels.toolName).toBe('echo');
      expect(metrics[0].labels.status).toBe('success');
    });

    it('should record failure status', () => {
      collector.recordToolMetrics('echo', 15, false);
      expect(collector.getMetrics()[0].labels.status).toBe('failure');
    });
  });
});

describe('NoOpMetricsCollector', () => {
  let collector: NoOpMetricsCollector;

  beforeEach(() => {
    collector = new NoOpMetricsCollector();
  });

  it('should not throw on recordMetric', () => {
    expect(() =>
      collector.recordMetric({
        name: 'test',
        value: 1,
        timestamp: new Date(),
        labels: {},
      })
    ).not.toThrow();
  });

  it('should return empty metrics', () => {
    expect(collector.getMetrics()).toEqual([]);
  });

  it('should not throw on clear', () => {
    expect(() => collector.clear()).not.toThrow();
  });
});
