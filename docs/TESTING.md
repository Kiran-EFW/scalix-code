# Testing Strategy for Scalix Code

## Overview

Scalix Code uses **Vitest** for all testing:
- **Unit tests** - Test individual functions/classes
- **Integration tests** - Test component interactions
- **End-to-end tests** - Test complete workflows

## Running Tests

### Run All Tests
```bash
pnpm test
```

### Run with Coverage
```bash
pnpm test:coverage
```

### Run Specific Test File
```bash
pnpm test core/src/agent/executor.test.ts
```

### Watch Mode
```bash
pnpm test --watch
```

## Test Structure

```
scalix-code/
├── core/src/
│   ├── agent/
│   │   └── executor.test.ts          ← Agent execution tests
│   ├── conversation/
│   │   └── engine.test.ts            ← Conversation tests
│   ├── guardrails/
│   │   └── system.test.ts            ← Safety rules tests
│   ├── tools/
│   │   └── dispatcher.test.ts        ← Tool execution tests
│   └── ...
│
├── packages/
│   ├── cli/
│   │   └── src/commands/agent.test.ts ← CLI tests
│   ├── api/
│   │   └── src/routes/agents.test.ts ← API tests
│   └── ...
│
└── packages/testing/
    └── src/
        ├── fixtures.ts              ← Test data
        ├── mocks.ts                 ← Mock implementations
        └── helpers.ts               ← Test utilities
```

## Test Categories

### 1. Unit Tests

Test individual functions and classes in isolation.

**Example: Agent Executor**
```typescript
describe('Agent Executor', () => {
  it('should execute a simple task', async () => {
    const agent = new Agent({ /* config */ });
    const result = await agent.execute('hello');
    expect(result).toContain('hello');
  });

  it('should handle errors gracefully', async () => {
    const agent = new Agent({ /* config */ });
    await expect(agent.execute(null)).rejects.toThrow();
  });
});
```

**Areas Covered:**
- Agent execution and state management
- Tool dispatch and safety
- Guardrails enforcement
- Plugin loading
- Storage operations
- Observability collection

### 2. Integration Tests

Test how components work together.

**Example: Conversation Loop**
```typescript
describe('Conversation Engine', () => {
  it('should handle multi-turn conversations', async () => {
    const engine = new ConversationEngine(agent, tools);
    
    const turn1 = await engine.processTurn('hello');
    expect(turn1.response).toBeDefined();
    
    const turn2 = await engine.processTurn('what did I say?');
    expect(turn2.response).toContain('hello');
  });

  it('should execute hooks correctly', async () => {
    const hookCalls = [];
    engine.on('PreToolUse', () => hookCalls.push('pre'));
    engine.on('PostToolUse', () => hookCalls.push('post'));
    
    await engine.processTurn('run a command');
    expect(hookCalls).toEqual(['pre', 'post']);
  });
});
```

**Areas Covered:**
- Conversation flow with guardrails
- Hook execution
- Tool dispatch with confirmations
- Multi-agent coordination
- Result merging
- Quality scoring

### 3. End-to-End Tests

Test complete user workflows.

**Example: Security Analysis Workflow**
```typescript
describe('Security Analysis Workflow', () => {
  it('should analyze code for vulnerabilities', async () => {
    const code = `
      const password = "hardcoded";
      const apiKey = process.env.API_KEY;
    `;
    
    const result = await scalixCode.analyze(code, 'security');
    
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        type: 'hardcoded-secret',
        severity: 'critical',
        file: expect.any(String),
      })
    );
  });
});
```

**Workflows to Test:**
- Code analysis (security, quality, performance)
- Code generation (functions, tests, documentation)
- Project modifications (refactoring, updates)
- Git operations (commits, branches, PRs)

## Test Data & Mocks

### Fixtures
Common test data in `packages/testing/src/fixtures.ts`:

```typescript
export const mockProject = {
  path: '/tmp/test-project',
  files: {
    'src/app.ts': 'export function app() {}',
    'src/utils.ts': 'export function helper() {}',
  },
};

export const mockAgent = {
  id: 'test-agent',
  name: 'Test Agent',
  role: 'specialist',
};
```

### Mocks
Mock implementations in `packages/testing/src/mocks.ts`:

```typescript
export class MockLLMProvider implements LLMProvider {
  async complete(prompt: string) {
    return 'mocked response';
  }
}

export class MockToolDispatcher implements ToolDispatcher {
  async dispatch(tool: string, args: any) {
    return { success: true, output: 'mocked output' };
  }
}
```

### Test Helpers
Utility functions in `packages/testing/src/helpers.ts`:

```typescript
export async function setupTestProject() {
  // Create temporary project directory
  // Copy fixture files
  // Initialize git
  // Return cleanup function
}

export function createTestAgent(overrides = {}) {
  // Create agent with defaults + overrides
  // Return configured agent
}
```

## Coverage Goals

**Targets:**
- Core components: >90% coverage
- Tools & Guardrails: >85% coverage
- API endpoints: >80% coverage
- CLI commands: >80% coverage
- Overall: >85% coverage

**What We Measure:**
- Line coverage (% of lines executed)
- Branch coverage (% of decision paths)
- Function coverage (% of functions called)
- Statement coverage (% of statements executed)

**View Coverage Report:**
```bash
pnpm test:coverage
# Open coverage/index.html in browser
```

## Writing Tests: Best Practices

### 1. Use Descriptive Names
```typescript
// ✅ Good
it('should block force push to main branch', () => {});

// ❌ Bad
it('test force push', () => {});
```

### 2. Test Behavior, Not Implementation
```typescript
// ✅ Good - tests what it should do
expect(result.findings).toHaveLength(3);

// ❌ Bad - tests how it's done internally
expect(engine.findings.length).toBe(3);
```

### 3. Use Test Fixtures
```typescript
// ✅ Good
const agent = createTestAgent();
const result = await agent.execute(task);

// ❌ Bad
const agent = new Agent({
  id: 'test',
  name: 'Test',
  role: 'specialist',
  tools: ['bash', 'git'],
  // ... 20 more lines of setup
});
```

### 4. Test Error Cases
```typescript
describe('Tool Dispatcher', () => {
  it('should execute successfully', () => {});
  
  it('should timeout on long-running commands', async () => {
    await expect(dispatcher.bash('sleep 100')).rejects.toThrow('timeout');
  });
  
  it('should sanitize dangerous commands', () => {
    expect(() => dispatcher.bash('rm -rf /')).toThrow('blocked');
  });
});
```

### 5. Clean Up After Tests
```typescript
afterEach(async () => {
  // Clean up test data
  await cleanup();
  // Reset mocks
  vi.clearAllMocks();
});
```

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Every push (GitHub Actions)
- Before releases

**CI Configuration:** `.github/workflows/test.yml`

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
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
```

## Test Requirements for Pull Requests

Before merging:
- ✅ All tests pass
- ✅ Coverage >85% (overall)
- ✅ No console.log or debug statements
- ✅ Type checking passes (`pnpm type-check`)
- ✅ Linting passes (`pnpm lint`)

## Debugging Tests

### Run Single Test
```bash
pnpm test core/src/agent/executor.test.ts --reporter=verbose
```

### Use Test Debugger
```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run
# Then open chrome://inspect
```

### Print Debug Info
```typescript
it('should work', () => {
  const result = compute();
  console.log('Result:', result);  // Use sparingly
  expect(result).toBe(expected);
});
```

### Check What Test Files Exist
```bash
find . -name "*.test.ts" -o -name "*.spec.ts" | sort
```

## Test Organization

### By Feature
```
├── agent/
│   ├── executor.ts
│   ├── executor.test.ts        ← Tests for executor
│   ├── state-machine.ts
│   └── state-machine.test.ts   ← Tests for state machine
```

### By Layer
```
├── __tests__/
│   ├── unit/
│   │   ├── agent.test.ts
│   │   ├── tools.test.ts
│   │   └── guardrails.test.ts
│   ├── integration/
│   │   ├── conversation.test.ts
│   │   └── workflow.test.ts
│   └── e2e/
│       ├── security-analysis.test.ts
│       └── code-generation.test.ts
```

## Common Test Patterns

### Testing Async Functions
```typescript
it('should execute asynchronously', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Errors
```typescript
it('should throw on invalid input', () => {
  expect(() => fn(null)).toThrow('Invalid input');
});

it('should reject on error', async () => {
  await expect(asyncFn()).rejects.toThrow();
});
```

### Testing with Mocks
```typescript
it('should use mocked tool', async () => {
  const mockTool = vi.fn().mockResolvedValue('mocked');
  const agent = new Agent({ tools: { mock: mockTool } });
  
  await agent.execute('use mock');
  expect(mockTool).toHaveBeenCalled();
});
```

### Testing State Changes
```typescript
it('should update state', () => {
  const engine = new Engine();
  expect(engine.state).toBe('initial');
  
  engine.start();
  expect(engine.state).toBe('running');
  
  engine.stop();
  expect(engine.state).toBe('stopped');
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Jest Matchers](https://vitest.dev/api/expect.html)

---

**Test regularly. Ship confidently.**
