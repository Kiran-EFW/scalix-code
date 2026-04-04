/**
 * Tool Types
 *
 * Type definitions for tool dispatch, execution, and safety.
 * Tools are the mechanism by which agents interact with the world.
 */

/**
 * Tool parameter definition
 */
export interface ToolParameter {
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

/**
 * Tool definition - describes what a tool can do
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (args: Record<string, unknown>) => Promise<unknown>;
  timeout?: number; // in milliseconds
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}

/**
 * Tool call from an agent
 */
export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  toolCall: ToolCall;
  success: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
  duration: number; // in milliseconds
  tokensUsed?: {
    input: number;
    output: number;
  };
}

/**
 * Tool registry interface
 */
export interface ToolRegistry {
  /**
   * Register a tool
   */
  register(tool: Tool): Promise<void>;

  /**
   * Unregister a tool
   */
  unregister(name: string): Promise<void>;

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined;

  /**
   * Get all registered tools
   */
  getAll(): Tool[];

  /**
   * Execute a tool call
   */
  execute(toolCall: ToolCall): Promise<ToolExecutionResult>;

  /**
   * Get available tools for an agent
   */
  getAvailable(agentId: string): Tool[];
}

/**
 * Tool safety policy
 */
export interface ToolSafetyPolicy {
  maxInputLength: number;
  maxOutputLength: number;
  blockedTools: string[];
  allowedPatterns: string[];
  sandbox?: boolean;
}
