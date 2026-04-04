# Scalix CLAW

**Agent Orchestration Platform for Production**

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)]()

## 🚀 What is Scalix CLAW?

Scalix CLAW is an open-source, production-ready **agent orchestration platform** that enables developers and enterprises to build, deploy, and manage sophisticated multi-agent AI systems at scale.

Think of it as:
- **LangChain** (agent framework) + **Claude Code** (extensibility) + **Temporal** (workflow orchestration)

## 🎯 Key Features

### Core Capabilities
- **Agent Lifecycle Management**: Spawn, execute, monitor, and shutdown agents
- **Multi-Agent Orchestration**: Sequential, parallel, tree, and reactive execution patterns
- **Tool Dispatch System**: Safe, sandboxed tool execution with rate limiting
- **Production Observability**: Built-in tracing, metrics, and cost tracking
- **Persistent State**: Database-backed agent memory and execution history
- **Plugin Ecosystem**: Extend with custom commands, agents, skills, and hooks

### Enterprise Ready
- **Type Safety**: 100% TypeScript, no `any` types allowed
- **Multi-Tenant Architecture**: Full isolation and RBAC
- **Compliance**: Built-in audit logging for SOX, HIPAA, GDPR
- **Security**: Input validation, sandboxing, encryption
- **Scalability**: Distributed execution on Kubernetes or serverless

### Developer Friendly
- **Excellent DX**: Clean APIs, comprehensive documentation, example projects
- **SDK & CLI**: TypeScript SDK + terminal CLI for power users
- **Marketplace**: Discover and share agents, templates, and integrations
- **Open Ecosystem**: MCP integrations for email, calendar, CRM, data tools

## 📦 Project Structure

```
scalix-claw/
├── core/                 # Production-grade core runtime
├── packages/            # Shared SDK, schemas, utilities
├── plugins/             # First-party plugins (email, CLI, etc.)
├── frontends/           # Multiple UX options (CLI, web, desktop)
├── examples/            # Reference implementations
├── docs/                # Comprehensive documentation
└── infra/               # Docker, Kubernetes, Terraform configs
```

## 🏗️ Architecture Philosophy

### 1. Modularity First
Each module has a single responsibility with clear boundaries:
- `agent/`: Agent lifecycle only
- `tools/`: Tool dispatch and safety only
- `orchestration/`: Multi-agent coordination only
- `observability/`: Tracing and metrics only
- `storage/`: Persistence only

### 2. Type Safety
- 100% TypeScript with strict mode enabled
- Zod for schema validation
- No implicit `any` types
- Comprehensive error handling

### 3. Production Ready
- Observability built-in (not bolted-on)
- Enterprise security from day 1
- Graceful error handling and recovery
- Performance optimized

### 4. Extensible
- Plugin system like Claude Code
- MCP integrations for external services
- Marketplace for sharing agents
- Hook system for event-driven automation

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/scalix/claw.git
cd claw

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Create Your First Agent

```typescript
import { createAgent } from '@scalix/sdk';

const agent = await createAgent({
  id: 'my-agent',
  name: 'My First Agent',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
  },
  tools: ['web_search', 'send_email'],
  systemPrompt: 'You are a helpful research assistant.',
});

const result = await agent.execute('Find information about TypeScript');
console.log(result.output);
```

### Run Agents in Parallel

```typescript
import { Coordinator } from '@scalix/core';

const coordinator = new Coordinator();

const results = await coordinator.executeParallel(
  [agentA, agentB, agentC],
  { topic: 'AI agents' }
);

results.forEach((result) => {
  console.log(`Agent ${result.agentId}: ${result.output}`);
});
```

## 📚 Documentation

- [**VISION.md**](./VISION.md) - Strategic vision and roadmap
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - Technical architecture deep-dive
- [**GETTING_STARTED.md**](./docs/GETTING_STARTED.md) - Detailed quick start guide
- [**API.md**](./docs/API.md) - Complete API documentation
- [**PLUGINS.md**](./docs/PLUGINS.md) - Plugin development guide
- [**CONTRIBUTING.md**](./CONTRIBUTING.md) - Contribution guidelines

## 🎓 Examples

See the [`examples/`](./examples/) directory for complete reference implementations:

- **email-agent**: Send emails with AI composition
- **sales-agent**: Research and outreach workflows
- **support-agent**: Customer support automation
- **dashboard-dashboard**: Analytics and monitoring

## 💻 Development

### Commands

```bash
# Development
pnpm dev              # Watch mode for all packages
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm test:coverage    # Generate coverage reports
pnpm lint             # Check code quality
pnpm format           # Format code with Prettier

# Docker
pnpm docker:build     # Build Docker images
pnpm docker:up        # Start services
pnpm docker:down      # Stop services

# Infrastructure
pnpm deploy           # Deploy to GCP
```

### Code Standards

- **Type Safety**: All code is TypeScript with strict mode
- **No `any`**: Never use implicit `any` types
- **Zod Validation**: Use Zod for all inputs
- **DI Pattern**: Dependencies injected, not global singletons
- **Tests First**: Write tests before implementation
- **Modular**: Functions < 50 lines, clear separation of concerns

## 🔌 Plugin Examples

### Build a Custom Agent Plugin

```markdown
# plugins/my-agent/plugin.json
{
  "name": "my-agent-plugin",
  "version": "1.0.0",
  "description": "Custom agent for my domain"
}

# plugins/my-agent/agents/my-agent.md
---
name: my-agent
description: Specialized agent for my use case
tools: [web_search, send_email]
---

Agent implementation...
```

### Create an MCP Integration

```typescript
// plugins/my-integration/.mcp.json
{
  "my-service": {
    "command": "${PLUGIN_ROOT}/mcp/server",
    "env": {
      "API_KEY": "${MY_SERVICE_API_KEY}"
    }
  }
}
```

## 🏗️ Deployment

### Local Development

```bash
docker-compose up -d
pnpm dev
```

### Kubernetes

```bash
kubectl apply -f infra/kubernetes/
kubectl port-forward svc/claw-api 8000:8000
```

### Google Cloud

```bash
cd infra/terraform/gcp
terraform init
terraform apply
```

## 📊 Observability

All agents come with built-in observability:

```typescript
const result = await agent.execute('Get latest AI news');

// View execution trace
console.log(result.trace); // Detailed span trace

// Check cost
console.log(result.cost); // Input/output tokens + USD cost

// View tool calls
console.log(result.toolCalls); // All tools used

// Check duration
console.log(result.duration); // Milliseconds
```

## 🔐 Security

- **Input Validation**: All inputs validated with Zod
- **Sandboxing**: Tools execute in isolated context
- **Rate Limiting**: Per-tool and per-agent rate limits
- **Encryption**: TLS for all network communication
- **Audit Logging**: All actions logged for compliance

## 📈 Roadmap

### Phase 1: Foundation (Months 1-3) ✅
- Core agent runtime
- Tool dispatch system
- Basic orchestration
- Built-in observability
- Open-source launch

### Phase 2: Extensibility (Months 4-6)
- Plugin system
- Agent marketplace
- MCP integrations
- Template library
- Hosting platform

### Phase 3: Enterprise (Months 7-9)
- Multi-tenant architecture
- RBAC and SSO
- Compliance certifications
- Advanced monitoring
- Dedicated support

### Phase 4: Vertical Specialization (Months 10-12)
- Email orchestration agents
- Sales/CRM agents
- Customer success agents
- Compliance templates
- Marketplace with 100+ agents

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Areas for Contribution
- New agent implementations
- Plugin development
- Documentation improvements
- Example projects
- Performance optimizations
- Test coverage

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🙏 Acknowledgments

Scalix CLAW is built on the shoulders of giants:
- **Claude Code** - Inspired the plugin architecture and extensibility model
- **LangChain** - Pioneered agent frameworks for LLMs
- **Temporal** - Inspired the workflow orchestration patterns
- **Pydantic** - Inspired the schema validation approach with Zod

## 💬 Community

- **GitHub Issues**: Report bugs and request features
- **Discord**: [Join the community](https://discord.gg/scalix)
- **Twitter**: [@ScalixAI](https://twitter.com/scalixai)
- **Blog**: [Technical articles and updates](https://blog.claw.scalix.dev)

---

**Scalix CLAW: The future of agent orchestration.**

*Built with ❤️ for developers who want production-grade agent automation.*
