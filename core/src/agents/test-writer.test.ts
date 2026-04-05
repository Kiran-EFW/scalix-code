/**
 * Test Writer Agent Tests
 */

import { describe, it, expect } from 'vitest';
import {
  testWriterConfig,
  testWriterMetadata,
  SUPPORTED_FRAMEWORKS,
  detectFramework,
  getTestFilePath,
  parseCoverageOutput,
  generateTestTemplate,
} from './test-writer';

describe('Test Writer Agent', () => {
  describe('metadata', () => {
    it('should have correct id and category', () => {
      expect(testWriterMetadata.id).toBe('test-writer');
      expect(testWriterMetadata.category).toBe('generation');
    });

    it('should require correct tools', () => {
      expect(testWriterMetadata.requiredTools).toContain('readFile');
      expect(testWriterMetadata.requiredTools).toContain('ast-parser');
      expect(testWriterMetadata.requiredTools).toContain('bashExec');
    });

    it('should have capabilities and examples', () => {
      expect(testWriterMetadata.capabilities.length).toBeGreaterThan(0);
      expect(testWriterMetadata.examples.length).toBeGreaterThan(0);
    });
  });

  describe('config', () => {
    it('should have a system prompt', () => {
      expect(testWriterConfig.systemPrompt).toBeTruthy();
      expect(testWriterConfig.systemPrompt.length).toBeGreaterThan(100);
    });

    it('should use low temperature for precise test generation', () => {
      expect(testWriterConfig.model.temperature).toBeLessThanOrEqual(0.5);
    });

    it('should have higher max iterations for complex test generation', () => {
      expect(testWriterConfig.maxIterations).toBeGreaterThanOrEqual(15);
    });
  });

  describe('SUPPORTED_FRAMEWORKS', () => {
    it('should include jest, pytest, and go-test', () => {
      const names = SUPPORTED_FRAMEWORKS.map(f => f.name);
      expect(names).toContain('jest');
      expect(names).toContain('pytest');
      expect(names).toContain('go-test');
    });
  });

  describe('detectFramework', () => {
    it('should detect Jest from config files', () => {
      const framework = detectFramework(['jest.config.ts', 'src/app.ts']);
      expect(framework).not.toBeNull();
      expect(framework!.name).toBe('jest');
      expect(framework!.language).toBe('typescript');
    });

    it('should detect Jest JavaScript', () => {
      const framework = detectFramework(['jest.config.js', 'src/app.js']);
      expect(framework).not.toBeNull();
      expect(framework!.name).toBe('jest');
      expect(framework!.language).toBe('javascript');
    });

    it('should detect Vitest', () => {
      const framework = detectFramework(['vitest.config.ts', 'src/app.ts']);
      expect(framework).not.toBeNull();
      expect(framework!.name).toBe('vitest');
    });

    it('should detect Pytest', () => {
      const framework = detectFramework(['pyproject.toml', 'src/main.py']);
      expect(framework).not.toBeNull();
      expect(framework!.name).toBe('pytest');
    });

    it('should detect Go test', () => {
      const framework = detectFramework(['go.mod', 'main.go']);
      expect(framework).not.toBeNull();
      expect(framework!.name).toBe('go-test');
    });

    it('should return null for unknown frameworks', () => {
      const framework = detectFramework(['README.md', 'Makefile']);
      expect(framework).toBeNull();
    });
  });

  describe('getTestFilePath', () => {
    it('should generate Jest test path', () => {
      const jestFramework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'jest' && f.language === 'typescript')!;
      expect(getTestFilePath('src/utils.ts', jestFramework)).toBe('src/utils.test.ts');
    });

    it('should generate Pytest test path', () => {
      const pytestFramework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'pytest')!;
      expect(getTestFilePath('src/utils.py', pytestFramework)).toBe('src/test_utils.py');
    });

    it('should generate Go test path', () => {
      const goFramework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'go-test')!;
      expect(getTestFilePath('pkg/utils.go', goFramework)).toBe('pkg/utils_test.go');
    });
  });

  describe('parseCoverageOutput', () => {
    it('should parse Jest coverage output', () => {
      const jestFramework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'jest')!;
      const output = `
 File          | % Stmts | % Branch | % Funcs | % Lines |
 utils.ts      |   85.5  |   70.2   |   90.0  |   88.3  |
 index.ts      |   100   |   100    |   100   |   100   |
`;
      const results = parseCoverageOutput(output, jestFramework);
      expect(results.length).toBe(2);
      expect(results[0].file).toBe('utils.ts');
      expect(results[0].statements).toBe(85.5);
    });

    it('should parse Go test coverage output', () => {
      const goFramework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'go-test')!;
      const output = `ok  \tgithub.com/user/pkg\t0.5s\tcoverage: 78.5% of statements`;
      const results = parseCoverageOutput(output, goFramework);
      expect(results.length).toBe(1);
      expect(results[0].lines).toBe(78.5);
    });

    it('should return empty for unparseable output', () => {
      const jestFramework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'jest')!;
      const results = parseCoverageOutput('no coverage data', jestFramework);
      expect(results).toEqual([]);
    });
  });

  describe('generateTestTemplate', () => {
    it('should generate Jest template', () => {
      const framework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'jest')!;
      const template = generateTestTemplate('myFunction', framework, './utils');
      expect(template).toContain("import { myFunction }");
      expect(template).toContain("describe('myFunction'");
      expect(template).toContain('expect(result)');
    });

    it('should generate Pytest template', () => {
      const framework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'pytest')!;
      const template = generateTestTemplate('my_function', framework, 'utils');
      expect(template).toContain('import pytest');
      expect(template).toContain('class TestMy_function');
      expect(template).toContain('def test_valid_input');
    });

    it('should generate Go test template', () => {
      const framework = SUPPORTED_FRAMEWORKS.find(f => f.name === 'go-test')!;
      const template = generateTestTemplate('myFunction', framework, 'pkg/utils');
      expect(template).toContain('func TestMyFunction');
      expect(template).toContain('t.Run');
    });
  });
});
