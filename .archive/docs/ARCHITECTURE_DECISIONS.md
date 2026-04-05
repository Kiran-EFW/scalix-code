# Scalix Code: Architecture & Decision Records

**Document Type:** Architecture Decision Record (ADR) Log  
**Version:** 1.0  
**Date:** April 5, 2026  
**Scope:** Phases 1-8 Planning & Implementation

---

## Core Architectural Decisions

### ADR-001: Agent Execution Model

**Decision:** Use pre-configured `AgentConfig` objects instead of custom agent classes.

**Rationale:**
- Leverages existing `AgentExecutor` infrastructure
- Enables dynamic agent discovery and loading
- Supports agent marketplace and sharing
- Reduces code duplication
- Agent = config + system prompt, not a new class

**Implementation:**
```typescript
// Pattern for all agents (Phase 4+)
export const codebaseAnalyzerConfig: AgentConfig = {
  id: 'codebase-analyzer',
  name: 'Codebase Analyzer',
  description: 'Analyzes project architecture and structure',
  systemPrompt: '...',
  tools: ['ast-parser', 'dependency-analyzer', 'metrics-calculator'],
  model: 'gpt-3.5-turbo',
  maxTokens: 4000,
  temperature: 0.7,
  maxIterations: 10,
  timeout: 60000
};

// Used like:
const agent = await platform.createAgent(codebaseAnalyzerConfig);
const result = await agent.execute({ goal: '...' });
```

**Benefits:**
- ✅ No subclassing needed
- ✅ Easy to register with platform
- ✅ Marketplace-ready format
- ✅ Configuration validation with Zod
- ✅ System prompts are first-class citizens

**Trade-offs:**
- Agents are less "smart" (no custom logic beyond system prompt)
- Extensibility limited to tools and prompts
- Mitigated by plugin system (Phase 7)

**Status:** ADOPTED  
**Impact:** All Phase 4+ agents follow this pattern

---

### ADR-002: Tool Definition Pattern

**Decision:** All tools follow uniform `ToolDefinition` interface with Zod validation.

**Rationale:**
- Consistent tool behavior across agents
- Type-safe parameter passing
- LLM function calling support
- Error handling standardization
- Rate limiting and timeout support

**Implementation:**
```typescript
export const astParserTool: ToolDefinition = {
  name: 'ast-parser',
  description: 'Parse code files to Abstract Syntax Trees',
  parameters: z.object({
    filePath: z.string().describe('Path to code file'),
    language: z.enum(['typescript', 'javascript', 'python']).optional()
  }),
  execute: async (input: ASTParserInput): Promise<ToolResult> => {
    try {
      const result = await astParser.parse(input.filePath);
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
```

**Benefits:**
- ✅ LLM can invoke tools with confidence
- ✅ Type safety at runtime
- ✅ Consistent error handling
- ✅ Automatic parameter validation
- ✅ Cost tracking per tool

**Limitations:**
- Tools can't maintain state between calls
- Mitigated by agent memory system

**Status:** ADOPTED  
**Impact:** All Phase 4+ tools follow this pattern

---

### ADR-003: LLM Provider Strategy

**Decision:** Use OpenAI-compatible SDK with pluggable providers.

**Rationale:**
- Single SDK supports multiple providers (OpenAI, Ollama, LM Studio)
- No need to maintain multiple LLM integrations
- Users can choose provider (commercial vs self-hosted)
- Cost flexibility (pay per use vs free local)

**Implementation:**
```typescript
// All providers implement LLMProvider interface
interface LLMProvider {
  call(messages, tools?): Promise<LLMResponse>;
  streaming?: true;
}

// Factory pattern for provider selection
function createDefaultProvider(): LLMProvider {
  if (process.env.OPENAI_API_KEY) {
    return createOpenAIProvider(); // Use OpenAI API
  } else if (isOllamaRunning()) {
    return createOllamaProvider(); // Use local Ollama
  } else {
    return createMockProvider(); // Fallback for testing
  }
}
```

**Supported Providers:**
- OpenAI (gpt-4, gpt-3.5-turbo) - $30-60 per MTok
- Ollama (local models) - Free, self-hosted
- LM Studio (local models) - Free, self-hosted
- Mock provider - Free, deterministic (testing)

**Cost Model:**
- OpenAI: ~$0.003-0.06 per 1K tokens
- Local: $0 (but requires compute)
- Decision: Cost is user's choice based on scale

**Benefits:**
- ✅ Vendor flexibility
- ✅ Cost control
- ✅ Privacy option (self-hosted)
- ✅ Works offline with local models
- ✅ Single SDK reduces complexity

**Trade-offs:**
- Different models have different capabilities
- Mitigated by system prompts and agents

**Status:** ADOPTED  
**Impact:** All LLM calls go through provider abstraction

---

### ADR-004: System Prompt Design Philosophy

**Decision:** System prompts position agents as domain experts with specific constraints.

**Rationale:**
- Improves output quality
- Reduces hallucinations
- Guides tool usage effectively
- Makes agent behavior predictable

**Pattern:**
```
System Prompt Structure:
1. Role (You are an expert X)
2. Responsibility (Your job is to...)
3. Constraints (Never..., Always...)
4. Output Format (Return results as...)
5. Tool Usage (You have access to...)
6. Examples (Example queries: ...)
```

**Example (CodebaseAnalyzer):**
```
You are an expert code architect with 20 years of experience...

Your job is to analyze codebases for:
- Architecture and design patterns
- Dependency relationships
- Code complexity and hotspots
- Potential improvements

Always:
- Use the dependency-analyzer tool first to understand relationships
- Calculate metrics for key modules
- Identify architectural patterns
- Suggest improvements based on metrics

Never:
- Suggest trivial refactorings
- Ignore architectural patterns
- Recommend changing technologies without strong justification

Return results as structured JSON with:
{ architecture: {...}, patterns: [...], recommendations: [...] }

You have access to these tools:
[tool definitions...]
```

**Benefits:**
- ✅ Consistent output quality
- ✅ Predictable tool usage
- ✅ Error reduction
- ✅ Easy to test and validate
- ✅ Can be optimized over time

**Versioning:**
- System prompts are versioned with agents
- Changes tracked in git
- Performance metrics per prompt version

**Status:** ADOPTED  
**Impact:** All Phase 4+ agents use this structure

---

### ADR-005: Agent Registration & Discovery

**Decision:** Agents registered in central registry with metadata for discovery.

**Rationale:**
- Enables dynamic agent loading
- Supports marketplace (Phase 7)
- Makes agents discoverable in CLI and IDE
- Separates agent definition from platform code

**Implementation:**
```typescript
// core/src/agents/index.ts - Central registry
export const BUILT_IN_AGENTS = [
  { config: codebaseAnalyzerConfig, metadata: codebaseAnalyzerMetadata },
  { config: codeExplainerConfig, metadata: codeExplainerMetadata },
  { config: securityAnalyzerConfig, metadata: securityAnalyzerMetadata }
];

// Agent metadata for discovery
interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'explanation' | 'security' | 'generation' | 'optimization';
  capabilities: string[];
  requiredTools: string[];
  examples: { query: string; description: string }[];
  costEstimate: { inputTokens: number; outputTokens: number; costUSD: number };
}

// CLI usage
$ scalix agents list
Codebase Analyzer  - Analyze project architecture and structure
Code Explainer     - Explain code functionality and relationships
Security Analyzer  - Find security vulnerabilities and issues

$ scalix agent use codebase-analyzer
$ scalix query "Analyze this codebase"
```

**Benefits:**
- ✅ Easy to add new agents
- ✅ CLI can discover agents automatically
- ✅ IDE extensions can query available agents
- ✅ Marketplace can index agents
- ✅ Metadata enables smart suggestions

**Status:** ADOPTED  
**Impact:** All Phase 4+ agents must be registered

---

### ADR-006: Cost Tracking & Transparency

**Decision:** Track costs at agent and tool levels with detailed breakdown.

**Rationale:**
- Users should know what they're spending
- Enables cost optimization
- Supports billing (future: Phase 7+)
- Helps identify expensive operations

**Implementation:**
```typescript
// Cost tracked in real-time
interface AgentResult {
  cost: {
    provider: 'openai' | 'ollama' | 'mock';
    model: string;
    inputTokens: number;
    outputTokens: number;
    inputCostUSD: number;
    outputCostUSD: number;
    costUSD: number;  // Total
    executionTime: number;  // ms
  };
  toolCalls: Array<{
    name: string;
    tokens: number;
    costUSD: number;
  }>;
}

// CLI output
$ scalix agent execute ...
...
📊 Cost Summary:
  Model: gpt-4
  Input: 1,234 tokens ($0.037)
  Output: 567 tokens ($0.034)
  Total: $0.071
  Time: 4.2s
```

**Pricing Models:**
- OpenAI: Model-specific ($0.003-0.06 per 1K tokens)
- Local: $0 (user pays compute)
- Tracking: All providers support cost tracking

**Benefits:**
- ✅ Cost transparency
- ✅ Budget awareness
- ✅ Identify expensive operations
- ✅ Support future billing/quotas
- ✅ Cost optimization data

**Limitations:**
- Local models require compute cost estimation
- Mitigated by clear pricing documentation

**Status:** ADOPTED  
**Impact:** All agent results include cost tracking

---

### ADR-007: Error Handling Strategy

**Decision:** Agents retry failed tool calls with backoff, with clear error reporting.

**Rationale:**
- Tools may fail transiently (file not found, timeout)
- Agents should be resilient
- Users should understand what failed
- Clear error messages enable fixing issues

**Implementation:**
```typescript
// Tool execution with retry
async function executeToolWithRetry(
  tool: ToolDefinition,
  input: any,
  maxRetries: number = 3
): Promise<ToolResult> {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await tool.execute(input);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }
  }
  
  return {
    success: false,
    error: `Tool failed after ${maxRetries} retries: ${lastError.message}`
  };
}

// Agent continues on tool failure
// Error reported in result for user visibility
if (!toolResult.success) {
  context.toolErrors.push({
    tool: toolName,
    error: toolResult.error,
    attempt: iteration
  });
  // Agent continues with available data or skips and tries different approach
}
```

**Benefits:**
- ✅ Resilient to transient failures
- ✅ Clear error reporting
- ✅ User understands what went wrong
- ✅ Prevents cascade failures
- ✅ Enables debugging

**Limitations:**
- May hide persistent bugs
- Mitigated by logging and monitoring

**Status:** ADOPTED  
**Impact:** All tool execution includes retry logic

---

### ADR-008: Multi-Language Support in Tools

**Decision:** Tools support TypeScript/JavaScript first, with fallback parsing for Python and Go.

**Rationale:**
- Scalix Code written in TypeScript
- ts-morph provides excellent TypeScript AST support
- Babel provides Python/JavaScript parsing
- Don't support all languages, focus on common ones

**Implementation:**
```typescript
// AST parser
export class ASTParser {
  async parse(filePath: string): Promise<ASTParseResult> {
    const language = this.detectLanguage(filePath);
    
    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.parseTypeScript(filePath);
      case 'python':
        return this.parsePython(filePath);
      case 'go':
        return this.parseGo(filePath);  // Basic, regex-based
      default:
        throw new Error(`Language not supported: ${language}`);
    }
  }
  
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop();
    return LANGUAGE_MAP[ext] || 'unknown';
  }
}

// Dependency analyzer
export class DependencyAnalyzer {
  async analyze(projectPath: string): Promise<DependencyAnalysisResult> {
    const results = { npm: null, python: null, go: null };
    
    // Try all package managers
    if (fs.existsSync(join(projectPath, 'package.json'))) {
      results.npm = this.analyzeNpm(projectPath);
    }
    if (fs.existsSync(join(projectPath, 'requirements.txt'))) {
      results.python = this.analyzePython(projectPath);
    }
    if (fs.existsSync(join(projectPath, 'go.mod'))) {
      results.go = this.analyzeGo(projectPath);
    }
    
    return results;
  }
}
```

**Supported Languages:**
- TypeScript/JavaScript (full support via ts-morph)
- Python (basic support via regex)
- Go (basic support via regex)
- Others (basic text search)

**Benefits:**
- ✅ Good support for primary language
- ✅ Extensible to other languages
- ✅ Dependency analysis works across stack
- ✅ Aligns with developer tooling

**Limitations:**
- Python/Go support is basic
- Future: Enhanced parsing with community tools

**Status:** ADOPTED  
**Impact:** All parsing tools support multiple languages

---

### ADR-009: Security Patterns vs External Tools

**Decision:** Use pattern-based security scanning, not external security tools.

**Rationale:**
- Pattern-based is fast and lightweight
- No dependency on external services
- 80/20 rule: patterns catch ~80% of issues
- External tools (Semgrep, Snyk) can be added later
- Patterns are testable and deterministic

**Implementation:**
```typescript
// Pattern-based detection
const SECURITY_PATTERNS = {
  SQL_INJECTION: {
    name: 'SQL Injection',
    severity: 'critical',
    patterns: [
      /query\s*\(\s*["`'].*\$\{.*\}.*["`']/,  // Template literal queries
      /execute\s*\(\s*".*\+.*\+.*"/,            // String concatenation
      /\bsqlQuery\s*\(\s*["`'].*%s.*["`']/      // Format string queries
    ],
    remediation: 'Use parameterized queries or prepared statements'
  },
  // 11 more patterns...
};

// Scan file against all patterns
function scanForVulnerabilities(code: string): Vulnerability[] {
  const results: Vulnerability[] = [];
  
  for (const [id, pattern] of Object.entries(SECURITY_PATTERNS)) {
    for (const regex of pattern.patterns) {
      const matches = code.matchAll(new RegExp(regex, 'g'));
      for (const match of matches) {
        results.push({
          type: id,
          message: pattern.name,
          severity: pattern.severity,
          line: code.substring(0, match.index).split('\n').length,
          remediation: pattern.remediation
        });
      }
    }
  }
  
  return results;
}
```

**Benefits:**
- ✅ Fast (no I/O, no external calls)
- ✅ No dependencies
- ✅ Deterministic results
- ✅ Easy to test
- ✅ User-controlled (no sending code to external services)

**Limitations:**
- Less precise than dedicated tools
- False positives/negatives
- Doesn't catch advanced issues

**Future:**
- Phase 8: Add Semgrep integration for advanced scanning
- Phase 8: Add Snyk integration for dependency scanning

**Status:** ADOPTED  
**Impact:** Security scanner uses pattern-based detection

---

## Phase-Specific Architectural Decisions

### Phase 5: IDE Integration Architecture

**ADR-010: WebSocket vs HTTP Polling**

**Decision:** Use WebSocket for real-time IDE communication.

**Rationale:**
- Agents take 1-5s to run (not instant)
- WebSocket enables real-time progress updates
- Reduces latency vs polling
- Enables agent cancellation
- Better user experience

**Protocol:**
```typescript
// IDE → Platform
{
  type: 'analyze' | 'explain' | 'scan',
  requestId: string,
  filePath: string,
  selectedText?: string,
  cancel?: boolean,  // Cancel in-progress
}

// Platform → IDE (multiple messages during execution)
{ requestId, status: 'running', progress: 25 }
{ requestId, status: 'complete', result: {...} }
```

**Benefits:**
- ✅ Real-time progress
- ✅ Operation cancellation
- ✅ Lower latency
- ✅ Better UX

**Status:** PLANNED (Phase 5)

---

### Phase 6: Multi-Agent Orchestration

**ADR-011: Sequential vs Parallel Agent Execution**

**Decision:** Default to sequential execution, with user opt-in to parallel.

**Rationale:**
- Sequential is simpler to reason about
- Results are consistent
- Parallel increases complexity (race conditions)
- Cost is lower (can cancel if satisfied with first result)

**Implementation:**
```typescript
// Sequential (default)
const analyzerResult = await codebaseAnalyzer.execute({...});
const explanationResult = await codeExplainer.execute({...});
const securityResult = await securityAnalyzer.execute({...});

// Parallel (if user requests)
const [analyzer, explanation, security] = await Promise.all([
  codebaseAnalyzer.execute({...}),
  codeExplainer.execute({...}),
  securityAnalyzer.execute({...})
]);

// Total cost for parallel would be ~3x
```

**Benefits:**
- ✅ Simpler implementation
- ✅ Lower cost
- ✅ Predictable behavior
- ✅ Can add parallel later

**Status:** PLANNED (Phase 6)

---

### Phase 7: Community & Marketplace

**ADR-012: Plugin Sandboxing**

**Decision:** Plugins run in Node.js process, with capability restrictions.

**Rationale:**
- Full sandbox (separate process) is slow
- Node.js security model (no native access) is sufficient
- Code review process catches malicious plugins
- Users can disable/review plugins

**Capabilities Model:**
```typescript
export interface PluginCapabilities {
  readFiles?: true;      // Can read project files
  writeFiles?: boolean;  // Can modify project files (dangerous)
  network?: boolean;     // Can make HTTP requests (dangerous)
  executeCode?: boolean; // Can run arbitrary code (dangerous)
  accessEnv?: boolean;   // Can read environment variables
}

// Plugin manifest
{
  "name": "my-plugin",
  "capabilities": {
    "readFiles": true,
    "writeFiles": false,
    "network": false
  }
}
```

**Benefits:**
- ✅ Fast execution
- ✅ Good balance of security/capability
- ✅ Code review provides security
- ✅ Users see required capabilities

**Limitations:**
- Requires code review for marketplace
- Doesn't prevent all attacks

**Status:** PLANNED (Phase 7)

---

### Phase 8: Enterprise Features

**ADR-013: Cost Quotas and Rate Limiting**

**Decision:** Implement per-user and per-organization cost quotas.

**Rationale:**
- Prevents runaway costs
- Supports multiple users on shared platform
- Enables billing
- Protects against abuse

**Implementation:**
```typescript
interface UserQuota {
  userId: string;
  monthlyCostLimit: number;
  currentCost: number;
  resetDate: Date;
  alerts: boolean;
}

// Check before execution
async function executeAgent(userId, agentConfig) {
  const quota = await getQuota(userId);
  const estimatedCost = estimateAgentCost(agentConfig);
  
  if (quota.currentCost + estimatedCost > quota.monthlyCostLimit) {
    throw new QuotaExceededError(
      `Monthly limit exceeded. Limit: $${quota.monthlyCostLimit}, Used: $${quota.currentCost}`
    );
  }
  
  const result = await agent.execute(...);
  quota.currentCost += result.cost.costUSD;
  
  return result;
}
```

**Benefits:**
- ✅ Predictable costs
- ✅ Supports multiple users
- ✅ Enables freemium model
- ✅ Prevents abuse

**Status:** PLANNED (Phase 8)

---

## Technology Decisions

### Language & Runtime

**Decision:** TypeScript for all backend code, JavaScript for IDEs.

**Rationale:**
- Type safety
- Better developer experience
- Alignment with Node.js ecosystem
- IDE plugins require their native languages (Kotlin, Python)

**Trade-offs:**
- No Python backend (but agents can analyze Python)
- IDE plugins require language-specific skills

**Status:** ADOPTED

---

### Database

**Decision:** PostgreSQL for marketplace/registry, file-based for local storage.

**Rationale:**
- PostgreSQL: Robust, well-understood, scalable
- File-based: Simpler for Phase 4-6 (no infra)
- Can migrate to centralized DB later

**Schema Evolution:**
- Migrations tracked in git
- Versions in code
- Backward compatible updates

**Status:** ADOPTED

---

### Testing Strategy

**Decision:** Jest for unit tests, real project analysis for E2E.

**Rationale:**
- Jest: Fast, good TypeScript support
- Real projects: Agents must work on real code
- Avoid mocking LLM (mock is unreliable)

**Test Coverage Target:**
- Phase 4: 85%
- Phase 5-8: 90%+

**E2E Testing:**
- Analyze Scalix Code itself
- Analyze React, Django, Go microservices
- Validate against known patterns

**Status:** ADOPTED

---

## Key Architectural Principles

1. **Composition over Inheritance**
   - Agents are configured via tools + system prompts
   - No agent subclassing
   - Reduces complexity

2. **Configuration as Code**
   - Agent definitions are configs, not classes
   - System prompts are first-class
   - Enables marketplace and discovery

3. **Type Safety**
   - TypeScript strict mode throughout
   - Zod validation at boundaries
   - Zero implicit `any`

4. **Observability Built In**
   - Cost tracking on all operations
   - Execution time measurement
   - Tool call logging
   - Error tracking

5. **Graceful Degradation**
   - Tool failure doesn't stop agent
   - Missing API key → use mock LLM
   - Handles partial results
   - Informative error messages

6. **Open Extensibility**
   - Plugin system (Phase 7)
   - Custom agents (Phase 7)
   - Custom tools (Phase 7)
   - Custom LLM providers

---

## Future Architectural Decisions

### Caching Strategy (Phase 8+)

**Candidate:** Implement multi-level caching
- L1: In-memory (agent execution results, 5 min TTL)
- L2: File-based (analysis results, 1 hour TTL)
- L3: Redis (optional, for distributed deployment)

**Benefits:** Reduce LLM costs, improve latency

---

### Distributed Execution (Phase 9+)

**Candidate:** Support distributed agent execution
- Multiple worker nodes
- Job queue (RabbitMQ, Redis)
- Result aggregation
- Enables scaling

**Requirements:** Phase 8 foundations complete

---

## Summary

This document captures the core architectural decisions that shape Scalix Code's design across all phases. These decisions prioritize:

1. **Simplicity** - Easy to understand and extend
2. **Type Safety** - Catch errors at compile time
3. **Transparency** - Users understand costs and behavior
4. **Extensibility** - Community can build on platform
5. **Performance** - Sub-second responsiveness where possible

---

*Architecture Decisions Last Updated: April 5, 2026*  
*For implementation status, see IMPLEMENTATION_COMPLETE.md*  
*For detailed roadmap, see MASTER_ROADMAP.md*
