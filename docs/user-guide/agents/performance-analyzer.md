# Performance Analyzer Agent

## Overview

The Performance Analyzer agent identifies performance bottlenecks, memory leaks, and optimization opportunities in your codebase. It uses profiling data, code analysis, and benchmarks to provide actionable performance insights.

## Capabilities

- Profile agent execution performance
- Identify memory leaks and excessive allocations
- Analyze algorithmic complexity
- Suggest caching strategies
- Recommend parallel processing opportunities
- Benchmark critical code paths

## Configuration

```typescript
const performanceAnalyzerConfig = {
  id: 'performance-analyzer',
  name: 'Performance Analyzer',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.3,
    maxTokens: 4096,
  },
  tools: ['readFile', 'ast-parser', 'metrics-calculator', 'bash-exec'],
  systemPrompt: `You are a performance engineering expert. Analyze code for
    performance issues and provide data-driven optimization recommendations.`,
  maxIterations: 10,
  timeout: 90000,
};
```

## Performance Targets

| Operation | Target Latency |
|-----------|---------------|
| Simple agent operations | <1s |
| IDE interactions | <500ms |
| Tool dispatch | <50ms |
| Cache lookup | <1ms |
| State transition | <1ms |

## Usage Examples

### Profile Agent Execution

```typescript
const result = await agent.execute(
  'Profile the agent execution pipeline and identify bottlenecks'
);
```

### Memory Analysis

```typescript
const result = await agent.execute(
  'Analyze memory usage patterns in the storage module'
);
```

### Optimization Recommendations

```typescript
const result = await agent.execute(
  'What operations should be cached to improve performance?'
);
```

## Built-in Profiling

Scalix Code includes a built-in profiler:

```typescript
import { Profiler, globalProfiler } from '@scalix/core/performance';

// Measure an async operation
const result = await globalProfiler.measure('my-operation', 'agent', async () => {
  return await someExpensiveOperation();
});

// Get performance summary
const summary = globalProfiler.getSummary();
console.log(`P95 latency: ${summary.p95}ms`);
console.log(`Bottlenecks:`, summary.bottlenecks);
```

## Caching Strategy

```typescript
import { LRUCache, createASTCache } from '@scalix/core/performance';

// Create a cache for expensive computations
const cache = new LRUCache({
  maxSize: 500,    // Maximum entries
  ttlMs: 300000,   // 5 minute TTL
});

// Use getOrSet for automatic caching
const result = await cache.getOrSet('cache-key', async () => {
  return await expensiveComputation();
});
```

## Best Practices

1. Profile before optimizing - measure, don't guess
2. Focus on the critical path first
3. Cache results of expensive operations
4. Use parallel processing for independent operations
5. Set performance budgets and monitor regression
