/**
 * Bash Execution Tool
 *
 * Safe command execution with output capture and timeout protection
 */

import { execSync } from 'child_process';
import { ToolDefinition, ToolExecutionContext } from '../conversation/types';

/**
 * Execute a bash command
 */
export const bashExecTool: ToolDefinition = {
  name: 'bashExec',
  description: 'Execute a bash command and capture output',
  handler: async (
    args: { command: string; cwd?: string; timeout?: number; shell?: string },
    context: ToolExecutionContext
  ) => {
    const command = args.command;
    const cwd = args.cwd || context.conversationState.projectPath;
    const timeout = args.timeout || 30000; // 30 seconds default
    // shell variable commented - execSync doesn't need explicit shell param
    // const shell = args.shell || '/bin/bash';

    // Validate command safety
    const validation = validateCommand(command, context);
    if (!validation.safe) {
      return {
        success: false,
        error: `Command blocked: ${validation.reason}`,
        suggestion: validation.suggestion,
      };
    }

    try {
      // Execute with timeout
      const output = execSync(command, {
        cwd,
        encoding: 'utf-8',
        timeout,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Limit output size
      if (output.length > 50000) {
        return {
          success: true,
          output: output.substring(0, 50000),
          truncated: true,
          message: `Command succeeded (showing first 50000 chars of ${output.length} total)`,
        };
      }

      return {
        success: true,
        output,
        command,
      };
    } catch (error: any) {
      // Handle timeout
      if (error.code === null && error.signal === 'SIGTERM') {
        return {
          success: false,
          error: `Command timeout after ${timeout / 1000} seconds`,
          suggestion: 'Try breaking the command into smaller parts',
        };
      }

      // Handle regular errors
      const stderr = error.stderr?.toString() || error.toString();
      const stdout = error.stdout?.toString() || '';

      return {
        success: false,
        error: stderr || 'Command failed',
        output: stdout,
        exitCode: error.status || 1,
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Bash command to execute',
      },
      cwd: {
        type: 'string',
        description: 'Working directory (defaults to project root)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)',
      },
      shell: {
        type: 'string',
        description: 'Shell to use (default: /bin/bash)',
      },
    },
    required: ['command'],
  },
  safety: {
    requiresConfirmation: true,
    blockedPatterns: [
      'rm -rf /', // Recursive delete from root
      'dd if=/dev', // Disk operations
      ':(){ :|:& }', // Fork bomb
      'exec /bin/sh', // Shell escape
      'eval $(', // Code execution
      'curl.*|sh', // Download and execute
    ],
    rateLimit: { maxPerMinute: 20, maxPerHour: 200 },
    costEstimate: (args: any) => ({
      costUSD: 0, // Bash execution is free
      inputTokens: 0,
      outputTokens: 0,
    }),
  },
};

/**
 * Run a test command (convenience wrapper)
 */
export const runTestsTool: ToolDefinition = {
  name: 'runTests',
  description: 'Run the project test suite',
  handler: async (args: { filter?: string; watch?: boolean }, context: ToolExecutionContext) => {
    const cwd = context.conversationState.projectPath;

    // Detect test command based on package manager
    let testCommand = 'pnpm test';

    // Try different package managers
    try {
      execSync('pnpm --version', { cwd, timeout: 5000 });
      testCommand = 'pnpm test';
    } catch {
      try {
        execSync('npm --version', { cwd, timeout: 5000 });
        testCommand = 'npm test';
      } catch {
        try {
          execSync('yarn --version', { cwd, timeout: 5000 });
          testCommand = 'yarn test';
        } catch {
          // Fallback
          testCommand = 'pnpm test';
        }
      }
    }

    // Add filters
    if (args?.filter) {
      testCommand += ` -- ${args.filter}`;
    }

    if (args?.watch) {
      testCommand += ' --watch';
    }

    // Use bashExec
    return bashExecTool.handler({ command: testCommand, cwd, timeout: 60000 }, context);
  },
  schema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        description: 'Test filter (e.g., "auth" to run auth tests)',
      },
      watch: {
        type: 'boolean',
        description: 'Run in watch mode',
      },
    },
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 10, maxPerHour: 100 },
  },
};

/**
 * Run build command
 */
export const buildTool: ToolDefinition = {
  name: 'build',
  description: 'Build the project',
  handler: async (_args: any, context: ToolExecutionContext) => {
    const cwd = context.conversationState.projectPath;

    // Detect build command
    let buildCommand = 'pnpm build';

    try {
      execSync('pnpm --version', { cwd, timeout: 5000 });
      buildCommand = 'pnpm build';
    } catch {
      try {
        execSync('npm --version', { cwd, timeout: 5000 });
        buildCommand = 'npm run build';
      } catch {
        buildCommand = 'pnpm build';
      }
    }

    return bashExecTool.handler({ command: buildCommand, cwd, timeout: 120000 }, context);
  },
  schema: {
    type: 'object',
    properties: {},
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 5, maxPerHour: 50 },
  },
};

/**
 * Run linter
 */
export const lintTool: ToolDefinition = {
  name: 'lint',
  description: 'Run the project linter',
  handler: async (_args: any, context: ToolExecutionContext) => {
    const cwd = context.conversationState.projectPath;

    // Common lint commands
    const lintCommand = 'pnpm lint';

    return bashExecTool.handler({ command: lintCommand, cwd, timeout: 30000 }, context);
  },
  schema: {
    type: 'object',
    properties: {},
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 10, maxPerHour: 100 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationResult {
  safe: boolean;
  reason?: string;
  suggestion?: string;
}

/**
 * Validate command safety
 */
function validateCommand(command: string, _context: ToolExecutionContext): ValidationResult {
  // Check blocked patterns
  const blockedPatterns = [
    { pattern: /rm\s+-rf\s+\//i, reason: 'Recursive deletion from root', suggestion: 'Be specific with paths' },
    { pattern: /dd\s+if=\/dev/i, reason: 'Dangerous disk operations', suggestion: 'Use file tools instead' },
    { pattern: /:\(\)\{:\|:\&\};:/i, reason: 'Fork bomb detected', suggestion: 'Use bash loops instead' },
    { pattern: /eval\s*\(/i, reason: 'Eval is dangerous', suggestion: 'Use specific commands' },
    { pattern: /curl.*\|.*sh/i, reason: 'Downloading and executing code', suggestion: 'Download and verify first' },
  ];

  for (const { pattern, reason, suggestion } of blockedPatterns) {
    if (pattern.test(command)) {
      return {
        safe: false,
        reason,
        suggestion,
      };
    }
  }

  // Check for chaining dangerous operations
  if (command.includes('&&') || command.includes('||') || command.includes('|')) {
    // Allow piping, but warn about some combinations
    const dangerous = command.match(/(rm|dd|mkfs|fdisk|dd).*(&&|\|\|)\s*(rm|dd|mkfs|fdisk)/i);
    if (dangerous) {
      return {
        safe: false,
        reason: 'Dangerous operation chaining',
        suggestion: 'Execute operations separately',
      };
    }
  }

  // Check for access to restricted paths
  const restrictedPaths = ['/.ssh/', '/.aws/', '/.gnupg/', '/etc/'];
  for (const restricted of restrictedPaths) {
    if (command.includes(restricted)) {
      return {
        safe: false,
        reason: `Cannot access ${restricted}`,
        suggestion: 'Use project-safe tools instead',
      };
    }
  }

  return { safe: true };
}

/**
 * Export all bash tools
 */
export const bashTools = [bashExecTool, runTestsTool, buildTool, lintTool];
