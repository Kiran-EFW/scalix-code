/**
 * Performance Analyzer Agent Tests
 */

import { describe, it, expect } from 'vitest';
import {
  performanceAnalyzerConfig,
  performanceAnalyzerMetadata,
  COMPLEXITY_PATTERNS,
  MEMORY_LEAK_PATTERNS,
  generateIssueId,
  classifyPerformanceSeverity,
  estimateSpeedup,
  sortIssuesBySeverity,
  getComplexityPattern,
} from './performance-analyzer';
import type { PerformanceIssue } from './performance-analyzer';

describe('Performance Analyzer Agent', () => {
  describe('metadata', () => {
    it('should have correct id and category', () => {
      expect(performanceAnalyzerMetadata.id).toBe('performance-analyzer');
      expect(performanceAnalyzerMetadata.category).toBe('analysis');
    });

    it('should require correct tools', () => {
      expect(performanceAnalyzerMetadata.requiredTools).toContain('ast-parser');
      expect(performanceAnalyzerMetadata.requiredTools).toContain('metrics-calculator');
      expect(performanceAnalyzerMetadata.requiredTools).toContain('bashExec');
    });
  });

  describe('config', () => {
    it('should have a system prompt', () => {
      expect(performanceAnalyzerConfig.systemPrompt).toBeTruthy();
    });

    it('should use low temperature for precise analysis', () => {
      expect(performanceAnalyzerConfig.model.temperature).toBeLessThanOrEqual(0.3);
    });
  });

  describe('COMPLEXITY_PATTERNS', () => {
    it('should include common complexity patterns', () => {
      expect(COMPLEXITY_PATTERNS['nested-loops']).toBeDefined();
      expect(COMPLEXITY_PATTERNS['n-plus-one']).toBeDefined();
      expect(COMPLEXITY_PATTERNS['string-concatenation']).toBeDefined();
    });

    it('should have pattern, complexity, and suggestion for each', () => {
      for (const [, value] of Object.entries(COMPLEXITY_PATTERNS)) {
        expect(value.pattern).toBeTruthy();
        expect(value.complexity).toBeTruthy();
        expect(value.suggestion).toBeTruthy();
      }
    });
  });

  describe('MEMORY_LEAK_PATTERNS', () => {
    it('should include common memory leak patterns', () => {
      const types = MEMORY_LEAK_PATTERNS.map(p => p.type);
      expect(types).toContain('event-listener');
      expect(types).toContain('timer');
      expect(types).toContain('closure');
      expect(types).toContain('cache');
    });
  });

  describe('generateIssueId', () => {
    it('should create a prefixed ID', () => {
      const id = generateIssueId('algorithmic-complexity', 'src/sort.ts', 15);
      expect(id).toBe('perf-algorithmic-complexity-sort-ts-L15');
    });
  });

  describe('classifyPerformanceSeverity', () => {
    it('should classify hot-path database issues with high scale as critical', () => {
      expect(classifyPerformanceSeverity('database', true, 200)).toBe('critical');
    });

    it('should classify hot-path algorithmic issues as high', () => {
      expect(classifyPerformanceSeverity('algorithmic-complexity', true, 50)).toBe('high');
    });

    it('should classify memory issues on hot path as high', () => {
      expect(classifyPerformanceSeverity('memory-management', true, 1)).toBe('high');
    });

    it('should classify memory issues off hot path as medium', () => {
      expect(classifyPerformanceSeverity('memory-management', false, 1)).toBe('medium');
    });

    it('should classify by scale factor for general categories', () => {
      expect(classifyPerformanceSeverity('network', false, 1500)).toBe('critical');
      expect(classifyPerformanceSeverity('network', false, 150)).toBe('high');
      expect(classifyPerformanceSeverity('network', false, 15)).toBe('medium');
      expect(classifyPerformanceSeverity('network', false, 5)).toBe('low');
    });
  });

  describe('estimateSpeedup', () => {
    it('should estimate O(n^2) to O(n) speedup', () => {
      const result = estimateSpeedup('O(n^2)', 'O(n)', 1000);
      expect(result).toContain('1000x');
    });

    it('should estimate O(n^2) to O(n log n) speedup', () => {
      const result = estimateSpeedup('O(n^2)', 'O(n log n)', 1000);
      expect(result).toContain('faster');
    });

    it('should handle unknown complexity', () => {
      const result = estimateSpeedup('O(unknown)', 'O(n)', 100);
      expect(result).toContain('Unknown');
    });

    it('should describe minor improvements', () => {
      const result = estimateSpeedup('O(n log n)', 'O(n)', 10);
      expect(result).toContain('faster');
    });
  });

  describe('sortIssuesBySeverity', () => {
    it('should sort critical issues first', () => {
      const issues: PerformanceIssue[] = [
        { id: '1', category: 'network', severity: 'low', title: '', description: '', file: '', startLine: 1, endLine: 5, estimatedImpact: '', optimization: '', tradeOffs: [], codeSnippet: '' },
        { id: '2', category: 'database', severity: 'critical', title: '', description: '', file: '', startLine: 1, endLine: 5, estimatedImpact: '', optimization: '', tradeOffs: [], codeSnippet: '' },
        { id: '3', category: 'memory-management', severity: 'high', title: '', description: '', file: '', startLine: 1, endLine: 5, estimatedImpact: '', optimization: '', tradeOffs: [], codeSnippet: '' },
      ];
      const sorted = sortIssuesBySeverity(issues);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('high');
      expect(sorted[2].severity).toBe('low');
    });
  });

  describe('getComplexityPattern', () => {
    it('should return pattern info for known patterns', () => {
      const pattern = getComplexityPattern('nested-loops');
      expect(pattern).not.toBeNull();
      expect(pattern!.complexity).toBe('O(n^2) or worse');
    });

    it('should return null for unknown patterns', () => {
      expect(getComplexityPattern('unknown')).toBeNull();
    });
  });
});
