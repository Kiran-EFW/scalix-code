# Troubleshooting Guide

## Common Issues

### Installation Issues

#### `pnpm install` fails with dependency resolution errors

```
ERR_PNPM_PEER_DEP_ISSUES
```

**Solution**: Ensure you're using pnpm >= 8.0.0 and Node.js >= 20.0.0:

```bash
node --version  # Should be >= 20.0.0
pnpm --version  # Should be >= 8.0.0
```

If versions are correct, try:
```bash
pnpm install --no-frozen-lockfile
```

#### TypeScript compilation errors after install

**Solution**: Run a clean build:
```bash
pnpm clean
pnpm install
pnpm build
```

### Agent Execution Issues

#### Agent execution times out

**Symptoms**: `ExecutionResult.status === 'failed'` with `error: "Execution timeout"`

**Causes**:
- LLM provider response is slow
- Too many tool calls in a single execution
- Network connectivity issues

**Solutions**:
1. Increase timeout in agent config: `timeout: 120000`
2. Reduce `maxIterations` to limit tool call rounds
3. Check network connectivity to LLM provider
4. Use a faster model (e.g., `gpt-3.5-turbo` vs `gpt-4`)

#### Agent produces empty output

**Causes**:
- Missing or invalid API key
- System prompt is too restrictive
- LLM model returned no content

**Solutions**:
1. Verify API key in `.env` file
2. Test API key with a simple direct call
3. Review and adjust the system prompt
4. Check LLM provider status page

#### State transition errors

```
Error: Invalid state transition: completed -> executing
```

**Solution**: The agent state machine enforces valid transitions. If you see this error:
1. Check that you're not reusing a completed agent without resetting
2. Create a new `AgentExecutor` instance for each execution
3. Call `stateMachine.reset()` if reuse is required

### Tool Issues

#### Tool not found error

```
Error: Tool not found: my-custom-tool
```

**Solutions**:
1. Register the tool before creating the agent:
   ```typescript
   registry.register(myTool);
   ```
2. Verify the tool name matches exactly (case-sensitive)
3. Check that `registry.registerBuiltins()` was called if using built-in tools

#### Tool rate limit exceeded

```
Error: Rate limit exceeded for tool-name
```

**Solution**: Wait for the rate limit window to reset, or adjust the rate limit:
```typescript
registry.register({
  ...myTool,
  rateLimit: { maxCalls: 100, windowMs: 60000 }, // 100 calls per minute
});
```

#### Tool execution blocked by input validation

```
Error: Input contains blocked pattern for tool-name
```

**Solution**: The input validator blocks potentially dangerous patterns (`eval()`, `exec()`, etc.). If these are legitimate:
1. Review the input for actual security issues
2. Ensure you're not passing user input directly without sanitization

### Performance Issues

#### High memory usage

**Solutions**:
1. Clear caches periodically: `cache.clear()` or `cache.prune()`
2. Limit metrics collector: max 10000 metrics are kept by default
3. Clear agent execution history: `agent.clearHistory()`
4. Reduce `maxIterations` to limit conversation length

#### Slow tool execution

**Solutions**:
1. Enable caching for expensive operations:
   ```typescript
   const cache = createASTCache();
   const result = await cache.getOrSet(filePath, () => parser.parse(filePath));
   ```
2. Use parallel processing for independent operations
3. Check the profiler for bottlenecks:
   ```typescript
   const summary = globalProfiler.getSummary();
   console.log(summary.bottlenecks);
   ```

### Plugin Issues

#### Plugin fails to load

```
Error: Dynamic plugin loading from paths requires a full implementation
```

**Solution**: Currently, plugins must be loaded as objects, not from file paths:
```typescript
const plugin = createPlugin({ name: 'my-plugin', version: '1.0.0' });
await loader.load(plugin);
```

#### Plugin already loaded

```
Error: Plugin already loaded: my-plugin
```

**Solution**: Unload the plugin first:
```typescript
await loader.unload('my-plugin');
await loader.load(newPluginVersion);
```

### Observability Issues

#### Traces not appearing

**Solutions**:
1. Ensure you're using `DefaultTracer`, not `NoOpTracer`
2. Call `tracer.endSpan()` to complete spans
3. Check `tracer.getTraces()` to verify collection

#### Metrics export is empty

**Solutions**:
1. Verify metrics are being recorded: `collector.getMetrics().length`
2. Check that the correct metric name is used in queries
3. Ensure timestamps are valid `Date` objects

## Debugging Tips

### Enable Debug Logging

```typescript
const logger = {
  debug: (msg, ctx) => console.log('[DEBUG]', msg, ctx),
  info: (msg, ctx) => console.log('[INFO]', msg, ctx),
  warn: (msg, ctx) => console.warn('[WARN]', msg, ctx),
  error: (msg, err) => console.error('[ERROR]', msg, err),
};
```

### Inspect Agent State

```typescript
const executor = new AgentExecutor(config, context);
console.log('Current state:', executor.getState());
console.log('History:', executor.getHistory());
```

### Profile Operations

```typescript
import { globalProfiler } from '@scalix/core/performance';

// Enable profiling
globalProfiler.setEnabled(true);

// Run operations...

// Check results
const summary = globalProfiler.getSummary();
console.log('Total duration:', summary.totalDuration, 'ms');
console.log('P95 latency:', summary.p95, 'ms');
console.log('Bottlenecks:', summary.bottlenecks);
```

## Getting Help

1. Check the [GitHub Issues](https://github.com/scalix-org/scalix-code/issues)
2. Search existing issues before creating new ones
3. Include: error message, stack trace, configuration, and steps to reproduce
4. Use the `bug` label for bug reports and `question` for questions
