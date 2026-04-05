/**
 * Refactoring Agent Tests
 */

import { describe, it, expect } from 'vitest';
import {
  refactorerConfig,
  refactorerMetadata,
  CODE_SMELL_THRESHOLDS,
  PATTERN_SUGGESTIONS,
  isLongMethod,
  isLargeClass,
  hasLongParameterList,
  isDeepNesting,
  assessRefactoringRisk,
  getPatternSuggestions,
  calculateComplexityReduction,
  generateProposalId,
} from './refactorer';

describe('Refactoring Agent', () => {
  describe('metadata', () => {
    it('should have correct id and category', () => {
      expect(refactorerMetadata.id).toBe('refactorer');
      expect(refactorerMetadata.category).toBe('refactoring');
    });

    it('should require correct tools', () => {
      expect(refactorerMetadata.requiredTools).toContain('ast-parser');
      expect(refactorerMetadata.requiredTools).toContain('metrics-calculator');
      expect(refactorerMetadata.requiredTools).toContain('file-editor');
    });
  });

  describe('config', () => {
    it('should have a system prompt', () => {
      expect(refactorerConfig.systemPrompt).toBeTruthy();
    });
  });

  describe('code smell detection', () => {
    it('should detect long methods', () => {
      expect(isLongMethod(21)).toBe(true);
      expect(isLongMethod(20)).toBe(false);
      expect(isLongMethod(10)).toBe(false);
    });

    it('should detect large classes', () => {
      expect(isLargeClass(201)).toBe(true);
      expect(isLargeClass(200)).toBe(false);
    });

    it('should detect long parameter lists', () => {
      expect(hasLongParameterList(4)).toBe(true);
      expect(hasLongParameterList(3)).toBe(false);
    });

    it('should detect deep nesting', () => {
      expect(isDeepNesting(4)).toBe(true);
      expect(isDeepNesting(3)).toBe(false);
    });
  });

  describe('assessRefactoringRisk', () => {
    it('should rate public API rename as high risk', () => {
      expect(assessRefactoringRisk('rename', 1, true, true)).toBe('high');
    });

    it('should rate multi-file changes without tests as high risk', () => {
      expect(assessRefactoringRisk('extract-function', 4, false, false)).toBe('high');
    });

    it('should rate multi-file changes with tests as medium risk', () => {
      expect(assessRefactoringRisk('extract-function', 2, true, false)).toBe('medium');
    });

    it('should rate single-file simple changes as low risk', () => {
      expect(assessRefactoringRisk('inline', 1, true, false)).toBe('low');
    });

    it('should rate extract-class as medium risk even for single file', () => {
      expect(assessRefactoringRisk('extract-class', 1, true, false)).toBe('medium');
    });
  });

  describe('getPatternSuggestions', () => {
    it('should return suggestions for long methods', () => {
      const suggestions = getPatternSuggestions('long-method');
      expect(suggestions).toContain('Extract Method');
    });

    it('should return suggestions for duplicated code', () => {
      const suggestions = getPatternSuggestions('duplicated-code');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty for unknown smells', () => {
      const suggestions = getPatternSuggestions('unknown' as any);
      expect(suggestions).toEqual([]);
    });
  });

  describe('calculateComplexityReduction', () => {
    it('should calculate absolute and percentage reduction', () => {
      const result = calculateComplexityReduction(20, 10);
      expect(result.absolute).toBe(10);
      expect(result.percentage).toBe(50);
    });

    it('should handle zero complexity', () => {
      const result = calculateComplexityReduction(0, 0);
      expect(result.absolute).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should handle increase in complexity', () => {
      const result = calculateComplexityReduction(5, 10);
      expect(result.absolute).toBe(-5);
    });
  });

  describe('generateProposalId', () => {
    it('should generate a unique ID', () => {
      const id = generateProposalId('extract-function', 'src/utils.ts');
      expect(id).toMatch(/^extract-function-utils-ts-\d+$/);
    });
  });
});
