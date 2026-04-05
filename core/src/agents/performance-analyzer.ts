/**
 * Performance Analyzer Agent
 *
 * Identifies performance bottlenecks, suggests optimizations,
 * and detects memory leaks and resource management issues.
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';
import { PERFORMANCE_ANALYZER_SYSTEM_PROMPT } from './prompts/performance-analyzer';

/**
 * Performance issue severity
 */
export type PerformanceSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Performance issue category
 */
export type PerformanceCategory =
  | 'algorithmic-complexity'
  | 'memory-management'
  | 'io-operations'
  | 'concurrency'
  | 'data-structures'
  | 'network'
  | 'rendering'
  | 'database';

/**
 * A detected performance issue
 */
export interface PerformanceIssue {
  id: string;
  category: PerformanceCategory;
  severity: PerformanceSeverity;
  title: string;
  description: string;
  file: string;
  startLine: number;
  endLine: number;
  currentComplexity?: string;
  suggestedComplexity?: string;
  estimatedImpact: string;
  optimization: string;
  tradeOffs: string[];
  codeSnippet: string;
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
  issueId: string;
  file: string;
  originalCode: string;
  optimizedCode: string;
  explanation: string;
  expectedSpeedup: string;
  memoryImpact: string;
  tradeOffs: string[];
  verificationSteps: string[];
}

/**
 * Performance benchmark result
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  avgDuration: number; // milliseconds
  minDuration: number;
  maxDuration: number;
  memoryUsage: number; // bytes
  throughput: number; // operations per second
}

/**
 * Memory leak detection result
 */
export interface MemoryLeakReport {
  file: string;
  line: number;
  type: 'event-listener' | 'timer' | 'closure' | 'cache' | 'resource';
  description: string;
  severity: PerformanceSeverity;
  fix: string;
}

/**
 * Algorithmic complexity patterns to detect
 */
export const COMPLEXITY_PATTERNS: Record<string, {
  pattern: string;
  complexity: string;
  suggestion: string;
}> = {
  'nested-loops': {
    pattern: 'Nested iteration over same or related collections',
    complexity: 'O(n^2) or worse',
    suggestion: 'Use hash maps for lookups, reduce to O(n)',
  },
  'repeated-search': {
    pattern: 'Linear search in a loop',
    complexity: 'O(n^2)',
    suggestion: 'Pre-build a Set or Map for O(1) lookups',
  },
  'recursive-fibonacci': {
    pattern: 'Naive recursive computation without memoization',
    complexity: 'O(2^n)',
    suggestion: 'Add memoization or use iterative approach',
  },
  'string-concatenation': {
    pattern: 'String concatenation in a loop',
    complexity: 'O(n^2) due to string immutability',
    suggestion: 'Use array join or StringBuilder pattern',
  },
  'unnecessary-sort': {
    pattern: 'Sorting when only min/max is needed',
    complexity: 'O(n log n) instead of O(n)',
    suggestion: 'Use single-pass min/max finding',
  },
  'n-plus-one': {
    pattern: 'Database query inside a loop (N+1 problem)',
    complexity: 'O(n) queries instead of O(1)',
    suggestion: 'Batch queries, use eager loading or joins',
  },
};

/**
 * Memory leak patterns to detect
 */
export const MEMORY_LEAK_PATTERNS = [
  {
    name: 'unremoved-event-listener',
    description: 'addEventListener without corresponding removeEventListener',
    type: 'event-listener' as const,
  },
  {
    name: 'uncleared-timer',
    description: 'setInterval or setTimeout without cleanup',
    type: 'timer' as const,
  },
  {
    name: 'closure-capture',
    description: 'Closure holding reference to large object scope',
    type: 'closure' as const,
  },
  {
    name: 'unbounded-cache',
    description: 'Cache or Map that grows without eviction',
    type: 'cache' as const,
  },
  {
    name: 'unclosed-resource',
    description: 'File handle, connection, or stream not closed',
    type: 'resource' as const,
  },
];

export const performanceAnalyzerMetadata: AgentMetadata = {
  id: 'performance-analyzer',
  name: 'Performance Analyzer',
  description: 'Identifies performance bottlenecks, suggests optimizations, and detects memory leaks',
  category: 'analysis',
  capabilities: [
    'Identify algorithmic complexity issues',
    'Detect memory leaks and resource management problems',
    'Suggest performance optimizations',
    'Analyze I/O and database query patterns',
    'Profile critical code paths',
    'Detect N+1 query problems',
    'Find unnecessary computations and allocations',
    'Benchmark and compare implementations',
  ],
  requiredTools: [
    'ast-parser',
    'metrics-calculator',
    'bashExec',
    'readFile',
    'security-scanner',
  ],
  examples: [
    'Find performance bottlenecks in this module',
    'Is there a memory leak in this code?',
    'Optimize this database query',
    'What is the time complexity of this function?',
    'Detect N+1 query problems in this API',
    'How can I make this function faster?',
  ],
};

export const performanceAnalyzerConfig: AgentConfig = {
  id: 'performance-analyzer',
  name: 'Performance Analyzer',
  description: performanceAnalyzerMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.2,
    maxTokens: 4000,
  },
  tools: performanceAnalyzerMetadata.requiredTools,
  systemPrompt: PERFORMANCE_ANALYZER_SYSTEM_PROMPT,
  maxIterations: 12,
  timeout: 120000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};

/**
 * Generate a unique performance issue ID
 */
export function generateIssueId(
  category: PerformanceCategory,
  file: string,
  line: number,
): string {
  const fileSlug = file.split('/').pop()?.replace(/\./g, '-') ?? 'unknown';
  return `perf-${category}-${fileSlug}-L${line}`;
}

/**
 * Classify performance severity based on impact
 */
export function classifyPerformanceSeverity(
  category: PerformanceCategory,
  isHotPath: boolean,
  scaleFactor: number,
): PerformanceSeverity {
  // N+1 queries and algorithmic issues on hot paths are critical
  if (isHotPath && (category === 'database' || category === 'algorithmic-complexity')) {
    return scaleFactor > 100 ? 'critical' : 'high';
  }

  // Memory leaks are always at least medium
  if (category === 'memory-management') {
    return isHotPath ? 'high' : 'medium';
  }

  // General severity mapping
  if (scaleFactor > 1000) return 'critical';
  if (scaleFactor > 100) return 'high';
  if (scaleFactor > 10) return 'medium';
  return 'low';
}

/**
 * Estimate the speedup from an optimization
 */
export function estimateSpeedup(
  currentComplexity: string,
  proposedComplexity: string,
  inputSize: number,
): string {
  const complexityValues: Record<string, (n: number) => number> = {
    'O(1)': () => 1,
    'O(log n)': (n) => Math.log2(n),
    'O(n)': (n) => n,
    'O(n log n)': (n) => n * Math.log2(n),
    'O(n^2)': (n) => n * n,
    'O(n^3)': (n) => n * n * n,
    'O(2^n)': (n) => Math.pow(2, n),
  };

  const currentFn = complexityValues[currentComplexity];
  const proposedFn = complexityValues[proposedComplexity];

  if (!currentFn || !proposedFn) {
    return 'Unknown - cannot estimate without complexity information';
  }

  const currentOps = currentFn(inputSize);
  const proposedOps = proposedFn(inputSize);
  const speedup = currentOps / proposedOps;

  if (speedup > 1000) return `~${Math.round(speedup)}x faster (dramatic improvement)`;
  if (speedup > 100) return `~${Math.round(speedup)}x faster (significant improvement)`;
  if (speedup > 10) return `~${Math.round(speedup)}x faster (notable improvement)`;
  if (speedup > 2) return `~${speedup.toFixed(1)}x faster (moderate improvement)`;
  return `~${speedup.toFixed(1)}x faster (minor improvement)`;
}

/**
 * Sort performance issues by severity and impact
 */
export function sortIssuesBySeverity(issues: PerformanceIssue[]): PerformanceIssue[] {
  const severityOrder: Record<PerformanceSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * Get complexity pattern information
 */
export function getComplexityPattern(patternName: string): {
  pattern: string;
  complexity: string;
  suggestion: string;
} | null {
  return COMPLEXITY_PATTERNS[patternName] ?? null;
}
