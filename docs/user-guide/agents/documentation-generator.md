# Documentation Generator Agent

## Overview

The Documentation Generator agent creates comprehensive documentation from code analysis. It generates API references, usage guides, architecture documents, and inline documentation.

## Capabilities

- Generate API documentation from source code
- Create usage examples from test cases
- Write architecture decision records (ADRs)
- Generate README files
- Create changelog entries
- Produce inline JSDoc/TSDoc comments

## Configuration

```typescript
const docGeneratorConfig = {
  id: 'documentation-generator',
  name: 'Documentation Generator',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.5,
    maxTokens: 8192,
  },
  tools: ['readFile', 'writeFile', 'ast-parser', 'findInFiles'],
  systemPrompt: `You are a technical writer. Generate clear, accurate, and
    comprehensive documentation from code analysis.`,
  maxIterations: 10,
  timeout: 60000,
};
```

## Usage Examples

### Generate API Reference

```typescript
const result = await agent.execute(
  'Generate API documentation for the @scalix/core/agent module'
);
```

### Generate README

```typescript
const result = await agent.execute(
  'Generate a README for this project based on the codebase'
);
```

## Best Practices

1. Review generated documentation for accuracy
2. Add domain-specific context that code alone cannot convey
3. Keep documentation in sync with code changes
4. Use automated doc generation in CI/CD pipelines
