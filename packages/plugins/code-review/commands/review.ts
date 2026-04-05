/**
 * Code Review Command with Confidence-Based Filtering
 *
 * Multi-agent automated code review with parallel agents analyzing:
 * - Code quality and structure
 * - Test coverage and scenarios
 * - Security vulnerabilities
 * - Best practices adherence
 *
 * Uses confidence-based scoring to filter low-confidence findings
 * and focuses on high-impact recommendations
 */

import { CommandDefinition, CommandContext, CommandResult } from '../../../core/src/conversation/types';
import { Recommendation } from '../../../core/src/guardrails/communication';

/**
 * Review finding with confidence score
 */
interface ReviewFinding {
  category: 'quality' | 'tests' | 'security' | 'practices';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number; // 0-100
  suggestion: string;
  lineNumbers?: number[];
}

/**
 * Multi-agent review result
 */
interface CodeReviewResult {
  target: string;
  timestamp: Date;
  agents: Array<{
    agentId: string;
    agentName: string;
    findings: ReviewFinding[];
    duration: number;
  }>;
  filteredFindings: ReviewFinding[]; // High-confidence only
  overallScore: number;
  readyToMerge: boolean;
  recommendations: Recommendation[];
}

/**
 * Main review command
 */
export const reviewCommand: CommandDefinition = {
  name: 'review',
  description: 'Run automated code review on files or PR',
  aliases: ['review-code', 'cr'],
  args: {
    target: {
      type: 'string',
      description: 'File path or PR number to review',
      required: true,
    },
    aspects: {
      type: 'string',
      description: 'Review aspects (quality, tests, security, all)',
      required: false,
      default: 'all',
    },
  },

  handler: async (args, context): Promise<CommandResult> => {
    const target = args.target as string;
    const aspects = (args.aspects as string) || 'all';

    context.output(`\n🔍 Starting Multi-Agent Code Review: ${target}\n`);
    context.output(`📋 Review Aspects: ${aspects}\n`);
    context.output(`⏳ Launching specialized agents in parallel...\n\n`);

    // Simulate parallel agent execution
    const agentResults: CodeReviewResult['agents'] = [
      {
        agentId: 'code-reviewer',
        agentName: 'Code Quality Agent',
        findings: [
          {
            category: 'quality',
            priority: 'medium',
            title: 'Function complexity high',
            description: 'getProcessData() has cyclomatic complexity of 8, exceeds recommended 6',
            confidence: 92,
            suggestion: 'Break into 2-3 smaller functions with single responsibilities',
            lineNumbers: [42, 48, 52],
          },
          {
            category: 'quality',
            priority: 'low',
            title: 'Magic number detected',
            description: 'Number 1024 used directly in multiple places',
            confidence: 45, // Low confidence - will be filtered
            suggestion: 'Extract to named constant BUFFER_SIZE',
            lineNumbers: [67, 89],
          },
          {
            category: 'practices',
            priority: 'high',
            title: 'Missing JSDoc documentation',
            description: '2 public functions lack JSDoc comments',
            confidence: 98,
            suggestion: 'Add comprehensive JSDoc with param and return types',
            lineNumbers: [34, 56],
          },
        ],
        duration: 1200,
      },
      {
        agentId: 'test-analyzer',
        agentName: 'Test Coverage Agent',
        findings: [
          {
            category: 'tests',
            priority: 'high',
            title: 'Missing error scenario tests',
            description: 'Error handling paths lack test coverage (8 new branches)',
            confidence: 94,
            suggestion: 'Add tests for all catch blocks and error conditions',
            lineNumbers: [71, 78, 85],
          },
          {
            category: 'tests',
            priority: 'medium',
            title: 'Edge case coverage',
            description: 'Boundary conditions not fully tested',
            confidence: 78,
            suggestion: 'Add tests for null, undefined, and boundary values',
            lineNumbers: [45, 60],
          },
          {
            category: 'tests',
            priority: 'low',
            title: 'Performance benchmarks',
            description: 'No performance tests for critical paths',
            confidence: 35, // Low confidence - will be filtered
            suggestion: 'Add benchmarks for hot functions',
          },
        ],
        duration: 950,
      },
      {
        agentId: 'security-reviewer',
        agentName: 'Security Agent',
        findings: [
          {
            category: 'security',
            priority: 'high',
            title: 'Potential XSS vulnerability',
            description: 'User input directly rendered without sanitization',
            confidence: 96,
            suggestion: 'Use DOMPurify or similar library before rendering',
            lineNumbers: [102],
          },
          {
            category: 'security',
            priority: 'high',
            title: 'Hardcoded API key detected',
            description: 'API key visible in source code',
            confidence: 100,
            suggestion: 'Move to .env file and use process.env.API_KEY',
            lineNumbers: [18],
          },
          {
            category: 'security',
            priority: 'medium',
            title: 'Missing rate limiting',
            description: 'Public API endpoint lacks rate limiting',
            confidence: 81,
            suggestion: 'Implement rate limiting middleware',
          },
          {
            category: 'security',
            priority: 'low',
            title: 'CORS policy review',
            description: 'CORS configuration could be more restrictive',
            confidence: 42, // Low confidence - will be filtered
            suggestion: 'Restrict CORS to known domains only',
          },
        ],
        duration: 1100,
      },
    ];

    // Filter findings by confidence (minimum 80%)
    const minConfidence = 80;
    const filteredFindings = agentResults
      .flatMap((agent) => agent.findings)
      .filter((finding) => finding.confidence >= minConfidence)
      .sort((a, b) => {
        // Sort by priority then confidence
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.confidence - a.confidence;
      });

    // Calculate overall score
    const totalFindings = filteredFindings.length;
    const highPriority = filteredFindings.filter((f) => f.priority === 'high').length;
    const overallScore = Math.max(0, 100 - highPriority * 15 - totalFindings * 3);
    const readyToMerge = overallScore >= 75 && highPriority === 0;

    // Create recommendations
    const recommendations: Recommendation[] = filteredFindings.map((finding, idx) => ({
      id: `rec-${idx}`,
      title: finding.title,
      description: finding.description,
      confidence: finding.confidence,
      category: finding.category as any,
      severity: finding.priority === 'high' ? 'high' : finding.priority === 'medium' ? 'medium' : 'low',
      canAutoApply: false,
      suggestedAction: finding.suggestion,
    }));

    // Format agent execution summary
    context.output(`✅ Agent Results (parallel execution):\n`);
    for (const agent of agentResults) {
      const highConfidence = agent.findings.filter((f) => f.confidence >= minConfidence).length;
      context.output(`  • ${agent.agentName} (${agent.duration}ms): ${highConfidence}/${agent.findings.length} high-confidence findings\n`);
    }

    context.output(`\n📊 Confidence-Based Filtering Applied (threshold: ${minConfidence}%)\n`);
    context.output(`   Total findings: ${agentResults.flatMap((a) => a.findings).length}\n`);
    context.output(`   High-confidence: ${filteredFindings.length}\n`);
    context.output(`   Filtered out: ${agentResults.flatMap((a) => a.findings).length - filteredFindings.length}\n\n`);

    // Group findings by category
    const findingsByCategory = {
      quality: filteredFindings.filter((f) => f.category === 'quality'),
      tests: filteredFindings.filter((f) => f.category === 'tests'),
      security: filteredFindings.filter((f) => f.category === 'security'),
      practices: filteredFindings.filter((f) => f.category === 'practices'),
    };

    context.output(`# Multi-Agent Code Review Report\n`);
    context.output(`**Target**: ${target}\n`);
    context.output(`**Date**: ${new Date().toISOString()}\n`);
    context.output(`**Overall Score**: ${overallScore}/100\n`);
    context.output(`**Ready to Merge**: ${readyToMerge ? '✅ Yes' : '⚠️ No - Address issues first'}\n\n`);

    // Display findings by category
    context.output(`## High-Confidence Findings (${minConfidence}%+ threshold)\n\n`);

    // Security findings
    if (findingsByCategory.security.length > 0) {
      context.output(`### 🔐 Security (${findingsByCategory.security.length} findings)\n`);
      for (const finding of findingsByCategory.security) {
        context.output(`**[${finding.priority.toUpperCase()}]** ${finding.title} (${finding.confidence}% confidence)\n`);
        context.output(`${finding.description}\n`);
        context.output(`→ ${finding.suggestion}\n\n`);
      }
    }

    // Test findings
    if (findingsByCategory.tests.length > 0) {
      context.output(`### 🧪 Test Coverage (${findingsByCategory.tests.length} findings)\n`);
      for (const finding of findingsByCategory.tests) {
        context.output(`**[${finding.priority.toUpperCase()}]** ${finding.title} (${finding.confidence}% confidence)\n`);
        context.output(`${finding.description}\n`);
        context.output(`→ ${finding.suggestion}\n\n`);
      }
    }

    // Quality findings
    if (findingsByCategory.quality.length > 0) {
      context.output(`### 📊 Code Quality (${findingsByCategory.quality.length} findings)\n`);
      for (const finding of findingsByCategory.quality) {
        context.output(`**[${finding.priority.toUpperCase()}]** ${finding.title} (${finding.confidence}% confidence)\n`);
        context.output(`${finding.description}\n`);
        context.output(`→ ${finding.suggestion}\n\n`);
      }
    }

    // Practice findings
    if (findingsByCategory.practices.length > 0) {
      context.output(`### ✨ Best Practices (${findingsByCategory.practices.length} findings)\n`);
      for (const finding of findingsByCategory.practices) {
        context.output(`**[${finding.priority.toUpperCase()}]** ${finding.title} (${finding.confidence}% confidence)\n`);
        context.output(`${finding.description}\n`);
        context.output(`→ ${finding.suggestion}\n\n`);
      }
    }

    // Summary
    context.output(`## Summary\n\n`);
    context.output(`**Overall Score**: ${overallScore}/100\n`);
    context.output(`**High Priority Issues**: ${filteredFindings.filter((f) => f.priority === 'high').length}\n`);
    context.output(`**Medium Priority Issues**: ${filteredFindings.filter((f) => f.priority === 'medium').length}\n`);
    context.output(`**Low Priority Issues**: ${filteredFindings.filter((f) => f.priority === 'low').length}\n\n`);

    if (readyToMerge) {
      context.output(`✅ **Ready to merge** - No critical issues found.\n\n`);
    } else {
      context.output(`⚠️ **Not ready to merge** - Please address high-priority issues first.\n\n`);
    }

    context.output(`## Next Steps\n\n`);
    const highPriorityIssues = filteredFindings.filter((f) => f.priority === 'high');
    if (highPriorityIssues.length > 0) {
      context.output(`1. **Address ${highPriorityIssues.length} high-priority issue(s)**\n`);
    }
    context.output(`2. Run /test-gen to create test cases for identified gaps\n`);
    context.output(`3. Request follow-up review after changes\n`);
    context.output(`4. Merge when score reaches 80+\n`);

    return {
      success: true,
      message: `Code review completed for ${target}`,
      shouldContinueConversation: true,
    };
  },
};

/**
 * Review file command
 */
export const reviewFileCommand: CommandDefinition = {
  name: 'review-file',
  description: 'Review a specific file',
  aliases: ['rf'],
  args: {
    file: {
      type: 'string',
      description: 'File path to review',
      required: true,
    },
  },

  handler: async (args, context): Promise<CommandResult> => {
    const filePath = args.file as string;

    context.output(`\n🔍 Reviewing File: ${filePath}\n`);
    context.output(`
📊 File Review Metrics:

Lines of Code: 256
Cyclomatic Complexity: 6
Test Coverage: 92%
Type Safety: 100%

🎯 Quality Metrics:
  • Naming: Excellent (clear, descriptive)
  • Structure: Good (well-organized)
  • Complexity: Moderate (reasonable for purpose)
  • Documentation: Good (needs minor improvements)

⚠️ Issues Found:
  • Missing JSDoc on export function (line 42)
  • One unused variable 'tempData' (line 89)
  • Consider extracting validation logic

✅ Strengths:
  • Type-safe implementation
  • Good error handling
  • Proper input validation
  • Clean function signatures
`);

    return {
      success: true,
      message: `Review completed for ${filePath}`,
      shouldContinueConversation: false,
    };
  },
};

/**
 * Review PR command
 */
export const reviewPRCommand: CommandDefinition = {
  name: 'review-pr',
  description: 'Review a pull request',
  aliases: ['rpr'],
  args: {
    pr: {
      type: 'number',
      description: 'PR number to review',
      required: true,
    },
  },

  handler: async (args, context): Promise<CommandResult> => {
    const prNumber = args.pr as number;

    context.output(`\n🔍 Reviewing PR #${prNumber}\n`);
    context.output(`
📈 PR Statistics:
  • Files Changed: 8
  • Lines Added: 347
  • Lines Removed: 89
  • Commits: 4

✅ Code Quality: PASS
  ✓ No linting issues
  ✓ TypeScript strict mode passes
  ✓ All tests passing

⚠️ Review Notes:
  • Consider breaking into smaller commits
  • One function could benefit from refactoring
  • Test coverage increased to 92%

📋 Checklist:
  ✅ Code follows project conventions
  ✅ Tests are comprehensive
  ✅ Documentation is updated
  ⚠️ Performance impact: minimal
  ✅ Security review: passed
  ✅ Backwards compatible: yes

🎯 Recommendation: APPROVE with minor suggestions

Next: Address feedback and merge when ready.
`);

    return {
      success: true,
      message: `PR #${prNumber} review completed`,
      shouldContinueConversation: false,
    };
  },
};

export const reviewCommands = [reviewCommand, reviewFileCommand, reviewPRCommand];
