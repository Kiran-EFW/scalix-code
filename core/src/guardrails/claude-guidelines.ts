/**
 * CLAUDE.md Guideline Compliance Checker
 *
 * Parses and enforces project guidelines from CLAUDE.md files
 * Integrates with the guardrails system for compliance validation
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guideline categories
 */
export type GuidelineCategory =
  | 'architecture'
  | 'naming'
  | 'testing'
  | 'documentation'
  | 'security'
  | 'performance'
  | 'errors'
  | 'tools'
  | 'custom';

/**
 * Parsed guideline
 */
export interface ParsedGuideline {
  category: GuidelineCategory;
  rule: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern?: RegExp;
  examples?: {
    bad: string;
    good: string;
  };
}

/**
 * Guideline validation result
 */
export interface GuidelineValidationResult {
  compliant: boolean;
  violations: Array<{
    guideline: ParsedGuideline;
    violation: string;
    severity: string;
    suggestion: string;
  }>;
  score: number; // 0-100
}

/**
 * CLAUDE.md Guideline Parser
 */
export class ClaudeGuidelineChecker {
  private guidelines: ParsedGuideline[] = [];
  private projectPath: string;
  private claudeMdPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.claudeMdPath = join(projectPath, 'CLAUDE.md');
    this.loadGuidelines();
  }

  /**
   * Load guidelines from CLAUDE.md
   */
  private loadGuidelines(): void {
    try {
      const content = readFileSync(this.claudeMdPath, 'utf-8');
      this.guidelines = this.parseClaudeMd(content);
    } catch (error) {
      // CLAUDE.md not found or error reading - this is optional
      this.guidelines = this.getDefaultGuidelines();
    }
  }

  /**
   * Parse CLAUDE.md content
   */
  private parseClaudeMd(content: string): ParsedGuideline[] {
    const guidelines: ParsedGuideline[] = [];
    const lines = content.split('\n');

    let currentCategory: GuidelineCategory = 'custom';
    let currentRule = '';
    let currentDescription = '';

    for (const line of lines) {
      // Check for category headers
      if (line.startsWith('## ') || line.startsWith('# ')) {
        const header = line.replace(/^#+\s+/, '').toLowerCase();

        if (header.includes('architecture')) currentCategory = 'architecture';
        else if (header.includes('naming')) currentCategory = 'naming';
        else if (header.includes('test')) currentCategory = 'testing';
        else if (header.includes('doc')) currentCategory = 'documentation';
        else if (header.includes('security')) currentCategory = 'security';
        else if (header.includes('performance')) currentCategory = 'performance';
        else if (header.includes('error')) currentCategory = 'errors';
        else if (header.includes('tool')) currentCategory = 'tools';
      }

      // Check for rule lines (typically bold or special formatting)
      if (line.includes('**') || line.includes('`')) {
        currentRule = line.replace(/\*\*|`|#|## /g, '').trim();
      }

      // Build guidelines from the content
      if (currentRule && line.trim().length > 0 && !line.startsWith('#')) {
        if (line.includes(':') && !line.includes('**')) {
          currentDescription += line + '\n';
        }
      }

      // Create guideline when we see a complete rule block
      if (currentRule && currentDescription.length > 20) {
        guidelines.push({
          category: currentCategory,
          rule: currentRule,
          description: currentDescription.trim(),
          severity: this.determineSeverity(currentRule, currentDescription),
        });

        currentRule = '';
        currentDescription = '';
      }
    }

    return guidelines.length > 0 ? guidelines : this.getDefaultGuidelines();
  }

  /**
   * Determine severity from guideline text
   */
  private determineSeverity(rule: string, description: string): 'low' | 'medium' | 'high' | 'critical' {
    const text = (rule + ' ' + description).toLowerCase();

    if (text.includes('never') || text.includes('must not') || text.includes('block')) {
      return 'critical';
    }
    if (text.includes('must') || text.includes('require') || text.includes('security')) {
      return 'high';
    }
    if (text.includes('should') || text.includes('strongly')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get default guidelines (fallback)
   */
  private getDefaultGuidelines(): ParsedGuideline[] {
    return [
      {
        category: 'security',
        rule: 'Never commit secrets',
        description: 'Do not commit API keys, passwords, or sensitive data',
        severity: 'critical',
      },
      {
        category: 'testing',
        rule: 'Write tests for new features',
        description: 'All new features must have corresponding unit and integration tests',
        severity: 'high',
      },
      {
        category: 'documentation',
        rule: 'Document public APIs',
        description: 'All public functions and classes must have JSDoc comments',
        severity: 'high',
      },
      {
        category: 'naming',
        rule: 'Use consistent naming conventions',
        description: 'Follow project naming conventions (camelCase for functions, PascalCase for classes)',
        severity: 'medium',
      },
      {
        category: 'performance',
        rule: 'Avoid performance regressions',
        description: 'Monitor performance metrics and avoid introducing regressions',
        severity: 'medium',
      },
    ];
  }

  /**
   * Validate code against guidelines
   */
  validateCode(code: string): GuidelineValidationResult {
    const violations: Array<{
      guideline: ParsedGuideline;
      violation: string;
      severity: string;
      suggestion: string;
    }> = [];

    // Check for common violations
    violations.push(...this.checkSecurityIssues(code));
    violations.push(...this.checkNamingConventions(code));
    violations.push(...this.checkDocumentation(code));
    violations.push(...this.checkTesting(code));

    const compliant = violations.length === 0;
    const score = Math.max(0, 100 - violations.reduce((sum, v) => {
      return sum + (v.severity === 'critical' ? 25 : v.severity === 'high' ? 15 : v.severity === 'medium' ? 10 : 5);
    }, 0));

    return {
      compliant,
      violations,
      score,
    };
  }

  /**
   * Check security guidelines
   */
  private checkSecurityIssues(code: string): Array<{
    guideline: ParsedGuideline;
    violation: string;
    severity: string;
    suggestion: string;
  }> {
    const violations = [];
    const securityGuideline = this.guidelines.find((g) => g.category === 'security') || {
      category: 'security' as const,
      rule: 'Never commit secrets',
      description: 'Do not commit API keys, passwords, or sensitive data',
      severity: 'critical' as const,
    };

    // Check for hardcoded secrets
    if (/password\s*[:=]\s*['"][^'"]*['"]/i.test(code) ||
        /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/i.test(code) ||
        /secret\s*[:=]\s*['"][^'"]*['"]/i.test(code)) {
      violations.push({
        guideline: securityGuideline,
        violation: 'Hardcoded secret detected',
        severity: 'critical',
        suggestion: 'Use environment variables or secure secret management instead of hardcoding',
      });
    }

    return violations;
  }

  /**
   * Check naming conventions
   */
  private checkNamingConventions(code: string): Array<{
    guideline: ParsedGuideline;
    violation: string;
    severity: string;
    suggestion: string;
  }> {
    const violations = [];
    const namingGuideline = this.guidelines.find((g) => g.category === 'naming') || {
      category: 'naming' as const,
      rule: 'Use consistent naming conventions',
      description: 'Follow camelCase for functions/vars, PascalCase for classes',
      severity: 'medium' as const,
    };

    // Check for snake_case in function/variable names (TypeScript convention)
    if (/function\s+[a-z]+_[a-z]+|const\s+[a-z]+_[a-z]+/.test(code)) {
      violations.push({
        guideline: namingGuideline,
        violation: 'Snake_case used instead of camelCase',
        severity: 'medium',
        suggestion: 'Use camelCase for function and variable names',
      });
    }

    return violations;
  }

  /**
   * Check documentation
   */
  private checkDocumentation(code: string): Array<{
    guideline: ParsedGuideline;
    violation: string;
    severity: string;
    suggestion: string;
  }> {
    const violations = [];
    const docGuideline = this.guidelines.find((g) => g.category === 'documentation') || {
      category: 'documentation' as const,
      rule: 'Document public APIs',
      description: 'All public functions and classes must have JSDoc comments',
      severity: 'high' as const,
    };

    // Check for undocumented public functions
    const publicFunctions = code.match(/export\s+(function|const|class)\s+[A-Z]\w+/g) || [];
    const documentedFunctions = code.match(/\/\*\*[\s\S]*?\*\/\s+(export\s+)?(function|const|class)/g) || [];

    if (publicFunctions.length > documentedFunctions.length / 2) {
      violations.push({
        guideline: docGuideline,
        violation: `${publicFunctions.length} public function(s) lack documentation`,
        severity: 'high',
        suggestion: 'Add JSDoc comments to all public APIs',
      });
    }

    return violations;
  }

  /**
   * Check testing
   */
  private checkTesting(code: string): Array<{
    guideline: ParsedGuideline;
    violation: string;
    severity: string;
    suggestion: string;
  }> {
    const violations = [];

    // Only check if this is production code (not test file)
    if (code.includes('describe(') || code.includes('it(') || code.includes('test(')) {
      return violations; // This is a test file, skip
    }

    const testingGuideline = this.guidelines.find((g) => g.category === 'testing') || {
      category: 'testing' as const,
      rule: 'Write tests for new features',
      description: 'All new features must have corresponding tests',
      severity: 'high' as const,
    };

    // Check for complex functions without tests (heuristic)
    const complexFunctions = code.match(/export\s+(?:async\s+)?function\s+\w+\([^)]*\)\s*{/g) || [];
    if (complexFunctions.length > 3) {
      violations.push({
        guideline: testingGuideline,
        violation: `${complexFunctions.length} public function(s) may need test coverage`,
        severity: 'medium',
        suggestion: 'Consider adding unit tests for exported functions',
      });
    }

    return violations;
  }

  /**
   * Get all guidelines
   */
  getGuidelines(): ParsedGuideline[] {
    return this.guidelines;
  }

  /**
   * Get guidelines by category
   */
  getGuidelinesByCategory(category: GuidelineCategory): ParsedGuideline[] {
    return this.guidelines.filter((g) => g.category === category);
  }

  /**
   * Format guidelines for display
   */
  formatGuidelines(): string {
    let output = '📋 Project Guidelines (CLAUDE.md)\n\n';

    const categories = ['architecture', 'naming', 'testing', 'documentation', 'security', 'performance', 'errors', 'tools'];

    for (const category of categories) {
      const categoryGuidelines = this.getGuidelinesByCategory(category as GuidelineCategory);
      if (categoryGuidelines.length === 0) continue;

      output += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
      for (const guideline of categoryGuidelines) {
        const severityEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢',
        }[guideline.severity];

        output += `${severityEmoji} **${guideline.rule}**\n`;
        output += `   ${guideline.description}\n\n`;
      }
    }

    return output;
  }
}

/**
 * Create guideline checker
 */
export function createGuidelineChecker(projectPath: string): ClaudeGuidelineChecker {
  return new ClaudeGuidelineChecker(projectPath);
}
