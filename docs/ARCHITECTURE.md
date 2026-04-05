# Scalix Code Architecture

## System Overview

Scalix Code is a conversational agent that understands your codebase and executes tasks.

```
User Input → CLI → Conversation Engine → Agent → Tools → Observability
```

## Core Components

### 1. CLI (Conversational Interface)
**Location:** `packages/cli/src/`

The terminal interface:
- Display prompt and format output
- Parse user input
- Handle confirmations
- Show agent responses

### 2. Conversation Engine
**Location:** `core/src/conversation/`

Manages multi-turn conversations:
- Session state and context
- Message routing
- Hook execution
- Tool coordination

### 3. Agent Layer
**Location:** `core/src/agent/`

The intelligent decision-maker:
- Main agent (general conversational)
- Specialist agents (security, performance)
- Tool selection and execution

### 4. Guardrails System
**Location:** `core/src/guardrails/`

Safety and compliance:
- Rule enforcement
- Confirmation gates
- CLAUDE.md compliance
- Audit logging

### 5. Tool Dispatch
**Location:** `core/src/tools/`

Executes tools safely:
- Bash execution
- Git operations
- File I/O
- API calls

### 6. Plugin System
**Location:** `core/src/plugins/`

Extensibility:
- Custom commands
- Specialized agents
- Lifecycle hooks
- MCP integration

### 7. Storage
**Location:** `core/src/storage/`

Persistence:
- Session history
- State snapshots
- Execution traces

### 8. Observability
**Location:** `core/src/observability/`

Visibility:
- Distributed tracing
- Metrics collection
- Structured logging

## Request Flow

```
User Input
  ↓
SessionStart Hooks
  ↓
Agent Analyzes Request
  ↓
Agent Executes Tools (with guardrails)
  ↓
SessionEnd Hooks
  ↓
Observability (log trace, metrics)
  ↓
Display Response
```

## Extension Points

### Hooks
- `SessionStart` / `SessionEnd`
- `PreToolUse` / `PostToolUse`
- `AgentInit` / `AgentShutdown`

### Custom Agents
Define specialized agents via plugins

### Commands
Add slash commands (`/test`, `/lint`)

### MCP Servers
Connect external services

## Configuration

**Location:** `~/.scalix/config.json`

```json
{
  "llmProvider": "anthropic",
  "modelId": "claude-3-5-sonnet-20241022",
  "guardrails": {
    "confirmDestructive": true,
    "enforceClaudeMd": true
  },
  "observability": {
    "tracingEnabled": true,
    "metricsEnabled": true
  }
}
```

## Design Principles

1. Single Responsibility - One job per module
2. Type Safety - 100% TypeScript, strict mode
3. Dependency Injection - No globals
4. Observable First - Built-in tracing
5. Secure by Default - Guardrails everywhere
6. Modular - Swappable components
7. Extensible - Safe plugins

---

See [GETTING_STARTED.md](GETTING_STARTED.md) and [PLUGINS.md](PLUGINS.md) for more details.
