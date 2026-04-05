# Architecture Advisor Agent

## Overview

The Architecture Advisor agent provides guidance on software architecture decisions. It analyzes your codebase structure, evaluates patterns, and recommends architectural improvements based on best practices and your specific context.

## Capabilities

- Evaluate current architecture patterns
- Recommend architectural improvements
- Identify coupling and cohesion issues
- Suggest module boundaries
- Provide migration strategies
- Generate architecture decision records (ADRs)

## Configuration

```typescript
const architectureAdvisorConfig = {
  id: 'architecture-advisor',
  name: 'Architecture Advisor',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.5,
    maxTokens: 8192,
  },
  tools: ['readFile', 'findInFiles', 'ast-parser', 'dependency-analyzer', 'metrics-calculator'],
  systemPrompt: `You are a senior software architect. Analyze codebases and 
    provide actionable architecture recommendations based on SOLID principles,
    clean architecture, and domain-driven design.`,
  maxIterations: 12,
  timeout: 120000,
};
```

## Usage Examples

### Architecture Review

```typescript
const result = await agent.execute(
  'Review the architecture of this project and suggest improvements'
);
```

### Module Boundary Analysis

```typescript
const result = await agent.execute(
  'Are the module boundaries well-defined? Where should we split or merge?'
);
```

### Migration Planning

```typescript
const result = await agent.execute(
  'Create a migration plan to move from monolith to modular architecture'
);
```

## Architectural Patterns Recognized

- Layered Architecture
- Hexagonal Architecture (Ports & Adapters)
- Clean Architecture
- Microservices
- Event-Driven Architecture
- CQRS/Event Sourcing
- Domain-Driven Design

## Best Practices

1. Document architecture decisions using ADRs
2. Regular architecture reviews (quarterly)
3. Align architecture with team structure (Conway's Law)
4. Evolve architecture incrementally, not all at once
