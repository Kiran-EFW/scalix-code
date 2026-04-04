/**
 * Agent Types
 *
 * Core type definitions for the agent lifecycle and execution.
 * All agents must conform to these types for proper orchestration.
 */

import type { ToolCall } from '../tools/types';
import type { TraceSpan } from '../observability/types';

/**
 * Supported LLM models
 */
export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'local';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  model: ModelConfig;
  tools: string[];
  systemPrompt: string;
  maxIterations?: number;
  timeout?: number; // in milliseconds
  retryPolicy?: RetryPolicy;
}

/**
 * Retry policy for agent execution
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
}

/**
 * Agent state machine
 */
export enum AgentState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  EXECUTING = 'executing',
  WAITING = 'waiting',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERRORED = 'errored',
  CANCELLED = 'cancelled',
}

/**
 * Cost tracking for agent execution
 */
export interface Cost {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  timestamp: Date;
}

/**
 * Result of a tool call
 */
export interface ToolResult {
  toolName: string;
  success: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
  duration: number; // in milliseconds
}

/**
 * Execution result from an agent
 */
export interface ExecutionResult {
  agentId: string;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  output: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  cost: Cost;
  duration: number; // in milliseconds
  iterations: number;
  trace: TraceSpan[];
  finalState: AgentState;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

/**
 * Agent interface - contract that all agents must implement
 */
export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly config: AgentConfig;
  readonly state: AgentState;

  /**
   * Execute the agent with the given input
   */
  execute(input: string, context?: Record<string, unknown>): Promise<ExecutionResult>;

  /**
   * Pause the agent execution
   */
  pause(): Promise<void>;

  /**
   * Resume the agent execution
   */
  resume(): Promise<void>;

  /**
   * Cancel the agent execution
   */
  cancel(): Promise<void>;

  /**
   * Get the agent's execution history
   */
  getHistory(): ExecutionResult[];

  /**
   * Clear the agent's execution history
   */
  clearHistory(): Promise<void>;
}

/**
 * Agent metadata for registry/marketplace
 */
export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  tools: string[];
  models: ModelProvider[];
  createdAt: Date;
  updatedAt: Date;
  downloads?: number;
  rating?: number;
}
