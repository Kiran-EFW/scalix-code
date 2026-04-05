# Testing Guide - Scalix CLAW

**Version**: 1.0  
**Date**: April 5, 2026  
**Status**: Testing Infrastructure Complete

---

## Testing Strategy

Scalix CLAW uses a comprehensive testing pyramid:

```
         /\
        /  \       E2E Tests (2%)
       /────\      Integration Tests (20%)
      /──────\     Unit Tests (78%)
```

---

## Test Structure

```
packages/
├── testing/                 # Shared testing utilities
│   ├── src/
│   │   ├── fixtures.ts     # Test data fixtures
│   │   ├── mocks.ts        # Mock implementations
│   │   └── index.ts        # Public exports
│   └── package.json
│
├── core/
│   ├── src/
│   │   ├── agent/
│   │   │   ├── executor.ts
│   │   │   └── executor.test.ts      # Unit tests
│   │   ├── tools/
│   │   │   ├── dispatcher.ts
│   │   │   └── dispatcher.test.ts    # Unit tests
│   │   └── orchestration/
│   │       └── coordinator.test.ts   # Integration tests
│
├── api/
│   └── src/
│       └── routes/
│           └── agents.test.ts        # Integration tests
│
└── cli/
    └── src/
        └── commands/
            └── agent.test.ts         # E2E tests

vitest.config.ts               # Shared test configuration
```

---

## Running Tests

### Run All Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test executor.test.ts

# Run with coverage
pnpm test:coverage
```

### Run Tests by Package
```bash
# Core runtime tests
cd core && pnpm test

# API tests
cd packages/api && pnpm test

# CLI tests
cd packages/cli && pnpm test
```

---

## Testing Library

### Fixtures (`@scalix/testing/fixtures`)

Standard test data for consistent testing:

```typescript
import {
  defaultAgentConfig,
  fullAgentConfig,
  defaultExecutionResult,
  testInputs,
  testTools,
  errorCases,
  apiTestCases,
} from '@scalix/testing';

describe('My Test', () => {
  it('should work', () => {
    const config = defaultAgentConfig;
    // Test using fixture
  });
});
```

**Available Fixtures**:
- `defaultAgentConfig` - Basic agent configuration
- `fullAgentConfig` - Agent with all fields
- `minimalAgentConfig` - Minimal required fields
- `defaultExecutionResult` - Typical execution result
- `failedExecutionResult` - Failed execution
- `multiToolExecutionResult` - Multiple tool calls
- `testInputs` - Various input strings
- `testTools` - Tool configurations
- `testWorkflows` - Workflow configurations
- `errorCases` - Error scenarios
- `apiTestCases` - API test scenarios

### Mocks (`@scalix/testing/mocks`)

Mock implementations for isolated testing:

```typescript
import {
  createMockLLMProvider,
  createMockLogger,
  createMockStorage,
  createTestContext,
} from '@scalix/testing';

describe('Agent Executor', () => {
  it('should execute', async () => {
    const mocks = {
      llmProvider: createMockLLMProvider(),
      logger: createMockLogger(),
      storage: createMockStorage(),
    };
    
    // Test with mocks
    const executor = new AgentExecutor(config, mocks);
    await executor.execute('test');
  });
});
```

**Available Mocks**:
- `createMockLLMProvider()` - Mock LLM calls
- `createMockLogger()` - Mock logging
- `createMockTracer()` - Mock tracing
- `createMockMetricsCollector()` - Mock metrics
- `createMockStorage()` - Mock storage
- `createMockAgent()` - Mock agent
- `createTestContext()` - Complete test context
- `createMockExecutionResult()` - Test execution results

---

## Unit Tests

Unit tests verify individual components in isolation using mocks.

### Example: Agent Executor Test

```typescript
describe('AgentExecutor', () => {
  let executor: AgentExecutor;
  let mocks: ReturnType<typeof setupMocks>;

  beforeEach(() => {
    mocks = setupMocks(); // Create mocks
    executor = new AgentExecutor(config, mocks);
  });

  describe('execution', () => {
    it('should execute with input', async () => {
      const result = await executor.execute('Hello');
      expect(result.status).toBe('completed');
    });

    it('should call LLM provider', async () => {
      await executor.execute('Hello');
      expect(mocks.llmProvider.call).toHaveBeenCalled();
    });

    it('should track duration', async () => {
      const result = await executor.execute('Hello');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
```

### Test Categories

**Core Module Tests**:
- ✅ AgentExecutor - State transitions, execution, error handling
- ✅ ToolDispatcher - Rate limiting, validation, timeouts
- ✅ ToolRegistry - Tool registration, discovery
- ✅ AgentStateMachine - State transitions
- ✅ Storage - Memory operations
- ✅ Observability - Tracer, logger, metrics

**Coverage Targets**:
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

---

## Integration Tests

Integration tests verify components working together with real implementations.

### Example: Agent Routes Test

```typescript
describe('Agent Routes', () => {
  let platform: CLAWPlatform;

  beforeEach(async () => {
    platform = createPlatform();
    await platform.ready();
  });

  it('should create and retrieve agent', async () => {
    const agent = await platform.createAgent(defaultAgentConfig);
    expect(agent).toBeDefined();

    const retrieved = platform.getAgent(agent.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(agent.id);
  });

  it('should list agents', async () => {
    await platform.createAgent(defaultAgentConfig);
    const agents = platform.getAgents();
    expect(agents.length).toBeGreaterThan(0);
  });
});
```

### API Integration Tests

Testing REST endpoints with actual server:

```typescript
describe('POST /api/agents', () => {
  it('should create agent', async () => {
    const response = await request(app)
      .post('/api/agents')
      .send(defaultAgentConfig);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(defaultAgentConfig.id);
  });

  it('should validate agent config', async () => {
    const response = await request(app)
      .post('/api/agents')
      .send({}); // Invalid: missing required fields

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
```

---

## E2E Tests

End-to-end tests verify complete workflows.

### Example: CLI Command Test

```typescript
describe('claw agent commands', () => {
  it('should create, list, and delete agent', async () => {
    // Create agent
    const createOutput = await runCommand('claw agent create test "Test Agent"');
    expect(createOutput).toContain('created');

    // List agents
    const listOutput = await runCommand('claw agent list');
    expect(listOutput).toContain('Test Agent');

    // Delete agent
    const deleteOutput = await runCommand('claw agent delete test');
    expect(deleteOutput).toContain('deleted');
  });
});
```

---

## Test Execution Flow

```
pnpm test
   │
   ├─ Unit Tests (core modules)
   │  ├─ AgentExecutor
   │  ├─ ToolDispatcher
   │  ├─ ToolRegistry
   │  └─ ... more
   │
   ├─ Integration Tests (API routes)
   │  ├─ Agent routes
   │  ├─ Execution routes
   │  └─ Observability routes
   │
   └─ E2E Tests (CLI commands)
      ├─ Agent management
      ├─ Execution
      └─ Statistics
```

---

## Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html
```

Coverage report includes:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage
- Detailed file-by-file breakdown

---

## Testing Best Practices

### ✅ Do

1. **Use Fixtures for Test Data**
   ```typescript
   const config = defaultAgentConfig; // ✅
   ```

2. **Mock External Dependencies**
   ```typescript
   const llm = createMockLLMProvider(); // ✅
   ```

3. **Test Error Paths**
   ```typescript
   it('should handle errors', async () => {
     const result = await executor.execute('invalid');
     expect(result.status).toBe('failed');
   });
   ```

4. **Use Descriptive Names**
   ```typescript
   it('should return completed status when execution succeeds', () => {
     // ✅ Clear what is being tested
   });
   ```

5. **Test One Thing Per Test**
   ```typescript
   it('should track duration', () => {
     // Test duration only
   });
   ```

### ❌ Don't

1. **Create Data in Tests**
   ```typescript
   const config = { id: 'test' }; // ❌ Use fixtures instead
   ```

2. **Test Implementation Details**
   ```typescript
   expect(executor.internalVar).toBe(5); // ❌
   ```

3. **Have Interdependent Tests**
   ```typescript
   // ❌ Don't rely on test execution order
   ```

4. **Mock Everything**
   ```typescript
   // ❌ Test real behavior, not mocks
   ```

5. **Write Flaky Tests**
   ```typescript
   setTimeout(() => expect().toBe(), 100); // ❌ Use waitFor
   ```

---

## Common Test Scenarios

### Testing Agent Execution

```typescript
it('should execute agent with input', async () => {
  const result = await executor.execute('What time is it?');
  
  expect(result.status).toBe('completed');
  expect(result.output).toBeDefined();
  expect(result.duration).toBeGreaterThan(0);
  expect(result.cost.costUSD).toBeGreaterThan(0);
});
```

### Testing Error Handling

```typescript
it('should handle timeout', async () => {
  config.timeout = 10;
  executor = new AgentExecutor(config, mocks);
  
  const result = await executor.execute('input');
  
  expect(result.status).toBe('failed');
  expect(result.error).toContain('timeout');
});
```

### Testing Tool Dispatch

```typescript
it('should dispatch tool calls', async () => {
  registry.register({
    name: 'test',
    execute: async (args) => args,
  });

  const result = await dispatcher.execute('test', { data: 'test' });
  
  expect(result.success).toBe(true);
  expect(result.data).toEqual({ data: 'test' });
});
```

### Testing Storage

```typescript
it('should save and retrieve memory', async () => {
  await storage.saveMemory('agent-1', { data: 'test' });
  const memory = await storage.loadMemory('agent-1');
  
  expect(memory.data).toBe('test');
});
```

---

## Debugging Tests

### Run with Debug Output

```bash
DEBUG=* pnpm test
```

### Run Single Test

```bash
pnpm test -- executor.test.ts
```

### Watch Mode for Development

```bash
pnpm test:watch -- executor.test.ts
```

### Inspect Test

```typescript
it('debug test', async () => {
  const result = await executor.execute('test');
  console.log('Result:', result); // Will show in test output
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Test Timeline

| Phase | Status | Tests | Coverage |
|-------|--------|-------|----------|
| Unit Tests | ✅ Started | 20+ | 80%+ |
| Integration | ⏳ In Progress | 15+ | 75%+ |
| E2E | ⏳ Planned | 10+ | 70%+ |
| CI/CD | 📋 Planned | N/A | N/A |

---

## Adding New Tests

### Step 1: Create Test File

```typescript
// src/component/component.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
```

### Step 2: Setup Test Context

```typescript
describe('MyComponent', () => {
  let component: MyComponent;
  let mocks: any;

  beforeEach(() => {
    // Setup
  });
});
```

### Step 3: Write Test Cases

```typescript
it('should do something', async () => {
  const result = await component.doSomething();
  expect(result).toBe(expected);
});
```

### Step 4: Run Test

```bash
pnpm test component.test.ts
```

---

## Test Maintenance

### Regular Tasks

- [ ] Review failing tests weekly
- [ ] Update fixtures when APIs change
- [ ] Increase coverage targets gradually
- [ ] Refactor duplicated test code
- [ ] Document new test patterns

### Quarterly Reviews

- [ ] Analyze coverage reports
- [ ] Identify untested code paths
- [ ] Plan testing improvements
- [ ] Update test documentation

---

## Resources

- **Testing Library**: https://vitest.dev
- **Test Fixtures**: `packages/testing/src/fixtures.ts`
- **Mock Objects**: `packages/testing/src/mocks.ts`
- **Coverage Config**: `vitest.config.ts`

---

## Support

For testing questions:
- 📧 Email: contact@scalix.dev
- 🐙 GitHub Issues: github.com/scalix/claw/issues
- 💬 Discussions: github.com/scalix/claw/discussions

---

**Testing Status**: 🟢 Infrastructure complete, tests in progress

Ready for automated test execution and CI/CD integration.
