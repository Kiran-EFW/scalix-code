# Codebase Analyzer Agent

## Overview

The Codebase Analyzer is a specialized agent that understands project architecture, dependencies, patterns, and code quality metrics. It provides actionable insights about your codebase structure.

## Capabilities

- Understand project structure and organization
- Identify architectural patterns (MVC, monolith, microservices, etc.)
- Analyze dependencies and relationships between modules
- Calculate code metrics (complexity, lines of code, function count)
- Suggest improvements and optimizations
- Explain design decisions and patterns

## Configuration

```typescript
import { codebaseAnalyzerConfig } from '@scalix/core/agents';

const config = {
  ...codebaseAnalyzerConfig,
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 4000,
  },
};
```

### Default Configuration

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `maxIterations` | 10 | Maximum analysis iterations |
| `timeout` | 60000ms | Execution timeout |
| `retryPolicy.maxAttempts` | 3 | Maximum retry attempts |
| `retryPolicy.backoffMs` | 1000ms | Initial backoff delay |
| `retryPolicy.backoffMultiplier` | 2 | Backoff multiplier |

## Required Tools

The Codebase Analyzer requires the following tools:

| Tool | Purpose |
|------|---------|
| `readFile` | Read source code files |
| `findInFiles` | Search for patterns across files |
| `ast-parser` | Parse code into Abstract Syntax Trees |
| `dependency-analyzer` | Analyze project dependencies |
| `metrics-calculator` | Calculate code complexity metrics |
| `smart-file-selector` | Intelligently select relevant files |

## Usage Examples

### Analyze Project Architecture

```typescript
const result = await agent.execute('Analyze the architecture of this project');
```

Output includes:
- Project type identification
- Directory structure analysis
- Module relationship mapping
- Pattern identification
- Architecture diagram suggestions

### Find Complexity Issues

```typescript
const result = await agent.execute('Find the most complex modules in this codebase');
```

### Dependency Analysis

```typescript
const result = await agent.execute('Show me the dependency graph and identify potential issues');
```

## Output Format

The Codebase Analyzer produces structured analysis reports:

```
## Project Overview
- Name: my-project
- Type: TypeScript monorepo
- Framework: Express.js + React

## Architecture
- Pattern: Layered Architecture
- Modules: 12 packages
- Entry points: 3

## Dependencies
- Production: 45
- Development: 23
- Peer: 5
- Circular dependencies: 0

## Complexity Analysis
- Most complex file: src/engine/parser.ts (cyclomatic: 24)
- Average complexity: 4.2
- Files above threshold: 3

## Recommendations
1. Consider splitting parser.ts into smaller modules
2. Add missing type exports in utils/index.ts
3. Update deprecated dependency: lodash@3.x -> 4.x
```

## Best Practices

1. **Start broad**: Ask for a full analysis first, then drill into specific areas
2. **Provide context**: Tell the agent what aspect you care about most
3. **Iterative analysis**: Use follow-up questions to go deeper
4. **Regular scans**: Run analysis periodically to track codebase health

## Limitations

- Cannot analyze binary files
- Python support is limited to basic structure analysis
- Very large codebases (>10000 files) may require multiple analysis passes
- External API dependencies are identified but not analyzed for compatibility
