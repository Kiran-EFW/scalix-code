/**
 * Bug Fixer Agent Tests
 */

import { describe, it, expect } from 'vitest';
import {
  bugFixerConfig,
  bugFixerMetadata,
  BUG_PATTERNS,
  generateBugId,
  classifySeverity,
  getPatternsForCategory,
  sortBugsBySeverity,
  calculateFixConfidence,
} from './bug-fixer';
import type { BugReport } from './bug-fixer';

describe('Bug Fixer Agent', () => {
  describe('metadata', () => {
    it('should have correct id and category', () => {
      expect(bugFixerMetadata.id).toBe('bug-fixer');
      expect(bugFixerMetadata.category).toBe('analysis');
    });

    it('should require correct tools', () => {
      expect(bugFixerMetadata.requiredTools).toContain('security-scanner');
      expect(bugFixerMetadata.requiredTools).toContain('ast-parser');
      expect(bugFixerMetadata.requiredTools).toContain('git-ops');
    });

    it('should have capabilities and examples', () => {
      expect(bugFixerMetadata.capabilities.length).toBeGreaterThan(0);
      expect(bugFixerMetadata.examples.length).toBeGreaterThan(0);
    });
  });

  describe('config', () => {
    it('should have a system prompt', () => {
      expect(bugFixerConfig.systemPrompt).toBeTruthy();
      expect(bugFixerConfig.systemPrompt.length).toBeGreaterThan(100);
    });

    it('should use low temperature for precise bug analysis', () => {
      expect(bugFixerConfig.model.temperature).toBeLessThanOrEqual(0.3);
    });
  });

  describe('BUG_PATTERNS', () => {
    it('should have patterns for all categories', () => {
      const categories = [
        'logic-error', 'null-reference', 'race-condition',
        'memory-leak', 'type-error', 'error-handling',
      ];
      for (const category of categories) {
        expect(BUG_PATTERNS[category as keyof typeof BUG_PATTERNS].length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateBugId', () => {
    it('should create a unique ID from category, file, and line', () => {
      const id = generateBugId('null-reference', 'src/utils.ts', 42);
      expect(id).toBe('null-reference-utils-ts-L42');
    });

    it('should handle paths with directories', () => {
      const id = generateBugId('logic-error', 'src/deep/path/module.ts', 10);
      expect(id).toBe('logic-error-module-ts-L10');
    });
  });

  describe('classifySeverity', () => {
    it('should classify data integrity issues as critical', () => {
      expect(classifySeverity('logic-error', false, true)).toBe('critical');
    });

    it('should classify critical-path race conditions as critical', () => {
      expect(classifySeverity('race-condition', true, false)).toBe('critical');
    });

    it('should classify critical-path memory leaks as critical', () => {
      expect(classifySeverity('memory-leak', true, false)).toBe('critical');
    });

    it('should classify non-critical-path configuration issues as low', () => {
      expect(classifySeverity('configuration', false, false)).toBe('low');
    });

    it('should classify non-critical logic errors as medium', () => {
      expect(classifySeverity('logic-error', false, false)).toBe('medium');
    });
  });

  describe('getPatternsForCategory', () => {
    it('should return patterns for known categories', () => {
      const patterns = getPatternsForCategory('null-reference');
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toContain('null');
    });

    it('should return empty for unknown category', () => {
      const patterns = getPatternsForCategory('unknown' as any);
      expect(patterns).toEqual([]);
    });
  });

  describe('sortBugsBySeverity', () => {
    it('should sort critical bugs first', () => {
      const bugs: BugReport[] = [
        { id: '1', category: 'logic-error', severity: 'low', title: 'Low', description: '', file: '', line: 1, rootCause: '', suggestedFix: '', codeSnippet: '', impact: '', prevention: '' },
        { id: '2', category: 'race-condition', severity: 'critical', title: 'Critical', description: '', file: '', line: 2, rootCause: '', suggestedFix: '', codeSnippet: '', impact: '', prevention: '' },
        { id: '3', category: 'type-error', severity: 'medium', title: 'Medium', description: '', file: '', line: 3, rootCause: '', suggestedFix: '', codeSnippet: '', impact: '', prevention: '' },
      ];

      const sorted = sortBugsBySeverity(bugs);
      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('medium');
      expect(sorted[2].severity).toBe('low');
    });

    it('should not mutate the original array', () => {
      const bugs: BugReport[] = [
        { id: '1', category: 'logic-error', severity: 'low', title: '', description: '', file: '', line: 1, rootCause: '', suggestedFix: '', codeSnippet: '', impact: '', prevention: '' },
      ];
      const sorted = sortBugsBySeverity(bugs);
      expect(sorted).not.toBe(bugs);
    });
  });

  describe('calculateFixConfidence', () => {
    it('should return base confidence with no signals', () => {
      expect(calculateFixConfidence(false, false, false, false)).toBe(0.3);
    });

    it('should increase confidence with tests', () => {
      expect(calculateFixConfidence(true, false, false, false)).toBe(0.5);
    });

    it('should cap confidence at 1.0', () => {
      expect(calculateFixConfidence(true, true, true, true)).toBe(1.0);
    });

    it('should accumulate signals', () => {
      const withAll = calculateFixConfidence(true, true, true, true);
      const withSome = calculateFixConfidence(true, false, false, false);
      expect(withAll).toBeGreaterThan(withSome);
    });
  });
});
