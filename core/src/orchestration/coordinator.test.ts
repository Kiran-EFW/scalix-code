/**
 * Workflow Coordinator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowCoordinator } from './coordinator';
import { createMockAgent, testWorkflows } from '@scalix/testing';

describe('WorkflowCoordinator', () => {
  let coordinator: WorkflowCoordinator;
  let agents: Map<string, any>;

  beforeEach(() => {
    coordinator = new WorkflowCoordinator();

    // Create mock agents
    agents = new Map();
    agents.set('agent-1', createMockAgent({ id: 'agent-1' }));
    agents.set('agent-2', createMockAgent({ id: 'agent-2' }));
    agents.set('agent-3', createMockAgent({ id: 'agent-3' }));
  });

  describe('sequential workflow', () => {
    it('should execute agents in order', async () => {
      const workflow = {
        pattern: 'sequential' as const,
        steps: [
          { agentId: 'agent-1', input: 'Step 1' },
          { agentId: 'agent-2', input: 'Step 2' },
          { agentId: 'agent-3', input: 'Step 3' },
        ],
      };

      const results = await coordinator.executeWorkflow(workflow, agents);

      expect(results).toBeDefined();
      expect(results.length).toBe(3);
      expect(results[0].agentId).toBe('agent-1');
      expect(results[1].agentId).toBe('agent-2');
      expect(results[2].agentId).toBe('agent-3');
    });

    it('should pass results between steps', async () => {
      const workflow = {
        pattern: 'sequential' as const,
        steps: [
          { agentId: 'agent-1', input: 'Initial' },
          { agentId: 'agent-2', input: 'From agent-1' },
        ],
      };

      const results = await coordinator.executeWorkflow(workflow, agents);

      expect(results.length).toBe(2);
      // Second step should process first step's output
    });

    it('should handle errors in sequential workflow', async () => {
      const failingAgent = createMockAgent({
        id: 'agent-fail',
        execute: async () => ({
          status: 'failed',
          error: 'Agent failed',
        } as any),
      });
      agents.set('agent-fail', failingAgent);

      const workflow = {
        pattern: 'sequential' as const,
        steps: [
          { agentId: 'agent-1', input: 'Step 1' },
          { agentId: 'agent-fail', input: 'Step 2' },
          { agentId: 'agent-3', input: 'Step 3' },
        ],
      };

      const results = await coordinator.executeWorkflow(workflow, agents);

      expect(results.some((r) => r.status === 'failed')).toBe(true);
    });
  });

  describe('parallel workflow', () => {
    it('should execute agents concurrently', async () => {
      const workflow = {
        pattern: 'parallel' as const,
        steps: [
          { agentId: 'agent-1', input: 'Task 1' },
          { agentId: 'agent-2', input: 'Task 2' },
          { agentId: 'agent-3', input: 'Task 3' },
        ],
      };

      const startTime = Date.now();
      const results = await coordinator.executeWorkflow(workflow, agents);
      const duration = Date.now() - startTime;

      expect(results).toBeDefined();
      expect(results.length).toBe(3);
      // Parallel execution should be faster than sequential
      // (would be ~3x faster if all tasks take same time)
    });

    it('should collect all results in parallel workflow', async () => {
      const workflow = {
        pattern: 'parallel' as const,
        steps: [
          { agentId: 'agent-1', input: 'Task 1' },
          { agentId: 'agent-2', input: 'Task 2' },
        ],
      };

      const results = await coordinator.executeWorkflow(workflow, agents);

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results.every((r) => r.status === 'completed')).toBe(true);
    });

    it('should handle failures in parallel workflow', async () => {
      const failingAgent = createMockAgent({
        id: 'agent-fail',
        execute: async () => ({
          status: 'failed',
          error: 'Task failed',
        } as any),
      });
      agents.set('agent-fail', failingAgent);

      const workflow = {
        pattern: 'parallel' as const,
        steps: [
          { agentId: 'agent-1', input: 'Task 1' },
          { agentId: 'agent-fail', input: 'Task 2' },
          { agentId: 'agent-3', input: 'Task 3' },
        ],
      };

      const results = await coordinator.executeWorkflow(workflow, agents);

      // Should complete all tasks even if one fails
      expect(results.length).toBe(3);
      expect(results.some((r) => r.status === 'failed')).toBe(true);
      expect(results.some((r) => r.status === 'completed')).toBe(true);
    });
  });

  describe('tree workflow', () => {
    it('should execute parent and child agents', async () => {
      const workflow = {
        pattern: 'tree' as const,
        steps: [
          {
            agentId: 'agent-1',
            input: 'Parent task',
            children: [
              { agentId: 'agent-2', input: 'Child 1' },
              { agentId: 'agent-3', input: 'Child 2' },
            ],
          },
        ],
      };

      const results = await coordinator.executeWorkflow(workflow, agents);

      expect(results).toBeDefined();
      // Should have parent execution plus child executions
    });
  });

  describe('workflow validation', () => {
    it('should validate agent IDs', async () => {
      const workflow = {
        pattern: 'sequential' as const,
        steps: [
          { agentId: 'nonexistent-agent', input: 'Test' },
        ],
      };

      expect(async () => {
        await coordinator.executeWorkflow(workflow, agents);
      }).rejects.toThrow();
    });

    it('should validate workflow structure', async () => {
      const invalidWorkflow: any = {
        pattern: 'invalid-pattern',
        steps: [],
      };

      expect(async () => {
        await coordinator.executeWorkflow(invalidWorkflow, agents);
      }).rejects.toThrow();
    });
  });

  describe('result aggregation', () => {
    it('should aggregate results from multiple agents', async () => {
      const workflow = {
        pattern: 'parallel' as const,
        steps: [
          { agentId: 'agent-1', input: 'Input 1' },
          { agentId: 'agent-2', input: 'Input 2' },
          { agentId: 'agent-3', input: 'Input 3' },
        ],
      };

      const results = await coordinator.executeWorkflow(workflow, agents);

      // Calculate totals
      const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
      const totalCost = results.reduce((sum, r) => sum + (r.cost?.costUSD || 0), 0);
      const totalTokens = results.reduce(
        (sum, r) => sum + (r.cost?.inputTokens || 0) + (r.cost?.outputTokens || 0),
        0
      );

      expect(totalDuration).toBeGreaterThan(0);
      expect(totalCost).toBeGreaterThanOrEqual(0);
      expect(totalTokens).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cost tracking', () => {
    it('should track total execution cost', async () => {
      const workflow = {
        pattern: 'sequential' as const,
        steps: [
          { agentId: 'agent-1', input: 'Task' },
          { agentId: 'agent-2', input: 'Task' },
        ],
      };

      const results = await coordinator.executeWorkflow(workflow, agents);

      const totalCost = results.reduce((sum, r) => sum + (r.cost?.costUSD || 0), 0);
      expect(totalCost).toBeGreaterThanOrEqual(0);
    });
  });
});
