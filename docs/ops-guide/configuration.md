# Configuration Guide

## Configuration Hierarchy

Scalix Code loads configuration from multiple sources (in priority order):

1. Environment variables (highest priority)
2. `.env` file in project root
3. `scalix.config.ts` or `scalix.config.json`
4. Default values

## Agent Configuration

### Model Configuration

```typescript
const modelConfig = {
  provider: 'anthropic',           // LLM provider
  model: 'claude-3-sonnet-20240229', // Model ID
  temperature: 0.7,                // Creativity (0.0-1.0)
  maxTokens: 4096,                 // Max response tokens
  topP: 0.95,                      // Nucleus sampling
  topK: 40,                        // Top-K sampling
};
```

### Supported Models

| Provider | Model | Use Case |
|----------|-------|----------|
| Anthropic | `claude-3-opus-20240229` | Complex reasoning, architecture |
| Anthropic | `claude-3-sonnet-20240229` | General purpose, balanced |
| OpenAI | `gpt-4` | Complex tasks |
| OpenAI | `gpt-3.5-turbo` | Simple tasks, fast response |
| Google | `gemini-2-flash` | Fast, cost-effective |
| Local | Custom | Privacy-sensitive workloads |

### Execution Limits

```typescript
const executionConfig = {
  maxIterations: 10,      // Maximum agent loop iterations
  timeout: 60000,         // Execution timeout (ms)
  retryPolicy: {
    maxAttempts: 3,        // Retry count
    backoffMs: 1000,       // Initial backoff
    backoffMultiplier: 2,  // Exponential backoff multiplier
  },
};
```

## Tool Configuration

### Rate Limiting

```typescript
const toolConfig = {
  rateLimit: {
    maxCalls: 100,        // Maximum calls
    windowMs: 60000,      // Per time window (ms)
  },
  timeout: 30000,         // Tool execution timeout (ms)
};
```

### Input Validation

The dispatcher enforces:
- Maximum input length: 10,000 characters
- Blocked patterns: `eval()`, `exec()`, `subprocess`, `os.system`

## Observability Configuration

### Logging

```typescript
const loggingConfig = {
  level: 'info',           // debug, info, warn, error
  format: 'json',          // json or text
  output: 'stdout',        // stdout, file, or both
};
```

### Metrics

```typescript
const metricsConfig = {
  enabled: true,
  maxMetrics: 10000,       // Maximum metrics in memory
  exportInterval: 30000,   // Export interval (ms)
  format: 'prometheus',    // prometheus or json
};
```

### Tracing

```typescript
const tracingConfig = {
  enabled: true,
  sampleRate: 1.0,         // 100% sampling
  exportFormat: 'json',    // json or otlp
};
```

## Performance Configuration

### Cache Settings

```typescript
const cacheConfig = {
  ast: {
    maxSize: 500,          // Maximum cached AST results
    ttlMs: 300000,         // 5 minute TTL
  },
  dependency: {
    maxSize: 100,          // Maximum cached dep results
    ttlMs: 600000,         // 10 minute TTL
  },
};
```

### Parallel Processing

```typescript
const parallelConfig = {
  concurrency: 10,         // Maximum concurrent operations
  taskTimeout: 30000,      // Per-task timeout (ms)
};
```

## Storage Configuration

### In-Memory (Development)

```typescript
import { InMemoryStorage } from '@scalix/core/storage';
const storage = new InMemoryStorage();
```

### PostgreSQL (Production)

```typescript
// Configure via DATABASE_URL environment variable
// DATABASE_URL=postgresql://user:pass@host:5432/scalix
```

## Security Configuration

### Guardrails

```typescript
const guardrailsConfig = {
  maxInputLength: 10000,
  maxOutputLength: 50000,
  blockedTools: [],              // Tools to block
  allowedPatterns: ['*'],        // Allowed input patterns
  sandbox: true,                 // Enable sandboxed execution
};
```

### Plugin Sandbox

```typescript
const pluginConfig = {
  allowDynamicLoading: false,    // Disable loading from paths
  trustedPlugins: ['official-*'], // Trusted plugin patterns
  maxPlugins: 20,                // Maximum loaded plugins
};
```
