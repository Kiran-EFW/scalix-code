/**
 * Bug Fixer Agent
 *
 * Identifies common bug patterns, diagnoses root causes,
 * suggests targeted fixes, and verifies fixes with tests.
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';
import { BUG_FIXER_SYSTEM_PROMPT } from './prompts/bug-fixer';

/**
 * Bug severity levels
 */
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Bug category classification
 */
export type BugCategory =
  | 'logic-error'
  | 'null-reference'
  | 'race-condition'
  | 'memory-leak'
  | 'type-error'
  | 'api-misuse'
  | 'state-management'
  | 'error-handling'
  | 'boundary-error'
  | 'configuration';

/**
 * A detected bug with analysis
 */
export interface BugReport {
  id: string;
  category: BugCategory;
  severity: BugSeverity;
  title: string;
  description: string;
  file: string;
  line: number;
  rootCause: string;
  suggestedFix: string;
  codeSnippet: string;
  impact: string;
  prevention: string;
}

/**
 * Bug fix proposal
 */
export interface BugFix {
  bugId: string;
  file: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  sideEffects: string[];
  testSuggestions: string[];
  confidence: number; // 0-1 scale
}

/**
 * Bug fix verification result
 */
export interface FixVerification {
  bugId: string;
  fixApplied: boolean;
  testsPass: boolean;
  regressionDetected: boolean;
  verificationSteps: string[];
  notes: string;
}

/**
 * Common bug patterns to detect
 */
export const BUG_PATTERNS: Record<BugCategory, string[]> = {
  'logic-error': [
    'off-by-one in loop bounds',
    'incorrect boolean logic (&&/|| confusion)',
    'wrong comparison operator (== vs ===)',
    'missing break in switch/case',
    'incorrect order of operations',
  ],
  'null-reference': [
    'accessing property on potentially null value',
    'missing null check before method call',
    'optional chaining not used',
    'destructuring without defaults',
    'array access without bounds check',
  ],
  'race-condition': [
    'shared mutable state without synchronization',
    'time-of-check to time-of-use (TOCTOU)',
    'unhandled promise race conditions',
    'missing await on async operations',
    'concurrent map access without locks',
  ],
  'memory-leak': [
    'event listeners not removed on cleanup',
    'setInterval/setTimeout not cleared',
    'closures holding references to large objects',
    'missing resource cleanup in error paths',
    'unbounded cache growth',
  ],
  'type-error': [
    'implicit type coercion bugs',
    'incorrect type assertion/cast',
    'wrong generic type parameter',
    'mixing number and string types',
    'enum value comparison errors',
  ],
  'api-misuse': [
    'incorrect API parameter order',
    'missing required API parameters',
    'wrong HTTP method for endpoint',
    'ignoring API error responses',
    'deprecated API usage',
  ],
  'state-management': [
    'stale state references in closures',
    'mutating state directly instead of immutably',
    'missing state initialization',
    'state updates not batched',
    'circular state dependencies',
  ],
  'error-handling': [
    'empty catch blocks swallowing errors',
    'unhandled promise rejections',
    'missing error propagation',
    'incorrect error type checking',
    'finally block masking errors',
  ],
  'boundary-error': [
    'integer overflow/underflow',
    'buffer overrun',
    'string length not validated',
    'array index out of bounds',
    'date/time boundary handling',
  ],
  'configuration': [
    'hardcoded environment-specific values',
    'missing environment variable fallbacks',
    'incorrect default configuration',
    'configuration not validated on startup',
    'secrets in configuration files',
  ],
};

export const bugFixerMetadata: AgentMetadata = {
  id: 'bug-fixer',
  name: 'Bug Fixer',
  description: 'Identifies bugs, diagnoses root causes, suggests fixes, and verifies corrections',
  category: 'analysis',
  capabilities: [
    'Identify common bug patterns in code',
    'Diagnose root causes of reported issues',
    'Suggest targeted fixes with explanations',
    'Verify fixes do not introduce regressions',
    'Classify bugs by severity and category',
    'Detect race conditions and memory leaks',
    'Find error handling gaps',
    'Recommend preventive measures',
  ],
  requiredTools: [
    'security-scanner',
    'ast-parser',
    'bashExec',
    'git-ops',
    'file-editor',
  ],
  examples: [
    'Find bugs in this function',
    'Why is this code throwing a null reference error?',
    'Fix this race condition',
    'Diagnose why this test is failing intermittently',
    'Check this module for common bug patterns',
    'What bugs were introduced in the last commit?',
  ],
};

export const bugFixerConfig: AgentConfig = {
  id: 'bug-fixer',
  name: 'Bug Fixer',
  description: bugFixerMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.2,
    maxTokens: 4000,
  },
  tools: bugFixerMetadata.requiredTools,
  systemPrompt: BUG_FIXER_SYSTEM_PROMPT,
  maxIterations: 15,
  timeout: 120000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};

/**
 * Generate a unique bug ID
 */
export function generateBugId(category: BugCategory, file: string, line: number): string {
  const fileHash = file.split('/').pop()?.replace(/\./g, '-') ?? 'unknown';
  return `${category}-${fileHash}-L${line}`;
}

/**
 * Classify bug severity based on category and context
 */
export function classifySeverity(
  category: BugCategory,
  isInCriticalPath: boolean,
  affectsDataIntegrity: boolean,
): BugSeverity {
  // Data integrity issues are always critical
  if (affectsDataIntegrity) return 'critical';

  // Critical path issues are at least high severity
  if (isInCriticalPath) {
    if (
      category === 'race-condition' ||
      category === 'memory-leak' ||
      category === 'null-reference'
    ) {
      return 'critical';
    }
    return 'high';
  }

  // Default severity by category
  const severityMap: Record<BugCategory, BugSeverity> = {
    'race-condition': 'high',
    'memory-leak': 'high',
    'null-reference': 'high',
    'logic-error': 'medium',
    'type-error': 'medium',
    'error-handling': 'medium',
    'boundary-error': 'medium',
    'api-misuse': 'medium',
    'state-management': 'medium',
    'configuration': 'low',
  };

  return severityMap[category] ?? 'medium';
}

/**
 * Get bug patterns for a given category
 */
export function getPatternsForCategory(category: BugCategory): string[] {
  return BUG_PATTERNS[category] ?? [];
}

/**
 * Sort bug reports by severity (most severe first)
 */
export function sortBugsBySeverity(bugs: BugReport[]): BugReport[] {
  const severityOrder: Record<BugSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...bugs].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * Calculate fix confidence based on available information
 */
export function calculateFixConfidence(
  hasTests: boolean,
  hasReproduction: boolean,
  isCommonPattern: boolean,
  hasGitHistory: boolean,
): number {
  let confidence = 0.3; // base confidence

  if (hasTests) confidence += 0.2;
  if (hasReproduction) confidence += 0.2;
  if (isCommonPattern) confidence += 0.15;
  if (hasGitHistory) confidence += 0.15;

  return Math.min(confidence, 1.0);
}
