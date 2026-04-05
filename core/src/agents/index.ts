/**
 * Built-in Agents
 *
 * Collection of pre-configured developer agents
 */

export type { AgentMetadata } from './types';

// Codebase Analyzer Agent
export {
  codebaseAnalyzerConfig,
  codebaseAnalyzerMetadata,
} from './codebase-analyzer';

// Code Explainer Agent
export {
  codeExplainerConfig,
  codeExplainerMetadata,
} from './code-explainer';

// Security Analyzer Agent
export {
  securityAnalyzerConfig,
  securityAnalyzerMetadata,
} from './security-analyzer';

// Export all agents as array
import { codebaseAnalyzerConfig, codebaseAnalyzerMetadata } from './codebase-analyzer';
import { codeExplainerConfig, codeExplainerMetadata } from './code-explainer';
import { securityAnalyzerConfig, securityAnalyzerMetadata } from './security-analyzer';

export const BUILT_IN_AGENTS = [
  {
    config: codebaseAnalyzerConfig,
    metadata: codebaseAnalyzerMetadata,
  },
  {
    config: codeExplainerConfig,
    metadata: codeExplainerMetadata,
  },
  {
    config: securityAnalyzerConfig,
    metadata: securityAnalyzerMetadata,
  },
];

export const BUILT_IN_AGENT_CONFIGS = [
  codebaseAnalyzerConfig,
  codeExplainerConfig,
  securityAnalyzerConfig,
];

export const BUILT_IN_AGENT_METADATA = {
  'codebase-analyzer': codebaseAnalyzerMetadata,
  'code-explainer': codeExplainerMetadata,
  'security-analyzer': securityAnalyzerMetadata,
};
