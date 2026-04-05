# Architecture Guide

## System Architecture

Scalix Code is built as a modular TypeScript monorepo using a layered architecture pattern. Each layer has clear responsibilities and depends only on layers below it.

## Layer Overview

```
┌─────────────────────────────────────────────────────┐
│ Layer 5: Frontends                                   │
│ CLI, VS Code Extension, Web Dashboard                │
├─────────────────────────────────────────────────────┤
│ Layer 4: API                                         │
│ REST endpoints, WebSocket, SDK                       │
├─────────────────────────────────────────────────────┤
│ Layer 3: Orchestration                               │
│ Workflow coordination, multi-agent patterns           │
├─────────────────────────────────────────────────────┤
│ Layer 2: Agent Runtime                               │
│ AgentExecutor, StateMachine, LLMProvider              │
├─────────────────────────────────────────────────────┤
│ Layer 1: Foundation                                   │
│ Tools, Storage, Observability, Plugins, Performance   │
└─────────────────────────────────────────────────────┘
```

## Module Details

### Agent Module (`core/src/agent/`)

The agent module implements the core execution engine:

- **`executor.ts`**: `AgentExecutor` - Main execution engine implementing the agent loop:
  1. Initialize state and load memory
  2. Build message history with system prompt
  3. Call LLM provider
  4. Process tool calls if any
  5. Loop until completion or max iterations
  6. Calculate cost and save results

- **`state-machine.ts`**: `AgentStateMachine` - Enforces valid state transitions:
  ```
  IDLE -> INITIALIZING -> EXECUTING -> WAITING -> EXECUTING -> COMPLETED
                                    -> PAUSED -> EXECUTING
                                    -> ERRORED
                                    -> CANCELLED
  ```

- **`types.ts`**: Core type definitions (`Agent`, `AgentConfig`, `ExecutionResult`, `Cost`)

### Tools Module (`core/src/tools/`)

The tools module provides the extensible tool system:

- **`registry.ts`**: `ToolRegistry` - Tool registration, lookup, and execution
- **`dispatcher.ts`**: `ToolDispatcher` - Safe execution with rate limiting and input validation
- **`ast-parser.ts`**: AST parsing using ts-morph and Babel
- **`dependency-analyzer.ts`**: Multi-language dependency analysis (npm, Python, Go)
- **`security-scanner.ts`**: Pattern-based security vulnerability detection
- **`types.ts`**: Tool interfaces (`Tool`, `ToolCall`, `ToolRegistry`)

### Orchestration Module (`core/src/orchestration/`)

Multi-agent coordination patterns:

- **`coordinator.ts`**: `WorkflowCoordinator` - Implements coordination patterns:
  - **Sequential**: Agents execute one after another, passing results
  - **Parallel**: All agents execute simultaneously
  - **Tree**: Hierarchical execution with parent-child relationships
  - **Reactive**: Event-driven execution from async streams
  - **Mesh**: Fully connected parallel execution

### Observability Module (`core/src/observability/`)

Production-grade monitoring:

- **`tracer.ts`**: `DefaultTracer` - Distributed tracing with span hierarchy
- **`metrics.ts`**: `DefaultMetricsCollector` - Prometheus-compatible metrics
- **`logger.ts`**: Structured logging interface

### Storage Module (`core/src/storage/`)

Persistent state management:

- **`storage.ts`**: `InMemoryStorage` - In-memory implementation (swap for PostgreSQL in production)
- Agent memory, execution results, and checkpoints

### Performance Module (`core/src/performance/`)

Performance optimization utilities:

- **`profiler.ts`**: `Profiler` - Timer-based profiling with memory tracking
- **`cache.ts`**: `LRUCache` - LRU cache with TTL and statistics
- **`parallel.ts`**: Parallel processing with concurrency control

### Plugin Module (`core/src/plugins/`)

Plugin system for extensibility:

- **`loader.ts`**: `PluginLoader` - Dynamic plugin lifecycle management
- **`types.ts`**: Plugin interfaces (commands, agents, skills, hooks)

## Key Design Decisions

### 1. State Machine for Agent Lifecycle

The agent uses an explicit state machine instead of ad-hoc status flags. This ensures:
- Invalid state transitions are caught immediately
- Lifecycle events are well-defined
- Concurrent access patterns are safer

### 2. Separation of Registry and Dispatcher

Tools are registered in the `ToolRegistry` but executed through the `ToolDispatcher`. This separation enables:
- Input validation before execution
- Rate limiting per tool
- Timeout enforcement
- Error isolation

### 3. In-Memory Storage with Interface Abstraction

The `Storage` interface is implemented with `InMemoryStorage` for development and testing. Production deployments swap this for `PostgresStorage` without changing any business logic.

### 4. LRU Cache with TTL

The caching system uses a combined LRU + TTL eviction strategy:
- LRU ensures the most-used items stay cached
- TTL prevents stale data from being served
- Statistics enable cache hit rate monitoring

### 5. Parallel Processing with Concurrency Control

The `parallelMap` utility provides safe parallel execution:
- Configurable concurrency limits
- Per-task timeouts
- Abort signal support
- Error isolation (one failure doesn't stop others)

## Data Flow

### Agent Execution Flow

```
User Input
    │
    ▼
AgentExecutor.execute()
    │
    ├── StateMachine: IDLE → INITIALIZING
    ├── Storage.loadMemory()
    ├── Build messages (system prompt + input)
    │
    ▼
Agent Loop (max iterations)
    │
    ├── StateMachine: INITIALIZING → EXECUTING
    ├── Tracer.startSpan("llm.call")
    ├── LLMProvider.call(messages, tools)
    ├── Tracer.endSpan()
    │
    ├── If no tool calls → COMPLETED
    │
    ├── For each tool call:
    │   ├── Tracer.startSpan("tool.execute")
    │   ├── ToolRegistry.execute(toolCall)
    │   │   ├── InputValidator.validate()
    │   │   ├── RateLimiter.isAllowed()
    │   │   └── Tool.execute(args)
    │   └── Tracer.endSpan()
    │
    ├── Add tool results to messages
    ├── StateMachine: EXECUTING → WAITING → EXECUTING
    └── Continue loop
    │
    ▼
Result
    │
    ├── Calculate cost
    ├── Storage.saveExecutionResult()
    ├── Storage.saveMemory()
    ├── Metrics.recordAgentMetrics()
    └── Return ExecutionResult
```

## Monorepo Structure

```
scalix-code/
├── core/              # Core runtime engine
├── packages/
│   ├── api/           # REST/WebSocket API server
│   ├── cli/           # CLI interface
│   ├── sdk/           # Client SDK
│   ├── schemas/       # Shared schemas
│   ├── testing/       # Test utilities and mocks
│   ├── utils/         # Shared utilities
│   └── types/         # Shared type definitions
├── plugins/           # Official plugins
├── frontends/
│   └── vscode-extension/  # VS Code integration
├── examples/          # Example projects
└── docs/              # Documentation
```

## Dependency Rules

1. `core` has no dependencies on `packages/*` or `frontends/*`
2. `packages/*` may depend on `core` and other `packages/*`
3. `frontends/*` may depend on `packages/*` and `core`
4. `plugins/*` depend only on `core` types
5. `examples/*` may depend on any published package
