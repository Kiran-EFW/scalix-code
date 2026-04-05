# Monitoring Guide

## Overview

Scalix Code provides built-in observability through distributed tracing, Prometheus-compatible metrics, and structured logging.

## Metrics

### Available Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `agent_execution_duration_ms` | Gauge | `agentId`, `status` | Agent execution time |
| `agent_iterations` | Gauge | `agentId` | Iterations per execution |
| `agent_input_tokens` | Gauge | `agentId` | Input tokens consumed |
| `agent_output_tokens` | Gauge | `agentId` | Output tokens generated |
| `agent_cost_usd` | Gauge | `agentId` | Execution cost in USD |
| `agent_execution_count` | Counter | `agentId`, `status` | Total executions |
| `tool_execution_duration_ms` | Gauge | `toolName`, `status` | Tool execution time |
| `tool_execution_count` | Counter | `toolName`, `status` | Total tool executions |

### Prometheus Integration

```typescript
import { DefaultMetricsCollector } from '@scalix/core/observability';

const collector = new DefaultMetricsCollector();

// Record metrics during operation
collector.recordAgentMetrics('agent-1', 500, 3, 1000, 500, 0.05, 'success');

// Export for Prometheus scraping
app.get('/metrics', (req, res) => {
  res.type('text/plain');
  res.send(collector.exportPrometheus());
});
```

### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'scalix-code'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Grafana Dashboard

Key panels to configure:

1. **Agent Execution Rate**: `rate(agent_execution_count[5m])`
2. **P95 Latency**: `histogram_quantile(0.95, agent_execution_duration_ms)`
3. **Error Rate**: `rate(agent_execution_count{status="failure"}[5m])`
4. **Cost per Hour**: `sum(rate(agent_cost_usd[1h]))`
5. **Token Usage**: `sum(rate(agent_input_tokens[5m])) + sum(rate(agent_output_tokens[5m]))`

## Distributed Tracing

### Trace Structure

```
agent.execute (root span)
├── agent.iteration.1
│   ├── llm.call
│   ├── tool.execute (readFile)
│   └── tool.execute (ast-parser)
├── agent.iteration.2
│   ├── llm.call
│   └── tool.execute (writeFile)
└── agent.iteration.3
    └── llm.call (final response)
```

### Using the Tracer

```typescript
import { DefaultTracer } from '@scalix/core/observability';

const tracer = new DefaultTracer();

// Start a trace
const span = tracer.startSpan('operation', { key: 'value' });

// Record events
tracer.recordEvent(span, {
  name: 'checkpoint',
  timestamp: new Date(),
  attributes: { step: 'validation' },
});

// End the trace
tracer.endSpan(span, 'success');

// Export traces
const traces = tracer.exportJSON();
```

## Logging

### Log Levels

| Level | Use Case |
|-------|----------|
| `debug` | Detailed debugging (development only) |
| `info` | Normal operations, execution start/end |
| `warn` | Degraded performance, approaching limits |
| `error` | Failures, exceptions, data loss |

### Structured Log Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Agent test-agent completed execution",
  "context": {
    "agentId": "test-agent",
    "status": "success",
    "duration": 1234,
    "iterations": 3,
    "cost": 0.05
  }
}
```

## Alerting

### Recommended Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | Error rate > 10% over 5 minutes | Critical |
| High Latency | P95 > 30 seconds | Warning |
| High Cost | Hourly cost > $10 | Warning |
| Memory Usage | Heap > 80% of limit | Warning |
| Agent Timeout | Timeout rate > 5% | Warning |
| Tool Failures | Any tool failure rate > 20% | Warning |

## Performance Profiling

```typescript
import { globalProfiler } from '@scalix/core/performance';

// Enable profiling
globalProfiler.setEnabled(true);

// ... run operations ...

// Get summary
const summary = globalProfiler.getSummary();
console.log('Performance Summary:');
console.log(`  Total Duration: ${summary.totalDuration}ms`);
console.log(`  P50: ${summary.p50}ms`);
console.log(`  P95: ${summary.p95}ms`);
console.log(`  P99: ${summary.p99}ms`);
console.log(`  Memory Peak: ${(summary.memoryPeak / 1024 / 1024).toFixed(1)}MB`);
console.log('  Bottlenecks:');
summary.bottlenecks.forEach((b) => {
  console.log(`    ${b.name}: ${b.duration.toFixed(1)}ms (${b.percentage.toFixed(1)}%)`);
});
```
