# Quick Start: Using Scalix Code Developer Agents

## Installation

```bash
# Install dependencies
npm install

# Add OpenAI API key (optional, uses mock if not provided)
export OPENAI_API_KEY=sk-your-key-here
```

## Using Agents in Code

### Basic Setup

```typescript
import { Scalix CodePlatform } from '@scalix/core';
import { createOpenAIProvider } from '@scalix/core/agent/llm-provider-openai';
import { codebaseAnalyzerConfig } from '@scalix/core/agents';

// Create platform with LLM
const platform = Scalix CodePlatform.createPlatform({
  llmProvider: createOpenAIProvider()
});

// Create agent
const agent = await platform.createAgent(codebaseAnalyzerConfig);

// Execute agent
const result = await agent.execute({
  goal: 'What is the architecture of this project?'
});

console.log(result);
```

## Three Available Agents

### 1. Codebase Analyzer 📊

Understands project architecture and structure.

```typescript
import { codebaseAnalyzerConfig } from '@scalix/core/agents';

const agent = await platform.createAgent(codebaseAnalyzerConfig);
const result = await agent.execute({
  goal: 'Analyze this codebase for me'
});
```

**Capabilities:**
- Understand project structure
- Identify architecture patterns
- Analyze dependencies
- Find code complexity issues
- Suggest improvements

**Example Questions:**
- "What is the architecture of this project?"
- "Show me the dependencies and their relationships"
- "Identify complex modules in this project"
- "What patterns does this codebase follow?"

---

### 2. Code Explainer 💡

Explains how code works and shows relationships.

```typescript
import { codeExplainerConfig } from '@scalix/core/agents';

const agent = await platform.createAgent(codeExplainerConfig);
const result = await agent.execute({
  goal: 'Explain how the authentication module works'
});
```

**Capabilities:**
- Explain code in plain English
- Show function call chains
- Find related code
- Explain design patterns
- Document code behavior

**Example Questions:**
- "Explain how this authentication module works"
- "What does this function do and where is it used?"
- "Show me the data flow in this component"
- "Explain this complex algorithm"

---

### 3. Security Analyzer 🔒

Finds vulnerabilities and security issues.

```typescript
import { securityAnalyzerConfig } from '@scalix/core/agents';

const agent = await platform.createAgent(securityAnalyzerConfig);
const result = await agent.execute({
  goal: 'Scan this code for security issues'
});
```

**Capabilities:**
- Scan for OWASP Top 10 vulnerabilities
- Find hardcoded secrets and credentials
- Detect insecure cryptography
- Identify authentication bypasses
- Analyze access control issues

**Detects:**
- SQL Injection
- XSS vulnerabilities
- Eval usage
- Hardcoded credentials
- Insecure cryptography
- Command injection
- And 6 more vulnerability types

**Example Questions:**
- "Scan this code for security issues"
- "Find all hardcoded passwords and API keys"
- "Check this for SQL injection vulnerabilities"
- "Analyze this authentication system"

---

## LLM Provider Options

### Use OpenAI API

```typescript
import { createOpenAIProvider } from '@scalix/core/agent/llm-provider-openai';

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4' // or 'gpt-3.5-turbo'
});
```

### Use Local Ollama

```typescript
import { createOllamaProvider } from '@scalix/core/agent/llm-provider-openai';

const provider = createOllamaProvider(
  'llama2', // model name
  'http://localhost:11434/v1' // Ollama endpoint
);
```

### Use Local LM Studio

```typescript
import { createLMStudioProvider } from '@scalix/core/agent/llm-provider-openai';

const provider = createLMStudioProvider(
  'local-model', // model name
  'http://localhost:1234/v1' // LM Studio endpoint
);
```

### Use Default (Auto-detect)

```typescript
import { createDefaultProvider } from '@scalix/core/agent/llm-provider-openai';

// Uses OpenAI if OPENAI_API_KEY is set, otherwise uses mock
const provider = createDefaultProvider();
```

---

## Complete Example

```typescript
import { Scalix CodePlatform } from '@scalix/core';
import { createOpenAIProvider } from '@scalix/core/agent/llm-provider-openai';
import {
  codebaseAnalyzerConfig,
  codeExplainerConfig,
  securityAnalyzerConfig
} from '@scalix/core/agents';

async function analyzeProject() {
  // Setup
  const platform = Scalix CodePlatform.createPlatform({
    llmProvider: createOpenAIProvider()
  });

  // 1. Analyze codebase
  console.log('📊 Analyzing codebase...');
  const analyzerAgent = await platform.createAgent(codebaseAnalyzerConfig);
  const analysis = await analyzerAgent.execute({
    goal: 'What is the architecture of this project?'
  });
  console.log('Analysis:', analysis);

  // 2. Explain a specific file
  console.log('\n💡 Explaining code...');
  const explainerAgent = await platform.createAgent(codeExplainerConfig);
  const explanation = await explainerAgent.execute({
    goal: 'Explain what the security scanner tool does'
  });
  console.log('Explanation:', explanation);

  // 3. Check for security issues
  console.log('\n🔒 Checking security...');
  const securityAgent = await platform.createAgent(securityAnalyzerConfig);
  const security = await securityAgent.execute({
    goal: 'Scan the tools directory for security issues'
  });
  console.log('Security Report:', security);

  // Cleanup
  await platform.shutdown();
}

analyzeProject().catch(console.error);
```

---

## Run the Full Example

```bash
# Run the complete code analysis example
npx ts-node examples/05-code-analysis.ts
```

---

## Understanding Agent Results

Each agent returns:

```typescript
{
  success: boolean;           // Did it succeed?
  goal: string;              // What you asked it to do
  result: string;            // The agent's response
  toolCalls: Array<{         // Tools it used
    name: string;
    arguments: any;
    result: any;
  }>;
  iterations: number;        // How many LLM calls it made
  cost: {                     // Cost tracking
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
  };
  executionTime: number;     // How long it took (ms)
}
```

---

## Available Tools

Agents have access to these tools:

### Code Analysis
- **ast-parser** — Parse code to Abstract Syntax Trees
- **dependency-analyzer** — Analyze npm/Python/Go dependencies
- **metrics-calculator** — Calculate complexity, LOC, etc

### File Operations
- **smart-file-selector** — Find relevant files based on context
- **readFile** — Read file contents
- **findInFiles** — Search for text in files

### Security
- **security-scanner** — Scan for 12 vulnerability types

---

## Troubleshooting

### "No API key found"
Set `OPENAI_API_KEY` environment variable or use a local model (Ollama).

### "Module not found"
Run `npm install` to install dependencies including ts-morph, @babel/parser, etc.

### "Agent not responding"
Check that your LLM provider is accessible:
- OpenAI: Check API key is valid
- Ollama: Run `ollama serve` first
- LM Studio: Make sure LM Studio is running

### "Tool failed"
Agents will retry tools. Common issues:
- File path incorrect
- Directory doesn't exist
- Permission denied

---

## Next Steps

1. **Try the agents** — Run `examples/05-code-analysis.ts`
2. **Analyze your own project** — Change the project path
3. **Experiment with prompts** — Try different goals and contexts
4. **Check results** — Look at the cost, iterations, and tool calls
5. **Build custom agents** — Create agents with your own system prompts

---

## More Information

- **Full Documentation:** See `PHASE4_BUILD_SUMMARY.md`
- **Architecture Details:** See `core/src/agents/`
- **Tool Implementations:** See `core/src/tools/`
- **LLM Provider:** See `core/src/agent/llm-provider-openai.ts`

---

**Ready to analyze code? Let's go!** 🚀
