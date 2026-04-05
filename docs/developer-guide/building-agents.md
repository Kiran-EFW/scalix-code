# Building Custom Agents

## Overview

This guide walks you through creating custom agents for Scalix Code. Agents are AI-powered assistants that use tools to accomplish specific tasks.

## Agent Anatomy

Every agent consists of:

1. **Configuration** (`AgentConfig`): Model, tools, system prompt, limits
2. **Executor** (`AgentExecutor`): Runtime that manages the agent loop
3. **Context** (`ExecutorContext`): Dependencies (LLM, storage, tracing)

## Step-by-Step Guide

### 1. Define Agent Configuration

```typescript
import type { AgentConfig } from '@scalix/core/agent';

const myAgentConfig: AgentConfig = {
  id: 'my-custom-agent',
  name: 'My Custom Agent',
  description: 'A custom agent that does specific tasks',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.5,        // Lower = more deterministic
    maxTokens: 4096,         // Max response length
  },
  tools: ['readFile', 'writeFile', 'findInFiles'],
  systemPrompt: `You are a specialized agent for [specific domain].
    
    Your capabilities:
    1. [Capability 1]
    2. [Capability 2]
    
    Guidelines:
    - Always verify before making changes
    - Explain your reasoning
    - Handle errors gracefully`,
  maxIterations: 10,         // Max agent loop iterations
  timeout: 60000,            // 60 second timeout
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};
```

### 2. Register Required Tools

```typescript
import { ToolRegistry } from '@scalix/core/tools';

const registry = new ToolRegistry();

// Register built-in tools
await registry.registerBuiltins();

// Register custom tools
registry.register({
  name: 'my-custom-tool',
  description: 'Does something specific',
  parameters: [
    {
      name: 'input',
      type: 'string',
      description: 'The input to process',
      required: true,
    },
  ],
  execute: async (args) => {
    const input = args.input as string;
    // Tool logic here
    return { result: input.toUpperCase() };
  },
  timeout: 10000,
  rateLimit: { maxCalls: 50, windowMs: 60000 },
});
```

### 3. Create the Agent

```typescript
import { AgentExecutor } from '@scalix/core/agent';
import { InMemoryStorage } from '@scalix/core/storage';
import { DefaultTracer } from '@scalix/core/observability';

const agent = new AgentExecutor(myAgentConfig, {
  llmProvider: yourLLMProvider,
  storage: new InMemoryStorage(),
  logger: console,
  tracer: new DefaultTracer(),
  tools: registry,
});
```

### 4. Execute the Agent

```typescript
const result = await agent.execute('Process this input', {
  projectPath: '/path/to/project',
  additionalContext: 'any extra info',
});

if (result.status === 'success') {
  console.log('Output:', result.output);
  console.log('Tool calls:', result.toolCalls.length);
  console.log('Cost:', result.cost.costUSD);
} else {
  console.error('Failed:', result.error?.message);
}
```

## Agent Design Patterns

### Analyst Agent

Reads and analyzes code without making changes:

```typescript
const config = {
  tools: ['readFile', 'findInFiles', 'ast-parser', 'metrics-calculator'],
  systemPrompt: 'You analyze code and provide insights. Never modify files.',
  temperature: 0.3,  // Deterministic analysis
};
```

### Editor Agent

Makes targeted code changes:

```typescript
const config = {
  tools: ['readFile', 'writeFile', 'ast-parser', 'bash-exec'],
  systemPrompt: 'You make precise code changes. Always read before writing.',
  temperature: 0.2,  // Very deterministic
};
```

### Orchestrator Agent

Coordinates other agents:

```typescript
const config = {
  tools: ['readFile', 'findInFiles'],
  systemPrompt: 'You plan and delegate tasks. Break complex tasks into steps.',
  temperature: 0.5,
  maxIterations: 15,  // More iterations for planning
};
```

## System Prompt Best Practices

1. **Be specific**: Define exactly what the agent should and should not do
2. **Provide structure**: Give step-by-step instructions for common tasks
3. **Set boundaries**: Explicitly state limitations and constraints
4. **Include examples**: Show expected input/output formats
5. **Define error handling**: Tell the agent how to handle edge cases

## Tool Selection Guidelines

| Use Case | Recommended Tools |
|----------|------------------|
| Code analysis | `readFile`, `ast-parser`, `findInFiles` |
| Code modification | `readFile`, `writeFile`, `ast-parser` |
| Security review | `security-scanner`, `dependency-analyzer` |
| Testing | `bash-exec`, `readFile`, `writeFile` |
| Documentation | `readFile`, `writeFile`, `ast-parser` |

## Testing Your Agent

```typescript
import { describe, it, expect } from 'vitest';

describe('MyCustomAgent', () => {
  it('should handle basic input', async () => {
    const result = await agent.execute('Test input');
    expect(result.status).toBe('success');
    expect(result.output).toContain('expected content');
  });

  it('should handle errors gracefully', async () => {
    const result = await agent.execute('Invalid input that causes error');
    expect(result.error).toBeDefined();
  });
});
```

## Performance Optimization

1. **Minimize tool calls**: Design prompts that reduce unnecessary tool usage
2. **Use caching**: Cache AST and dependency analysis results
3. **Set appropriate timeouts**: Don't let agents run indefinitely
4. **Limit iterations**: Set `maxIterations` based on task complexity
5. **Choose the right model**: Use smaller models for simple tasks
