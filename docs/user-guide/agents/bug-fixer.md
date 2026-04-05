# Bug Fixer Agent

## Overview

The Bug Fixer agent diagnoses and resolves software bugs by analyzing error messages, stack traces, code patterns, and test failures. It provides root cause analysis and generates targeted fixes.

## Capabilities

- Parse and analyze error messages and stack traces
- Identify root causes through code analysis
- Generate targeted code fixes
- Verify fixes against test suites
- Handle common bug patterns (null reference, off-by-one, race conditions)
- Suggest preventive measures

## Configuration

```typescript
const bugFixerConfig = {
  id: 'bug-fixer',
  name: 'Bug Fixer',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.2,
    maxTokens: 4096,
  },
  tools: ['readFile', 'writeFile', 'findInFiles', 'bash-exec', 'ast-parser'],
  systemPrompt: `You are an expert debugger. Analyze bugs systematically,
    identify root causes, and generate minimal, targeted fixes.`,
  maxIterations: 15,
  timeout: 90000,
};
```

## Usage Examples

### Fix from Error Message

```typescript
const result = await agent.execute(`
  Fix this error: TypeError: Cannot read properties of undefined (reading 'name')
  at AgentExecutor.execute (agent/executor.ts:167)
`);
```

### Fix Failing Test

```typescript
const result = await agent.execute(
  'The test "should handle timeout" in executor.test.ts is failing. Fix the issue.'
);
```

## Diagnostic Process

1. **Error Analysis**: Parse error message and stack trace
2. **Code Review**: Read relevant source files
3. **Root Cause**: Identify the underlying issue
4. **Fix Generation**: Create minimal code change
5. **Verification**: Run affected tests

## Best Practices

1. Provide complete error messages and stack traces
2. Include reproduction steps when possible
3. Review generated fixes before applying
4. Run the full test suite after applying fixes
