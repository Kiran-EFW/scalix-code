/**
 * Smart File Selector Tool
 *
 * Find relevant files based on context and patterns
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

export const SmartFileSelectorInputSchema = z.object({
  projectPath: z.string().describe('Root path of the project'),
  context: z.string().describe('Context or search query'),
  limit: z.number().optional().default(10).describe('Maximum number of files to return'),
  fileTypes: z.array(z.string()).optional().describe('File extensions to search (e.g., [".ts", ".js"])'),
});

export type SmartFileSelectorInput = z.infer<typeof SmartFileSelectorInputSchema>;

export interface FileMatch {
  path: string;
  relevance: number;
  reason: string;
}

export interface SmartFileSelectorResult {
  success: boolean;
  projectPath: string;
  context: string;
  files: FileMatch[];
  error?: string;
}

/**
 * Smart file selector
 */
export class SmartFileSelector {
  /**
   * Get all files in a directory
   */
  private getAllFiles(dirPath: string, fileTypes?: string[]): string[] {
    const files: string[] = [];

    try {
      const walk = (dir: string) => {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          // Skip common directories
          if (['node_modules', '.git', 'dist', 'build', '.next', '__pycache__'].includes(item)) {
            continue;
          }

          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (!fileTypes || fileTypes.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      };

      walk(dirPath);
    } catch (error) {
      // Silently skip inaccessible directories
    }

    return files;
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(filePath: string, context: string): { score: number; reason: string } {
    let score = 0;
    const reasons: string[] = [];

    // Normalize for comparison
    const normalizedPath = filePath.toLowerCase();
    const normalizedContext = context.toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();

    // Exact filename match
    if (fileName === normalizedContext || fileName === `${normalizedContext}.ts` ||
        fileName === `${normalizedContext}.js` || fileName === `${normalizedContext}.tsx`) {
      score += 100;
      reasons.push('exact filename match');
    }

    // Filename contains context
    if (fileName.includes(normalizedContext)) {
      score += 50;
      reasons.push('filename contains context');
    }

    // Path contains context
    if (normalizedPath.includes(normalizedContext)) {
      score += 30;
      reasons.push('path contains context');
    }

    // Keyword-based relevance
    const keywords = [
      { word: 'test', points: 25 },
      { word: 'spec', points: 25 },
      { word: 'index', points: 10 },
      { word: 'types', points: 15 },
      { word: 'interface', points: 15 },
      { word: 'module', points: 10 },
    ];

    for (const { word, points } of keywords) {
      if (normalizedContext.includes(word) && fileName.includes(word)) {
        score += points;
        reasons.push(`contains keyword: ${word}`);
      }
    }

    // Penalize unrelated files
    const penaltyKeywords = ['node_modules', 'test', 'spec', 'min', 'build', 'dist'];
    for (const keyword of penaltyKeywords) {
      if (normalizedPath.includes(keyword) && !normalizedContext.includes(keyword)) {
        score -= 10;
      }
    }

    return {
      score: Math.max(0, score),
      reason: reasons.join(', ') || 'file in project',
    };
  }

  /**
   * Select relevant files
   */
  selectFiles(input: SmartFileSelectorInput): SmartFileSelectorResult {
    try {
      // Get all files
      const allFiles = this.getAllFiles(input.projectPath, input.fileTypes);

      // Score each file
      const scoredFiles = allFiles
        .map(file => {
          const { score, reason } = this.calculateRelevance(file, input.context);
          return {
            path: path.relative(input.projectPath, file),
            relevance: score,
            reason,
          };
        })
        .filter(f => f.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, input.limit || 10);

      return {
        success: true,
        projectPath: input.projectPath,
        context: input.context,
        files: scoredFiles,
      };
    } catch (error) {
      return {
        success: false,
        projectPath: input.projectPath,
        context: input.context,
        files: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create smart file selector tool
 */
export function createSmartFileSelectorTool() {
  const selector = new SmartFileSelector();

  return {
    name: 'smart-file-selector',
    description: 'Find relevant files in a project based on context',
    schema: SmartFileSelectorInputSchema,
    async execute(input: SmartFileSelectorInput): Promise<SmartFileSelectorResult> {
      return selector.selectFiles(input);
    },
  };
}
