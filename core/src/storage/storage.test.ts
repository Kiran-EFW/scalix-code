/**
 * Storage Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorage, NoOpStorage } from './storage';
import type { AgentMemory, ExecutionCheckpoint } from './types';
import type { ExecutionResult } from '../agent/types';
import { AgentState } from '../agent/types';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  const createMockMemory = (agentId: string): AgentMemory => ({
    agentId,
    history: [],
    context: { key: 'value' },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMockResult = (agentId: string): ExecutionResult => ({
    agentId,
    status: 'success',
    output: 'test output',
    toolCalls: [],
    toolResults: [],
    cost: {
      provider: 'anthropic',
      model: 'claude-3-sonnet',
      inputTokens: 100,
      outputTokens: 50,
      costUSD: 0.01,
      timestamp: new Date(),
    },
    duration: 500,
    iterations: 2,
    trace: [],
    finalState: AgentState.COMPLETED,
  });

  const createMockCheckpoint = (agentId: string, id: string): ExecutionCheckpoint => ({
    id,
    agentId,
    state: { progress: 50 },
    timestamp: new Date(),
  });

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  describe('memory operations', () => {
    it('should save and load memory', async () => {
      const memory = createMockMemory('agent-1');
      await storage.saveMemory(memory);
      const loaded = await storage.loadMemory('agent-1');

      expect(loaded).toBeDefined();
      expect(loaded!.agentId).toBe('agent-1');
      expect(loaded!.context).toEqual({ key: 'value' });
    });

    it('should return undefined for missing memory', async () => {
      const result = await storage.loadMemory('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should delete memory', async () => {
      await storage.saveMemory(createMockMemory('agent-1'));
      await storage.deleteMemory('agent-1');
      const result = await storage.loadMemory('agent-1');
      expect(result).toBeUndefined();
    });

    it('should overwrite existing memory', async () => {
      await storage.saveMemory(createMockMemory('agent-1'));
      const updated = createMockMemory('agent-1');
      updated.context = { updated: true };
      await storage.saveMemory(updated);

      const loaded = await storage.loadMemory('agent-1');
      expect(loaded!.context).toEqual({ updated: true });
    });
  });

  describe('execution results', () => {
    it('should save and load execution results', async () => {
      const result = createMockResult('agent-1');
      await storage.saveExecutionResult(result);

      const loaded = await storage.loadExecutionResults('agent-1');
      expect(loaded).toHaveLength(1);
      expect(loaded[0].output).toBe('test output');
    });

    it('should accumulate results for same agent', async () => {
      await storage.saveExecutionResult(createMockResult('agent-1'));
      await storage.saveExecutionResult(createMockResult('agent-1'));

      const loaded = await storage.loadExecutionResults('agent-1');
      expect(loaded).toHaveLength(2);
    });

    it('should return empty array for unknown agent', async () => {
      const loaded = await storage.loadExecutionResults('unknown');
      expect(loaded).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await storage.saveExecutionResult(createMockResult('agent-1'));
      }

      const loaded = await storage.loadExecutionResults('agent-1', 2);
      expect(loaded).toHaveLength(2);
    });

    it('should return latest results when limited', async () => {
      for (let i = 0; i < 5; i++) {
        const result = createMockResult('agent-1');
        result.output = `result-${i}`;
        await storage.saveExecutionResult(result);
      }

      const loaded = await storage.loadExecutionResults('agent-1', 2);
      expect(loaded[0].output).toBe('result-3');
      expect(loaded[1].output).toBe('result-4');
    });
  });

  describe('checkpoint operations', () => {
    it('should save and load checkpoints', async () => {
      const checkpoint = createMockCheckpoint('agent-1', 'cp-1');
      await storage.saveCheckpoint(checkpoint);

      const loaded = await storage.loadCheckpoint('agent-1');
      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe('cp-1');
    });

    it('should return latest checkpoint for agent', async () => {
      const cp1 = createMockCheckpoint('agent-1', 'cp-1');
      cp1.timestamp = new Date('2024-01-01');
      const cp2 = createMockCheckpoint('agent-1', 'cp-2');
      cp2.timestamp = new Date('2024-01-02');

      await storage.saveCheckpoint(cp1);
      await storage.saveCheckpoint(cp2);

      const loaded = await storage.loadCheckpoint('agent-1');
      expect(loaded!.id).toBe('cp-2');
    });

    it('should return undefined for unknown agent checkpoint', async () => {
      const loaded = await storage.loadCheckpoint('unknown');
      expect(loaded).toBeUndefined();
    });

    it('should delete checkpoints', async () => {
      await storage.saveCheckpoint(createMockCheckpoint('agent-1', 'cp-1'));
      await storage.deleteCheckpoint('cp-1');

      const loaded = await storage.loadCheckpoint('agent-1');
      expect(loaded).toBeUndefined();
    });
  });

  describe('health', () => {
    it('should return true for healthy storage', async () => {
      expect(await storage.health()).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await storage.saveMemory(createMockMemory('agent-1'));
      await storage.saveMemory(createMockMemory('agent-2'));
      await storage.saveExecutionResult(createMockResult('agent-1'));
      await storage.saveCheckpoint(createMockCheckpoint('agent-1', 'cp-1'));

      const stats = storage.getStats();
      expect(stats.agents).toBe(2);
      expect(stats.results).toBe(1);
      expect(stats.checkpoints).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      await storage.saveMemory(createMockMemory('agent-1'));
      await storage.saveExecutionResult(createMockResult('agent-1'));
      await storage.saveCheckpoint(createMockCheckpoint('agent-1', 'cp-1'));

      storage.clear();

      const stats = storage.getStats();
      expect(stats.agents).toBe(0);
      expect(stats.results).toBe(0);
      expect(stats.checkpoints).toBe(0);
    });
  });
});

describe('NoOpStorage', () => {
  let storage: NoOpStorage;

  beforeEach(() => {
    storage = new NoOpStorage();
  });

  it('should not throw on saveMemory', async () => {
    await expect(storage.saveMemory({} as any)).resolves.toBeUndefined();
  });

  it('should return undefined on loadMemory', async () => {
    expect(await storage.loadMemory('any')).toBeUndefined();
  });

  it('should not throw on deleteMemory', async () => {
    await expect(storage.deleteMemory('any')).resolves.toBeUndefined();
  });

  it('should return empty results', async () => {
    expect(await storage.loadExecutionResults('any')).toEqual([]);
  });

  it('should return true for health', async () => {
    expect(await storage.health()).toBe(true);
  });

  it('should return undefined for checkpoint', async () => {
    expect(await storage.loadCheckpoint('any')).toBeUndefined();
  });
});
