# Code Explainer Agent

## Overview

The Code Explainer agent provides detailed, context-aware explanations of code. It understands multiple programming languages and can explain code at various levels of detail, from high-level summaries to line-by-line walkthroughs.

## Capabilities

- Explain functions, classes, and modules
- Trace execution flow through complex logic
- Identify design patterns in use
- Explain algorithmic complexity
- Provide context about why code is structured a certain way
- Generate documentation from code analysis

## Configuration

```typescript
const codeExplainerConfig = {
  id: 'code-explainer',
  name: 'Code Explainer',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.5,
    maxTokens: 4096,
  },
  tools: ['readFile', 'findInFiles', 'ast-parser'],
  systemPrompt: `You are an expert code explainer. Provide clear, accurate
    explanations of code at the appropriate level of detail for the user.`,
  maxIterations: 8,
  timeout: 45000,
};
```

## Usage Examples

### Explain a Function

```typescript
const result = await agent.execute(
  'Explain the executeInternal method in agent/executor.ts'
);
```

### Trace Execution Flow

```typescript
const result = await agent.execute(
  'Trace the execution flow when a tool call is dispatched'
);
```

### Explain Design Decisions

```typescript
const result = await agent.execute(
  'Why does the state machine use explicit transition validation?'
);
```

## Output Format

Explanations are structured with:

1. **Summary**: One-paragraph overview
2. **Detailed Breakdown**: Step-by-step explanation
3. **Key Concepts**: Important patterns or techniques used
4. **Complexity**: Time/space complexity if applicable
5. **Related Code**: Links to related functions or modules

## Best Practices

- Provide file paths for specific code explanations
- Specify the audience level (beginner, intermediate, expert)
- Ask follow-up questions to drill deeper into specific parts
