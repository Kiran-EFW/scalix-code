/**
 * Orchestration Coordinator
 *
 * Multi-agent coordination with different patterns
 */

import type { Agent, ExecutionResult } from '../agent/types';
import type {
  Coordinator,
  Workflow,
  WorkflowExecutionResult,
} from './types';

/**
 * Coordinator implementation
 */
export class WorkflowCoordinator implements Coordinator {
  /**
   * Execute a workflow with the given agents
   */
  async executeWorkflow(
    workflow: Workflow,
    agents: Agent[]
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const agentsMap = new Map(agents.map((a) => [a.id, a]));

    const stepResults: ExecutionResult[] = [];

    try {
      for (const step of workflow.steps) {
        // Validate agent IDs exist
        const agentIds = step.agentIds || [];
        if (agentIds.length === 0) {
          throw new Error(`Step ${step.id} must have agentIds`);
        }

        const stepAgents = agentIds
          .map((id) => agentsMap.get(id))
          .filter((a): a is Agent => a !== undefined);

        if (stepAgents.length === 0) {
          throw new Error(`No valid agents found for step ${step.id}`);
        }

        const stepInput = step.inputs || {};
        let stepResult: ExecutionResult | ExecutionResult[];

        switch (step.pattern) {
          case 'sequential':
            stepResult = await this.executeSequential(stepAgents, stepInput);
            break;
          case 'parallel':
            stepResult = await this.executeParallel(stepAgents, stepInput);
            break;
          case 'tree':
            stepResult = await this.executeTree(stepAgents[0], new Map(), stepInput);
            break;
          case 'reactive':
            stepResult = await this.executeReactive(
              stepAgents,
              this.emptyAsyncIterable()
            );
            break;
          case 'mesh':
            stepResult = await this.executeParallel(stepAgents, stepInput);
            break;
          default:
            throw new Error(`Unknown pattern: ${step.pattern}`);
        }

        // Collect results
        if (Array.isArray(stepResult)) {
          stepResults.push(...stepResult);
        } else {
          stepResults.push(stepResult);
        }
      }

      return {
        workflowId: workflow.id,
        status: 'success',
        stepResults,
        duration: Date.now() - startTime,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      return {
        workflowId: workflow.id,
        status: 'failure',
        stepResults,
        duration: Date.now() - startTime,
        error: {
          stepId: 'unknown',
          agentId: 'unknown',
          message: error.message,
        },
      };
    }
  }

  /**
   * Execute agents sequentially
   */
  async executeSequential(
    agents: Agent[],
    inputs: Record<string, unknown>
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    let output = inputs;

    for (const agent of agents) {
      const input = typeof output === 'string'
        ? output
        : JSON.stringify(output);
      const result = await agent.execute(input, output as any);
      results.push(result);

      if (result.status !== 'success') {
        break;
      }

      // Use output as input for next agent
      output = result.output;
    }

    return results;
  }

  /**
   * Execute agents in parallel
   */
  async executeParallel(
    agents: Agent[],
    inputs: Record<string, unknown>
  ): Promise<ExecutionResult[]> {
    const input = typeof inputs === 'string'
      ? inputs
      : JSON.stringify(inputs);

    const promises = agents.map((agent) => agent.execute(input, inputs));
    return Promise.all(promises);
  }

  /**
   * Execute agents in tree structure
   */
  async executeTree(
    rootAgent: Agent,
    childAgents: Map<string, Agent[]>,
    inputs: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const input = typeof inputs === 'string'
      ? inputs
      : JSON.stringify(inputs);

    // Execute root agent
    const rootResult = await rootAgent.execute(input, inputs);

    if (rootResult.status !== 'success') {
      return rootResult;
    }

    // Execute child agents if any
    const childAgentsList = childAgents.get(rootAgent.id) || [];
    if (childAgentsList.length > 0) {
      await Promise.all(
        childAgentsList.map((agent) =>
          agent.execute(rootResult.output, {
            parentOutput: rootResult.output,
          })
        )
      );
    }

    return rootResult;
  }

  /**
   * Execute agents reactively
   */
  async executeReactive(
    agents: Agent[],
    eventStream: AsyncIterable<unknown>
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for await (const event of eventStream) {
      const eventStr = typeof event === 'string'
        ? event
        : JSON.stringify(event);

      for (const agent of agents) {
        const result = await agent.execute(eventStr, { event });
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Empty async iterable for reactive pattern
   */
  private async *emptyAsyncIterable(): AsyncIterable<unknown> {
    // Empty generator
  }
}

/**
 * Execution result merger
 */
export function mergeExecutionResults(
  results: ExecutionResult[]
): ExecutionResult {
  if (results.length === 0) {
    throw new Error('No results to merge');
  }

  if (results.length === 1) {
    return results[0];
  }

  // Merge multiple results
  return {
    agentId: results.map((r) => r.agentId).join(','),
    status:
      results.some((r) => r.status !== 'success') ? 'failure' : 'success',
    output: results.map((r) => r.output).join('\n'),
    toolCalls: results.flatMap((r) => r.toolCalls),
    toolResults: results.flatMap((r) => r.toolResults),
    cost: {
      provider: results[0].cost.provider,
      model: results[0].cost.model,
      inputTokens: results.reduce((sum, r) => sum + r.cost.inputTokens, 0),
      outputTokens: results.reduce((sum, r) => sum + r.cost.outputTokens, 0),
      costUSD: results.reduce((sum, r) => sum + r.cost.costUSD, 0),
      timestamp: new Date(),
    },
    duration: Math.max(...results.map((r) => r.duration)),
    iterations: results.reduce((sum, r) => sum + r.iterations, 0),
    trace: results.flatMap((r) => r.trace),
    finalState: results[0].finalState,
    error: results.find((r) => r.error)?.error,
  };
}
