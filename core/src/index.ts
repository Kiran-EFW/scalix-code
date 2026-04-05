/**
 * Scalix Code - Agent Orchestration Platform
 *
 * This is the main entry point for the Scalix Code core runtime.
 * It exports all public APIs for building and running agents.
 */

// Agent module exports
export * from './agent/index';

// Orchestration module exports
export * from './orchestration/index';

// Tools module exports
export * from './tools/index';

// Observability module exports
export * from './observability/index';

// Storage module exports
export * from './storage/index';

// Plugins module exports
export * from './plugins/index';

// API module exports
export * from './api/index';

// Performance module exports
export * from './performance/index';

// Platform exports
export * from './platform';

// Re-export common types
export type { Agent, ExecutionResult, ToolCall, Cost } from './agent/types';
export type { Workflow, WorkflowStep, CoordinationPattern } from './orchestration/types';
export type { Tool, ToolRegistry, ToolCall as ToolCallType } from './tools/types';
export type { TraceSpan, Metric, Logger } from './observability/types';
export type { Storage, AgentMemory } from './storage/types';
export type { Plugin, PluginConfig } from './plugins/types';

// Version
export const VERSION = '0.1.0';
