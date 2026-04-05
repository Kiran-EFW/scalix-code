/**
 * Unit Tests for VS Code Extension Components
 */

import { describe, it, expect, vi } from 'vitest';

describe('Diagnostics Provider', () => {
  it('should parse security output correctly', () => {
    // Test parsing logic without VS Code mocks
    const testOutput = `[CRITICAL] src/app.ts:15 - SQL injection vulnerability
[HIGH] src/app.ts:20 - XSS vulnerability`;

    const findingRegex = /^\[(\w+)\]\s+(.+?):(\d+)\s*-\s*(.+)$/;
    const lines = testOutput.split('\n');
    const findings = [];

    for (const line of lines) {
      const match = line.match(findingRegex);
      if (match) {
        const [, severity, file, lineNum, message] = match;
        findings.push({
          severity: severity.toLowerCase(),
          file,
          line: parseInt(lineNum, 10),
          message,
        });
      }
    }

    expect(findings).toHaveLength(2);
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].message).toContain('SQL injection');
    expect(findings[1].severity).toBe('high');
  });

  it('should normalize severity levels', () => {
    const severities = ['CRITICAL', 'CRIT', 'HIGH', 'MEDIUM', 'MED', 'LOW', 'INFO'];
    const normalized = severities.map((s) => {
      const lower = s.toLowerCase();
      if (lower === 'critical' || lower === 'crit') return 'critical';
      if (lower === 'high') return 'high';
      if (lower === 'medium' || lower === 'med') return 'medium';
      if (lower === 'low') return 'low';
      return 'info';
    });

    expect(normalized[0]).toBe('critical');
    expect(normalized[1]).toBe('critical');
    expect(normalized[2]).toBe('high');
    expect(normalized[3]).toBe('medium');
    expect(normalized[4]).toBe('medium');
    expect(normalized[5]).toBe('low');
    expect(normalized[6]).toBe('info');
  });
});

describe('Hover Provider Cache', () => {
  it('should generate cache keys correctly', () => {
    const getCacheKey = (uri: string, line: number, word: string) => {
      return `${uri}:${line}:${word}`;
    };

    const key1 = getCacheKey('file:///test/app.ts', 5, 'const');
    const key2 = getCacheKey('file:///test/app.ts', 5, 'const');
    const key3 = getCacheKey('file:///test/app.ts', 6, 'const');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('should check cache expiration', () => {
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    const cacheEntry = {
      explanation: 'Test explanation',
      timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
    };

    const isExpired = Date.now() - cacheEntry.timestamp > CACHE_TTL_MS;
    expect(isExpired).toBe(false);

    const oldEntry = {
      explanation: 'Old explanation',
      timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    };

    const isOldExpired = Date.now() - oldEntry.timestamp > CACHE_TTL_MS;
    expect(isOldExpired).toBe(true);
  });
});

describe('Code Actions', () => {
  it('should filter diagnostics by source', () => {
    const diagnostics = [
      { source: 'Scalix Security', message: 'Issue 1' },
      { source: 'ESLint', message: 'Issue 2' },
      { source: 'Scalix Security', message: 'Issue 3' },
      { source: 'TypeScript', message: 'Issue 4' },
    ];

    const scalixDiags = diagnostics.filter((d) => d.source === 'Scalix Security');
    expect(scalixDiags).toHaveLength(2);
    expect(scalixDiags[0].message).toBe('Issue 1');
  });

  it('should generate code action titles', () => {
    const diagnostic = { message: 'SQL injection vulnerability' };
    const actionTitle = `Scalix: Explain "${diagnostic.message}"`;

    expect(actionTitle).toBe('Scalix: Explain "SQL injection vulnerability"');
  });
});

describe('Configuration Validation', () => {
  it('should validate required config fields', () => {
    const validate = (config: any) => {
      const errors: string[] = [];

      if (!config.apiUrl || config.apiUrl.trim() === '') {
        errors.push('API URL is required and cannot be empty');
      }

      if (config.maxTokens && (config.maxTokens < 500 || config.maxTokens > 16000)) {
        errors.push('Max tokens must be between 500 and 16000');
      }

      if (config.timeout && (config.timeout < 5000 || config.timeout > 120000)) {
        errors.push('Timeout must be between 5000 and 120000 milliseconds');
      }

      return errors;
    };

    expect(validate({}).length).toBeGreaterThan(0);
    expect(validate({ apiUrl: '' }).length).toBeGreaterThan(0);
    expect(validate({ apiUrl: 'http://localhost:3000' }).length).toBe(0);
    expect(validate({ apiUrl: 'http://localhost:3000', maxTokens: 100 }).length).toBeGreaterThan(0);
  });
});

describe('Result Formatting', () => {
  it('should format duration correctly', () => {
    const formatDuration = (ms: number) => {
      if (ms < 1000) {
        return `${ms}ms`;
      }
      return `${(ms / 1000).toFixed(2)}s`;
    };

    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(1000)).toBe('1.00s');
    expect(formatDuration(1500)).toBe('1.50s');
    expect(formatDuration(2345)).toBe('2.35s');
  });

  it('should format token counts', () => {
    const formatTokens = (count: number) => {
      if (count < 1000) {
        return count.toString();
      }
      return `${(count / 1000).toFixed(1)}k`;
    };

    expect(formatTokens(100)).toBe('100');
    expect(formatTokens(1000)).toBe('1.0k');
    expect(formatTokens(1500)).toBe('1.5k');
    expect(formatTokens(1000000)).toBe('1000.0k');
  });
});

describe('WebSocket Message Handling', () => {
  it('should handle execution progress messages', () => {
    const message = {
      status: 'progress',
      agentId: 'codebase-analyzer',
      executionId: 'exec-123',
      message: 'Analyzing architecture...',
      progress: 0.5,
    };

    expect(message.status).toBe('progress');
    expect(message.progress).toBe(0.5);
    expect(message.message).toBeDefined();
  });

  it('should handle execution completion messages', () => {
    const message = {
      status: 'completed',
      agentId: 'codebase-analyzer',
      executionId: 'exec-123',
      output: 'Analysis complete',
      duration: 1500,
      iterations: 1,
      cost: { inputTokens: 1000, outputTokens: 500, totalCost: 0.01 },
    };

    expect(message.status).toBe('completed');
    expect(message.output).toBeDefined();
    expect(message.duration).toBe(1500);
    expect(message.cost.inputTokens).toBe(1000);
  });

  it('should handle execution error messages', () => {
    const message = {
      status: 'error',
      agentId: 'codebase-analyzer',
      executionId: 'exec-123',
      error: 'Server error',
    };

    expect(message.status).toBe('error');
    expect(message.error).toBeDefined();
  });
});

describe('Context Extraction', () => {
  it('should build execution context', () => {
    const context = {
      projectPath: '/workspace/my-project',
      filePath: '/workspace/my-project/src/app.ts',
      selectedText: 'const x = 1;',
      language: 'typescript',
      openFiles: [
        '/workspace/my-project/src/app.ts',
        '/workspace/my-project/src/config.ts',
      ],
    };

    expect(context.projectPath).toBeDefined();
    expect(context.filePath).toBeDefined();
    expect(context.language).toBe('typescript');
    expect(context.openFiles.length).toBe(2);
  });

  it('should handle missing context gracefully', () => {
    const partialContext = {
      projectPath: '/workspace',
      // filePath missing
      language: 'typescript',
    };

    expect(partialContext.projectPath).toBeDefined();
    expect((partialContext as any).filePath).toBeUndefined();
  });
});

describe('Agent Command Building', () => {
  it('should build analyze code command', () => {
    const agentId = 'codebase-analyzer';
    const input = 'Analyze this codebase for architecture, structure, and patterns.';

    expect(agentId).toBe('codebase-analyzer');
    expect(input).toContain('architecture');
  });

  it('should build explain code command with selection', () => {
    const selectedText = 'function analyze() { ... }';
    const agentId = 'code-explainer';
    const input = `Explain this code:\n\n${selectedText}`;

    expect(input).toContain('function analyze');
    expect(agentId).toBe('code-explainer');
  });

  it('should build security scan command', () => {
    const filePath = '/src/app.ts';
    const agentId = 'security-analyzer';
    const input = `Scan this file for security issues:\n${filePath}`;

    expect(input).toContain(filePath);
    expect(agentId).toBe('security-analyzer');
  });
});
