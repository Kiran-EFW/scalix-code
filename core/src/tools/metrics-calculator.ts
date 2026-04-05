/**
 * Metrics Calculator Tool
 *
 * Calculate code metrics like complexity, lines of code, etc
 */

import { z } from 'zod';
import * as fs from 'fs';

export const MetricsCalculatorInputSchema = z.object({
  filePath: z.string().describe('Path to file to analyze'),
  metricsType: z.enum(['all', 'complexity', 'loc', 'coverage']).optional().describe('Type of metrics to calculate'),
});

export type MetricsCalculatorInput = z.infer<typeof MetricsCalculatorInputSchema>;

export interface CodeMetrics {
  filePath: string;
  success: boolean;
  linesOfCode: number;
  logicalLinesOfCode: number;
  commentLines: number;
  blankLines: number;
  cyclomaticComplexity: number;
  functionCount: number;
  classCount: number;
  averageComplexity: number;
  codeToCommentRatio: number;
  error?: string;
}

/**
 * Calculate code metrics for files
 */
export class MetricsCalculator {
  /**
   * Calculate lines of code
   */
  private calculateLOC(content: string): {
    loc: number;
    lloc: number;
    comments: number;
    blank: number;
  } {
    const lines = content.split('\n');
    let loc = 0;
    let comments = 0;
    let blank = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        blank++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
        comments++;
      } else if (trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        comments++;
      } else {
        loc++;
      }
    }

    return {
      loc: loc + comments,
      lloc: loc,
      comments,
      blank,
    };
  }

  /**
   * Calculate cyclomatic complexity (simplified)
   */
  private calculateComplexity(content: string): {
    complexity: number;
    functions: number;
    avgComplexity: number;
  } {
    let complexity = 1; // Base complexity
    let functions = 0;
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>|\bif\b|\belse\b|\bcase\b|\bfor\b|\bwhile\b|\bcatch\b/g) || [];

    // Count function definitions
    functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g) || []).length;

    // Each control structure increases complexity
    const ifCount = (content.match(/\bif\b/g) || []).length;
    const elseCount = (content.match(/\belse\b/g) || []).length;
    const caseCount = (content.match(/\bcase\b/g) || []).length;
    const forCount = (content.match(/\bfor\b/g) || []).length;
    const whileCount = (content.match(/\bwhile\b/g) || []).length;
    const catchCount = (content.match(/\bcatch\b/g) || []).length;

    complexity += ifCount + elseCount + caseCount + forCount + whileCount + catchCount;

    const avgComplexity = functions > 0 ? complexity / functions : complexity;

    return {
      complexity: Math.max(1, complexity),
      functions,
      avgComplexity: Math.round(avgComplexity * 100) / 100,
    };
  }

  /**
   * Calculate all metrics
   */
  calculateMetrics(input: MetricsCalculatorInput): CodeMetrics {
    try {
      if (!fs.existsSync(input.filePath)) {
        return {
          filePath: input.filePath,
          success: false,
          linesOfCode: 0,
          logicalLinesOfCode: 0,
          commentLines: 0,
          blankLines: 0,
          cyclomaticComplexity: 0,
          functionCount: 0,
          classCount: 0,
          averageComplexity: 0,
          codeToCommentRatio: 0,
          error: 'File not found',
        };
      }

      const content = fs.readFileSync(input.filePath, 'utf-8');

      // Calculate LOC metrics
      const locMetrics = this.calculateLOC(content);

      // Calculate complexity metrics
      const complexityMetrics = this.calculateComplexity(content);

      // Count classes
      const classCount = (content.match(/\bclass\b|\btype\b\s+\w+\s*=\s*{/g) || []).length;

      // Calculate code to comment ratio
      const codeToCommentRatio =
        locMetrics.comments > 0
          ? Math.round((locMetrics.lloc / locMetrics.comments) * 100) / 100
          : locMetrics.lloc > 0
          ? Infinity
          : 0;

      return {
        filePath: input.filePath,
        success: true,
        linesOfCode: locMetrics.loc,
        logicalLinesOfCode: locMetrics.lloc,
        commentLines: locMetrics.comments,
        blankLines: locMetrics.blank,
        cyclomaticComplexity: complexityMetrics.complexity,
        functionCount: complexityMetrics.functions,
        classCount,
        averageComplexity: complexityMetrics.avgComplexity,
        codeToCommentRatio,
      };
    } catch (error) {
      return {
        filePath: input.filePath,
        success: false,
        linesOfCode: 0,
        logicalLinesOfCode: 0,
        commentLines: 0,
        blankLines: 0,
        cyclomaticComplexity: 0,
        functionCount: 0,
        classCount: 0,
        averageComplexity: 0,
        codeToCommentRatio: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create metrics calculator tool
 */
export function createMetricsCalculatorTool() {
  const calculator = new MetricsCalculator();

  return {
    name: 'metrics-calculator',
    description: 'Calculate code metrics like complexity, lines of code, function count',
    schema: MetricsCalculatorInputSchema,
    async execute(input: MetricsCalculatorInput): Promise<CodeMetrics> {
      return calculator.calculateMetrics(input);
    },
  };
}
