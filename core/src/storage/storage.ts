/**
 * Storage Implementation
 *
 * In-memory storage for agent state (production would use PostgreSQL)
 */

import type { AgentMemory, ExecutionCheckpoint, Storage } from './types';
import type { ExecutionResult } from '../agent/types';

/**
 * In-memory storage implementation
 */
export class InMemoryStorage implements Storage {
  private agentMemories = new Map<string, AgentMemory>();
  private executionResults = new Map<string, ExecutionResult[]>();
  private checkpoints = new Map<string, ExecutionCheckpoint>();

  /**
   * Save agent memory
   */
  async saveMemory(memory: AgentMemory): Promise<void> {
    this.agentMemories.set(memory.agentId, memory);
  }

  /**
   * Load agent memory
   */
  async loadMemory(agentId: string): Promise<AgentMemory | undefined> {
    return this.agentMemories.get(agentId);
  }

  /**
   * Delete agent memory
   */
  async deleteMemory(agentId: string): Promise<void> {
    this.agentMemories.delete(agentId);
  }

  /**
   * Save execution result
   */
  async saveExecutionResult(result: ExecutionResult): Promise<void> {
    const results = this.executionResults.get(result.agentId) || [];
    results.push(result);
    this.executionResults.set(result.agentId, results);
  }

  /**
   * Load execution results
   */
  async loadExecutionResults(
    agentId: string,
    limit?: number
  ): Promise<ExecutionResult[]> {
    const results = this.executionResults.get(agentId) || [];
    if (limit) {
      return results.slice(-limit);
    }
    return results;
  }

  /**
   * Save checkpoint
   */
  async saveCheckpoint(checkpoint: ExecutionCheckpoint): Promise<void> {
    this.checkpoints.set(checkpoint.id, checkpoint);
  }

  /**
   * Load checkpoint
   */
  async loadCheckpoint(agentId: string): Promise<ExecutionCheckpoint | undefined> {
    // Find latest checkpoint for agent
    let latest: ExecutionCheckpoint | undefined;

    for (const checkpoint of this.checkpoints.values()) {
      if (checkpoint.agentId === agentId) {
        if (!latest || checkpoint.timestamp > latest.timestamp) {
          latest = checkpoint;
        }
      }
    }

    return latest;
  }

  /**
   * Delete checkpoint
   */
  async deleteCheckpoint(id: string): Promise<void> {
    this.checkpoints.delete(id);
  }

  /**
   * Health check
   */
  async health(): Promise<boolean> {
    return true;
  }

  /**
   * Get storage statistics
   */
  getStats(): { agents: number; results: number; checkpoints: number } {
    return {
      agents: this.agentMemories.size,
      results: Array.from(this.executionResults.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
      checkpoints: this.checkpoints.size,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.agentMemories.clear();
    this.executionResults.clear();
    this.checkpoints.clear();
  }
}

/**
 * No-op storage for testing
 */
export class NoOpStorage implements Storage {
  async saveMemory(memory: AgentMemory): Promise<void> {
    // No-op
  }

  async loadMemory(agentId: string): Promise<AgentMemory | undefined> {
    return undefined;
  }

  async deleteMemory(agentId: string): Promise<void> {
    // No-op
  }

  async saveExecutionResult(result: ExecutionResult): Promise<void> {
    // No-op
  }

  async loadExecutionResults(
    agentId: string,
    limit?: number
  ): Promise<ExecutionResult[]> {
    return [];
  }

  async saveCheckpoint(checkpoint: ExecutionCheckpoint): Promise<void> {
    // No-op
  }

  async loadCheckpoint(agentId: string): Promise<ExecutionCheckpoint | undefined> {
    return undefined;
  }

  async deleteCheckpoint(id: string): Promise<void> {
    // No-op
  }

  async health(): Promise<boolean> {
    return true;
  }
}
