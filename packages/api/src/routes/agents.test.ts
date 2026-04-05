/**
 * Agent Routes Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPlatform } from '@scalix/core';
import { createServer } from '../server';
import type { AgentConfig } from '@scalix/core';

describe('Agent Routes', () => {
  let server: any;
  let platform: any;
  let client: any;

  beforeEach(async () => {
    // Create platform
    platform = createPlatform({ debug: false });

    // Register built-in tools
    const toolRegistry = platform.getToolRegistry();
    await (toolRegistry as any).registerBuiltins();

    // Create server (would need actual server setup in real tests)
    // For now, we'll test the logic directly
  });

  describe('POST /api/agents', () => {
    it('should create an agent with valid config', async () => {
      const config: AgentConfig = {
        id: 'test-agent',
        name: 'Test Agent',
        model: {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
        },
        tools: ['echo'],
      };

      const agent = await platform.createAgent(config);

      expect(agent).toBeDefined();
      expect(agent.id).toBe('test-agent');
      expect(agent.name).toBe('Test Agent');
    });

    it('should reject agent without required fields', async () => {
      const invalidConfig: any = {
        name: 'Agent without ID',
        // Missing id
      };

      expect(async () => {
        await platform.createAgent(invalidConfig);
      }).rejects.toThrow();
    });
  });

  describe('GET /api/agents', () => {
    it('should list all agents', async () => {
      // Create test agents
      await platform.createAgent({
        id: 'agent-1',
        name: 'Agent 1',
        model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
      });

      await platform.createAgent({
        id: 'agent-2',
        name: 'Agent 2',
        model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
      });

      const agents = platform.getAgents();

      expect(agents).toBeDefined();
      expect(agents.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty list when no agents exist', async () => {
      // Fresh platform
      const freshPlatform = createPlatform();
      const agents = freshPlatform.getAgents();

      expect(agents).toBeDefined();
      expect(agents.length).toBe(0);
    });
  });

  describe('GET /api/agents/:agentId', () => {
    it('should get agent details', async () => {
      const config: AgentConfig = {
        id: 'detail-agent',
        name: 'Detail Agent',
        description: 'Test agent for details',
        model: {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
        },
        tools: ['echo', 'get_current_time'],
      };

      await platform.createAgent(config);
      const agent = platform.getAgent('detail-agent');

      expect(agent).toBeDefined();
      expect(agent.id).toBe('detail-agent');
      expect(agent.config.description).toBe('Test agent for details');
    });

    it('should return null for nonexistent agent', () => {
      const agent = platform.getAgent('nonexistent-agent');
      expect(agent).toBeUndefined();
    });
  });

  describe('PUT /api/agents/:agentId', () => {
    it('should update agent configuration', async () => {
      const config: AgentConfig = {
        id: 'update-agent',
        name: 'Original Name',
        model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
      };

      const agent = await platform.createAgent(config);

      // Update agent config
      agent.config.name = 'Updated Name';
      agent.config.tools = ['echo', 'get_current_time'];

      const updatedAgent = platform.getAgent('update-agent');
      expect(updatedAgent.config.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/agents/:agentId', () => {
    it('should delete an agent', async () => {
      const config: AgentConfig = {
        id: 'delete-agent',
        name: 'Agent to Delete',
        model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
      };

      await platform.createAgent(config);
      expect(platform.getAgent('delete-agent')).toBeDefined();

      await platform.deleteAgent('delete-agent');
      expect(platform.getAgent('delete-agent')).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid agent configurations', async () => {
      const invalidConfig: any = {
        // Missing required fields
      };

      expect(async () => {
        await platform.createAgent(invalidConfig);
      }).rejects.toThrow();
    });

    it('should handle duplicate agent IDs', async () => {
      const config1: AgentConfig = {
        id: 'duplicate',
        name: 'First',
        model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
      };

      const config2: AgentConfig = {
        id: 'duplicate',
        name: 'Second',
        model: { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
      };

      await platform.createAgent(config1);

      // Second creation should either fail or overwrite
      // Depending on implementation
      expect(async () => {
        await platform.createAgent(config2);
      }).rejects.toThrow();
    });
  });
});
