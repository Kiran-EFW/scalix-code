/**
 * Tool Dispatcher
 *
 * Safe tool execution with rate limiting and input validation
 */

import type { Tool, ToolCall, ToolExecutionResult, ToolRegistry } from './types';

/**
 * Rate limiter implementation
 */
class RateLimiter {
  private callCounts = new Map<string, number[]>();
  private limits = new Map<string, { maxCalls: number; windowMs: number }>();

  /**
   * Register a rate limit for a tool
   */
  register(
    toolName: string,
    maxCalls: number,
    windowMs: number
  ): void {
    this.limits.set(toolName, { maxCalls, windowMs });
  }

  /**
   * Check if tool call is allowed
   */
  isAllowed(toolName: string): boolean {
    const limit = this.limits.get(toolName);
    if (!limit) return true; // No limit = always allowed

    const now = Date.now();
    const calls = this.callCounts.get(toolName) || [];

    // Remove calls outside the window
    const recentCalls = calls.filter((time) => now - time < limit.windowMs);

    // Check if under limit
    if (recentCalls.length >= limit.maxCalls) {
      return false;
    }

    // Update counts
    recentCalls.push(now);
    this.callCounts.set(toolName, recentCalls);

    return true;
  }

  /**
   * Get remaining calls for a tool
   */
  getRemaining(toolName: string): number {
    const limit = this.limits.get(toolName);
    if (!limit) return Infinity;

    const now = Date.now();
    const calls = this.callCounts.get(toolName) || [];
    const recentCalls = calls.filter((time) => now - time < limit.windowMs);

    return Math.max(0, limit.maxCalls - recentCalls.length);
  }
}

/**
 * Input validator
 */
class InputValidator {
  private maxInputLength = 10000;
  private blockedPatterns = [
    /exec\(/gi, // exec() calls
    /eval\(/gi, // eval() calls
    /subprocess/gi, // subprocess
    /os\.system/gi, // os.system
  ];

  /**
   * Validate input arguments
   */
  validate(toolName: string, args: Record<string, unknown>): boolean {
    const inputStr = JSON.stringify(args);

    // Check length
    if (inputStr.length > this.maxInputLength) {
      throw new Error(
        `Input too large: ${inputStr.length} > ${this.maxInputLength}`
      );
    }

    // Check for blocked patterns
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(inputStr)) {
        throw new Error(`Blocked pattern detected in input for ${toolName}`);
      }
    }

    return true;
  }
}

/**
 * Tool dispatcher - safe execution with limits
 */
export class ToolDispatcher {
  private rateLimiter = new RateLimiter();
  private validator = new InputValidator();

  constructor(private registry: ToolRegistry) {}

  /**
   * Dispatch a tool call
   */
  async dispatch(toolCall: ToolCall): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Get tool
      const tool = this.registry.get(toolCall.toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolCall.toolName}`);
      }

      // Validate input
      this.validator.validate(toolCall.toolName, toolCall.arguments);

      // Check rate limit
      if (!this.rateLimiter.isAllowed(toolCall.toolName)) {
        throw new Error(
          `Rate limit exceeded for ${toolCall.toolName}. Remaining: ${this.rateLimiter.getRemaining(
            toolCall.toolName
          )}`
        );
      }

      // Register rate limit if not already registered
      if (tool.rateLimit && !this.rateLimiter.getRemaining(toolCall.toolName)) {
        this.rateLimiter.register(
          toolCall.toolName,
          tool.rateLimit.maxCalls,
          tool.rateLimit.windowMs
        );
      }

      // Execute tool with timeout
      const timeout = tool.timeout ?? 30000; // 30s default
      const result = await Promise.race([
        tool.execute(toolCall.arguments),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Tool execution timeout: ${timeout}ms`)),
            timeout
          )
        ),
      ]);

      const duration = Date.now() - startTime;

      return {
        toolCall,
        success: true,
        result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        toolCall,
        success: false,
        error: {
          code: 'TOOL_EXECUTION_FAILED',
          message,
        },
        duration,
      };
    }
  }

  /**
   * Register a rate limit for a tool
   */
  setRateLimit(
    toolName: string,
    maxCalls: number,
    windowMs: number
  ): void {
    this.rateLimiter.register(toolName, maxCalls, windowMs);
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(toolName: string): { remaining: number; limit?: number } {
    return {
      remaining: this.rateLimiter.getRemaining(toolName),
    };
  }
}
