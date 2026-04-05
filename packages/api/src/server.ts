/**
 * REST API Server
 *
 * Express server with routes for agent management, execution, and observability
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer as createHttpServer, Server as HttpServer } from 'http';
import { Scalix CodePlatform } from '@scalix/core';
import type { Agent, ExecutionResult } from '@scalix/core';
import { v4 as uuidv4 } from 'uuid';
import {
  errorHandler,
  requestValidator,
  asyncHandler,
} from './middleware/index';
import { attachWebSocketServer } from './websocket';
import agentRoutes from './routes/agents';
import executionRoutes from './routes/executions';
import observabilityRoutes from './routes/observability';

/**
 * Server configuration
 */
export interface ServerConfig {
  port: number;
  host?: string;
  debug?: boolean;
  platformConfig?: any;
}

/**
 * API Context - attached to request
 */
export interface ApiContext {
  platform: Scalix CodePlatform;
  requestId: string;
  startTime: number;
}

/**
 * Extend Express Request type
 */
declare global {
  namespace Express {
    interface Request {
      context?: ApiContext;
    }
  }
}

/**
 * Create and configure Express server
 */
export function createServer(
  platform: Scalix CodePlatform,
  config: ServerConfig
): Express {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request context
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.context = {
      platform,
      requestId: req.headers['x-request-id'] as string || uuidv4(),
      startTime: Date.now(),
    };
    res.setHeader('x-request-id', req.context.requestId);
    next();
  });

  // Request logging
  if (config.debug) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const platform = req.context!.platform;
      platform.getLogger().info(`${req.method} ${req.path}`, {
        requestId: req.context!.requestId,
      });
      next();
    });
  }

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Ready check
  app.get('/ready', asyncHandler(async (req: Request, res: Response) => {
    const health = await req.context!.platform.health();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  }));

  // Routes
  app.use('/api/agents', agentRoutes);
  app.use('/api/executions', executionRoutes);
  app.use('/api/observability', observabilityRoutes);

  // 404
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
      method: req.method,
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start server with HTTP and WebSocket support
 */
export async function startServer(
  platform: Scalix CodePlatform,
  config: ServerConfig
): Promise<{
  app: Express;
  httpServer: HttpServer;
  close: () => Promise<void>;
}> {
  const app = createServer(platform, config);
  const httpServer = createHttpServer(app);

  // Attach WebSocket server
  attachWebSocketServer(httpServer, platform);

  return new Promise((resolve, reject) => {
    httpServer.listen(config.port, config.host || 'localhost', () => {
      const logger = platform.getLogger();
      const url = `http://${config.host || 'localhost'}:${config.port}`;
      logger.info(`🚀 API server listening on ${url}`);
      logger.info(`🔌 WebSocket available at ws://${config.host || 'localhost'}:${config.port}`);

      resolve({
        app,
        httpServer,
        close: () =>
          new Promise((resolveClose) => {
            httpServer.close(() => {
              logger.info('API server closed');
              resolveClose();
            });
          }),
      });
    });

    httpServer.on('error', reject);
  });
}
