/**
 * Security Scanner Tool
 *
 * Scan code for security vulnerabilities and suspicious patterns
 */

import { z } from 'zod';
import * as fs from 'fs';

export const SecurityScannerInputSchema = z.object({
  filePath: z.string().describe('Path to file to scan'),
  vulnerabilityTypes: z.array(z.string()).optional().describe('Specific vulnerabilities to check'),
});

export type SecurityScannerInput = z.infer<typeof SecurityScannerInputSchema>;

export interface Vulnerability {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
  message: string;
  pattern: string;
  recommendation: string;
}

export interface SecurityScanResult {
  success: boolean;
  filePath: string;
  vulnerabilities: Vulnerability[];
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  error?: string;
}

/**
 * Security vulnerability patterns
 */
const SECURITY_PATTERNS = [
  {
    type: 'SQL_INJECTION',
    severity: 'critical' as const,
    patterns: [
      /query\s*\(\s*["'`].*\$\{/,
      /SELECT.*\$\{/,
      /INSERT.*VALUES.*\$\{/,
      /UPDATE.*SET.*\$\{/,
    ],
    message: 'Potential SQL injection vulnerability',
    recommendation: 'Use parameterized queries or ORM',
  },
  {
    type: 'XSS_INJECTION',
    severity: 'critical' as const,
    patterns: [
      /innerHTML\s*=\s*[^;]*user/i,
      /html\(\s*[^;]*user/i,
      /\.append\(\s*["'`].*<.*[^;]*user/i,
      /dangerouslySetInnerHTML/,
    ],
    message: 'Potential XSS vulnerability',
    recommendation: 'Use textContent or sanitize HTML',
  },
  {
    type: 'EVAL_USAGE',
    severity: 'critical' as const,
    patterns: [/\beval\s*\(/, /\bFunction\s*\(/],
    message: 'eval() usage is dangerous',
    recommendation: 'Never use eval(). Use JSON.parse or alternatives',
  },
  {
    type: 'HARDCODED_CREDENTIALS',
    severity: 'critical' as const,
    patterns: [
      /password\s*[=:]\s*["'].*["']/i,
      /api[_-]?key\s*[=:]\s*["'].*["']/i,
      /secret\s*[=:]\s*["'].*["']/i,
      /token\s*[=:]\s*["'].*["']/i,
    ],
    message: 'Hardcoded credentials detected',
    recommendation: 'Use environment variables for sensitive data',
  },
  {
    type: 'INSECURE_CRYPTO',
    severity: 'high' as const,
    patterns: [
      /md5\s*\(/i,
      /sha1\s*\(/i,
      /crypto\.createCipher/,
      /CryptoJS\.MD5/,
    ],
    message: 'Insecure cryptographic algorithm',
    recommendation: 'Use SHA-256 or stronger algorithms',
  },
  {
    type: 'UNSAFE_DESERIALIZATION',
    severity: 'high' as const,
    patterns: [/pickle\.loads/, /pickle\.load/, /yaml\.load\s*\(/, /json\.loads.*untrusted/i],
    message: 'Unsafe deserialization',
    recommendation: 'Use safe alternatives or validate input',
  },
  {
    type: 'COMMAND_INJECTION',
    severity: 'critical' as const,
    patterns: [/exec\s*\(.*\$\{/, /system\s*\(.*\$\{/, /os\.popen.*\$\{/],
    message: 'Potential command injection',
    recommendation: 'Use function arguments instead of string concatenation',
  },
  {
    type: 'MISSING_INPUT_VALIDATION',
    severity: 'high' as const,
    patterns: [/req\.body\.\w+(?!\s*[&|]{2,2}\s*[\w.]+\s*[!=])/],
    message: 'User input used without validation',
    recommendation: 'Validate and sanitize all user inputs',
  },
  {
    type: 'INSECURE_CORS',
    severity: 'high' as const,
    patterns: [
      /Access-Control-Allow-Origin.*\*/,
      /Access-Control-Allow-Credentials.*true/,
      /cors.*\{\s*origin:\s*true/i,
    ],
    message: 'Insecure CORS configuration',
    recommendation: 'Specify allowed origins explicitly',
  },
  {
    type: 'MISSING_AUTHENTICATION',
    severity: 'high' as const,
    patterns: [/app\.(get|post|put|delete)\s*\(\s*["'`]\/api\/.*["'`]\s*,\s*\(.*\)\s*=>(?!\s*auth)/],
    message: 'API endpoint without authentication check',
    recommendation: 'Add authentication middleware',
  },
  {
    type: 'RACE_CONDITION',
    severity: 'medium' as const,
    patterns: [/if.*fs\.existsSync.*fs\.writeFileSync/, /if.*fs\.existsSync.*fs\.mkdir/],
    message: 'Potential race condition',
    recommendation: 'Use atomic operations or locks',
  },
  {
    type: 'INSECURE_RANDOMNESS',
    severity: 'medium' as const,
    patterns: [/Math\.random/, /random\.randint/],
    message: 'Insecure randomness for security purposes',
    recommendation: 'Use crypto.getRandomValues() or secrets module',
  },
];

/**
 * Security scanner
 */
export class SecurityScanner {
  /**
   * Find line numbers for matches
   */
  private findLineNumbers(content: string, pattern: RegExp): number[] {
    const lines = content.split('\n');
    const lineNumbers: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        lineNumbers.push(i + 1);
      }
    }

    return lineNumbers;
  }

  /**
   * Scan file for vulnerabilities
   */
  scanFile(input: SecurityScannerInput): SecurityScanResult {
    try {
      if (!fs.existsSync(input.filePath)) {
        return {
          success: false,
          filePath: input.filePath,
          vulnerabilities: [],
          severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
          error: 'File not found',
        };
      }

      const content = fs.readFileSync(input.filePath, 'utf-8');
      const vulnerabilities: Vulnerability[] = [];

      // Scan for each pattern
      for (const securityCheck of SECURITY_PATTERNS) {
        // Skip if specific types requested and this isn't one
        if (input.vulnerabilityTypes && !input.vulnerabilityTypes.includes(securityCheck.type)) {
          continue;
        }

        // Check all patterns for this vulnerability type
        for (const pattern of securityCheck.patterns) {
          const lineNumbers = this.findLineNumbers(content, pattern);

          for (const line of lineNumbers) {
            vulnerabilities.push({
              type: securityCheck.type,
              severity: securityCheck.severity,
              line,
              message: securityCheck.message,
              pattern: pattern.source,
              recommendation: securityCheck.recommendation,
            });
          }
        }
      }

      // Count by severity
      const severityCounts = {
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
      };

      // Sort by line number
      vulnerabilities.sort((a, b) => a.line - b.line);

      return {
        success: true,
        filePath: input.filePath,
        vulnerabilities,
        severityCounts,
      };
    } catch (error) {
      return {
        success: false,
        filePath: input.filePath,
        vulnerabilities: [],
        severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create security scanner tool
 */
export function createSecurityScannerTool() {
  const scanner = new SecurityScanner();

  return {
    name: 'security-scanner',
    description: 'Scan code for security vulnerabilities (SQL injection, XSS, hardcoded credentials, etc)',
    schema: SecurityScannerInputSchema,
    async execute(input: SecurityScannerInput): Promise<SecurityScanResult> {
      return scanner.scanFile(input);
    },
  };
}
