# Scalix Code Quick Start Guide

**Get up and running with Scalix Code in 5 minutes**

## Prerequisites

- Node.js 20+
- pnpm 8+
- Git

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/scalix/claw.git
cd claw

# 2. Install dependencies
pnpm install

# 3. Build the project
pnpm build

# 4. Run tests (verify everything works)
pnpm test
```

## Create Your First Agent

```typescript
// examples/hello-agent.ts
import { createAgent } from '@scalix/sdk';

const agent = await createAgent({
  id: 'hello-agent',
  name: 'Hello Agent',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
  },
  tools: [],
  systemPrompt: 'You are a helpful assistant.',
});

const result = await agent.execute('Say hello and introduce yourself!');
console.log('Agent Output:', result.output);
console.log('Duration:', result.duration, 'ms');
console.log('Cost:', result.cost.costUSD, 'USD');
```

Run it:
```bash
npx tsx examples/hello-agent.ts
```

## Next Steps

### 1. Add Tools to Your Agent

```typescript
import { createAgent, ToolRegistry } from '@scalix/sdk';

const registry = new ToolRegistry();

await registry.register({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: [
    {
      name: 'location',
      type: 'string',
      description: 'City name',
      required: true,
    },
  ],
  execute: async (args) => {
    const location = args.location as string;
    return `Weather in ${location}: Sunny, 72°F`;
  },
});

const agent = await createAgent({
  id: 'weather-agent',
  name: 'Weather Agent',
  model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
  tools: ['get_weather'],
  systemPrompt: 'You are a weather assistant. Help users get weather information.',
});

const result = await agent.execute('What is the weather in San Francisco?');
console.log(result.output);
```

### 2. Run Multiple Agents in Parallel

```typescript
import { Coordinator } from '@scalix/core';

const coordinator = new Coordinator();

const agentA = await createAgent({ /* ... */ });
const agentB = await createAgent({ /* ... */ });
const agentC = await createAgent({ /* ... */ });

const results = await coordinator.executeParallel(
  [agentA, agentB, agentC],
  { topic: 'Artificial Intelligence' }
);

results.forEach((result) => {
  console.log(`${result.agentId}: ${result.output}`);
});
```

### 3. Create a Workflow

```typescript
import { Workflow, WorkflowExecutor } from '@scalix/core';

const workflow: Workflow = {
  id: 'research-workflow',
  name: 'Research Workflow',
  steps: [
    {
      id: 'step-1',
      agentIds: ['research-agent'],
      pattern: 'sequential',
      inputs: { topic: 'TypeScript Best Practices' },
    },
    {
      id: 'step-2',
      agentIds: ['summarize-agent'],
      pattern: 'sequential',
    },
    {
      id: 'step-3',
      agentIds: ['format-agent'],
      pattern: 'sequential',
    },
  ],
  version: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const executor = new WorkflowExecutor();
const result = await executor.execute(workflow, agents);
console.log('Workflow Result:', result);
```

### 4. View Observability Data

```typescript
const result = await agent.execute('Your task');

// Traces - see what the agent did
console.log('Execution Trace:');
result.trace.forEach((span) => {
  console.log(`  ${span.name}: ${span.duration}ms`);
  span.events.forEach((event) => {
    console.log(`    - ${event.name}`);
  });
});

// Metrics
console.log('Metrics:');
console.log(`  Duration: ${result.duration}ms`);
console.log(`  Iterations: ${result.iterations}`);
console.log(`  Input Tokens: ${result.cost.inputTokens}`);
console.log(`  Output Tokens: ${result.cost.outputTokens}`);
console.log(`  Cost: $${result.cost.costUSD.toFixed(4)}`);

// Tool Calls
console.log('Tool Calls:');
result.toolCalls.forEach((call) => {
  console.log(`  ${call.toolName}(${JSON.stringify(call.arguments)})`);
});
```

## Development Workflow

### Run in Watch Mode

```bash
pnpm dev
```

This starts TypeScript compiler in watch mode for all packages.

### Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test -- --watch
```

### Check Code Quality

```bash
# Lint
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## Project Structure Guide

```
scalix-claw/
├── core/                    # Main runtime
│   ├── src/agent/          # Agent execution
│   ├── src/tools/          # Tool dispatch
│   ├── src/orchestration/  # Multi-agent coordination
│   ├── src/observability/  # Tracing & metrics
│   ├── src/storage/        # Persistence
│   └── src/plugins/        # Plugin system
│
├── packages/
│   ├── sdk/                # Public TypeScript SDK
│   ├── schemas/            # Zod validation schemas
│   └── utils/              # Shared utilities
│
├── plugins/
│   ├── cli-plugin/         # Terminal interface (coming soon)
│   ├── email-suite/        # Email agents (coming soon)
│   └── marketplace/        # Agent discovery (coming soon)
│
└── examples/
    ├── hello-agent.ts
    ├── weather-agent.ts
    ├── research-workflow.ts
    └── ...
```

## Common Tasks

### Creating a New Package

```bash
# 1. Create directory
mkdir packages/my-package
cd packages/my-package

# 2. Create package.json
cat > package.json << 'EOF'
{
  "name": "@scalix/my-package",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "@scalix/core": "workspace:*"
  }
}
EOF

# 3. Create src/index.ts
mkdir -p src
echo 'export {};' > src/index.ts

# 4. Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
EOF

# 5. Install
cd ../..
pnpm install
```

### Adding a Dependency

```bash
# Add to core
pnpm add --filter @scalix/core zod

# Add to all packages
pnpm add -r typescript
```

## Useful Commands Reference

| Command | What it does |
|---------|------------|
| `pnpm dev` | Watch mode for all packages |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Check code quality |
| `pnpm format` | Auto-format code |
| `pnpm type-check` | TypeScript type checking |
| `pnpm docker:build` | Build Docker images |
| `pnpm docker:up` | Start services with Docker |

## Troubleshooting

### Node version issues
```bash
node --version  # Should be v20 or higher
nvm use 20      # If using nvm
```

### pnpm not found
```bash
npm install -g pnpm  # Install pnpm globally
pnpm --version       # Verify
```

### Build errors
```bash
pnpm clean   # Clean build artifacts
pnpm build   # Rebuild from scratch
```

### Port already in use
```bash
# If Docker services fail to start
docker-compose down
docker volume prune  # Clean up
pnpm docker:up      # Try again
```

## What's Next?

1. **Read the VISION**: Understand the strategic direction
   - `cat VISION.md`

2. **Explore the Architecture**: Deep dive into system design
   - `cat docs/ARCHITECTURE.md`

3. **Write Your First Plugin**: Extend Scalix Code
   - Follow `docs/PLUGINS.md`

4. **Deploy Locally**: Run the full stack
   - `pnpm docker:up`
   - Visit `http://localhost:3000`

5. **Contribute**: Help build the future
   - See `CONTRIBUTING.md`

## Getting Help

- **Documentation**: `docs/` directory
- **Issues**: GitHub issues for bugs/features
- **Discord**: Community discussion channel
- **Examples**: `examples/` directory

---

**Happy building with Scalix Code! 🚀**
