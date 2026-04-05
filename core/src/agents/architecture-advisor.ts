/**
 * Architecture Advisor Agent
 *
 * Reviews system architecture, identifies architectural issues,
 * and suggests improvements aligned with best practices.
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';
import { ARCHITECTURE_ADVISOR_SYSTEM_PROMPT } from './prompts/architecture-advisor';

/**
 * Architecture quality attributes
 */
export type QualityAttribute =
  | 'scalability'
  | 'maintainability'
  | 'reliability'
  | 'security'
  | 'performance'
  | 'testability'
  | 'deployability'
  | 'observability';

/**
 * Architecture pattern types
 */
export type ArchitecturePattern =
  | 'layered'
  | 'microservices'
  | 'event-driven'
  | 'hexagonal'
  | 'monolith'
  | 'mvc'
  | 'cqrs'
  | 'serverless';

/**
 * Architecture issue severity
 */
export type ArchitectureSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Effort estimate for a recommendation
 */
export type EffortEstimate = 'small' | 'medium' | 'large';

/**
 * Architecture anti-patterns
 */
export type AntiPattern =
  | 'circular-dependency'
  | 'god-module'
  | 'tight-coupling'
  | 'missing-abstraction'
  | 'leaky-abstraction'
  | 'distributed-monolith'
  | 'shared-mutable-state'
  | 'missing-error-boundary';

/**
 * An architectural finding
 */
export interface ArchitectureFinding {
  id: string;
  component: string;
  issue: string;
  description: string;
  severity: ArchitectureSeverity;
  qualityAttributesAffected: QualityAttribute[];
  antiPattern?: AntiPattern;
  recommendation: string;
  tradeOffs: { pros: string[]; cons: string[] };
  effort: EffortEstimate;
  priority: 'must-fix' | 'should-fix' | 'nice-to-have';
  files: string[];
}

/**
 * Architecture review result
 */
export interface ArchitectureReview {
  projectName: string;
  timestamp: Date;
  detectedPattern: ArchitecturePattern;
  findings: ArchitectureFinding[];
  qualityScores: Record<QualityAttribute, number>; // 0-10
  dependencyGraph: DependencyNode[];
  summary: string;
  recommendations: string[];
}

/**
 * Dependency graph node
 */
export interface DependencyNode {
  module: string;
  dependencies: string[];
  dependents: string[];
  isCircular: boolean;
  coupling: number; // 0-1, higher = more coupled
  cohesion: number; // 0-1, higher = more cohesive
}

/**
 * Architecture metrics
 */
export interface ArchitectureMetrics {
  moduleCount: number;
  totalDependencies: number;
  circularDependencies: number;
  averageCoupling: number;
  averageCohesion: number;
  maxModuleSize: number;
  layerViolations: number;
  abstractionRatio: number; // interfaces/abstractions vs concrete implementations
}

/**
 * Anti-pattern detection rules
 */
export const ANTI_PATTERN_RULES: Record<AntiPattern, {
  description: string;
  detection: string;
  impact: QualityAttribute[];
  remediation: string;
}> = {
  'circular-dependency': {
    description: 'Module A depends on Module B which depends back on Module A',
    detection: 'Analyze dependency graph for cycles',
    impact: ['maintainability', 'testability'],
    remediation: 'Extract shared code into a third module, or use dependency inversion',
  },
  'god-module': {
    description: 'A module with too many responsibilities and dependencies',
    detection: 'Check for modules with high fan-in/fan-out or excessive LOC',
    impact: ['maintainability', 'testability', 'scalability'],
    remediation: 'Split into focused modules following single responsibility principle',
  },
  'tight-coupling': {
    description: 'Components are highly dependent on implementation details of others',
    detection: 'Measure afferent/efferent coupling metrics',
    impact: ['maintainability', 'testability', 'deployability'],
    remediation: 'Introduce interfaces and dependency injection',
  },
  'missing-abstraction': {
    description: 'Concrete implementations used directly without abstraction layer',
    detection: 'Check for missing interfaces at module boundaries',
    impact: ['maintainability', 'testability'],
    remediation: 'Define interfaces for cross-module communication',
  },
  'leaky-abstraction': {
    description: 'Implementation details leak through the abstraction boundary',
    detection: 'Check for internal types or implementation details in public APIs',
    impact: ['maintainability', 'reliability'],
    remediation: 'Redesign the abstraction to hide implementation details',
  },
  'distributed-monolith': {
    description: 'Microservices that must be deployed together due to tight coupling',
    detection: 'Check for synchronous cross-service dependencies',
    impact: ['deployability', 'scalability', 'reliability'],
    remediation: 'Introduce asynchronous communication and define clear service boundaries',
  },
  'shared-mutable-state': {
    description: 'Multiple components sharing and mutating the same state',
    detection: 'Find global mutable state accessed across module boundaries',
    impact: ['reliability', 'testability', 'scalability'],
    remediation: 'Use immutable data patterns, event sourcing, or message passing',
  },
  'missing-error-boundary': {
    description: 'Errors propagate across component boundaries without handling',
    detection: 'Check for missing try/catch at component boundaries',
    impact: ['reliability', 'observability'],
    remediation: 'Add error boundaries at component interfaces with proper logging',
  },
};

export const architectureAdvisorMetadata: AgentMetadata = {
  id: 'architecture-advisor',
  name: 'Architecture Advisor',
  description: 'Reviews architecture, identifies issues, and suggests improvements with trade-off analysis',
  category: 'analysis',
  capabilities: [
    'Review system architecture for quality attributes',
    'Identify architectural anti-patterns',
    'Detect circular dependencies',
    'Evaluate design pattern appropriateness',
    'Suggest architectural improvements',
    'Analyze coupling and cohesion metrics',
    'Assess SOLID principle adherence',
    'Provide trade-off analysis for recommendations',
  ],
  requiredTools: [
    'dependency-analyzer',
    'metrics-calculator',
    'ast-parser',
    'smart-file-selector',
  ],
  examples: [
    'Review the architecture of this project',
    'Are there any circular dependencies?',
    'What architectural anti-patterns exist in this codebase?',
    'How can I improve the modularity of this system?',
    'Evaluate the coupling between these modules',
    'Should I use microservices or a monolith for this project?',
  ],
};

export const architectureAdvisorConfig: AgentConfig = {
  id: 'architecture-advisor',
  name: 'Architecture Advisor',
  description: architectureAdvisorMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.4,
    maxTokens: 4000,
  },
  tools: architectureAdvisorMetadata.requiredTools,
  systemPrompt: ARCHITECTURE_ADVISOR_SYSTEM_PROMPT,
  maxIterations: 12,
  timeout: 120000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};

/**
 * Generate a unique finding ID
 */
export function generateFindingId(
  antiPattern: AntiPattern | string,
  component: string,
): string {
  const componentSlug = component.replace(/[^\w-]/g, '-').toLowerCase();
  return `arch-${antiPattern}-${componentSlug}`;
}

/**
 * Score a quality attribute based on findings
 */
export function scoreQualityAttribute(
  attribute: QualityAttribute,
  findings: ArchitectureFinding[],
): number {
  let score = 10; // start with perfect score

  const relevantFindings = findings.filter(
    f => f.qualityAttributesAffected.includes(attribute)
  );

  for (const finding of relevantFindings) {
    const deductions: Record<ArchitectureSeverity, number> = {
      critical: 3,
      high: 2,
      medium: 1,
      low: 0.5,
    };
    score -= deductions[finding.severity];
  }

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Detect the primary architecture pattern from module structure
 */
export function detectArchitecturePattern(
  modules: string[],
  dependencies: DependencyNode[],
): ArchitecturePattern {
  const moduleNames = modules.map(m => m.toLowerCase());

  // Check for layered architecture
  const hasLayers = ['controller', 'service', 'repository', 'model'].some(
    layer => moduleNames.some(m => m.includes(layer))
  );
  if (hasLayers) return 'layered';

  // Check for MVC
  const hasMVC = ['model', 'view', 'controller'].every(
    component => moduleNames.some(m => m.includes(component))
  );
  if (hasMVC) return 'mvc';

  // Check for hexagonal
  const hasHexagonal = ['port', 'adapter', 'domain'].some(
    component => moduleNames.some(m => m.includes(component))
  );
  if (hasHexagonal) return 'hexagonal';

  // Check for event-driven
  const hasEventDriven = ['event', 'handler', 'subscriber', 'publisher'].some(
    component => moduleNames.some(m => m.includes(component))
  );
  if (hasEventDriven) return 'event-driven';

  // Check for microservices (many independent modules)
  if (dependencies.length > 5 && dependencies.filter(d => d.dependencies.length <= 2).length > dependencies.length / 2) {
    return 'microservices';
  }

  return 'monolith';
}

/**
 * Calculate architecture metrics from dependency graph
 */
export function calculateArchitectureMetrics(
  dependencies: DependencyNode[],
): ArchitectureMetrics {
  const totalDeps = dependencies.reduce((sum, d) => sum + d.dependencies.length, 0);
  const circularCount = dependencies.filter(d => d.isCircular).length;
  const avgCoupling = dependencies.length > 0
    ? dependencies.reduce((sum, d) => sum + d.coupling, 0) / dependencies.length
    : 0;
  const avgCohesion = dependencies.length > 0
    ? dependencies.reduce((sum, d) => sum + d.cohesion, 0) / dependencies.length
    : 0;

  return {
    moduleCount: dependencies.length,
    totalDependencies: totalDeps,
    circularDependencies: circularCount,
    averageCoupling: Math.round(avgCoupling * 100) / 100,
    averageCohesion: Math.round(avgCohesion * 100) / 100,
    maxModuleSize: 0, // requires file analysis
    layerViolations: 0, // requires layer detection
    abstractionRatio: 0, // requires AST analysis
  };
}

/**
 * Get anti-pattern information
 */
export function getAntiPatternInfo(pattern: AntiPattern): {
  description: string;
  detection: string;
  impact: QualityAttribute[];
  remediation: string;
} {
  return ANTI_PATTERN_RULES[pattern];
}

/**
 * Sort findings by priority and severity
 */
export function sortFindings(findings: ArchitectureFinding[]): ArchitectureFinding[] {
  const priorityOrder: Record<string, number> = {
    'must-fix': 0,
    'should-fix': 1,
    'nice-to-have': 2,
  };
  const severityOrder: Record<ArchitectureSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...findings].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
