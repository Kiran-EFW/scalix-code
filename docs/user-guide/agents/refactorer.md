# Refactorer Agent

## Overview

The Refactorer agent improves code quality through automated refactoring. It identifies code smells, applies design patterns, reduces complexity, and improves maintainability while preserving behavior.

## Capabilities

- Extract methods and classes
- Simplify conditional logic
- Remove code duplication
- Apply design patterns
- Improve naming and organization
- Reduce cyclomatic complexity
- Modernize syntax and patterns

## Configuration

```typescript
const refactorerConfig = {
  id: 'refactorer',
  name: 'Refactorer',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.3,
    maxTokens: 8192,
  },
  tools: ['readFile', 'writeFile', 'ast-parser', 'metrics-calculator', 'findInFiles'],
  systemPrompt: `You are an expert software architect specializing in refactoring.
    Improve code quality while preserving behavior. Always explain your reasoning.`,
  maxIterations: 12,
  timeout: 90000,
};
```

## Usage Examples

### Reduce Complexity

```typescript
const result = await agent.execute(
  'Refactor the dispatch method in tools/dispatcher.ts to reduce complexity'
);
```

### Extract Common Patterns

```typescript
const result = await agent.execute(
  'Extract common error handling patterns into a shared utility'
);
```

### Modernize Code

```typescript
const result = await agent.execute(
  'Modernize the storage module to use async/await consistently'
);
```

## Refactoring Patterns Applied

| Pattern | Description |
|---------|-------------|
| Extract Method | Break large functions into smaller, focused ones |
| Extract Class | Separate concerns into distinct classes |
| Inline Temp | Remove unnecessary temporary variables |
| Replace Conditional with Polymorphism | Use strategy pattern instead of switch |
| Introduce Parameter Object | Group related parameters |
| Move Method | Relocate methods to more appropriate classes |
| Rename | Improve naming for clarity |

## Best Practices

1. Run tests before and after refactoring
2. Refactor in small, verifiable steps
3. Commit each refactoring step separately
4. Review generated changes for correctness
5. Use code coverage to verify behavior preservation
