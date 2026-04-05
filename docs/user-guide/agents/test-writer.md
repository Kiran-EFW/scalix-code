# Test Writer Agent

## Overview

The Test Writer agent automatically generates comprehensive test suites for your codebase. It analyzes code structure, identifies testable units, and produces well-structured tests with appropriate assertions, mocks, and edge case coverage.

## Capabilities

- Generate unit tests from source code
- Create integration test suites
- Write end-to-end test scenarios
- Generate test fixtures and mock data
- Identify edge cases and boundary conditions
- Support multiple test frameworks (Vitest, Jest, Mocha, pytest)

## Configuration

```typescript
const testWriterConfig = {
  id: 'test-writer',
  name: 'Test Writer',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.3,
    maxTokens: 8192,
  },
  tools: ['readFile', 'writeFile', 'ast-parser', 'findInFiles'],
  systemPrompt: `You are an expert test engineer. Write comprehensive, 
    maintainable tests that cover happy paths, edge cases, and error scenarios.`,
  maxIterations: 10,
  timeout: 60000,
};
```

## Usage Examples

### Generate Unit Tests

```typescript
const result = await agent.execute(
  'Write unit tests for the ToolRegistry class in tools/registry.ts'
);
```

### Generate Integration Tests

```typescript
const result = await agent.execute(
  'Write integration tests for the agent execution pipeline'
);
```

### Add Missing Coverage

```typescript
const result = await agent.execute(
  'Identify untested code paths in storage/storage.ts and write tests for them'
);
```

## Test Generation Strategy

The Test Writer follows this strategy:

1. **Parse source code** using AST parser to identify:
   - Public methods and functions
   - Constructor parameters and dependencies
   - Error handling paths
   - Branch conditions

2. **Generate test structure**:
   - Group tests by functionality (describe blocks)
   - Create setup/teardown with appropriate mocks
   - Write assertions for return values, side effects, and errors

3. **Cover edge cases**:
   - Null/undefined inputs
   - Empty collections
   - Boundary values
   - Concurrent access
   - Error conditions

4. **Verify completeness**:
   - All public methods tested
   - Both success and failure paths
   - Integration points with dependencies

## Best Practices

1. Review generated tests before committing
2. Ensure mocks accurately reflect real behavior
3. Add custom assertions for domain-specific logic
4. Run coverage reports to verify completeness
