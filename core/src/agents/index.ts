/**
 * Built-in Agents
 *
 * Collection of pre-configured developer agents
 */

export type { AgentMetadata } from './types';

// Phase 4 Agents
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

// Phase 6 Agents
// Test Writer Agent
export {
  testWriterConfig,
  testWriterMetadata,
} from './test-writer';
export type {
  TestFramework,
  TestType,
  CoverageResult,
  TestGenerationRequest,
  TestGenerationResult,
} from './test-writer';

// Bug Fixer Agent
export {
  bugFixerConfig,
  bugFixerMetadata,
} from './bug-fixer';
export type {
  BugSeverity,
  BugCategory,
  BugReport,
  BugFix,
  FixVerification,
} from './bug-fixer';

// Refactoring Agent
export {
  refactorerConfig,
  refactorerMetadata,
} from './refactorer';
export type {
  RefactoringType,
  CodeSmell,
  RefactoringRisk,
  CodeSmellReport,
  RefactoringProposal,
  RefactoringResult,
} from './refactorer';

// Documentation Generator Agent
export {
  documentationGeneratorConfig,
  documentationGeneratorMetadata,
} from './documentation-generator';
export type {
  DocumentationType,
  DocumentationTarget,
  DocumentationResult,
  FunctionSignature,
  ParameterInfo,
} from './documentation-generator';

// Performance Analyzer Agent
export {
  performanceAnalyzerConfig,
  performanceAnalyzerMetadata,
} from './performance-analyzer';
export type {
  PerformanceSeverity,
  PerformanceCategory,
  PerformanceIssue,
  OptimizationSuggestion,
  BenchmarkResult,
  MemoryLeakReport,
} from './performance-analyzer';

// Architecture Advisor Agent
export {
  architectureAdvisorConfig,
  architectureAdvisorMetadata,
} from './architecture-advisor';
export type {
  QualityAttribute,
  ArchitecturePattern,
  ArchitectureSeverity,
  AntiPattern,
  ArchitectureFinding,
  ArchitectureReview,
  DependencyNode,
  ArchitectureMetrics,
} from './architecture-advisor';

// System Prompts
export * from './prompts';

// Export all agents as array
import { codebaseAnalyzerConfig, codebaseAnalyzerMetadata } from './codebase-analyzer';
import { codeExplainerConfig, codeExplainerMetadata } from './code-explainer';
import { securityAnalyzerConfig, securityAnalyzerMetadata } from './security-analyzer';
import { testWriterConfig, testWriterMetadata } from './test-writer';
import { bugFixerConfig, bugFixerMetadata } from './bug-fixer';
import { refactorerConfig, refactorerMetadata } from './refactorer';
import { documentationGeneratorConfig, documentationGeneratorMetadata } from './documentation-generator';
import { performanceAnalyzerConfig, performanceAnalyzerMetadata } from './performance-analyzer';
import { architectureAdvisorConfig, architectureAdvisorMetadata } from './architecture-advisor';

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
  {
    config: testWriterConfig,
    metadata: testWriterMetadata,
  },
  {
    config: bugFixerConfig,
    metadata: bugFixerMetadata,
  },
  {
    config: refactorerConfig,
    metadata: refactorerMetadata,
  },
  {
    config: documentationGeneratorConfig,
    metadata: documentationGeneratorMetadata,
  },
  {
    config: performanceAnalyzerConfig,
    metadata: performanceAnalyzerMetadata,
  },
  {
    config: architectureAdvisorConfig,
    metadata: architectureAdvisorMetadata,
  },
];

export const BUILT_IN_AGENT_CONFIGS = [
  codebaseAnalyzerConfig,
  codeExplainerConfig,
  securityAnalyzerConfig,
  testWriterConfig,
  bugFixerConfig,
  refactorerConfig,
  documentationGeneratorConfig,
  performanceAnalyzerConfig,
  architectureAdvisorConfig,
];

export const BUILT_IN_AGENT_METADATA = {
  'codebase-analyzer': codebaseAnalyzerMetadata,
  'code-explainer': codeExplainerMetadata,
  'security-analyzer': securityAnalyzerMetadata,
  'test-writer': testWriterMetadata,
  'bug-fixer': bugFixerMetadata,
  'refactorer': refactorerMetadata,
  'documentation-generator': documentationGeneratorMetadata,
  'performance-analyzer': performanceAnalyzerMetadata,
  'architecture-advisor': architectureAdvisorMetadata,
};
