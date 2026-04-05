# Scalix Code

**An open-source, self-hosted alternative to Claude Code.**

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)]()

## What is Scalix Code?

A conversational CLI tool that understands your codebase and executes tasks safely and reliably. Like Claude Code, but open-source, self-hosted, and extensible.

**Core capabilities:**
- Conversational interface that understands your code
- Execute tasks (bash, git, file operations)
- Safety guardrails and confirmations
- Extensible plugin system
- Enterprise observability (tracing, metrics, costs)

## Key Features

### Conversational Interface
- **Natural language control** - "write tests for src/auth.ts", "analyze this for security"
- **Multi-turn context** - understands your project and remembers conversation
- **Smart tool selection** - knows when to run bash, modify files, or commit to git

### Safety First
- **Confirmation gates** - requires confirmation for destructive operations
- **Project guidelines** - respects CLAUDE.md rules and custom guardrails
- **Audit trail** - every action is logged for compliance
- **Role-based access** - enterprise RBAC support

### Extensible
- **Plugin system** - build custom commands, agents, and skills
- **MCP integrations** - connect to external services (email, calendar, etc)
- **Hook system** - event-driven automation
- **Marketplace** - share and discover plugins

### Observable
- **Tracing** - detailed execution traces for every operation
- **Metrics** - latency, tokens used, cost per operation
- **Logging** - structured logs with context
- **Dashboards** - real-time monitoring and alerts

## Project Structure

```
scalix-code/
├── core/src/
│   ├── agent/           # Agent executor and lifecycle
│   ├── conversation/    # Multi-turn conversation engine
│   ├── guardrails/      # Safety rules and communication
│   ├── tools/           # Tool dispatch (bash, git, file, api)
│   ├── plugins/         # Plugin loading system
│   ├── api/             # REST API
│   ├── storage/         # State persistence
│   └── observability/   # Tracing, metrics, logging
│
├── packages/
│   ├── cli/             # Command-line interface
│   ├── api/             # API server
│   ├── sdk/             # TypeScript SDK
│   ├── schemas/         # Type definitions
│   └── testing/         # Test utilities
│
├── docs/                # User documentation
├── examples/            # Usage examples
└── .github/             # CI/CD workflows
```

## Architecture

```
┌──────────────────────────────────────────┐
│      Scalix Code CLI (REPL)              │
│   (Terminal Interface)                   │
└──────────────────────┬───────────────────┘
                       ↓
┌──────────────────────────────────────────┐
│   Conversation Engine                    │
│   (Multi-turn context management)        │
└──────────────────────┬───────────────────┘
                       ↓
   ┌──────────────┬────────────┬──────────┐
   ↓              ↓            ↓          ↓
┌──────┐   ┌──────────┐   ┌────────┐  ┌────┐
│Agent │   │Guardrails│   │Plugins │  │Tools│
│Layer │   │System    │   │System  │  │Disp │
└──────┘   └──────────┘   └────────┘  └────┘
   ↓              ↓            ↓          ↓
   └──────────────┬────────────┬──────────┘
                  ↓
         ┌────────────────────┐
         │ Observability      │
         │ (Tracing, Metrics) │
         └────────────────────┘
```

## Quick Start

### Install

```bash
npm install -g scalix-code
```

### Run

```bash
scalix-code
```

### Start Conversing

```
> analyze this codebase for security issues
> write unit tests for src/auth.ts
> create a PR with these changes
> show me the git log
```

Scalix Code will:
- Understand your codebase structure
- Execute commands safely
- Ask for confirmation on destructive operations
- Show you exactly what it's doing

## Documentation

| Guide | Purpose |
|-------|---------|
| [Getting Started](docs/GETTING_STARTED.md) | Install, configure, first command |
| [Architecture](docs/ARCHITECTURE.md) | How it works under the hood |
| [Building Plugins](docs/PLUGINS.md) | Create custom commands and agents |
| [Guardrails](docs/GUARDRAILS.md) | Safety system and confirmations |
| [API Reference](docs/API.md) | REST API for automation |

## Development

### Setup

```bash
git clone https://github.com/scalix-org/scalix-code
cd scalix-code
npm install
npm run build
```

### Commands

```bash
npm run dev        # Development mode
npm test           # Run tests
npm run build      # Build for production
npm run lint       # Check code quality
```

### Code Standards

- **100% TypeScript** - strict mode, no `any` types
- **Zod validation** - all inputs validated
- **Tests first** - test before implementation
- **Modular** - single responsibility per module
- **No globals** - dependency injection throughout

## Comparison with Claude Code

| Feature | Scalix Code | Claude Code |
|---------|-------------|------------|
| **Open Source** | ✅ Yes | ❌ No |
| **Self-Hosted** | ✅ Yes | ❌ SaaS only |
| **Extensible** | ✅ Plugins + Custom Agents | ✅ Plugins |
| **Guardrails** | ✅ Comprehensive | ⚠️ Basic |
| **Observable** | ✅ Full tracing, metrics | ❌ Limited |
| **REST API** | ✅ Yes | ❌ No |
| **Cost Tracking** | ✅ Per-operation | ❌ No |

## Roadmap

| Version | Target | Focus |
|---------|--------|-------|
| v0.5.0 | Apr 2026 | Safety & Guardrails |
| v0.6.0 | May 2026 | Multi-Agent Coordination |
| v0.7.0 | Jun 2026 | Enterprise Features (RBAC, SSO) |
| v1.0.0 | Jul 2026 | Category Leadership |

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

### Help Needed
- Plugin examples
- Documentation
- Performance optimizations
- Enterprise features
- MCP integrations

## License

MIT - see [LICENSE](LICENSE)

## Community

- **GitHub Issues**: Bug reports and features
- **Discord**: [Join us](https://discord.gg/scalix)
- **Twitter**: [@scalix_dev](https://twitter.com/scalix_dev)

---

**Scalix Code: The open-source Claude Code alternative.**

*Built for developers who want control, visibility, and extensibility.*
