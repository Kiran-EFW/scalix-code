/**
 * LLM Provider Exports
 *
 * Main entry point for LLM provider functionality
 */

import type { LLMProvider } from './executor';
export type { LLMProvider };

// Export real implementations
export {
  OpenAICompatibleProvider,
  createOpenAIProvider,
  createOllamaProvider,
  createLMStudioProvider,
} from './llm-provider-openai';

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
 * Fallback to mock provider (for testing or when API unavailable)
 */
export function createMockProvider(): LLMProvider {
  return new MockLLMProvider();
}

/**
 * Default provider factory - uses OpenAI if API key available, otherwise mock
 */
export function createDefaultProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey.startsWith('sk-')) {
    return createOpenAIProvider({ apiKey });
  }
  // Fall back to mock for testing
  return new MockLLMProvider();
}
