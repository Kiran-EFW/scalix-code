/**
 * Hook Registry & Execution System
 *
 * Manages plugin hooks for pre/post tool use, session lifecycle, and error handling
 */

import { v4 as uuidv4 } from 'uuid';
import {
  HookEvent,
  HookDefinition,
  HookContext,
  HookRegistry,
  HookModification,
} from '../conversation/types';

/**
 * Registry for managing hooks from all plugins
 */
export class ScalixHookRegistry implements HookRegistry {
  hooks: Map<HookEvent, HookDefinition[]> = new Map();
  private hookExecutionLog: Array<{ hookId: string; event: HookEvent; timestamp: Date; duration: number }> = [];

  constructor() {
    // Initialize hook event collections
    const events: HookEvent[] = [
      'SessionStart',
      'SessionEnd',
      'PreToolUse',
      'PostToolUse',
      'AgentSwitch',
      'ErrorOccurred',
      'TurnComplete',
    ];

    for (const event of events) {
      this.hooks.set(event, []);
    }
  }

  /**
   * Register a hook from a plugin
   */
  register(hook: HookDefinition): void {
    const event = hook.event;
    const hooks = this.hooks.get(event);

    if (!hooks) {
      throw new Error(`Unknown hook event: ${event}`);
    }

    // Ensure hook has unique ID
    if (!hook.id) {
      hook.id = `${hook.pluginId}:${event}:${uuidv4()}`;
    }

    // Add with ordering
    if (hook.order === undefined) {
      hook.order = hooks.length;
    }

    hooks.push(hook);
    hooks.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Unregister a hook
   */
  unregister(hookId: string): void {
    for (const [_event, hooks] of this.hooks) {
      const index = hooks.findIndex((h) => h.id === hookId);
      if (index !== -1) {
        hooks.splice(index, 1);
        break;
      }
    }
  }

  /**
   * Execute all hooks for an event
   */
  async execute(event: HookEvent, context: HookContext): Promise<HookModification[]> {
    const hooks = this.hooks.get(event) || [];
    const modifications: HookModification[] = [];

    for (const hook of hooks) {
      const startTime = Date.now();

      try {
        const result = await hook.handler(context);
        const duration = Date.now() - startTime;

        // Log execution
        this.hookExecutionLog.push({
          hookId: hook.id,
          event,
          timestamp: new Date(),
          duration,
        });

        if (result) {
          modifications.push(result);

          // If hook blocked an action, stop processing other hooks
          if (result.blocked) {
            break;
          }
        }
      } catch (error) {
        console.error(`Error executing hook ${hook.id}:`, error);
        // Continue with other hooks even if one fails
      }
    }

    return modifications;
  }

  /**
   * Get execution log for metrics
   */
  getExecutionLog(): typeof this.hookExecutionLog {
    return [...this.hookExecutionLog];
  }

  /**
   * Clear execution log
   */
  clearExecutionLog(): void {
    this.hookExecutionLog = [];
  }
}

/**
 * Built-in hooks provided by Scalix Code
 */

/**
 * Safety hook: Prevent dangerous shell commands
 */
export const safetyHook: HookDefinition = {
  id: 'scalix:safety',
  event: 'PreToolUse',
  pluginId: 'core',
  order: 0, // Run first
  handler: async (context: HookContext) => {
    if (context.toolCall?.name !== 'bashExec') {
      return;
    }

    const command = context.toolCall.args.command as string;

    // Dangerous patterns
    const dangerousPatterns = [
      /rm\s+-rf\s+\/\s*/,
      /dd\s+if=\/dev\/\w+ of=\/dev\/\w+/,
      /:\(\)\{:\|:\&\};:/,
      /fork\(\)/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          blocked: true,
          blockReason: `⚠️ Dangerous command pattern detected: ${pattern}`,
        };
      }
    }

    return;
  },
};

/**
 * Confirmation hook: Ask for approval before destructive operations
 */
export const confirmationHook: HookDefinition = {
  id: 'scalix:confirmation',
  event: 'PreToolUse',
  pluginId: 'core',
  order: 1, // Run after safety
  handler: async (context: HookContext) => {
    if (!context.toolCall) return;

    const { name, args } = context.toolCall;
    const preferences = context.conversationState.context.userPreferences;

    if (!preferences.confirmDestructive) {
      return;
    }

    // Check for destructive operations
    const isDestructive =
      (name === 'deleteFile' || name === 'deleteFiles') ||
      (name === 'gitCommit' && !context.conversationState.context.userPreferences.autoCommit) ||
      (name === 'bashExec' && (args.command as string).includes('rm ')) ||
      (name === 'writeFile' && (args.overwrite === true));

    if (isDestructive) {
      const confirmed = await context.confirm(
        `This operation is destructive. Continue? [y/N]`
      );

      if (!confirmed) {
        return {
          blocked: true,
          blockReason: 'Operation cancelled by user',
        };
      }
    }

    return;
  },
};

/**
 * Logging hook: Track tool execution
 */
export const loggingHook: HookDefinition = {
  id: 'scalix:logging',
  event: 'PostToolUse',
  pluginId: 'core',
  handler: async (context: HookContext) => {
    if (!context.toolCall) return;

    const { name, args } = context.toolCall;
    context.log(`✓ Tool executed: ${name} with args ${JSON.stringify(args)}`);

    return;
  },
};

/**
 * Cost tracking hook: Estimate operation costs
 */
export const costTrackingHook: HookDefinition = {
  id: 'scalix:cost-tracking',
  event: 'PreToolUse',
  pluginId: 'core',
  handler: async (context: HookContext) => {
    if (!context.toolCall) return;

    const { name, args } = context.toolCall;

    // Estimate costs for expensive operations
    let estimatedCost = 0;

    if (name === 'callLLM') {
      // ~100 tokens per call, ~$0.00001 per token
      const estimatedTokens = (args.prompt as string).split(' ').length * 1.3;
      estimatedCost = estimatedTokens * 0.00001;
    }

    if (estimatedCost > 0) {
      context.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);
    }

    return;
  },
};

/**
 * File access control hook: Respect .claudeignore
 */
export const fileAccessControlHook: HookDefinition = {
  id: 'scalix:file-access-control',
  event: 'PreToolUse',
  pluginId: 'core',
  order: -1, // Run first
  handler: async (context: HookContext) => {
    if (!context.toolCall) return;

    const { name, args } = context.toolCall;
    const projectPath = context.conversationState.context.projectPath;

    // Check if operation accesses files outside project
    const fileOps = ['readFile', 'writeFile', 'deleteFile'];
    if (fileOps.includes(name)) {
      const filePath = args.path as string;

      // Prevent access to home directory
      if (filePath.startsWith('~') || filePath.startsWith('/Users') || filePath.startsWith('/home')) {
        // Allow if within project
        if (!filePath.includes(projectPath)) {
          return {
            blocked: true,
            blockReason: `⛔ Cannot access files outside project directory: ${filePath}`,
          };
        }
      }

      // TODO: Check .claudeignore for file patterns
    }

    return;
  },
};

/**
 * Error handler hook: Catch and log errors
 */
export const errorHandlerHook: HookDefinition = {
  id: 'scalix:error-handler',
  event: 'ErrorOccurred',
  pluginId: 'core',
  handler: async (context: HookContext) => {
    if (!context.error) return;

    context.log(`❌ Error: ${context.error.message}`);
    context.log(`Stack: ${context.error.stack}`);

    // TODO: Send to error tracking service

    return;
  },
};

/**
 * Get all built-in hooks
 */
export function getBuiltInHooks(): HookDefinition[] {
  return [
    fileAccessControlHook,
    safetyHook,
    confirmationHook,
    costTrackingHook,
    loggingHook,
    errorHandlerHook,
  ];
}
