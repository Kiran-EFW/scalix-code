/**
 * Scalix Code Conversation System Types
 *
 * Core interfaces for multi-turn conversational loop with context awareness
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface ConversationState {
  sessionId: string;
  createdAt: Date;
  projectPath: string;

  // Multi-turn tracking
  turns: ConversationTurn[];
  context: ConversationContext;

  // Session metadata
  metadata: SessionMetadata;

  // Plugin & hook system
  pluginManager: PluginManager;
  hookRegistry: HookRegistry;
}

export interface ConversationTurn {
  id: string;
  timestamp: Date;

  // User input & agent response
  userMessage: string;
  agentResponse: string;
  agentId: string;

  // Tool execution details
  toolCalls: ToolCallRecord[];
  toolResults: ToolResult[];

  // Hook execution
  hookExecutions: HookExecution[];

  // Performance & cost
  duration: number;
  cost: CostInfo;

  // Metadata
  inputTokens: number;
  outputTokens: number;
  isError: boolean;
  errorMessage?: string;
}

export interface ConversationContext {
  projectPath: string;
  projectName: string;

  // Git context
  gitBranch: string;
  gitStatus: {
    modified: string[];
    untracked: string[];
    staged: string[];
    ahead: number;
    behind: number;
  };

  // File context
  recentFiles: string[];
  selectedFile?: string;
  fileCache: Map<string, FileContextInfo>;

  // Agent context
  selectedAgent: string; // 'main' | 'code-reviewer' | etc.
  agentHistory: string[];

  // User preferences
  userPreferences: {
    confirmDestructive: boolean;
    explainReasons: boolean;
    autoCommit: boolean;
    commitTemplate?: string;
  };

  // Custom memory
  memory: Map<string, any>;
}

export interface FileContextInfo {
  path: string;
  language: string;
  lines: number;
  lastRead: Date;
  relevance: number; // 0-1 score
}

export interface SessionMetadata {
  totalTurns: number;
  totalTokens: number;
  totalCost: number;
  totalDuration: number;

  // Agent usage
  agentSwitches: number;
  agentUsage: Record<string, AgentUsageStats>;

  // Tool usage
  toolCalls: number;
  toolUsage: Record<string, ToolUsageStats>;

  // Hook metrics
  hookExecutions: number;
  hookBlocks: number; // Times a hook prevented an action
}

export interface AgentUsageStats {
  name: string;
  turnCount: number;
  duration: number;
  cost: number;
  errorCount: number;
  lastUsed: Date;
}

export interface ToolUsageStats {
  name: string;
  callCount: number;
  successCount: number;
  errorCount: number;
  duration: number;
  cost: number;
  lastUsed: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: Date;
}

export interface ToolCallRecord extends ToolCall {
  duration: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  cost: CostInfo;
}

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  handler: (args: Record<string, any>, context: ToolExecutionContext) => Promise<any>;
  schema: Record<string, any>; // JSON Schema
  safety: ToolSafetyConfig;
}

export interface ToolExecutionContext {
  conversationState: ConversationState;
  hookRegistry: HookRegistry;
  userId: string;
  sessionId: string;
}

export interface ToolSafetyConfig {
  requiresConfirmation: boolean;
  blockedPatterns: string[];
  allowedPaths?: string[]; // File access restrictions
  rateLimit?: {
    maxPerMinute: number;
    maxPerHour: number;
  };
  costEstimate?: (args: Record<string, any>) => CostInfo;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export type HookEvent =
  | 'SessionStart'
  | 'SessionEnd'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'AgentSwitch'
  | 'ErrorOccurred'
  | 'TurnComplete';

export interface HookDefinition {
  id: string;
  event: HookEvent;
  pluginId: string;
  handler: (context: HookContext) => Promise<void | HookModification>;
  order?: number; // Execution order (lower = earlier)
}

export interface HookExecution {
  hookId: string;
  event: HookEvent;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
  modifications?: HookModification;
}

export interface HookContext {
  conversationState: ConversationState;
  event: HookEvent;

  // Event-specific data
  toolCall?: ToolCall;
  error?: Error;
  agentId?: string;

  // Utilities
  warn: (message: string) => void;
  confirm: (prompt: string) => Promise<boolean>;
  log: (message: string) => void;
}

export interface HookModification {
  blocked?: boolean;
  blockReason?: string;
  toolCall?: Partial<ToolCall>;
  context?: Partial<ConversationContext>;
}

export interface HookRegistry {
  hooks: Map<HookEvent, HookDefinition[]>;
  register: (hook: HookDefinition) => void;
  unregister: (hookId: string) => void;
  execute: (event: HookEvent, context: HookContext) => Promise<HookModification[]>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLUGIN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;

  // Plugin capabilities
  capabilities: {
    commands?: string[];
    agents?: string[];
    skills?: string[];
    hooks?: HookEvent[];
    mcpServers?: string[];
  };

  // Dependencies
  dependencies?: Record<string, string>;
  requiredVersion?: string; // Min Scalix Code version
}

export interface PluginDefinition extends PluginMetadata {
  path: string;
  loaded: boolean;
  enabled: boolean;
  commands?: CommandDefinition[];
  agents?: AgentDefinition[];
  skills?: SkillDefinition[];
  hooks?: HookDefinition[];
  mcpServers?: MCPServerConfig[];
}

export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  args?: Record<string, ArgumentSpec>;
  handler: (args: Record<string, any>, context: CommandContext) => Promise<CommandResult>;
}

export interface ArgumentSpec {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  choices?: any[];
}

export interface CommandContext {
  conversationState: ConversationState;
  userInput: string;
  output: (message: string) => void;
}

export interface CommandResult {
  success: boolean;
  message: string;
  output?: string;
  shouldContinueConversation?: boolean;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  role: string;
  systemPrompt: string;
  tools: string[];
  skills?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  trigger: string | string[]; // Keywords that trigger this skill
  guidance: string; // Guidance text to inject into agent prompt
  examples?: string[];
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface PluginManager {
  plugins: Map<string, PluginDefinition>;
  loadPlugin: (pluginPath: string) => Promise<PluginDefinition>;
  unloadPlugin: (pluginId: string) => Promise<void>;
  getPlugin: (pluginId: string) => PluginDefinition | undefined;
  listPlugins: () => PluginDefinition[];
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// COST & OBSERVABILITY
// ═══════════════════════════════════════════════════════════════════════════

export interface CostInfo {
  costUSD: number;
  inputTokens: number;
  outputTokens: number;
  modelUsed?: string;
}

export interface ConversationMetrics {
  sessionId: string;
  totalDuration: number;
  totalCost: number;
  turnCount: number;

  // Per-agent metrics
  agentMetrics: Record<string, AgentMetrics>;

  // Per-tool metrics
  toolMetrics: Record<string, ToolMetrics>;

  // Traces (for observability)
  traces: TraceSpan[];
}

export interface AgentMetrics {
  name: string;
  turnCount: number;
  duration: number;
  cost: number;
  errorRate: number;
  averageTokens: number;
}

export interface ToolMetrics {
  name: string;
  callCount: number;
  successRate: number;
  duration: number;
  cost: number;
  errorCount: number;
}

export interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  parentId?: string;
  attributes: Record<string, any>;
  events: TraceEvent[];
  status: 'success' | 'error';
}

export interface TraceEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN AGENT INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface MainAgent {
  id: string;
  name: string;
  role: string;

  // Process user message and return response
  processMessage: (
    userMessage: string,
    context: ConversationState
  ) => Promise<AgentProcessResult>;

  // Decide whether to use tools
  shouldUseTool: (toolName: string, context: ConversationState) => Promise<boolean>;

  // Execute tools (delegated to tool registry)
  executeTool: (toolCall: ToolCall, context: ConversationState) => Promise<ToolResult>;
}

export interface AgentProcessResult {
  response: string;
  toolCalls: ToolCall[];
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  duration: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION ENGINE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface ConversationEngine {
  // Session management
  startSession: (projectPath: string) => Promise<ConversationState>;
  endSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<ConversationState>;

  // Processing user input
  processUserInput: (
    input: string,
    state: ConversationState
  ) => Promise<ConversationTurn>;

  // Agent routing
  switchAgent: (agentId: string, state: ConversationState) => Promise<void>;

  // Tool execution
  executeTool: (toolCall: ToolCall, state: ConversationState) => Promise<ToolResult>;

  // Memory & context
  updateMemory: (key: string, value: any, state: ConversationState) => void;
  getMemory: (key: string, state: ConversationState) => any;

  // Observability
  getMetrics: (sessionId: string) => Promise<ConversationMetrics>;
  getHistory: (sessionId: string, limit?: number) => Promise<ConversationTurn[]>;
}
