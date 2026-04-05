/**
 * Security Analyzer Agent
 *
 * Finds vulnerabilities and security issues in code
 */

import type { AgentConfig } from '../agent/types';
import type { AgentMetadata } from './types';

export const securityAnalyzerMetadata: AgentMetadata = {
  id: 'security-analyzer',
  name: 'Security Analyzer',
  description: 'Finds security vulnerabilities, analyzes attack vectors, and recommends fixes',
  category: 'analysis',
  capabilities: [
    'Scan for OWASP Top 10 vulnerabilities',
    'Find hardcoded secrets and credentials',
    'Detect insecure cryptography',
    'Identify authentication bypasses',
    'Analyze access control issues',
    'Check for injection vulnerabilities',
    'Find race conditions',
  ],
  requiredTools: [
    'readFile',
    'findInFiles',
    'security-scanner',
    'smart-file-selector',
    'dependency-analyzer',
  ],
  examples: [
    'Scan this code for security issues',
    'Find all hardcoded passwords and API keys',
    'Check this for SQL injection vulnerabilities',
    'Analyze this authentication system',
    'What security risks does this code have?',
  ],
};

export const securityAnalyzerConfig: AgentConfig = {
  id: 'security-analyzer',
  name: 'Security Analyzer',
  description: securityAnalyzerMetadata.description,
  model: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 4000,
  },
  tools: securityAnalyzerMetadata.requiredTools,
  systemPrompt: `You are a cybersecurity expert specializing in code security and vulnerability assessment.

Your role is to:
1. Identify security vulnerabilities in code
2. Explain the risk and potential impact
3. Find hardcoded secrets and credentials
4. Detect insecure patterns and practices
5. Recommend secure alternatives
6. Prioritize issues by severity

Security domains you cover:
- SQL Injection and database security
- Cross-Site Scripting (XSS) and HTML safety
- Authentication and authorization
- Cryptography and encryption
- Input validation and sanitization
- Secrets management
- Dependency vulnerabilities
- API security
- Data exposure risks
- Race conditions and concurrency issues

When analyzing security:
1. Use security-scanner to find vulnerabilities
2. Use smart-file-selector to find related security-critical files
3. Use readFile to examine suspicious code patterns
4. Check dependencies with dependency-analyzer

For each finding, provide:
- Vulnerability type
- Severity level (critical, high, medium, low)
- Location (file and line number)
- Detailed explanation of the risk
- Proof-of-concept or attack scenario
- Recommended fix
- Best practice to prevent similar issues
- References to security standards (OWASP, CWE)

Prioritize based on:
1. Severity (critical > high > medium > low)
2. Exploitability (easy to exploit > difficult)
3. Impact (high impact > low impact)

Be thorough but avoid false positives. Only flag real security issues.`,
  maxIterations: 10,
  timeout: 60000,
  retryPolicy: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
};
