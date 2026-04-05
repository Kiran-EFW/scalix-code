/**
 * Agent Metadata Types
 *
 * Shared types for built-in agents
 */

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'generation' | 'refactoring' | 'automation';
  capabilities: string[];
  requiredTools: string[];
  examples: string[];
}
