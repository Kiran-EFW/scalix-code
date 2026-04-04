/**
 * Orchestration Types
 *
 * Multi-agent coordination patterns and workflow definitions.
 */

import type { Agent, ExecutionResult } from '../agent/types';

/**
 * Coordination patterns for multi-agent execution
 */
export type CoordinationPattern = 'sequential' | 'parallel' | 'tree' | 'reactive' | 'mesh';

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  id: string;
  agentIds: string[];
  pattern: CoordinationPattern;
  inputs?: Record<string, unknown>;
  maxParallel?: number;
  timeoutMs?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Workflow definition - a set of steps to execute
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  workflowId: string;
  stepId: string;
  agents: Agent[];
  inputs: Record<string, unknown>;
  outputs: Record<string, ExecutionResult>;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  workflowId: string;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  stepResults: ExecutionResult[];
  duration: number;
  error?: {
    stepId: string;
    agentId: string;
    message: string;
  };
}

/**
 * Agent coordinator interface
 */
export interface Coordinator {
  /**
   * Execute a workflow with the given agents
   */
  executeWorkflow(workflow: Workflow, agents: Agent[]): Promise<WorkflowExecutionResult>;

  /**
   * Execute multiple agents in parallel
   */
  executeParallel(agents: Agent[], inputs: Record<string, unknown>): Promise<ExecutionResult[]>;

  /**
   * Execute agents sequentially
   */
  executeSequential(
    agents: Agent[],
    inputs: Record<string, unknown>
  ): Promise<ExecutionResult[]>;

  /**
   * Execute agents in a tree structure
   */
  executeTree(
    rootAgent: Agent,
    childAgents: Map<string, Agent[]>,
    inputs: Record<string, unknown>
  ): Promise<ExecutionResult>;

  /**
   * Execute agents reactively (responding to events)
   */
  executeReactive(
    agents: Agent[],
    eventStream: AsyncIterable<unknown>
  ): Promise<ExecutionResult[]>;
}
