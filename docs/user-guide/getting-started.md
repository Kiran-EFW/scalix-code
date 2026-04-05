# Getting Started with Scalix Code

## What is Scalix Code?

Scalix Code is an open-source, self-hosted AI agent orchestration platform for software engineering. It provides a modular framework for building, running, and coordinating AI agents that assist with code analysis, generation, testing, security scanning, and more.

Unlike cloud-only solutions, Scalix Code runs entirely in your infrastructure, giving you full control over data, models, and execution.

## Key Features

- **Agent Orchestration**: Run multiple AI agents with sequential, parallel, tree, reactive, and mesh coordination patterns
- **Tool System**: Extensible tools for file operations, AST parsing, dependency analysis, security scanning, and more
- **Safety Guardrails**: Built-in input validation, rate limiting, execution sandboxing, and blocked pattern detection
- **Observability**: Distributed tracing, Prometheus-compatible metrics, and structured logging
- **Plugin System**: Extend functionality with custom agents, tools, commands, and hooks
- **Multi-Provider LLM Support**: Anthropic, OpenAI, Google, and local model support
- **Performance**: LRU caching, parallel processing, and profiling utilities

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- An API key from a supported LLM provider

### Installation

```bash
# Clone the repository
git clone https://github.com/scalix-org/scalix-code.git
cd scalix-code

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Environment Setup

Create a `.env` file in the project root:

```env
# LLM Provider Configuration
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional: Google AI
GOOGLE_AI_API_KEY=...

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

### Your First Agent

```typescript
import { AgentExecutor, ToolRegistry, InMemoryStorage, DefaultTracer } from '@scalix/core';

// 1. Set up dependencies
const registry = new ToolRegistry();
await registry.registerBuiltins();

const storage = new InMemoryStorage();
const tracer = new DefaultTracer();

// 2. Configure the agent
const config = {
  id: 'my-first-agent',
  name: 'Hello Agent',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 4096,
  },
  tools: ['echo', 'get_current_time'],
  systemPrompt: 'You are a helpful assistant. Use the available tools to answer questions.',
  maxIterations: 5,
  timeout: 30000,
};

// 3. Create and execute
const agent = new AgentExecutor(config, {
  llmProvider: yourLLMProvider,
  storage,
  logger: console,
  tracer,
  tools: registry,
});

const result = await agent.execute('What time is it?');
console.log(result.output);
console.log(`Duration: ${result.duration}ms, Cost: $${result.cost.costUSD}`);
```

## Architecture Overview

Scalix Code follows a modular architecture:

```
┌──────────────────────────────────────────────────┐
│                   Frontends                       │
│  CLI  │  VS Code Extension  │  Web Dashboard     │
├──────────────────────────────────────────────────┤
│                    API Layer                      │
│           REST + WebSocket + SDK                  │
├──────────────────────────────────────────────────┤
│               Orchestration Layer                 │
│  Sequential │ Parallel │ Tree │ Reactive │ Mesh  │
├──────────────────────────────────────────────────┤
│                  Agent Runtime                    │
│  Executor │ State Machine │ LLM Provider         │
├──────────────────────────────────────────────────┤
│                  Tool System                      │
│  Registry │ Dispatcher │ Rate Limiter │ Sandbox  │
├──────────────────────────────────────────────────┤
│               Core Services                       │
│  Storage │ Observability │ Plugins │ Performance  │
└──────────────────────────────────────────────────┘
```

### Core Modules

| Module | Description |
|--------|-------------|
| `@scalix/core/agent` | Agent executor, state machine, LLM providers |
| `@scalix/core/tools` | Tool registry, dispatcher, built-in tools |
| `@scalix/core/orchestration` | Multi-agent coordination patterns |
| `@scalix/core/observability` | Tracing, metrics, logging |
| `@scalix/core/storage` | Persistent state management |
| `@scalix/core/plugins` | Plugin loading and management |
| `@scalix/core/performance` | Profiling, caching, parallel processing |

## Next Steps

- [Agent Configuration](./agents/) - Deep dive into agent setup
- [Tool Reference](./tools/) - All available tools
- [IDE Extensions](./ide-extensions/) - VS Code integration
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Support

- GitHub Issues: [scalix-org/scalix-code](https://github.com/scalix-org/scalix-code/issues)
- Documentation: [scalix-code.dev](https://scalix-code.dev)
