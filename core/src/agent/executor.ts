/**
 * Agent Executor
 *
 * Core execution engine for agents
 * Handles LLM interaction, tool dispatch, iteration loop
 */

import { v4 as uuid } from 'uuid';
import type {
  Agent,
  AgentConfig,
  AgentState,
  ExecutionResult,
  Cost,
} from './types';
import type { ToolRegistry, ToolCall } from '../tools/types';
import type { Tracer, Logger } from '../observability/types';
import type { Storage } from '../storage/types';
import { AgentStateMachine } from './state-machine';

/**
 * LLM response structure
 */
interface LLMResponse {
  content: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  inputTokens: number;
  outputTokens: number;
  model: string;
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
}

/**
 * Agent executor - core execution engine
 */
export class AgentExecutor implements Agent {
  readonly id: string;
  readonly name: string;
  readonly config: AgentConfig;
  private stateMachine: AgentStateMachine;
  private executionHistory: ExecutionResult[] = [];

  constructor(
    config: AgentConfig,
    private tools: ToolRegistry,
    private tracer: Tracer,
    private storage: Storage,
    private logger: Logger,
    private llmProvider: LLMProvider
  ) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    this.stateMachine = new AgentStateMachine();
  }

  /**
   * Get current state
   */
  get state(): AgentState {
    return this.stateMachine.getState() as AgentState;
  }

  /**
   * Execute the agent
   */
  async execute(
    input: string,
    context?: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const traceId = uuid();
    const span = this.tracer.startSpan('agent.execute', {
      agentId: this.id,
      input: input.substring(0, 100),
      traceId,
    });

    const startTime = Date.now();

    try {
      this.stateMachine.transition('initializing' as any);
      this.logger.info(`Agent ${this.name} starting execution`, {
        agentId: this.id,
        input: input.substring(0, 100),
      });

      // Load agent memory for context
      const memory = await this.storage.loadMemory(this.id);
      const messages: Array<{ role: string; content: string }> = [];

      // Build message history
      if (memory) {
        messages.push({
          role: 'system',
          content: this.config.systemPrompt,
        });
      } else {
        messages.push({
          role: 'system',
          content: this.config.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: input,
      });

      // Initialize execution tracking
      const toolCalls: ToolCall[] = [];
      const toolResults: any[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let iteration = 0;
      const maxIterations = this.config.maxIterations ?? 10;

      this.stateMachine.transition('executing' as any);

      // Main agent loop
      while (iteration < maxIterations && !this.stateMachine.isTerminal()) {
        iteration++;

        const iterationSpan = this.tracer.startSpan(`agent.iteration.${iteration}`, {
          iteration,
          messageCount: messages.length,
        });

        try {
          // Call LLM
          const llmSpan = this.tracer.startSpan('llm.call', {
            model: this.config.model.model,
            provider: this.config.model.provider,
          });

          let llmResponse: LLMResponse;
          try {
            llmResponse = await this.llmProvider.call({
              model: this.config.model,
              messages,
              tools: this.config.tools,
            });

            this.tracer.endSpan(llmSpan, 'success');
          } catch (error) {
            this.tracer.endSpan(llmSpan, 'error');
            throw error;
          }

          totalInputTokens += llmResponse.inputTokens;
          totalOutputTokens += llmResponse.outputTokens;

          // Add assistant response to messages
          messages.push({
            role: 'assistant',
            content: llmResponse.content,
          });

          // Process tool calls if any
          if (llmResponse.toolCalls.length === 0) {
            // Agent finished
            this.stateMachine.transition('completed' as any);
            this.tracer.endSpan(iterationSpan, 'success');
            break;
          }

          // Execute tools
          const toolResultsThisIteration: any[] = [];

          for (const toolCall of llmResponse.toolCalls) {
            const toolSpan = this.tracer.startSpan(`tool.execute`, {
              toolName: toolCall.name,
              toolId: toolCall.id,
            });

            const toolCallRecord: ToolCall = {
              id: toolCall.id,
              toolName: toolCall.name,
              arguments: toolCall.arguments,
              timestamp: new Date(),
            };

            toolCalls.push(toolCallRecord);

            try {
              const toolResult = await this.tools.execute(toolCallRecord);

              if (toolResult.success) {
                toolResults.push(toolResult.result);
                toolResultsThisIteration.push({
                  id: toolCall.id,
                  success: true,
                  content: JSON.stringify(toolResult.result),
                });
                this.tracer.endSpan(toolSpan, 'success');
              } else {
                toolResultsThisIteration.push({
                  id: toolCall.id,
                  success: false,
                  content: `Tool error: ${toolResult.error?.message}`,
                });
                this.tracer.endSpan(toolSpan, 'error');
              }
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Unknown error';
              toolResultsThisIteration.push({
                id: toolCall.id,
                success: false,
                content: `Tool exception: ${message}`,
              });
              this.tracer.endSpan(toolSpan, 'error');
            }
          }

          // Add tool results to messages
          messages.push({
            role: 'user',
            content: JSON.stringify(toolResultsThisIteration),
          });

          this.stateMachine.transition('waiting' as any);
          this.tracer.endSpan(iterationSpan, 'success');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Iteration ${iteration} failed`, error as Error);
          this.tracer.endSpan(iterationSpan, 'error');

          if (iteration >= maxIterations) {
            this.stateMachine.transition('completed' as any);
          } else {
            // Retry iteration
            this.stateMachine.transition('executing' as any);
          }
        }
      }

      // Get final output
      const lastMessage = messages[messages.length - 1];
      const output = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

      // Calculate cost
      const cost = this.calculateCost(
        totalInputTokens,
        totalOutputTokens,
        this.config.model.model
      );

      const duration = Date.now() - startTime;

      // Build execution result
      const result: ExecutionResult = {
        agentId: this.id,
        status: this.stateMachine.isTerminal() ? 'success' : 'timeout',
        output,
        toolCalls,
        toolResults,
        cost,
        duration,
        iterations: iteration,
        trace: span ? [span] : [],
        finalState: this.stateMachine.getState() as AgentState,
      };

      // Save to storage
      await this.storage.saveExecutionResult(result);

      // Save to history
      this.executionHistory.push(result);

      this.tracer.endSpan(span, 'success');
      this.logger.info(`Agent ${this.name} completed execution`, {
        agentId: this.id,
        status: result.status,
        duration,
        iterations: iteration,
        cost: cost.costUSD,
      });

      return result;
    } catch (error) {
      this.stateMachine.transition('errored' as any);
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Agent ${this.name} execution failed`, error as Error);
      this.tracer.endSpan(span, 'error');

      const result: ExecutionResult = {
        agentId: this.id,
        status: 'failure',
        output: '',
        toolCalls: [],
        toolResults: [],
        cost: {
          provider: this.config.model.provider,
          model: this.config.model.model,
          inputTokens: 0,
          outputTokens: 0,
          costUSD: 0,
          timestamp: new Date(),
        },
        duration: Date.now() - startTime,
        iterations: 0,
        trace: [span],
        finalState: this.stateMachine.getState() as AgentState,
        error: {
          code: 'AGENT_EXECUTION_FAILED',
          message,
        },
      };

      return result;
    }
  }

  /**
   * Pause agent execution
   */
  async pause(): Promise<void> {
    this.stateMachine.transition('paused' as any);
    this.logger.info(`Agent ${this.name} paused`);
  }

  /**
   * Resume agent execution
   */
  async resume(): Promise<void> {
    this.stateMachine.transition('executing' as any);
    this.logger.info(`Agent ${this.name} resumed`);
  }

  /**
   * Cancel agent execution
   */
  async cancel(): Promise<void> {
    this.stateMachine.transition('cancelled' as any);
    this.logger.info(`Agent ${this.name} cancelled`);
  }

  /**
   * Get execution history
   */
  getHistory(): ExecutionResult[] {
    return [...this.executionHistory];
  }

  /**
   * Clear execution history
   */
  async clearHistory(): Promise<void> {
    this.executionHistory = [];
    this.logger.info(`Agent ${this.name} history cleared`);
  }

  /**
   * Calculate cost based on tokens
   */
  private calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): Cost {
    // Token pricing (per 1M tokens)
    const rates: Record<string, { input: number; output: number }> = {
      'claude-3-sonnet-20240229': {
        input: 3, // $3 per 1M input tokens
        output: 15, // $15 per 1M output tokens
      },
      'claude-3-opus-20240229': {
        input: 15,
        output: 75,
      },
      'gpt-4': {
        input: 30,
        output: 60,
      },
      'gpt-3.5-turbo': {
        input: 0.5,
        output: 1.5,
      },
      'gemini-2-flash': {
        input: 0.075,
        output: 0.3,
      },
    };

    const rate = rates[model] || rates['claude-3-sonnet-20240229'];
    const costUSD =
      (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;

    return {
      provider: this.config.model.provider,
      model,
      inputTokens,
      outputTokens,
      costUSD,
      timestamp: new Date(),
    };
  }
}

/**
 * LLM Provider interface
 */
export interface LLMProvider {
  call(options: {
    model: any;
    messages: Array<{ role: string; content: string }>;
    tools: string[];
  }): Promise<LLMResponse>;
}
