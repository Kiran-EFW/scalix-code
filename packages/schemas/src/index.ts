/**
 * Shared Zod Schemas
 *
 * Type-safe validation schemas used across Scalix Code.
 * Enables clear contracts between modules.
 */

import { z } from 'zod';

// Agent schemas
export const ModelConfigSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'google', 'local']),
  model: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});

export const AgentConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  model: ModelConfigSchema,
  tools: z.array(z.string()),
  systemPrompt: z.string(),
  maxIterations: z.number().optional(),
  timeout: z.number().optional(),
});

// Tool schemas
export const ToolParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string(),
  required: z.boolean(),
  enum: z.array(z.unknown()).optional(),
});

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.array(ToolParameterSchema),
});

// Workflow schemas
export const WorkflowStepSchema = z.object({
  id: z.string(),
  agentIds: z.array(z.string()),
  pattern: z.enum(['sequential', 'parallel', 'tree', 'reactive', 'mesh']),
  inputs: z.record(z.unknown()).optional(),
  maxParallel: z.number().optional(),
  timeoutMs: z.number().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(WorkflowStepSchema),
  version: z.string(),
});

// API schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
  timestamp: z.date(),
});

// Plugin schemas
export const PluginConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
});

// Type exports
export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type ToolParameter = z.infer<typeof ToolParameterSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
