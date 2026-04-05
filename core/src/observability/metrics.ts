/**
 * Metrics Collector
 *
 * Collect and aggregate metrics (Prometheus-compatible)
 */

import type { Metric, MetricsCollector } from './types';

/**
 * Metrics collector implementation
 */
export class DefaultMetricsCollector implements MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics = 10000;

  /**
   * Record a metric
   */
  recordMetric(metric: Metric): void {
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): Metric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get metrics by label
   */
  getMetricsByLabel(label: string, value: string): Metric[] {
    return this.metrics.filter((m) => m.labels[label] === value);
  }

  /**
   * Get metric summary
   */
  getSummary(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
  } | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const values = metrics.map((m) => m.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / metrics.length,
      sum,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Group by metric name
    const byName = new Map<string, Metric[]>();
    for (const metric of this.metrics) {
      const existing = byName.get(metric.name) || [];
      existing.push(metric);
      byName.set(metric.name, existing);
    }

    // Format each metric
    for (const [name, metrics] of byName) {
      lines.push(`# HELP ${name} Metric ${name}`);
      lines.push(`# TYPE ${name} gauge`);

      for (const metric of metrics) {
        const labels = Object.entries(metric.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');

        const metricsLine =
          labels.length > 0
            ? `${name}{${labels}} ${metric.value}`
            : `${name} ${metric.value}`;

        lines.push(metricsLine);
      }
    }

    return lines.join('\n');
  }

  /**
   * Export metrics as JSON
   */
  exportJSON(): unknown {
    return {
      metrics: this.metrics.map((m) => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        timestamp: m.timestamp.toISOString(),
        labels: m.labels,
      })),
      totalCount: this.metrics.length,
      names: Array.from(
        new Set(this.metrics.map((m) => m.name))
      ),
    };
  }

  /**
   * Record common agent metrics
   */
  recordAgentMetrics(
    agentId: string,
    duration: number,
    iterations: number,
    inputTokens: number,
    outputTokens: number,
    costUsd: number,
    status: 'success' | 'failure' | 'timeout'
  ): void {
    const timestamp = new Date();

    this.recordMetric({
      name: 'agent_execution_duration_ms',
      value: duration,
      unit: 'ms',
      timestamp,
      labels: { agentId, status },
    });

    this.recordMetric({
      name: 'agent_iterations',
      value: iterations,
      timestamp,
      labels: { agentId },
    });

    this.recordMetric({
      name: 'agent_input_tokens',
      value: inputTokens,
      timestamp,
      labels: { agentId },
    });

    this.recordMetric({
      name: 'agent_output_tokens',
      value: outputTokens,
      timestamp,
      labels: { agentId },
    });

    this.recordMetric({
      name: 'agent_cost_usd',
      value: costUsd,
      unit: 'USD',
      timestamp,
      labels: { agentId },
    });

    this.recordMetric({
      name: 'agent_execution_count',
      value: 1,
      timestamp,
      labels: { agentId, status },
    });
  }

  /**
   * Record tool metrics
   */
  recordToolMetrics(
    toolName: string,
    duration: number,
    success: boolean
  ): void {
    const timestamp = new Date();

    this.recordMetric({
      name: 'tool_execution_duration_ms',
      value: duration,
      unit: 'ms',
      timestamp,
      labels: { toolName, status: success ? 'success' : 'failure' },
    });

    this.recordMetric({
      name: 'tool_execution_count',
      value: 1,
      timestamp,
      labels: { toolName, status: success ? 'success' : 'failure' },
    });
  }
}

/**
 * No-op metrics collector for testing
 */
export class NoOpMetricsCollector implements MetricsCollector {
  recordMetric(_metric: Metric): void {
    // No-op
  }

  getMetrics(): Metric[] {
    return [];
  }

  clear(): void {
    // No-op
  }
}
