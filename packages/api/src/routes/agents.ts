/**
 * Agent Management Routes
 *
 * POST   /api/agents              - Create agent
 * GET    /api/agents              - List agents
 * GET    /api/agents/:agentId     - Get agent details
 * PUT    /api/agents/:agentId     - Update agent
 * DELETE /api/agents/:agentId     - Delete agent
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { AgentConfig } from '@scalix/core';
import { asyncHandler, validateParams } from '../middleware/index';
import { ApiError } from '../middleware/error-handler';

const router = Router();

/**
 * Create Agent
 * POST /api/agents
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;

    // Validate request body
    const createAgentSchema = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      model: z.object({
        provider: z.enum(['anthropic', 'openai', 'google']),
        model: z.string(),
      }),
      tools: z.array(z.string()).default([]),
      systemPrompt: z.string().optional(),
      maxIterations: z.number().int().positive().optional(),
      timeout: z.number().int().positive().optional(),
    });

    const validated = createAgentSchema.parse(req.body);

    const agent = await platform.createAgent(validated as AgentConfig);

    res.status(201).json({
      id: agent.id,
      name: agent.name,
      description: agent.config.description,
      model: agent.config.model,
      tools: agent.config.tools,
      systemPrompt: agent.config.systemPrompt,
      createdAt: new Date().toISOString(),
    });
  })
);

/**
 * List Agents
 * GET /api/agents
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const agents = platform.getAgents();

    res.json({
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.config.description,
        model: agent.config.model,
        tools: agent.config.tools,
      })),
      total: agents.length,
    });
  })
);

/**
 * Get Agent Details
 * GET /api/agents/:agentId
 */
router.get(
  '/:agentId',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const agent = platform.getAgent(req.params.agentId);

    if (!agent) {
      throw new ApiError(404, 'Agent not found', 'AGENT_NOT_FOUND', {
        agentId: req.params.agentId,
      });
    }

    res.json({
      id: agent.id,
      name: agent.name,
      description: agent.config.description,
      model: agent.config.model,
      tools: agent.config.tools,
      systemPrompt: agent.config.systemPrompt,
      maxIterations: agent.config.maxIterations,
      timeout: agent.config.timeout,
    });
  })
);

/**
 * Update Agent (configuration only, not execution state)
 * PUT /api/agents/:agentId
 */
router.put(
  '/:agentId',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const agent = platform.getAgent(req.params.agentId);

    if (!agent) {
      throw new ApiError(404, 'Agent not found', 'AGENT_NOT_FOUND', {
        agentId: req.params.agentId,
      });
    }

    // For now, we only allow updating certain fields
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      systemPrompt: z.string().optional(),
      tools: z.array(z.string()).optional(),
      maxIterations: z.number().int().positive().optional(),
      timeout: z.number().int().positive().optional(),
    });

    const updates = updateSchema.parse(req.body);

    // Apply updates to agent config
    if (updates.name) agent.config.name = updates.name;
    if (updates.description) agent.config.description = updates.description;
    if (updates.systemPrompt) agent.config.systemPrompt = updates.systemPrompt;
    if (updates.tools) agent.config.tools = updates.tools;
    if (updates.maxIterations) agent.config.maxIterations = updates.maxIterations;
    if (updates.timeout) agent.config.timeout = updates.timeout;

    res.json({
      id: agent.id,
      name: agent.name,
      description: agent.config.description,
      message: 'Agent updated successfully',
    });
  })
);

/**
 * Delete Agent
 * DELETE /api/agents/:agentId
 */
router.delete(
  '/:agentId',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const agent = platform.getAgent(req.params.agentId);

    if (!agent) {
      throw new ApiError(404, 'Agent not found', 'AGENT_NOT_FOUND', {
        agentId: req.params.agentId,
      });
    }

    await platform.deleteAgent(req.params.agentId);

    res.json({
      id: req.params.agentId,
      message: 'Agent deleted successfully',
    });
  })
);

export default router;
