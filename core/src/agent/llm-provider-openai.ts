/**
 * OpenAI-Compatible LLM Provider
 *
 * Supports OpenAI API and OpenAI-compatible endpoints (Ollama, LM Studio, etc)
 */

import OpenAI from 'openai';
import type { LLMProvider } from './executor';

interface OpenAILLMConfig {
  apiKey?: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface LLMMessage {
  role: string;
  content: string;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  inputTokens: number;
  outputTokens: number;
  model: string;
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
}

/**
 * Pricing for models (per 1M tokens)
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'ollama': { input: 0, output: 0 }, // Local models are free
  'default': { input: 0, output: 0 }, // Assume free for unknown models
};

/**
 * OpenAI-Compatible LLM Provider
 * Works with OpenAI API and compatible endpoints
 */
export class OpenAICompatibleProvider implements LLMProvider {
  private client: OpenAI;
  private config: OpenAILLMConfig;

  constructor(config: OpenAILLMConfig) {
    this.config = config;

    // Initialize OpenAI client with optional custom endpoint
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'sk-test',
      baseURL: config.baseURL, // Optional custom endpoint (Ollama, LM Studio, etc)
      ...(config.baseURL && { defaultHeaders: {} }), // Clear default headers for custom endpoints
    });
  }

  /**
   * Call the LLM with messages and tools
   */
  async call(options: {
    model: any;
    messages: LLMMessage[];
    tools: string[];
  }): Promise<LLMResponse> {
    const model = options.model.model || this.config.model;

    try {
      // Prepare tool definitions if tools are provided
      const tools = options.tools && options.tools.length > 0
        ? this.buildToolDefinitions(options.tools)
        : undefined;

      // Call the LLM API
      const response = await this.client.chat.completions.create({
        model: model,
        messages: options.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 2000,
        top_p: this.config.topP ?? 1,
        tools: tools,
      });

      // Parse the response
      const message = response.choices[0]?.message;
      if (!message) {
        throw new Error('No message in LLM response');
      }

      // Extract text content and tool calls
      let content = '';
      const toolCalls: ToolCall[] = [];

      if (message.content) {
        content = message.content;
      }

      // Parse tool calls if present
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.type === 'function') {
            const functionCall = toolCall.function;
            toolCalls.push({
              id: toolCall.id,
              name: functionCall.name,
              arguments: JSON.parse(functionCall.arguments || '{}'),
            });
          }
        }
      }

      // Determine stop reason
      const stopReason = message.tool_calls && message.tool_calls.length > 0
        ? 'tool_use'
        : response.finish_reason === 'length'
        ? 'max_tokens'
        : 'end_turn';

      // Extract token counts
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;

      return {
        content,
        toolCalls,
        inputTokens,
        outputTokens,
        model: model,
        stopReason: stopReason as 'end_turn' | 'tool_use' | 'max_tokens',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LLM call failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Build tool definitions for OpenAI API
   */
  private buildToolDefinitions(toolNames: string[]): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }> {
    // Generic tool definitions - in real implementation, would fetch actual tool metadata
    return toolNames.map(name => ({
      type: 'function' as const,
      function: {
        name: name,
        description: `Execute tool: ${name}`,
        parameters: {
          type: 'object' as const,
          properties: {
            input: {
              type: 'string',
              description: 'Input for the tool',
            },
          },
          required: ['input'],
        },
      },
    }));
  }

  /**
   * Calculate cost of the LLM call
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING.default;
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return parseFloat((inputCost + outputCost).toFixed(6));
  }
}

/**
 * Factory function to create OpenAI provider
 */
export function createOpenAIProvider(config: Partial<OpenAILLMConfig> = {}): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    baseURL: config.baseURL,
    model: config.model || 'gpt-3.5-turbo',
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 2000,
    topP: config.topP ?? 1,
  });
}

/**
 * Create provider for local Ollama instance
 */
export function createOllamaProvider(
  model: string = 'llama2',
  baseURL: string = 'http://localhost:11434/v1'
): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    model,
    baseURL,
    apiKey: 'not-needed', // Ollama doesn't require API key
  });
}

/**
 * Create provider for LM Studio
 */
export function createLMStudioProvider(
  model: string = 'local-model',
  baseURL: string = 'http://localhost:1234/v1'
): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    model,
    baseURL,
    apiKey: 'not-needed',
  });
}
