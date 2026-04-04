/**
 * LLM Provider Stub
 *
 * Placeholder for LLM integration (would use @ai-sdk/anthropic in production)
 */

import type { LLMProvider } from './executor';

/**
 * Mock LLM provider for testing
 */
export class MockLLMProvider implements LLMProvider {
  async call(options: {
    model: any;
    messages: Array<{ role: string; content: string }>;
    tools: string[];
  }) {
    // Simulate LLM response
    const lastMessage = options.messages[options.messages.length - 1];
    const content =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    return {
      content: `Response to: ${content.substring(0, 50)}...`,
      toolCalls: [],
      inputTokens: Math.floor(Math.random() * 1000),
      outputTokens: Math.floor(Math.random() * 500),
      model: options.model.model || 'mock-model',
      stopReason: 'end_turn' as const,
    };
  }
}

/**
 * Real LLM provider factory (would use Anthropic SDK)
 */
export function createAnthropicProvider(): LLMProvider {
  // TODO: Implement when anthropic SDK is available
  return new MockLLMProvider();
}

export function createOpenAIProvider(): LLMProvider {
  // TODO: Implement when openai SDK is available
  return new MockLLMProvider();
}

export function createGoogleProvider(): LLMProvider {
  // TODO: Implement when google SDK is available
  return new MockLLMProvider();
}
