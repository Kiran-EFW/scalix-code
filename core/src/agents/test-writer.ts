/**
 * Test Writer Agent
 *
 * Generates unit, integration, and end-to-end tests across
 * multiple testing frameworks (Jest, Pytest, Go test).
 * Analyzes code coverage and identifies testing gaps.
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';
import { TEST_WRITER_SYSTEM_PROMPT } from './prompts/test-writer';

/**
 * Supported test framework configurations
 */
export interface TestFramework {
  name: string;
  language: string;
  filePattern: string;
  runCommand: string;
  coverageCommand: string;
}

export const SUPPORTED_FRAMEWORKS: TestFramework[] = [
  {
    name: 'jest',
    language: 'typescript',
    filePattern: '**/*.test.ts',
    runCommand: 'npx jest',
    coverageCommand: 'npx jest --coverage',
  },
  {
    name: 'jest',
    language: 'javascript',
    filePattern: '**/*.test.js',
    runCommand: 'npx jest',
    coverageCommand: 'npx jest --coverage',
  },
  {
    name: 'vitest',
    language: 'typescript',
    filePattern: '**/*.test.ts',
    runCommand: 'npx vitest run',
    coverageCommand: 'npx vitest run --coverage',
  },
  {
    name: 'pytest',
    language: 'python',
    filePattern: '**/test_*.py',
    runCommand: 'python -m pytest',
    coverageCommand: 'python -m pytest --cov',
  },
  {
    name: 'go-test',
    language: 'go',
    filePattern: '**/*_test.go',
    runCommand: 'go test ./...',
    coverageCommand: 'go test -cover ./...',
  },
];

/**
 * Test generation types
 */
export type TestType = 'unit' | 'integration' | 'e2e';

/**
 * Coverage analysis result
 */
export interface CoverageResult {
  file: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines: number[];
}

/**
 * Test generation request
 */
export interface TestGenerationRequest {
  targetFile: string;
  testType: TestType;
  framework?: string;
  existingTests?: string;
  coverageTarget?: number;
}

/**
 * Test generation result
 */
export interface TestGenerationResult {
  testFile: string;
  testCode: string;
  testCount: number;
  coverage: CoverageResult | null;
  framework: string;
  suggestions: string[];
}

export const testWriterMetadata: AgentMetadata = {
  id: 'test-writer',
  name: 'Test Writer',
  description: 'Generates comprehensive unit, integration, and E2E tests with coverage analysis',
  category: 'generation',
  capabilities: [
    'Generate unit tests for functions and classes',
    'Create integration tests for component interactions',
    'Write end-to-end tests for user flows',
    'Analyze code coverage and identify gaps',
    'Support Jest, Pytest, and Go test frameworks',
    'Generate test fixtures and mock data',
    'Follow AAA (Arrange-Act-Assert) pattern',
    'Test edge cases and error handling paths',
  ],
  requiredTools: [
    'readFile',
    'findInFiles',
    'ast-parser',
    'smart-file-selector',
    'bashExec',
  ],
  examples: [
    'Write unit tests for this function',
    'Generate integration tests for the API module',
    'Create E2E tests for the checkout flow',
    'What is the test coverage for this file?',
    'Find untested functions in this module',
    'Generate tests for edge cases in this class',
  ],
};

export const testWriterConfig: AgentConfig = {
  id: 'test-writer',
  name: 'Test Writer',
  description: testWriterMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 4000,
  },
  tools: testWriterMetadata.requiredTools,
  systemPrompt: TEST_WRITER_SYSTEM_PROMPT,
  maxIterations: 15,
  timeout: 120000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};

/**
 * Detect the testing framework from project configuration
 */
export function detectFramework(projectFiles: string[]): TestFramework | null {
  // Check for Jest
  if (
    projectFiles.some(f =>
      f.includes('jest.config') || f.includes('.jest')
    )
  ) {
    const isTs = projectFiles.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    return SUPPORTED_FRAMEWORKS.find(
      f => f.name === 'jest' && f.language === (isTs ? 'typescript' : 'javascript')
    ) ?? null;
  }

  // Check for Vitest
  if (projectFiles.some(f => f.includes('vitest.config'))) {
    return SUPPORTED_FRAMEWORKS.find(f => f.name === 'vitest') ?? null;
  }

  // Check for Pytest
  if (
    projectFiles.some(f =>
      f.includes('pytest.ini') ||
      f.includes('pyproject.toml') ||
      f.includes('conftest.py')
    )
  ) {
    return SUPPORTED_FRAMEWORKS.find(f => f.name === 'pytest') ?? null;
  }

  // Check for Go
  if (projectFiles.some(f => f.endsWith('go.mod'))) {
    return SUPPORTED_FRAMEWORKS.find(f => f.name === 'go-test') ?? null;
  }

  return null;
}

/**
 * Generate the test file path from a source file path
 */
export function getTestFilePath(sourceFile: string, framework: TestFramework): string {
  const ext = sourceFile.split('.').pop() ?? '';

  switch (framework.name) {
    case 'jest':
    case 'vitest':
      return sourceFile.replace(`.${ext}`, `.test.${ext}`);
    case 'pytest':
      // Python convention: test_filename.py in same directory
      const parts = sourceFile.split('/');
      const filename = parts.pop() ?? '';
      return [...parts, `test_${filename}`].join('/');
    case 'go-test':
      return sourceFile.replace('.go', '_test.go');
    default:
      return sourceFile.replace(`.${ext}`, `.test.${ext}`);
  }
}

/**
 * Parse coverage output to structured result
 */
export function parseCoverageOutput(
  output: string,
  framework: TestFramework,
): CoverageResult[] {
  const results: CoverageResult[] = [];

  switch (framework.name) {
    case 'jest':
    case 'vitest': {
      // Parse Jest/Vitest table output
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(
          /^\s*([^\s|]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/
        );
        if (match && match[1] && !match[1].includes('---') && match[1] !== 'File') {
          results.push({
            file: match[1].trim(),
            statements: parseFloat(match[2]),
            branches: parseFloat(match[3]),
            functions: parseFloat(match[4]),
            lines: parseFloat(match[5]),
            uncoveredLines: [],
          });
        }
      }
      break;
    }
    case 'pytest': {
      // Parse pytest-cov output
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(
          /^([^\s]+\.py)\s+(\d+)\s+(\d+)\s+(\d+)%/
        );
        if (match && match[1]) {
          const coverage = parseFloat(match[4]);
          results.push({
            file: match[1],
            statements: coverage,
            branches: 0,
            functions: 0,
            lines: coverage,
            uncoveredLines: [],
          });
        }
      }
      break;
    }
    case 'go-test': {
      // Parse go test -cover output
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(/^ok\s+([^\s]+)\s+.*coverage:\s+([\d.]+)%/);
        if (match && match[1]) {
          const coverage = parseFloat(match[2]);
          results.push({
            file: match[1],
            statements: coverage,
            branches: 0,
            functions: 0,
            lines: coverage,
            uncoveredLines: [],
          });
        }
      }
      break;
    }
  }

  return results;
}

/**
 * Generate a test template for the given framework
 */
export function generateTestTemplate(
  functionName: string,
  framework: TestFramework,
  importPath: string,
): string {
  switch (framework.name) {
    case 'jest':
    case 'vitest':
      return `import { ${functionName} } from '${importPath}';

describe('${functionName}', () => {
  it('should handle valid input correctly', () => {
    // Arrange
    const input = undefined; // TODO: Set up test input

    // Act
    const result = ${functionName}(input);

    // Assert
    expect(result).toBeDefined();
  });

  it('should handle edge cases', () => {
    // TODO: Add edge case tests
  });

  it('should handle error cases', () => {
    // TODO: Add error handling tests
  });
});
`;

    case 'pytest':
      return `import pytest
from ${importPath} import ${functionName}


class Test${functionName.charAt(0).toUpperCase() + functionName.slice(1)}:
    """Tests for ${functionName}"""

    def test_valid_input(self):
        """Should handle valid input correctly"""
        # Arrange
        input_data = None  # TODO: Set up test input

        # Act
        result = ${functionName}(input_data)

        # Assert
        assert result is not None

    def test_edge_cases(self):
        """Should handle edge cases"""
        # TODO: Add edge case tests
        pass

    def test_error_cases(self):
        """Should handle error cases"""
        # TODO: Add error handling tests
        with pytest.raises(Exception):
            ${functionName}(None)
`;

    case 'go-test':
      return `package ${importPath.split('/').pop()}

import (
\t"testing"
)

func Test${functionName.charAt(0).toUpperCase() + functionName.slice(1)}(t *testing.T) {
\tt.Run("should handle valid input", func(t *testing.T) {
\t\t// Arrange
\t\t// TODO: Set up test input

\t\t// Act
\t\t// result := ${functionName}(input)

\t\t// Assert
\t\t// if result != expected {
\t\t// \tt.Errorf("expected %v, got %v", expected, result)
\t\t// }
\t})

\tt.Run("should handle edge cases", func(t *testing.T) {
\t\t// TODO: Add edge case tests
\t})

\tt.Run("should handle error cases", func(t *testing.T) {
\t\t// TODO: Add error handling tests
\t})
}
`;

    default:
      return `// Test template for ${functionName}\n// Framework: ${framework.name}\n`;
  }
}
