# Building Custom Tools

## Overview

Tools are the mechanism by which agents interact with the external world. They perform specific operations like reading files, executing commands, or calling APIs.

## Tool Interface

Every tool implements the `Tool` interface:

```typescript
interface Tool {
  name: string;                                        // Unique identifier
  description: string;                                 // What the tool does
  parameters: ToolParameter[];                        // Input parameters
  execute: (args: Record<string, unknown>) => Promise<unknown>;  // Execution function
  timeout?: number;                                    // Max execution time (ms)
  rateLimit?: { maxCalls: number; windowMs: number }; // Rate limiting
}

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}
```

## Creating a Tool

### Basic Tool

```typescript
import { ToolRegistry } from '@scalix/core/tools';

const registry = new ToolRegistry();

registry.register({
  name: 'word-count',
  description: 'Count words in a text',
  parameters: [
    {
      name: 'text',
      type: 'string',
      description: 'Text to count words in',
      required: true,
    },
  ],
  execute: async (args) => {
    const text = args.text as string;
    const words = text.trim().split(/\s+/).filter(Boolean);
    return { wordCount: words.length };
  },
});
```

### Tool with Validation

```typescript
registry.register({
  name: 'calculate',
  description: 'Perform a calculation',
  parameters: [
    {
      name: 'a',
      type: 'number',
      description: 'First operand',
      required: true,
      minimum: -1000000,
      maximum: 1000000,
    },
    {
      name: 'b',
      type: 'number',
      description: 'Second operand',
      required: true,
    },
    {
      name: 'operation',
      type: 'string',
      description: 'Operation to perform',
      required: true,
      enum: ['add', 'subtract', 'multiply', 'divide'],
    },
  ],
  execute: async (args) => {
    const { a, b, operation } = args as { a: number; b: number; operation: string };

    switch (operation) {
      case 'add': return { result: a + b };
      case 'subtract': return { result: a - b };
      case 'multiply': return { result: a * b };
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return { result: a / b };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
  timeout: 5000,
});
```

### Tool with Rate Limiting

```typescript
registry.register({
  name: 'api-call',
  description: 'Call an external API',
  parameters: [
    { name: 'endpoint', type: 'string', description: 'API endpoint', required: true },
  ],
  execute: async (args) => {
    const response = await fetch(args.endpoint as string);
    return await response.json();
  },
  timeout: 30000,
  rateLimit: {
    maxCalls: 10,      // 10 calls
    windowMs: 60000,   // per minute
  },
});
```

## Safety Considerations

### Input Validation

The `ToolDispatcher` automatically validates inputs:
- Maximum input length: 10,000 characters
- Blocked patterns: `eval()`, `exec()`, `subprocess`, `os.system`

### Security Best Practices

1. **Validate all inputs**: Don't trust agent-provided arguments
2. **Limit file access**: Restrict read/write to project directories
3. **Sanitize command execution**: Never pass raw input to shell commands
4. **Handle errors gracefully**: Return structured error objects
5. **Set appropriate timeouts**: Prevent runaway executions
6. **Use rate limiting**: Prevent abuse of expensive operations

```typescript
// GOOD: Validated command execution
execute: async (args) => {
  const allowedCommands = ['ls', 'cat', 'grep'];
  const command = args.command as string;
  
  if (!allowedCommands.includes(command.split(' ')[0])) {
    throw new Error('Command not allowed');
  }
  
  // Execute safely...
};

// BAD: Unvalidated command execution
execute: async (args) => {
  const { execSync } = require('child_process');
  return execSync(args.command as string).toString(); // DANGEROUS
};
```

## Testing Tools

```typescript
import { describe, it, expect } from 'vitest';

describe('word-count tool', () => {
  it('should count words correctly', async () => {
    const tool = registry.get('word-count')!;
    const result = await tool.execute({ text: 'hello world foo' });
    expect(result).toEqual({ wordCount: 3 });
  });

  it('should handle empty text', async () => {
    const tool = registry.get('word-count')!;
    const result = await tool.execute({ text: '' });
    expect(result).toEqual({ wordCount: 0 });
  });

  it('should handle whitespace-only text', async () => {
    const tool = registry.get('word-count')!;
    const result = await tool.execute({ text: '   ' });
    expect(result).toEqual({ wordCount: 0 });
  });
});
```

## Tool Registration Patterns

### Factory Pattern

```typescript
function createDatabaseTool(connectionString: string) {
  return {
    name: 'db-query',
    description: 'Execute a read-only database query',
    parameters: [
      { name: 'sql', type: 'string', description: 'SQL query', required: true },
    ],
    execute: async (args) => {
      // Use connectionString to create connection
      // Execute query safely with parameterization
    },
  };
}

registry.register(createDatabaseTool(process.env.DATABASE_URL!));
```

### Composable Tools

```typescript
// Combine multiple tools into one
function createAnalysisTool(astParser: ASTParser, depAnalyzer: DependencyAnalyzer) {
  return {
    name: 'full-analysis',
    description: 'Perform complete code analysis',
    parameters: [
      { name: 'filePath', type: 'string', description: 'File to analyze', required: true },
    ],
    execute: async (args) => {
      const ast = astParser.parse({ filePath: args.filePath as string });
      const deps = depAnalyzer.analyze({ projectPath: path.dirname(args.filePath as string) });
      return { ast, deps };
    },
  };
}
```
