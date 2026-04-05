# Scalix Code: Product Clarity

**Date:** April 5, 2026  
**Status:** Clean, focused product defined

---

## What is Scalix Code?

A conversational CLI tool. Like Claude Code, but:
- ✅ Open source
- ✅ Self-hosted
- ✅ Fully extensible
- ✅ Enterprise observable

## Quick Summary

```
┌──────────────────────────────────┐
│     SCALIX CODE v0.5.0           │
├──────────────────────────────────┤
│                                  │
│  A conversational agent that      │
│  understands your codebase and   │
│  executes tasks safely.          │
│                                  │
│  Type commands like:             │
│  > analyze src/ for security     │
│  > write tests for src/auth.ts   │
│  > create a PR with changes      │
│                                  │
└──────────────────────────────────┘
```

## The Product Stack

```
scalix-code/
├── core/src/
│   ├── conversation/    ← Multi-turn conversations
│   ├── agent/           ← Decision maker
│   ├── guardrails/      ← Safety rules
│   ├── tools/           ← Bash, git, files, API
│   ├── plugins/         ← Extensibility
│   ├── api/             ← REST API
│   ├── storage/         ← Persistence
│   └── observability/   ← Tracing, metrics
│
├── packages/
│   ├── cli/             ← Terminal interface
│   ├── api/             ← API server
│   ├── sdk/             ← TypeScript SDK
│   └── schemas/         ← Type definitions
│
├── docs/
│   ├── README.md                ← What is it?
│   ├── GETTING_STARTED.md       ← How to use
│   ├── ARCHITECTURE.md          ← How it works
│   ├── PLUGINS.md               ← Build plugins
│   └── GUARDRAILS.md            ← Safety system
│
└── examples/            ← Usage examples
```

## Key Features

### Conversational
- Natural language interface
- Multi-turn context awareness
- Smart tool selection

### Safe
- Confirmation gates
- CLAUDE.md compliance
- Audit trails
- Project guidelines

### Observable
- Distributed tracing
- Metrics (latency, tokens, cost)
- Structured logging
- Real-time monitoring

### Extensible
- Plugin system
- Custom agents
- Custom commands
- MCP integrations

## Version Status

| Version | Date | Status | Focus |
|---------|------|--------|-------|
| v0.5.0 | Apr 2026 | ✅ Complete | Safety, guardrails, CLAUDE.md |
| v0.6.0 | May 2026 | 🚧 In Progress | Multi-agent coordination |
| v0.7.0 | Jun 2026 | 📋 Planned | Enterprise (RBAC, SSO) |
| v1.0.0 | Jul 2026 | 📋 Planned | Category leadership |

## What Was Cleaned Up

### Removed (Archived)
- 50+ research and analysis documents
- Experimental Python agent framework
- Duplicate documentation
- Research/comparison analysis

These are preserved on branch: `archive/research-analysis-v0.5`

### Kept (Focused)
- Core Scalix Code implementation (TypeScript)
- Clear product documentation
- Plugin system
- Safety guardrails
- Observability features

## Next Steps

### For Users
1. Read [README.md](README.md) - What is Scalix Code?
2. Follow [GETTING_STARTED.md](docs/GETTING_STARTED.md) - Install and run
3. Explore [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Understand how it works

### For Contributors
1. Read [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
2. See [PLUGINS.md](docs/PLUGINS.md) - Build extensions
3. Check [CONTRIBUTING.md](.github/CONTRIBUTING.md) - How to help

### For the Team
1. **Product Definition** - DONE ✅
2. **Documentation** - DONE ✅
3. **v0.5.0 Release** - Finalize guardrails, CLAUDE.md compliance
4. **v0.6.0 Planning** - Multi-agent coordination features

## Comparison: Scalix Code vs Claude Code

| Aspect | Scalix | Claude Code |
|--------|--------|-------------|
| **Open Source** | ✅ Yes | ❌ No |
| **Self-Hosted** | ✅ Yes | ❌ SaaS |
| **Guardrails** | ✅ Comprehensive | ⚠️ Basic |
| **Observable** | ✅ Built-in | ❌ No |
| **API** | ✅ Yes | ❌ No |
| **Extensible** | ✅✅ Plugins + Agents | ✅ Plugins |
| **Cost Tracking** | ✅ Per-op | ❌ No |
| **Enterprise Ready** | ✅ v0.7.0 | ✅ Yes |

## Success Metrics

For Scalix Code to be successful:

- ✅ Clear product (done - this document)
- ✅ Working MVP (done - v0.5.0)
- ⏳ User adoption (next)
- ⏳ Plugin ecosystem (next)
- ⏳ Enterprise features (v0.7.0)

## Key Files to Know

| File | Purpose |
|------|---------|
| [README.md](README.md) | Product overview |
| [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) | First steps |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/PLUGINS.md](docs/PLUGINS.md) | Plugin development |
| [docs/GUARDRAILS.md](docs/GUARDRAILS.md) | Safety system |
| [VISION.md](VISION.md) | Long-term vision |

## One-Liner for Your Team

**Scalix Code: An open-source, self-hosted Claude Code alternative with built-in safety guardrails, comprehensive observability, and a plugin system for customization.**

---

**Status:** Product clarity achieved. Ready for v0.5.0 release.
