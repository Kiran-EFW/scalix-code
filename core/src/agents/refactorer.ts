/**
 * Refactoring Agent
 *
 * Extracts functions/classes, reduces complexity, removes duplication,
 * and applies design patterns to improve code quality.
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';
import { REFACTORER_SYSTEM_PROMPT } from './prompts/refactorer';

/**
 * Types of refactoring operations
 */
export type RefactoringType =
  | 'extract-function'
  | 'extract-class'
  | 'inline'
  | 'rename'
  | 'move'
  | 'replace-conditional'
  | 'introduce-parameter-object'
  | 'replace-magic-number'
  | 'simplify-boolean'
  | 'decompose-conditional';

/**
 * Code smell categories
 */
export type CodeSmell =
  | 'long-method'
  | 'large-class'
  | 'long-parameter-list'
  | 'duplicated-code'
  | 'deep-nesting'
  | 'feature-envy'
  | 'god-object'
  | 'shotgun-surgery'
  | 'dead-code'
  | 'primitive-obsession';

/**
 * Refactoring risk level
 */
export type RefactoringRisk = 'low' | 'medium' | 'high';

/**
 * Code smell detection result
 */
export interface CodeSmellReport {
  smell: CodeSmell;
  file: string;
  startLine: number;
  endLine: number;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  suggestedRefactoring: RefactoringType;
  metrics: {
    currentComplexity?: number;
    linesOfCode?: number;
    parameterCount?: number;
    nestingDepth?: number;
    duplicateCount?: number;
  };
}

/**
 * Refactoring proposal
 */
export interface RefactoringProposal {
  id: string;
  type: RefactoringType;
  file: string;
  description: string;
  rationale: string;
  risk: RefactoringRisk;
  beforeCode: string;
  afterCode: string;
  metricsImpact: {
    complexityBefore: number;
    complexityAfter: number;
    linesBefore: number;
    linesAfter: number;
  };
  dependencies: string[];
  testImpact: string;
}

/**
 * Refactoring execution result
 */
export interface RefactoringResult {
  proposalId: string;
  applied: boolean;
  testsPass: boolean;
  filesModified: string[];
  metricsImproved: boolean;
  notes: string;
}

/**
 * Thresholds for code smell detection
 */
export const CODE_SMELL_THRESHOLDS = {
  longMethod: {
    maxLines: 20,
    warningLines: 15,
  },
  largeClass: {
    maxLines: 200,
    warningLines: 150,
  },
  longParameterList: {
    maxParams: 3,
    warningParams: 3,
  },
  deepNesting: {
    maxDepth: 3,
    warningDepth: 2,
  },
  duplicatedCode: {
    minDuplicateLines: 5,
    minSimilarity: 0.8,
  },
} as const;

/**
 * Design pattern suggestions mapped to code smells
 */
export const PATTERN_SUGGESTIONS: Record<CodeSmell, string[]> = {
  'long-method': ['Extract Method', 'Compose Method', 'Replace Method with Method Object'],
  'large-class': ['Extract Class', 'Extract Subclass', 'Extract Interface'],
  'long-parameter-list': ['Introduce Parameter Object', 'Preserve Whole Object', 'Replace Parameter with Method Call'],
  'duplicated-code': ['Extract Method', 'Form Template Method', 'Pull Up Method'],
  'deep-nesting': ['Replace Nested Conditional with Guard Clauses', 'Replace Conditional with Polymorphism', 'Decompose Conditional'],
  'feature-envy': ['Move Method', 'Extract Method + Move Method'],
  'god-object': ['Extract Class', 'Move Method', 'Move Field'],
  'shotgun-surgery': ['Move Method', 'Move Field', 'Inline Class'],
  'dead-code': ['Remove Dead Code', 'Collapse Hierarchy'],
  'primitive-obsession': ['Replace Data Value with Object', 'Replace Type Code with Class', 'Introduce Parameter Object'],
};

export const refactorerMetadata: AgentMetadata = {
  id: 'refactorer',
  name: 'Refactoring Agent',
  description: 'Refactors code to reduce complexity, remove duplication, and apply design patterns',
  category: 'refactoring',
  capabilities: [
    'Extract functions and classes',
    'Reduce cyclomatic complexity',
    'Remove code duplication',
    'Apply design patterns',
    'Detect code smells',
    'Improve naming and readability',
    'Simplify conditional logic',
    'Measure complexity before and after changes',
  ],
  requiredTools: [
    'ast-parser',
    'metrics-calculator',
    'file-editor',
    'bashExec',
    'git-ops',
  ],
  examples: [
    'Refactor this long function into smaller pieces',
    'Remove duplicated code in this module',
    'Reduce the complexity of this class',
    'Apply the strategy pattern here',
    'Find code smells in this file',
    'Simplify this nested conditional logic',
  ],
};

export const refactorerConfig: AgentConfig = {
  id: 'refactorer',
  name: 'Refactoring Agent',
  description: refactorerMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 4000,
  },
  tools: refactorerMetadata.requiredTools,
  systemPrompt: REFACTORER_SYSTEM_PROMPT,
  maxIterations: 15,
  timeout: 120000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};

/**
 * Check if a function exceeds the long method threshold
 */
export function isLongMethod(lineCount: number): boolean {
  return lineCount > CODE_SMELL_THRESHOLDS.longMethod.maxLines;
}

/**
 * Check if a class exceeds the large class threshold
 */
export function isLargeClass(lineCount: number): boolean {
  return lineCount > CODE_SMELL_THRESHOLDS.largeClass.maxLines;
}

/**
 * Check if a parameter list is too long
 */
export function hasLongParameterList(paramCount: number): boolean {
  return paramCount > CODE_SMELL_THRESHOLDS.longParameterList.maxParams;
}

/**
 * Check if nesting is too deep
 */
export function isDeepNesting(depth: number): boolean {
  return depth > CODE_SMELL_THRESHOLDS.deepNesting.maxDepth;
}

/**
 * Assess the risk level of a refactoring
 */
export function assessRefactoringRisk(
  type: RefactoringType,
  affectedFiles: number,
  hasTests: boolean,
  isPublicAPI: boolean,
): RefactoringRisk {
  // High risk: public API changes or multi-file changes without tests
  if (isPublicAPI && (type === 'rename' || type === 'move')) return 'high';
  if (affectedFiles > 3 && !hasTests) return 'high';

  // Medium risk: multi-file changes with tests, or structural changes
  if (affectedFiles > 1) return 'medium';
  if (type === 'extract-class' || type === 'replace-conditional') return 'medium';

  // Low risk: single-file, well-tested changes
  return 'low';
}

/**
 * Get pattern suggestions for a detected code smell
 */
export function getPatternSuggestions(smell: CodeSmell): string[] {
  return PATTERN_SUGGESTIONS[smell] ?? [];
}

/**
 * Calculate the complexity reduction from a refactoring
 */
export function calculateComplexityReduction(
  before: number,
  after: number,
): { absolute: number; percentage: number } {
  const absolute = before - after;
  const percentage = before > 0 ? (absolute / before) * 100 : 0;
  return { absolute, percentage: Math.round(percentage * 10) / 10 };
}

/**
 * Generate a unique refactoring proposal ID
 */
export function generateProposalId(type: RefactoringType, file: string): string {
  const timestamp = Date.now();
  const fileSlug = file.split('/').pop()?.replace(/\./g, '-') ?? 'unknown';
  return `${type}-${fileSlug}-${timestamp}`;
}
