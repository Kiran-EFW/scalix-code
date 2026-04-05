/**
 * Security Scanner Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityScanner } from './security-scanner';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;
  let tempDir: string;

  beforeEach(() => {
    scanner = new SecurityScanner();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scalix-sec-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const writeTestFile = (filename: string, content: string): string => {
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  describe('SQL injection detection', () => {
    it('should detect template literal SQL injection', () => {
      const filePath = writeTestFile('sql.ts', `
const query = db.query(\`SELECT * FROM users WHERE id = \${userId}\`);
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.success).toBe(true);
      expect(result.vulnerabilities.some((v) => v.type === 'SQL_INJECTION')).toBe(true);
    });
  });

  describe('XSS detection', () => {
    it('should detect dangerouslySetInnerHTML', () => {
      const filePath = writeTestFile('xss.tsx', `
<div dangerouslySetInnerHTML={{ __html: content }} />
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.vulnerabilities.some((v) => v.type === 'XSS_INJECTION')).toBe(true);
    });
  });

  describe('eval detection', () => {
    it('should detect eval usage', () => {
      const filePath = writeTestFile('eval.js', `
const result = eval(userInput);
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.vulnerabilities.some((v) => v.type === 'EVAL_USAGE')).toBe(true);
      expect(result.vulnerabilities[0].severity).toBe('critical');
    });

    it('should detect Function constructor', () => {
      const filePath = writeTestFile('func.js', `
const fn = new Function('return ' + code);
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.vulnerabilities.some((v) => v.type === 'EVAL_USAGE')).toBe(true);
    });
  });

  describe('hardcoded credentials', () => {
    it('should detect hardcoded passwords', () => {
      const filePath = writeTestFile('creds.ts', `
const password = "supersecret123";
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.vulnerabilities.some((v) => v.type === 'HARDCODED_CREDENTIALS')).toBe(true);
    });

    it('should detect hardcoded API keys', () => {
      const filePath = writeTestFile('api.ts', `
const api_key = "sk-12345abcdef";
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.vulnerabilities.some((v) => v.type === 'HARDCODED_CREDENTIALS')).toBe(true);
    });
  });

  describe('insecure crypto', () => {
    it('should detect MD5 usage', () => {
      const filePath = writeTestFile('crypto.ts', `
const hash = md5(data);
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.vulnerabilities.some((v) => v.type === 'INSECURE_CRYPTO')).toBe(true);
    });
  });

  describe('insecure randomness', () => {
    it('should detect Math.random usage', () => {
      const filePath = writeTestFile('random.ts', `
const token = Math.random().toString(36);
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.vulnerabilities.some((v) => v.type === 'INSECURE_RANDOMNESS')).toBe(true);
    });
  });

  describe('severity counts', () => {
    it('should count vulnerabilities by severity', () => {
      const filePath = writeTestFile('multi.ts', `
const x = eval(input);
const hash = md5(data);
const token = Math.random();
      `);

      const result = scanner.scanFile({ filePath });
      const totalCount =
        result.severityCounts.critical +
        result.severityCounts.high +
        result.severityCounts.medium +
        result.severityCounts.low;

      expect(totalCount).toBe(result.vulnerabilities.length);
    });
  });

  describe('clean files', () => {
    it('should report no vulnerabilities for clean code', () => {
      const filePath = writeTestFile('clean.ts', `
import crypto from 'crypto';
const hash = crypto.createHash('sha256').update(data).digest('hex');
const id = crypto.randomUUID();
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.success).toBe(true);
      expect(result.vulnerabilities).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent files', () => {
      const result = scanner.scanFile({ filePath: '/nonexistent/file.ts' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('vulnerability type filtering', () => {
    it('should only check specified types', () => {
      const filePath = writeTestFile('filter.ts', `
const x = eval(input);
const hash = md5(data);
      `);

      const result = scanner.scanFile({
        filePath,
        vulnerabilityTypes: ['EVAL_USAGE'],
      });

      expect(result.vulnerabilities.every((v) => v.type === 'EVAL_USAGE')).toBe(true);
    });
  });

  describe('line numbers', () => {
    it('should report correct line numbers', () => {
      const filePath = writeTestFile('lines.ts', `line1
line2
const x = eval(bad);
line4
      `);

      const result = scanner.scanFile({ filePath });
      expect(result.vulnerabilities[0].line).toBe(3);
    });
  });
});
