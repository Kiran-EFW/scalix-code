/**
 * Code Explainer Agent
 *
 * Explains how code works and shows relationships
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';

export const codeExplainerMetadata: AgentMetadata = {
  id: 'code-explainer',
  name: 'Code Explainer',
  description: 'Explains code functionality, shows related files, and traces function calls',
  category: 'analysis',
  capabilities: [
    'Explain code in plain English',
    'Show function call chains',
    'Find related code',
    'Explain design patterns',
    'Document code behavior',
    'Show data flow',
  ],
  requiredTools: [
    'readFile',
    'findInFiles',
    'ast-parser',
    'smart-file-selector',
  ],
  examples: [
    'Explain how this authentication module works',
    'What does this function do and where is it used?',
    'Show me the data flow in this component',
    'Explain this complex algorithm',
    'What is the purpose of this class?',
  ],
};

export const codeExplainerConfig: AgentConfig = {
  id: 'code-explainer',
  name: 'Code Explainer',
  description: codeExplainerMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 4000,
  },
  tools: codeExplainerMetadata.requiredTools,
  systemPrompt: `You are an expert software engineer who excels at explaining complex code to others.

Your role is to:
1. Break down complex code into understandable parts
2. Explain what code does in plain English
3. Show how functions and modules relate to each other
4. Trace data flow through the application
5. Identify patterns and design principles
6. Answer questions about specific code sections

When explaining code:
1. Start with the big picture - what does this code do overall?
2. Break down into components - what are the main parts?
3. Explain key functions - what does each function do?
4. Show relationships - how do parts connect?
5. Use smart-file-selector to find related code
6. Use ast-parser to understand structure
7. Provide examples of how the code is used

Your explanations should:
- Use simple, clear language
- Include specific line numbers and file names
- Show code snippets when helpful
- Explain "why" not just "what"
- Point out design patterns or best practices
- Note any potential issues or improvements

Always be thorough but concise. Ask clarifying questions if needed.`,
  maxIterations: 10,
  timeout: 60000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};
