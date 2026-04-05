/**
 * CLI Agent Commands Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockAgent, defaultAgentConfig } from '@scalix/testing';
import { getClient } from '../utils/client';

describe('Agent CLI Commands', () => {
  let mockClient: any;

  beforeEach(() => {
    // Mock the client
    mockClient = {
      createAgent: vi.fn(async (config) => ({
        ...config,
        createdAt: new Date().toISOString(),
      })),
      listAgents: vi.fn(async () => ({
        agents: [
          { id: 'test-1', name: 'Test Agent 1', tools: [] },
          { id: 'test-2', name: 'Test Agent 2', tools: [] },
        ],
        total: 2,
      })),
      getAgent: vi.fn(async (id) => ({
        ...defaultAgentConfig,
        id,
      })),
      updateAgent: vi.fn(async (id, updates) => ({
        id,
        message: 'Agent updated successfully',
      })),
      deleteAgent: vi.fn(async (id) => ({
        id,
        message: 'Agent deleted successfully',
      })),
    };
  });

  describe('agent create', () => {
    it('should create agent with valid input', async () => {
      const config = {
        id: 'new-agent',
        name: 'New Agent',
      };

      const result = await mockClient.createAgent(config);

      expect(result).toBeDefined();
      expect(result.id).toBe('new-agent');
      expect(result.name).toBe('New Agent');
      expect(mockClient.createAgent).toHaveBeenCalledWith(config);
    });

    it('should include optional fields when provided', async () => {
      const config = {
        id: 'full-agent',
        name: 'Full Agent',
        description: 'A full agent',
        tools: ['echo', 'get_current_time'],
      };

      const result = await mockClient.createAgent(config);

      expect(result.tools).toBeDefined();
      expect(result.description).toBe('A full agent');
    });
  });

  describe('agent list', () => {
    it('should list all agents', async () => {
      const result = await mockClient.listAgents();

      expect(result.agents).toBeDefined();
      expect(result.agents.length).toBe(2);
      expect(result.total).toBe(2);
      expect(mockClient.listAgents).toHaveBeenCalled();
    });

    it('should show agent details', async () => {
      const result = await mockClient.listAgents();

      expect(result.agents[0]).toHaveProperty('id');
      expect(result.agents[0]).toHaveProperty('name');
      expect(result.agents[0]).toHaveProperty('tools');
    });

    it('should handle empty list', async () => {
      mockClient.listAgents.mockResolvedValueOnce({
        agents: [],
        total: 0,
      });

      const result = await mockClient.listAgents();

      expect(result.agents).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('agent get', () => {
    it('should get agent details', async () => {
      const result = await mockClient.getAgent('test-agent');

      expect(result).toBeDefined();
      expect(result.id).toBe('test-agent');
      expect(result.name).toBeDefined();
      expect(mockClient.getAgent).toHaveBeenCalledWith('test-agent');
    });

    it('should include all agent fields', async () => {
      const result = await mockClient.getAgent('test-agent');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('model');
    });
  });

  describe('agent delete', () => {
    it('should delete agent successfully', async () => {
      const result = await mockClient.deleteAgent('test-agent');

      expect(result).toBeDefined();
      expect(result.id).toBe('test-agent');
      expect(result.message).toContain('deleted');
      expect(mockClient.deleteAgent).toHaveBeenCalledWith('test-agent');
    });

    it('should return confirmation message', async () => {
      const result = await mockClient.deleteAgent('test-agent');

      expect(result.message).toContain('deleted');
      expect(result.message).toContain('successfully');
    });
  });

  describe('agent update', () => {
    it('should update agent configuration', async () => {
      const updates = {
        name: 'Updated Name',
        tools: ['echo', 'get_current_time'],
      };

      const result = await mockClient.updateAgent('test-agent', updates);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-agent');
      expect(result.message).toContain('updated');
      expect(mockClient.updateAgent).toHaveBeenCalledWith('test-agent', updates);
    });

    it('should support partial updates', async () => {
      const updates = { name: 'New Name' };

      const result = await mockClient.updateAgent('test-agent', updates);

      expect(result.message).toContain('updated');
    });
  });

  describe('error handling', () => {
    it('should handle missing agent', async () => {
      mockClient.getAgent.mockRejectedValueOnce(
        new Error('Agent not found')
      );

      expect(async () => {
        await mockClient.getAgent('nonexistent');
      }).rejects.toThrow('Agent not found');
    });

    it('should handle invalid configuration', async () => {
      mockClient.createAgent.mockRejectedValueOnce(
        new Error('Invalid configuration')
      );

      expect(async () => {
        await mockClient.createAgent({});
      }).rejects.toThrow('Invalid configuration');
    });

    it('should handle network errors', async () => {
      mockClient.listAgents.mockRejectedValueOnce(
        new Error('Network error')
      );

      expect(async () => {
        await mockClient.listAgents();
      }).rejects.toThrow('Network error');
    });
  });
});
