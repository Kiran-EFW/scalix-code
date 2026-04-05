# Contributing to Scalix Code

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/scalix-code.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/my-feature`
5. Make changes and test
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Git

### First-Time Setup

```bash
pnpm install
pnpm build
pnpm test
```

### Development Workflow

```bash
# Start in watch mode
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm type-check

# Format code
pnpm format

# Lint
pnpm lint
```

## Code Style

- TypeScript strict mode
- Prettier for formatting (see `prettier.config.js`)
- ESLint for linting
- No `any` types unless absolutely necessary (and documented)
- Prefer `async/await` over `.then()` chains
- Use explicit return types for public functions

## Project Structure

```
core/src/
├── agent/          # Agent executor and state machine
├── tools/          # Tool system
├── orchestration/  # Multi-agent coordination
├── observability/  # Tracing, metrics, logging
├── storage/        # Persistent state
├── plugins/        # Plugin system
├── performance/    # Profiling and caching
├── guardrails/     # Safety guardrails
└── __tests__/      # Integration and E2E tests
```

## Writing Tests

### Test File Naming

- Unit tests: `module.test.ts` (alongside the source file)
- Integration tests: `__tests__/integration/*.test.ts`
- E2E tests: `__tests__/e2e/*.test.ts`
- Benchmarks: `__tests__/benchmarks/*.bench.ts`

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ModuleName', () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  describe('methodName', () => {
    it('should handle normal input', () => {
      const result = instance.methodName('input');
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(() => instance.methodName('')).toThrow();
    });
  });
});
```

### Coverage Targets

| Test Type | Target |
|-----------|--------|
| Unit tests | 60% of effort |
| Integration tests | 20% |
| E2E tests | 15% |
| Benchmarks | 5% |
| **Overall coverage** | **85%+** |

## Pull Request Process

1. Ensure tests pass: `pnpm test`
2. Ensure type check passes: `pnpm type-check`
3. Format code: `pnpm format`
4. Write a clear PR description
5. Link related issues
6. Request review from maintainers

### PR Title Format

```
type: description

Examples:
feat: add parallel processing utility
fix: handle timeout in agent executor
docs: update getting started guide
test: add coverage for state machine
refactor: simplify tool dispatcher
perf: cache AST parse results
```

## Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix a bug
docs: documentation changes
test: add or update tests
refactor: code refactoring
perf: performance improvements
chore: maintenance tasks
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
