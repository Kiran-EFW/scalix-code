/**
 * Git Operations Tools
 *
 * Safe git operations with commit tracking and safety validation
 */

import { execSync } from 'child_process';
import { ToolDefinition, ToolExecutionContext } from '../conversation/types';

/**
 * Get current git status
 */
export const gitStatusTool: ToolDefinition = {
  name: 'gitStatus',
  description: 'Get current git status (modified files, branches, commits)',
  handler: async (args: any, context: ToolExecutionContext) => {
    try {
      const projectPath = context.conversationState.projectPath;
      const output = execSync('git status --porcelain', { cwd: projectPath, encoding: 'utf-8' });
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: projectPath,
        encoding: 'utf-8',
      }).trim();

      const lines = output.split('\n').filter((l) => l.trim());
      const modified = lines.filter((l) => l.startsWith('M')).map((l) => l.substring(3));
      const untracked = lines.filter((l) => l.startsWith('??')).map((l) => l.substring(3));
      const staged = lines.filter((l) => l.startsWith('A ')).map((l) => l.substring(3));

      return {
        success: true,
        branch,
        modified,
        untracked,
        staged,
        status: output,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git status',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {},
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 60, maxPerHour: 1000 },
  },
};

/**
 * Get git diff for changes
 */
export const gitDiffTool: ToolDefinition = {
  name: 'gitDiff',
  description: 'Get diff between commits or working directory',
  handler: async (args: { ref?: string; staged?: boolean }, context: ToolExecutionContext) => {
    try {
      const projectPath = context.conversationState.projectPath;
      const staged = args.staged ? '--staged' : '';
      const ref = args.ref ? `${args.ref}..HEAD` : '';

      const output = execSync(`git diff ${staged} ${ref}`, {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      // Limit output
      if (output.length > 10000) {
        return {
          success: true,
          diff: output.substring(0, 10000),
          truncated: true,
          message: `Showing first 10000 chars of diff (total: ${output.length} chars)`,
        };
      }

      return {
        success: true,
        diff: output,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git diff',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
        description: 'Git reference to compare against (branch, commit, tag)',
      },
      staged: {
        type: 'boolean',
        description: 'Show only staged changes',
      },
    },
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 30, maxPerHour: 300 },
  },
};

/**
 * Commit changes to git
 */
export const gitCommitTool: ToolDefinition = {
  name: 'gitCommit',
  description: 'Commit staged changes with a message',
  handler: async (args: { message: string; author?: string }, context: ToolExecutionContext) => {
    try {
      const projectPath = context.conversationState.projectPath;
      const message = args.message;

      // Validate message
      if (!message || message.trim().length === 0) {
        return {
          success: false,
          error: 'Commit message cannot be empty',
        };
      }

      if (message.length > 72) {
        return {
          success: false,
          error: 'Commit message should be under 72 characters',
          suggestion: `Your message: "${message}" (${message.length} chars)`,
        };
      }

      // Check if there are staged changes
      try {
        execSync('git diff --staged --quiet', { cwd: projectPath });
        return {
          success: false,
          error: 'No staged changes to commit',
          suggestion: 'Use writeFile tool to make changes first, or run: git add .',
        };
      } catch {
        // Expected - there are changes
      }

      // Create commit
      const author = args.author || '';
      const authorFlag = author ? `--author="${author}"` : '';

      const output = execSync(`git commit -m "${message}" ${authorFlag}`, {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      return {
        success: true,
        message: `Committed: ${message}`,
        output,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to commit changes',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Commit message (should be under 72 chars)',
      },
      author: {
        type: 'string',
        description: 'Author in format "Name <email@example.com>"',
      },
    },
    required: ['message'],
  },
  safety: {
    requiresConfirmation: true,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 20, maxPerHour: 200 },
  },
};

/**
 * Push commits to remote
 */
export const gitPushTool: ToolDefinition = {
  name: 'gitPush',
  description: 'Push commits to remote branch',
  handler: async (args: { branch?: string; force?: boolean }, context: ToolExecutionContext) => {
    try {
      const projectPath = context.conversationState.projectPath;

      // Get current branch if not specified
      let branch = args.branch;
      if (!branch) {
        branch = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: projectPath,
          encoding: 'utf-8',
        }).trim();
      }

      // Prevent force push to main/master
      if (args.force && (branch === 'main' || branch === 'master')) {
        return {
          success: false,
          error: `Cannot force push to ${branch} branch`,
          suggestion: 'Use a feature branch instead',
        };
      }

      const forceFlag = args.force ? '-f' : '';
      const output = execSync(`git push ${forceFlag} origin ${branch}`, {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      return {
        success: true,
        message: `Pushed to ${branch}`,
        output,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to push commits',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      branch: {
        type: 'string',
        description: 'Branch to push to (defaults to current branch)',
      },
      force: {
        type: 'boolean',
        description: 'Force push (dangerous, blocked for main/master)',
      },
    },
  },
  safety: {
    requiresConfirmation: true,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 10, maxPerHour: 100 },
  },
};

/**
 * View git log
 */
export const gitLogTool: ToolDefinition = {
  name: 'gitLog',
  description: 'View git commit history',
  handler: async (args: { limit?: number; oneline?: boolean }, context: ToolExecutionContext) => {
    try {
      const projectPath = context.conversationState.projectPath;
      const limit = args.limit || 10;
      const oneline = args.oneline ? '--oneline' : '';

      const output = execSync(`git log ${oneline} -n ${limit}`, {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      return {
        success: true,
        log: output,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get git log',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of commits to show',
      },
      oneline: {
        type: 'boolean',
        description: 'Show in condensed one-line format',
      },
    },
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 60, maxPerHour: 1000 },
  },
};

/**
 * Stage changes for commit
 */
export const gitAddTool: ToolDefinition = {
  name: 'gitAdd',
  description: 'Stage files for commit',
  handler: async (args: { files?: string[]; all?: boolean }, context: ToolExecutionContext) => {
    try {
      const projectPath = context.conversationState.projectPath;

      let command = 'git add';
      if (args.all) {
        command += ' .';
      } else if (args.files && args.files.length > 0) {
        command += ' ' + args.files.map((f) => `"${f}"`).join(' ');
      } else {
        return {
          success: false,
          error: 'Specify either "all: true" or provide list of files',
        };
      }

      const output = execSync(command, { cwd: projectPath, encoding: 'utf-8' });

      return {
        success: true,
        message: `Staged changes`,
        output,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stage changes',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of files to stage',
      },
      all: {
        type: 'boolean',
        description: 'Stage all changes',
      },
    },
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 30, maxPerHour: 300 },
  },
};

/**
 * Export all git tools
 */
export const gitOperationTools = [gitStatusTool, gitDiffTool, gitCommitTool, gitPushTool, gitLogTool, gitAddTool];
