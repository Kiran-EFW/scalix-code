/**
 * Storage Types
 *
 * Persistent state management for agents and workflows.
 */

import type { ExecutionResult } from '../agent/types';

/**
 * Agent memory - persistent state for an agent
 */
export interface AgentMemory {
  agentId: string;
  history: ExecutionResult[];
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Execution checkpoint - snapshot of agent state
 */
export interface ExecutionCheckpoint {
  id: string;
  agentId: string;
  state: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Storage interface
 */
export interface Storage {
  /**
   * Save agent memory
   */
  saveMemory(memory: AgentMemory): Promise<void>;

  /**
   * Load agent memory
   */
  loadMemory(agentId: string): Promise<AgentMemory | undefined>;

  /**
   * Delete agent memory
   */
  deleteMemory(agentId: string): Promise<void>;

  /**
   * Save execution result
   */
  saveExecutionResult(result: ExecutionResult): Promise<void>;

  /**
   * Load execution results
   */
  loadExecutionResults(agentId: string, limit?: number): Promise<ExecutionResult[]>;

  /**
   * Save checkpoint
   */
  saveCheckpoint(checkpoint: ExecutionCheckpoint): Promise<void>;

  /**
   * Load checkpoint
   */
  loadCheckpoint(agentId: string): Promise<ExecutionCheckpoint | undefined>;

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(id: string): Promise<void>;

  /**
   * Health check
   */
  health(): Promise<boolean>;
}

/**
 * Database adapter for different backends
 */
export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<void>;
}
