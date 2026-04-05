/**
 * File Operations Tools
 *
 * Safe file reading, writing, deletion, and listing with validation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ToolDefinition, ToolExecutionContext } from '../conversation/types';

/**
 * Read file contents
 */
export const readFileTool: ToolDefinition = {
  name: 'readFile',
  description: 'Read the contents of a file',
  handler: async (args: { path: string }, context: ToolExecutionContext) => {
    const filePath = args.path;

    // Validate path safety
    validateFilePath(filePath, context);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Return limited preview if file is too large
      if (content.length > 50000) {
        return {
          success: true,
          content: content.substring(0, 50000),
          truncated: true,
          message: `File is ${content.length} bytes, showing first 50000 bytes`,
        };
      }

      return {
        success: true,
        content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to read (relative to project root)',
      },
    },
    required: ['path'],
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: ['/etc/', '/sys/', '/.ssh/', '/.aws/', '/Applications/'],
    allowedPaths: undefined, // All paths in project allowed
    rateLimit: { maxPerMinute: 60, maxPerHour: 1000 },
  },
};

/**
 * Write or update a file
 */
export const writeFileTool: ToolDefinition = {
  name: 'writeFile',
  description: 'Write content to a file (creates or overwrites)',
  handler: async (
    args: { path: string; content: string; overwrite?: boolean },
    context: ToolExecutionContext
  ) => {
    const filePath = args.path;
    const content = args.content;

    // Validate path safety
    validateFilePath(filePath, context);

    try {
      // Check if file exists
      let exists = false;
      try {
        await fs.access(filePath);
        exists = true;
      } catch {
        exists = false;
      }

      // Require confirmation if overwriting
      if (exists && !args.overwrite) {
        return {
          success: false,
          error: `File ${filePath} already exists. Set overwrite: true to replace it.`,
        };
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, content, 'utf-8');

      return {
        success: true,
        message: `Successfully wrote ${content.length} bytes to ${filePath}`,
        bytesWritten: content.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to write',
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing file (requires confirmation by default)',
      },
    },
    required: ['path', 'content'],
  },
  safety: {
    requiresConfirmation: true,
    blockedPatterns: ['/etc/', '/sys/', '/.ssh/', '/.aws/'],
    rateLimit: { maxPerMinute: 30, maxPerHour: 300 },
  },
};

/**
 * Create a new file with optional template
 */
export const createFileTool: ToolDefinition = {
  name: 'createFile',
  description: 'Create a new file (fails if file exists)',
  handler: async (args: { path: string; content?: string; template?: string }, context: ToolExecutionContext) => {
    const filePath = args.path;

    // Validate path safety
    validateFilePath(filePath, context);

    try {
      // Check if file exists
      try {
        await fs.access(filePath);
        return {
          success: false,
          error: `File ${filePath} already exists`,
        };
      } catch {
        // File doesn't exist, continue
      }

      // Determine content
      let content = args.content || '';

      if (args.template) {
        content = getFileTemplate(args.template, filePath);
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, content, 'utf-8');

      return {
        success: true,
        message: `Created file: ${filePath}`,
        path: filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create file',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path for the new file',
      },
      content: {
        type: 'string',
        description: 'Initial content for the file',
      },
      template: {
        type: 'string',
        description: 'Template name (test, component, service, etc.)',
      },
    },
    required: ['path'],
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: ['/etc/', '/sys/', '/.ssh/', '/.aws/'],
    rateLimit: { maxPerMinute: 30, maxPerHour: 300 },
  },
};

/**
 * Delete a file
 */
export const deleteFileTool: ToolDefinition = {
  name: 'deleteFile',
  description: 'Delete a file',
  handler: async (args: { path: string }, context: ToolExecutionContext) => {
    const filePath = args.path;

    // Validate path safety
    validateFilePath(filePath, context);

    try {
      await fs.unlink(filePath);

      return {
        success: true,
        message: `Deleted file: ${filePath}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file to delete',
      },
    },
    required: ['path'],
  },
  safety: {
    requiresConfirmation: true,
    blockedPatterns: ['/etc/', '/sys/', '/.ssh/', '/.aws/', '/', '..'],
    rateLimit: { maxPerMinute: 10, maxPerHour: 100 },
  },
};

/**
 * List files matching a pattern
 */
export const listFilesTool: ToolDefinition = {
  name: 'listFiles',
  description: 'List files matching a pattern (glob)',
  handler: async (args: { pattern: string; maxResults?: number }, context: ToolExecutionContext) => {
    const pattern = args.pattern;
    const maxResults = args.maxResults || 100;

    try {
      // Simple glob implementation - would use glob library in production
      const files: string[] = [];

      // For now, return helpful message
      return {
        success: true,
        message: `Use gitStatus or bash commands to find files matching: ${pattern}`,
        suggestion: `Try: bashExec with "find . -name '${pattern}'" or "ls -la"`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern to match files',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return',
      },
    },
    required: ['pattern'],
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: [],
    rateLimit: { maxPerMinute: 60, maxPerHour: 1000 },
  },
};

/**
 * Find files containing a pattern
 */
export const findInFilesTool: ToolDefinition = {
  name: 'findInFiles',
  description: 'Search for files containing a pattern',
  handler: async (
    args: { pattern: string; path?: string; maxResults?: number },
    context: ToolExecutionContext
  ) => {
    const pattern = args.pattern;
    const searchPath = args.path || '.';
    const maxResults = args.maxResults || 50;

    try {
      // Would use grep/ripgrep in production
      return {
        success: true,
        message: `Use bashExec with grep to search: grep -r "${pattern}" ${searchPath}`,
        suggestion: `bashExec with: grep -r "${pattern}" ${searchPath} | head -${maxResults}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search files',
      };
    }
  },
  schema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Pattern to search for',
      },
      path: {
        type: 'string',
        description: 'Path to search in (defaults to current directory)',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results',
      },
    },
    required: ['pattern'],
  },
  safety: {
    requiresConfirmation: false,
    blockedPatterns: ['/etc/', '/sys/', '/.ssh/', '/.aws/'],
    rateLimit: { maxPerMinute: 30, maxPerHour: 300 },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate file path safety
 */
function validateFilePath(filePath: string, context: ToolExecutionContext): void {
  const projectPath = context.conversationState.projectPath;

  // Prevent access outside project
  const absolutePath = path.resolve(filePath);
  const absoluteProjectPath = path.resolve(projectPath);

  if (!absolutePath.startsWith(absoluteProjectPath)) {
    throw new Error(`Cannot access files outside project directory: ${filePath}`);
  }

  // Prevent dangerous paths
  const blockedPatterns = ['/.git/', '/.env', '/node_modules/', '/.next/'];
  for (const pattern of blockedPatterns) {
    if (absolutePath.includes(pattern)) {
      throw new Error(`Cannot access restricted path: ${filePath}`);
    }
  }
}

/**
 * Get template content for new files
 */
function getFileTemplate(template: string, filePath: string): string {
  const ext = path.extname(filePath);

  switch (template) {
    case 'test':
      return testTemplate(filePath);
    case 'component':
      return componentTemplate(filePath);
    case 'service':
      return serviceTemplate(filePath);
    case 'interface':
      return interfaceTemplate(filePath);
    case 'util':
      return utilTemplate(filePath);
    default:
      return '';
  }
}

function testTemplate(filePath: string): string {
  const name = path.basename(filePath, path.extname(filePath));
  return `import { describe, it, expect } from 'vitest';

describe('${name}', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
`;
}

function componentTemplate(filePath: string): string {
  const name = path.basename(filePath, path.extname(filePath));
  return `import React from 'react';

interface ${name}Props {
  // Props here
}

export function ${name}({ }: ${name}Props) {
  return <div>${name}</div>;
}

export default ${name};
`;
}

function serviceTemplate(filePath: string): string {
  const name = path.basename(filePath, path.extname(filePath));
  const className = name.charAt(0).toUpperCase() + name.slice(1);
  return `export class ${className}Service {
  constructor() {
    // Initialize service
  }

  // Methods here
}

export const ${name}Service = new ${className}Service();
`;
}

function interfaceTemplate(filePath: string): string {
  const name = path.basename(filePath, path.extname(filePath));
  return `export interface ${name} {
  // Properties here
}
`;
}

function utilTemplate(filePath: string): string {
  const name = path.basename(filePath, path.extname(filePath));
  return `/**
 * ${name}
 * Description of what this utility does
 */

export function ${name}() {
  // Implementation
}
`;
}

/**
 * Export all file operation tools
 */
export const fileOperationTools = [
  readFileTool,
  writeFileTool,
  createFileTool,
  deleteFileTool,
  listFilesTool,
  findInFilesTool,
];
