/**
 * Tool Registry
 *
 * Register and manage tools for agents
 */

import type { Tool, ToolRegistry as ToolRegistryInterface, ToolExecutionResult, ToolCall } from './types';
import { ToolDispatcher } from './dispatcher';

/**
 * Tool registry implementation
 */
export class ToolRegistry implements ToolRegistryInterface {
  private tools = new Map<string, Tool>();
  private dispatcher: ToolDispatcher;

  constructor() {
    this.dispatcher = new ToolDispatcher(this);
  }

  /**
   * Register a tool
   */
  register(tool: Partial<Tool>): void {
    if (this.tools.has(tool.name as string)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }

    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('Tool name is required and must be a string');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      throw new Error('Tool description is required and must be a string');
    }

    // Make parameters optional - default to empty array
    const parameters = tool.parameters || [];
    if (!Array.isArray(parameters)) {
      throw new Error('Tool parameters must be an array');
    }

    if (typeof tool.execute !== 'function') {
      throw new Error('Tool execute must be a function');
    }

    // Ensure tool has all required properties
    const completeTool: Tool = {
      name: tool.name,
      description: tool.description,
      parameters: parameters as any[],
      execute: tool.execute as any,
      timeout: tool.timeout,
      rateLimit: tool.rateLimit,
    };

    this.tools.set(tool.name, completeTool);

    // Register rate limit if specified
    if (completeTool.rateLimit) {
      this.dispatcher.setRateLimit(
        completeTool.name,
        tool.rateLimit.maxCalls,
        tool.rateLimit.windowMs
      );
    }
  }

  /**
   * Unregister a tool
   */
  async unregister(name: string): Promise<void> {
    if (!this.tools.has(name)) {
      throw new Error(`Tool not found: ${name}`);
    }

    this.tools.delete(name);
  }

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool call
   */
  async execute(toolCall: ToolCall): Promise<ToolExecutionResult> {
    return this.dispatcher.dispatch(toolCall);
  }

  /**
   * Get available tools for an agent
   */
  getAvailable(agentId: string): Tool[] {
    // TODO: Implement agent-specific tool access control
    return this.getAll();
  }

  /**
   * Register built-in tools
   */
  registerBuiltins(): Promise<void> {
    const builtins: Tool[] = [
      {
        name: 'echo',
        description: 'Echo back the input',
        parameters: [
          {
            name: 'message',
            type: 'string',
            description: 'Message to echo',
            required: true,
          },
        ],
        execute: async (args) => {
          const message = args.message as string;
          return { echoed: message };
        },
      },
      {
        name: 'get_current_time',
        description: 'Get the current time',
        parameters: [],
        execute: async () => {
          return { time: new Date().toISOString() };
        },
      },
      {
        name: 'random_number',
        description: 'Generate a random number between min and max',
        parameters: [
          {
            name: 'min',
            type: 'number',
            description: 'Minimum value',
            required: true,
          },
          {
            name: 'max',
            type: 'number',
            description: 'Maximum value',
            required: true,
          },
        ],
        execute: async (args) => {
          const min = args.min as number;
          const max = args.max as number;
          return {
            number: Math.floor(Math.random() * (max - min + 1)) + min,
          };
        },
      },
    ];

    return Promise.all(builtins.map((tool) => this.register(tool))).then(
      () => undefined
    );
  }
}
