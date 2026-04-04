# Scalix CLAW Architecture

**Version**: 0.1.0  
**Last Updated**: April 4, 2026

## Overview

Scalix CLAW is built around **three core architectural principles**:

1. **Modularity**: Each module is independent with clear boundaries
2. **Type Safety**: 100% TypeScript with strict mode, Zod validation
3. **Production Ready**: Observability, security, and error handling built-in

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  FRONTENDS                           │
├──────────┬──────────────┬────────────┬──────────────┤
│   CLI    │  Web UI      │  Desktop   │  IDE Plugins │
│ (Ink)    │  (React)     │ (Electron) │ (VS Code)    │
└────┬─────┴──────┬───────┴────┬───────┴──────┬───────┘
     │            │             │              │
     └────────────┼─────────────┼──────────────┘
                  │
        ┌─────────▼──────────┐
        │   REST/WS API      │
        │  (Express.js)      │
        └─────────┬──────────┘
                  │
    ┌─────────────▼──────────────────┐
    │    CORE DAEMON                   │
    ├──────────────────────────────────┤
    │ ┌─────────────────────────────┐  │
    │ │  AGENT RUNTIME              │  │
    │ ├──────────┬──────────────────┤  │
    │ │  Executor│  State Machine   │  │
    │ └──────────┴──────────────────┘  │
    │                                  │
    │ ┌─────────────────────────────┐  │
    │ │  ORCHESTRATION              │  │
    │ ├──────────┬──────────────────┤  │
    │ │ Sequential Parallel Tree    │  │
    │ │ Reactive   Mesh             │  │
    │ └──────────┴──────────────────┘  │
    │                                  │
    │ ┌─────────────────────────────┐  │
    │ │  TOOL DISPATCHER            │  │
    │ ├──────────┬──────────────────┤  │
    │ │ Registry │  Safety & Limits │  │
    │ └──────────┴──────────────────┘  │
    │                                  │
    │ ┌─────────────────────────────┐  │
    │ │  OBSERVABILITY              │  │
    │ ├──────────┬──────────────────┤  │
    │ │ Tracer   │ Metrics Logger   │  │
    │ └──────────┴──────────────────┘  │
    │                                  │
    │ ┌─────────────────────────────┐  │
    │ │  STORAGE                    │  │
    │ ├──────────┬──────────────────┤  │
    │ │ Memory   │ Checkpoints      │  │
    │ └──────────┴──────────────────┘  │
    │                                  │
    │ ┌─────────────────────────────┐  │
    │ │  PLUGINS & HOOKS            │  │
    │ ├──────────┬──────────────────┤  │
    │ │ Loader   │  Event Handlers  │  │
    │ └──────────┴──────────────────┘  │
    └──────────────────────────────────┘
                  │
    ┌─────────────┴──────────────────┐
    │   EXTERNAL SYSTEMS              │
    ├────────┬─────────┬──────┬───────┤
    │  MCP   │  Email  │ CRM  │ Data  │
    │Services│ Servers │Tools │ APIs  │
    └────────┴─────────┴──────┴───────┘
                  │
    ┌─────────────┴──────────────────┐
    │   INFRASTRUCTURE                │
    ├────────┬─────────┬──────┬───────┤
    │Database│ Message │Cache │Logging│
    │(PG)   │ Queue   │(Redis) Tracer │
    └────────┴─────────┴──────┴───────┘
```

---

## Core Modules

### 1. Agent Module (`core/agent/`)

**Responsibility**: Agent lifecycle and execution

**Key Components**:
- `Agent`: Interface that all agents implement
- `Executor`: Executes agent with tools, handles retries
- `StateMachine`: IDLE → EXECUTING → WAITING → COMPLETED
- `Types`: Agent configuration, execution results

**Design Pattern**: Dependency Injection
```typescript
class AgentExecutor {
  constructor(
    private tools: ToolRegistry,
    private tracer: Tracer,
    private storage: Storage,
    private logger: Logger
  ) {}

  async execute(agent: Agent, input: string): Promise<ExecutionResult> {
    // Execution logic with dependencies injected
  }
}
```

**Key Responsibilities**:
- ✅ Agent initialization and configuration
- ✅ LLM interaction and prompt engineering
- ✅ Tool call parsing and execution
- ✅ Iteration loop (think → plan → act → observe)
- ✅ Error handling and retries
- ✅ Tracing and observability

---

### 2. Orchestration Module (`core/orchestration/`)

**Responsibility**: Multi-agent coordination patterns

**Key Components**:
- `Coordinator`: Orchestrates multiple agents
- `Patterns`: Sequential, Parallel, Tree, Reactive, Mesh
- `Workflow`: Defined sequence of agent steps

**Patterns Explained**:

```typescript
// Sequential: Agent A → Agent B → Agent C
// Each agent waits for previous to complete
await coordinator.executeSequential([agentA, agentB, agentC], inputs);

// Parallel: All agents run simultaneously
// Wait for all to complete
await coordinator.executeParallel([agentA, agentB, agentC], inputs);

// Tree: Parent agent spawns child agents
// Parent coordinates results from children
await coordinator.executeTree(parentAgent, childAgentMap, inputs);

// Reactive: Agents respond to events in stream
// Each event triggers agent execution
await coordinator.executeReactive([agents], eventStream);

// Mesh: Complex graph of agent interactions
// Full bidirectional communication between agents
await coordinator.executeMesh(agentGraph, inputs);
```

**Design Pattern**: Strategy Pattern
```typescript
interface CoordinationStrategy {
  execute(agents: Agent[], inputs: Record<string, unknown>): Promise<Result>;
}

class SequentialStrategy implements CoordinationStrategy { }
class ParallelStrategy implements CoordinationStrategy { }
class TreeStrategy implements CoordinationStrategy { }
```

---

### 3. Tools Module (`core/tools/`)

**Responsibility**: Safe tool execution with rate limiting

**Key Components**:
- `ToolRegistry`: Register and retrieve tools
- `Dispatcher`: Execute tool calls safely
- `Safety`: Input validation, output limits
- `RateLimit`: Per-tool and per-agent limits

**Tool Safety Pipeline**:

```
Tool Call → Validate Input → Check Rate Limit → Execute
            ↓
        Too Large? → Error
        
            ↓
        Blocked Pattern? → Error
        
            ↓
        Rate Limited? → Error
        
            ↓
        Execute (with timeout)
        
            ↓
        Validate Output → Check Size → Return Result
```

**Design Pattern**: Registry Pattern + Decorator Pattern
```typescript
class SafeToolDispatcher implements ToolDispatcher {
  constructor(
    private registry: ToolRegistry,
    private safety: ToolSafety,
    private rateLimit: RateLimiter
  ) {}

  async dispatch(call: ToolCall): Promise<ToolResult> {
    // Check safety
    this.safety.validateInput(call);
    
    // Check rate limit
    await this.rateLimit.checkLimit(call.toolName);
    
    // Execute with timeout
    return await timeout(this.registry.execute(call), 30000);
  }
}
```

---

### 4. Observability Module (`core/observability/`)

**Responsibility**: Production observability

**Key Components**:
- `Tracer`: Distributed tracing (OpenTelemetry compatible)
- `MetricsCollector`: Prometheus metrics
- `Logger`: Structured logging (Winston/Pino)
- `CostTracker`: LLM token costs

**Observability Data Flow**:

```
Agent Execution
    ↓
Start Span (trace)
    ↓
Execute Steps
    ├─→ Record Events
    ├─→ Record Metrics
    ├─→ Record Logs
    └─→ Track Costs
    ↓
End Span
    ↓
Store Trace (Jaeger/Tempo)
    ↓
Visualize in Dashboard
```

**Key Metrics**:
- `agent.execution.duration`: How long agent ran
- `agent.execution.iterations`: Tool calls made
- `agent.tokens.input`: Input tokens
- `agent.tokens.output`: Output tokens
- `agent.cost.usd`: Total cost in USD
- `tool.execution.duration`: Tool call duration
- `tool.execution.errors`: Tool failures

---

### 5. Storage Module (`core/storage/`)

**Responsibility**: Persistent state management

**Key Components**:
- `Storage`: Abstract interface
- `AgentMemory`: Execution history, context
- `ExecutionCheckpoint`: Snapshot of state
- `DatabaseAdapter`: PostgreSQL, etc.

**Storage Model**:

```
┌─────────────────────────────────────┐
│        AGENT MEMORY                  │
├─────────────────────────────────────┤
│ Agent ID: agent-123                 │
│ Created: 2026-04-04                 │
│ Updated: 2026-04-04 16:30           │
│                                     │
│ EXECUTION HISTORY:                  │
│  [0] {"status":"success",...}       │
│  [1] {"status":"success",...}       │
│  [2] {"status":"failed",...}        │
│                                     │
│ CONTEXT:                            │
│  {"user_id":"user-123",...}        │
│  {"previous_output":"..."}          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    EXECUTION CHECKPOINT              │
├─────────────────────────────────────┤
│ Checkpoint ID: chk-456              │
│ Agent ID: agent-123                 │
│ State: {"iteration":5, "tools":[...]} │
│ Timestamp: 2026-04-04 16:20         │
└─────────────────────────────────────┘
```

---

### 6. Plugins Module (`core/plugins/`)

**Responsibility**: Extensibility

**Key Components**:
- `Plugin`: Interface for all plugins
- `PluginLoader`: Load plugins from directories
- `PluginRegistry`: Manage loaded plugins
- `HookSystem`: Event-driven automation

**Plugin Architecture** (from Claude Code):

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json              # Metadata
├── commands/
│   ├── command-name.md          # Slash command
│   └── ...
├── agents/
│   ├── agent-name.md            # Agent definition
│   └── ...
├── skills/
│   └── skill-name/SKILL.md      # Domain expertise
├── hooks/
│   ├── hooks.json               # Hook config
│   └── handlers/                # Event handlers
├── .mcp.json                    # MCP servers
└── README.md
```

**Hook Events**:
```typescript
enum HookEvent {
  AGENT_START = 'agent:start',      // Before agent executes
  AGENT_END = 'agent:end',          // After agent completes
  TOOL_CALL = 'tool:call',          // Before tool executes
  TOOL_RESULT = 'tool:result',      // After tool completes
  WORKFLOW_START = 'workflow:start', // Before workflow
  WORKFLOW_END = 'workflow:end',    // After workflow
  PLUGIN_LOAD = 'plugin:load',      // Plugin loaded
  PLUGIN_UNLOAD = 'plugin:unload',  // Plugin unloaded
}
```

---

### 7. API Module (`core/api/`)

**Responsibility**: REST and WebSocket interfaces

**REST Endpoints**:
```
POST   /agents              # Create agent
GET    /agents/:id          # Get agent
PUT    /agents/:id          # Update agent
DELETE /agents/:id          # Delete agent

POST   /agents/:id/execute  # Run agent
GET    /agents/:id/history  # Get execution history

POST   /workflows            # Create workflow
POST   /workflows/:id/run    # Execute workflow

GET    /tools               # List tools
POST   /tools/:name/call    # Execute tool directly

GET    /observability/traces   # Get traces
GET    /observability/metrics  # Get metrics
```

**WebSocket Events**:
```
// Agent execution stream
{
  "type": "agent.start",
  "agentId": "agent-123",
  "timestamp": "2026-04-04T16:30:00Z"
}

{
  "type": "agent.thinking",
  "agentId": "agent-123",
  "thought": "I should search for..."
}

{
  "type": "tool.call",
  "agentId": "agent-123",
  "toolName": "web_search",
  "arguments": {"query": "..."}
}

{
  "type": "agent.complete",
  "agentId": "agent-123",
  "status": "success",
  "output": "..."
}
```

---

## Data Flow Examples

### Simple Agent Execution

```
User Input
    ↓
REST API (POST /agents/agent-123/execute)
    ↓
Request Validation (Zod)
    ↓
Agent Executor
    ├─→ Start Trace Span
    ├─→ Get Agent from Storage
    ├─→ Initialize State Machine (IDLE → INITIALIZING)
    ├─→ Call LLM (Anthropic API)
    ├─→ Parse Tool Calls
    ├─→ For Each Tool Call:
    │   ├─→ Start Tool Span
    │   ├─→ Validate Input
    │   ├─→ Check Rate Limit
    │   ├─→ Execute Tool
    │   ├─→ Record Metrics
    │   ├─→ Save Result
    │   └─→ End Tool Span
    ├─→ Update State Machine (EXECUTING → WAITING/COMPLETED)
    ├─→ Save Execution Result
    ├─→ Save Trace
    ├─→ Calculate Cost
    ├─→ Record Final Metrics
    └─→ End Trace Span
    ↓
REST Response (ExecutionResult)
    ↓
Client
```

### Multi-Agent Workflow Execution

```
User Input
    ↓
Workflow Executor
    ├─→ Load Workflow Definition
    ├─→ For Each Step:
    │   ├─→ Load Agents
    │   ├─→ Apply Coordination Pattern
    │   │
    │   ├─ If Sequential:
    │   │   └─→ Execute agents one by one
    │   │
    │   ├─ If Parallel:
    │   │   ├─→ Start all agents concurrently
    │   │   ├─→ Wait for all to complete
    │   │   └─→ Aggregate results
    │   │
    │   └─ If Tree:
    │       ├─→ Start parent agent
    │       ├─→ Parent spawns child agents
    │       └─→ Parent coordinates results
    │
    ├─→ Pass results to next step
    └─→ Return final results
    ↓
Client
```

---

## Design Patterns Used

### 1. Dependency Injection
Modules receive dependencies as constructor arguments, not global singletons.

```typescript
class AgentService {
  constructor(
    private db: Database,
    private tracer: Tracer,
    private tools: ToolRegistry
  ) {}
}
```

### 2. Strategy Pattern
Multiple implementations of orchestration patterns.

```typescript
interface CoordinationStrategy {
  execute(agents: Agent[]): Promise<Result>;
}

class SequentialStrategy implements CoordinationStrategy { }
class ParallelStrategy implements CoordinationStrategy { }
```

### 3. Registry Pattern
Register and retrieve components dynamically.

```typescript
class ToolRegistry {
  private tools = new Map<string, Tool>();
  
  register(tool: Tool) { }
  get(name: string): Tool { }
  getAll(): Tool[] { }
}
```

### 4. Observer Pattern
Hooks and event systems.

```typescript
class EventEmitter {
  on(event: HookEvent, handler: Handler) { }
  emit(event: HookEvent, data: unknown) { }
}
```

### 5. Template Method Pattern
Plugin initialization lifecycle.

```typescript
interface Plugin {
  initialize?(): Promise<void>;  // Called on load
  shutdown?(): Promise<void>;    // Called on unload
  getCommands?(): CommandDefinition[];
  getAgents?(): AgentDefinition[];
}
```

---

## Performance Considerations

### 1. Concurrency
- Use async/await throughout
- Parallel agent execution via Promise.all()
- Connection pooling for database
- Message queue for long-running tasks

### 2. Memory
- Stream large responses (not all in memory)
- Pagination for history queries
- Cache frequently accessed data (LRU)
- Cleanup old traces/metrics

### 3. Scalability
- Stateless API servers (can scale horizontally)
- Database is central (vertical scaling + read replicas)
- Message queue for background jobs
- CDN for static assets

---

## Security Considerations

### 1. Input Validation
All inputs validated with Zod before processing.

```typescript
const agentConfig = AgentConfigSchema.parse(input);
```

### 2. Tool Safety
- Input size limits
- Output size limits
- Blocked patterns (e.g., `exec()`)
- Rate limiting per tool and agent

### 3. Authentication
- API key for CLI
- OAuth for web
- SSO for enterprise

### 4. Encryption
- TLS for all network communication
- Encrypted at rest for sensitive data
- Key rotation policies

---

## Testing Strategy

```
Unit Tests (40% coverage)
├─ Agent lifecycle
├─ Tool execution
├─ Validation
└─ State machine

Integration Tests (40% coverage)
├─ Agent + Tools
├─ Orchestration patterns
├─ Storage persistence
└─ API endpoints

E2E Tests (20% coverage)
├─ Complete workflows
├─ Plugin loading
├─ Multi-agent scenarios
└─ Error recovery
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│               CLIENT LAYER                          │
├──────────────────────────────────────────────────────┤
│ Web UI (React) │ CLI (Node) │ Desktop │ IDE Plugins │
└────────┬───────────────────────────────┬────────────┘
         │ HTTPS/WSS                      │
    ┌────▼─────────────────────────────────▼────┐
    │         API GATEWAY (Nginx)               │
    │ Rate Limit | Auth | Request Routing      │
    └────┬──────────────────────────────────┬───┘
         │                                   │
    ┌────▼────────────┐    ┌────────────────▼────┐
    │ Daemon Service  │    │  Daemon Service     │
    │ (Kubernetes)    │    │  (Kubernetes)       │
    │ Replicas: 3-10  │    │  Replicas: 3-10     │
    └────┬────────────┘    └────────────┬────────┘
         │                              │
    ┌────▼──────────────────────────────▼────┐
    │      Message Queue (RabbitMQ/Redis)    │
    │  Long-running tasks, event distribution│
    └────┬───────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────────┐
    │         Data Layer                          │
    ├──────────────┬──────────────┬───────────────┤
    │ PostgreSQL   │ Redis Cache  │ S3 Artifacts  │
    │ (Replicated) │ (Replicated) │ (Backup)      │
    └──────────────┴──────────────┴───────────────┘
         │
    ┌────▼───────────────────────────────┐
    │    Observability Stack              │
    ├────────────┬──────────────┬────────┤
    │ Jaeger     │ Prometheus   │ Loki   │
    │ (Traces)   │ (Metrics)    │ (Logs) │
    └────────────┴──────────────┴────────┘
```

---

## Future Architecture Enhancements

### 1. Distributed Execution
- Agents execute on edge nodes
- Remote tool execution
- P2P agent communication

### 2. Advanced Orchestration
- Temporal workflow support
- Graph execution engine
- Conditional branching

### 3. Learning & Optimization
- Agent performance analytics
- Auto-tuning of model parameters
- Cost optimization

### 4. Compliance
- GDPR-compliant data deletion
- SOX audit trails
- HIPAA encryption

---

*For more information, see [VISION.md](../VISION.md) and [API.md](./API.md)*
