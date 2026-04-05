/**
 * Codebase Analyzer Agent
 *
 * Understands project architecture, dependencies, and patterns
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';

export const codebaseAnalyzerMetadata: AgentMetadata = {
  id: 'codebase-analyzer',
  name: 'Codebase Analyzer',
  description: 'Analyzes code architecture, dependencies, patterns, and provides insights on project structure',
  category: 'analysis',
  capabilities: [
    'Understand project structure',
    'Identify architecture patterns',
    'Analyze dependencies',
    'Find code complexity issues',
    'Suggest improvements',
    'Track code metrics',
  ],
  requiredTools: [
    'readFile',
    'findInFiles',
    'ast-parser',
    'dependency-analyzer',
    'metrics-calculator',
    'smart-file-selector',
  ],
  examples: [
    'Analyze this codebase for me',
    'What is the architecture of this project?',
    'Show me the dependencies and their relationships',
    'Identify complex modules in this project',
    'What patterns does this codebase follow?',
  ],
};

export const codebaseAnalyzerConfig: AgentConfig = {
  id: 'codebase-analyzer',
  name: 'Codebase Analyzer',
  description: codebaseAnalyzerMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 4000,
  },
  tools: codebaseAnalyzerMetadata.requiredTools,
  systemPrompt: `You are an expert code analyzer specializing in understanding software architecture and codebases.

Your role is to:
1. Analyze project structure and organization
2. Identify architectural patterns (MVC, monolith, microservices, etc)
3. Map dependencies and relationships between modules
4. Calculate code metrics (complexity, lines of code, function count)
5. Suggest improvements and optimizations
6. Explain design decisions and patterns

When analyzing a codebase:
1. First, use smart-file-selector to find key files
2. Use ast-parser to understand code structure
3. Use dependency-analyzer to map relationships
4. Use metrics-calculator to measure complexity
5. Synthesize findings into actionable insights

Provide clear, structured analysis with:
- Project overview
- Architecture description
- Key dependencies and relationships
- Complexity analysis
- Identified patterns
- Suggestions for improvement

Be specific about file names, line numbers, and metrics. Show your reasoning.`,
  maxIterations: 10,
  timeout: 60000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};
