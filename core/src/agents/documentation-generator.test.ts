/**
 * Documentation Generator Agent Tests
 */

import { describe, it, expect } from 'vitest';
import {
  documentationGeneratorConfig,
  documentationGeneratorMetadata,
  STANDARD_README_SECTIONS,
  DOC_STYLES,
  detectDocStyle,
  generateJSDoc,
  generateDocstring,
  generateGoDoc,
  findUndocumentedFunctions,
  generateTableOfContents,
} from './documentation-generator';
import type { FunctionSignature, DocumentationSection } from './documentation-generator';

describe('Documentation Generator Agent', () => {
  describe('metadata', () => {
    it('should have correct id and category', () => {
      expect(documentationGeneratorMetadata.id).toBe('documentation-generator');
      expect(documentationGeneratorMetadata.category).toBe('generation');
    });

    it('should require correct tools', () => {
      expect(documentationGeneratorMetadata.requiredTools).toContain('ast-parser');
      expect(documentationGeneratorMetadata.requiredTools).toContain('file-editor');
    });
  });

  describe('config', () => {
    it('should have a system prompt', () => {
      expect(documentationGeneratorConfig.systemPrompt).toBeTruthy();
    });

    it('should use moderate temperature for creative documentation', () => {
      expect(documentationGeneratorConfig.model.temperature).toBe(0.5);
    });
  });

  describe('STANDARD_README_SECTIONS', () => {
    it('should include required sections', () => {
      const required = STANDARD_README_SECTIONS.filter(s => s.required);
      const requiredIds = required.map(s => s.id);
      expect(requiredIds).toContain('title');
      expect(requiredIds).toContain('description');
      expect(requiredIds).toContain('installation');
      expect(requiredIds).toContain('license');
    });
  });

  describe('DOC_STYLES', () => {
    it('should have styles for common languages', () => {
      expect(DOC_STYLES.typescript).toBeDefined();
      expect(DOC_STYLES.python).toBeDefined();
      expect(DOC_STYLES.go).toBeDefined();
    });

    it('should have correct JSDoc markers for TypeScript', () => {
      expect(DOC_STYLES.typescript.commentStart).toBe('/**');
      expect(DOC_STYLES.typescript.paramTag).toBe('@param');
    });
  });

  describe('detectDocStyle', () => {
    it('should detect TypeScript files', () => {
      expect(detectDocStyle('src/utils.ts')).toBe('typescript');
      expect(detectDocStyle('src/app.tsx')).toBe('typescript');
    });

    it('should detect Python files', () => {
      expect(detectDocStyle('src/utils.py')).toBe('python');
    });

    it('should detect Go files', () => {
      expect(detectDocStyle('main.go')).toBe('go');
    });

    it('should default to typescript for unknown extensions', () => {
      expect(detectDocStyle('file.unknown')).toBe('typescript');
    });
  });

  describe('generateJSDoc', () => {
    it('should generate a valid JSDoc comment', () => {
      const signature: FunctionSignature = {
        name: 'add',
        parameters: [
          { name: 'a', type: 'number', isOptional: false },
          { name: 'b', type: 'number', isOptional: false },
        ],
        returnType: 'number',
        isAsync: false,
        isExported: true,
        decorators: [],
        genericTypes: [],
      };
      const doc = generateJSDoc(signature, 'Adds two numbers together');
      expect(doc).toContain('/**');
      expect(doc).toContain('Adds two numbers together');
      expect(doc).toContain('@param a');
      expect(doc).toContain('@param b');
      expect(doc).toContain('@returns number');
      expect(doc).toContain('*/');
    });

    it('should handle optional parameters', () => {
      const signature: FunctionSignature = {
        name: 'greet',
        parameters: [
          { name: 'name', type: 'string', isOptional: true, defaultValue: '"World"' },
        ],
        returnType: 'string',
        isAsync: false,
        isExported: true,
        decorators: [],
        genericTypes: [],
      };
      const doc = generateJSDoc(signature, 'Greets a person');
      expect(doc).toContain('(optional)');
      expect(doc).toContain('defaults to "World"');
    });

    it('should handle generic types', () => {
      const signature: FunctionSignature = {
        name: 'identity',
        parameters: [{ name: 'value', type: 'T', isOptional: false }],
        returnType: 'T',
        isAsync: false,
        isExported: true,
        decorators: [],
        genericTypes: ['T'],
      };
      const doc = generateJSDoc(signature, 'Returns the input value');
      expect(doc).toContain('@template T');
    });

    it('should not include @returns for void functions', () => {
      const signature: FunctionSignature = {
        name: 'doSomething',
        parameters: [],
        returnType: 'void',
        isAsync: false,
        isExported: true,
        decorators: [],
        genericTypes: [],
      };
      const doc = generateJSDoc(signature, 'Does something');
      expect(doc).not.toContain('@returns');
    });
  });

  describe('generateDocstring', () => {
    it('should generate a valid Python docstring', () => {
      const signature: FunctionSignature = {
        name: 'calculate',
        parameters: [
          { name: 'x', type: 'int', isOptional: false },
          { name: 'y', type: 'int', isOptional: true, defaultValue: '0' },
        ],
        returnType: 'int',
        isAsync: false,
        isExported: true,
        decorators: [],
        genericTypes: [],
      };
      const doc = generateDocstring(signature, 'Calculates a result');
      expect(doc).toContain('"""');
      expect(doc).toContain('Calculates a result');
      expect(doc).toContain('Args:');
      expect(doc).toContain('x (int)');
      expect(doc).toContain('y (int, optional)');
      expect(doc).toContain('Returns:');
    });
  });

  describe('generateGoDoc', () => {
    it('should generate a Go doc comment', () => {
      const doc = generateGoDoc('Calculate', 'computes the result of an operation');
      expect(doc).toBe('// Calculate computes the result of an operation');
    });
  });

  describe('findUndocumentedFunctions', () => {
    it('should find exported functions without documentation', () => {
      const signatures: FunctionSignature[] = [
        { name: 'documented', parameters: [], returnType: 'void', isAsync: false, isExported: true, decorators: [], genericTypes: [] },
        { name: 'undocumented', parameters: [], returnType: 'void', isAsync: false, isExported: true, decorators: [], genericTypes: [] },
        { name: 'internal', parameters: [], returnType: 'void', isAsync: false, isExported: false, decorators: [], genericTypes: [] },
      ];
      const existingDocs = ['/** documented - does something */'];
      const undocumented = findUndocumentedFunctions(signatures, existingDocs);
      expect(undocumented.length).toBe(1);
      expect(undocumented[0].name).toBe('undocumented');
    });
  });

  describe('generateTableOfContents', () => {
    it('should generate markdown links sorted by order', () => {
      const sections: DocumentationSection[] = [
        { title: 'Installation', content: '', order: 2 },
        { title: 'Quick Start', content: '', order: 3 },
        { title: 'Overview', content: '', order: 1 },
      ];
      const toc = generateTableOfContents(sections);
      const lines = toc.split('\n');
      expect(lines[0]).toContain('Overview');
      expect(lines[1]).toContain('Installation');
      expect(lines[2]).toContain('Quick Start');
      expect(lines[0]).toContain('#overview');
    });
  });
});
