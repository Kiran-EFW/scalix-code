/**
 * Agent Factory
 *
 * Creates agent instances with all dependencies
 */

import type { AgentConfig, Agent } from './types';
import type { ToolRegistry } from '../tools/types';
import type { Tracer, Logger } from '../observability/types';
import type { Storage } from '../storage/types';
import type { LLMProvider } from './executor';
import { AgentExecutor } from './executor';

/**
 * Create an agent instance
 */
export function createAgent(
  config: AgentConfig,
  dependencies: {
    tools: ToolRegistry;
    tracer: Tracer;
    storage: Storage;
    logger: Logger;
    llmProvider: LLMProvider;
  }
): Agent {
  return new AgentExecutor(
    config,
    dependencies.tools,
    dependencies.tracer,
    dependencies.storage,
    dependencies.logger,
    dependencies.llmProvider
  );
}

/**
 * Validate agent configuration
 */
export function validateAgentConfig(config: AgentConfig): boolean {
  if (!config.id || typeof config.id !== 'string') {
    throw new Error('Agent ID is required and must be a string');
  }

  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Agent name is required and must be a string');
  }

  if (!config.model) {
    throw new Error('Agent model configuration is required');
  }

  if (!config.systemPrompt || typeof config.systemPrompt !== 'string') {
    throw new Error('Agent systemPrompt is required and must be a string');
  }

  if (!Array.isArray(config.tools)) {
    throw new Error('Agent tools must be an array');
  }

  return true;
}
