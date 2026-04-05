/**
 * Execution Routes
 *
 * POST   /api/executions           - Execute agent
 * GET    /api/executions/:agentId  - Get execution history
 * GET    /api/executions/:agentId/:executionId - Get execution details
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index';
import { ApiError } from '../middleware/error-handler';

const router = Router();

/**
 * Execute Agent
 * POST /api/executions
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;

    const executeSchema = z.object({
      agentId: z.string().min(1),
      input: z.string().min(1),
      context: z.record(z.any()).optional(),
    });

    const validated = executeSchema.parse(req.body);
    const agent = platform.getAgent(validated.agentId);

    if (!agent) {
      throw new ApiError(404, 'Agent not found', 'AGENT_NOT_FOUND', {
        agentId: validated.agentId,
      });
    }

    const startTime = Date.now();

    try {
      const result = await agent.execute(validated.input);

      const duration = Date.now() - startTime;

      res.json({
        executionId: result.executionId,
        agentId: validated.agentId,
        status: result.status,
        output: result.output,
        duration,
        iterations: result.iterations,
        toolCalls: result.toolCalls,
        cost: result.cost,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
      });
    } catch (error) {
      throw new ApiError(
        500,
        'Agent execution failed',
        'EXECUTION_ERROR',
        {
          agentId: validated.agentId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  })
);

/**
 * Get Execution History for Agent
 * GET /api/executions/:agentId
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

    const storage = platform.getStorage();
    const results = await storage.loadExecutionResults(
      req.params.agentId
    );

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const paginated = results.slice(offset, offset + limit);

    res.json({
      agentId: req.params.agentId,
      total: results.length,
      limit,
      offset,
      executions: paginated.map((result) => ({
        executionId: result.executionId,
        status: result.status,
        duration: result.duration,
        iterations: result.iterations,
        toolCalls: result.toolCalls.length,
        cost: result.cost,
      })),
    });
  })
);

/**
 * Get Execution Details
 * GET /api/executions/:agentId/:executionId
 */
router.get(
  '/:agentId/:executionId',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const agent = platform.getAgent(req.params.agentId);

    if (!agent) {
      throw new ApiError(404, 'Agent not found', 'AGENT_NOT_FOUND', {
        agentId: req.params.agentId,
      });
    }

    const storage = platform.getStorage();
    const results = await storage.loadExecutionResults(
      req.params.agentId
    );

    const result = results.find((r) => r.executionId === req.params.executionId);

    if (!result) {
      throw new ApiError(
        404,
        'Execution not found',
        'EXECUTION_NOT_FOUND',
        {
          agentId: req.params.agentId,
          executionId: req.params.executionId,
        }
      );
    }

    res.json({
      executionId: result.executionId,
      agentId: req.params.agentId,
      status: result.status,
      output: result.output,
      error: result.error,
      duration: result.duration,
      iterations: result.iterations,
      toolCalls: result.toolCalls,
      cost: result.cost,
      trace: result.trace,
    });
  })
);

export default router;
