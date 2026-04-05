/**
 * WebSocket Server
 *
 * Real-time streaming for agent execution, logs, metrics, and traces
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { Scalix CodePlatform } from '@scalix/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * WebSocket message types
 */
export type WSMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'execute'
  | 'execution_started'
  | 'execution_progress'
  | 'execution_completed'
  | 'execution_error'
  | 'log'
  | 'trace'
  | 'metric'
  | 'error'
  | 'ping'
  | 'pong';

export interface WSMessage {
  type: WSMessageType;
  requestId?: string;
  data?: any;
  error?: string;
  timestamp?: string;
}

/**
 * WebSocket connection context
 */
interface WSConnection {
  id: string;
  ws: WebSocket;
  platform: Scalix CodePlatform;
  subscriptions: Set<string>; // trace IDs, agent IDs, etc.
}

/**
 * Create and attach WebSocket server to HTTP server
 */
export function attachWebSocketServer(
  httpServer: HttpServer,
  platform: Scalix CodePlatform
): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer });
  const connections = new Map<string, WSConnection>();

  wss.on('connection', (ws: WebSocket) => {
    const connectionId = uuidv4();
    const connection: WSConnection = {
      id: connectionId,
      ws,
      platform,
      subscriptions: new Set(),
    };

    connections.set(connectionId, connection);

    platform.getLogger().info('WebSocket connection established', {
      connectionId,
      totalConnections: connections.size,
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        handleMessage(connection, message, connections);
      } catch (error) {
        sendError(ws, 'Invalid message format', error as Error);
      }
    });

    // Handle ping/pong for keep-alive
    ws.on('ping', () => {
      ws.pong();
    });

    // Handle connection close
    ws.on('close', () => {
      connections.delete(connectionId);
      platform.getLogger().info('WebSocket connection closed', {
        connectionId,
        totalConnections: connections.size,
      });
    });

    // Handle errors
    ws.on('error', (error) => {
      platform.getLogger().error('WebSocket error', {
        connectionId,
        error: error.message,
      });
    });

    // Send welcome message
    send(ws, {
      type: 'connected',
      data: { connectionId, timestamp: new Date().toISOString() },
    } as WSMessage);
  });

  return wss;
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(
  connection: WSConnection,
  message: WSMessage,
  allConnections: Map<string, WSConnection>
) {
  const { platform, ws, subscriptions } = connection;

  switch (message.type) {
    case 'ping':
      send(ws, { type: 'pong', requestId: message.requestId });
      break;

    case 'subscribe':
      // Subscribe to traces, agents, etc.
      if (message.data?.channel) {
        subscriptions.add(message.data.channel);
        send(ws, {
          type: 'subscribed',
          requestId: message.requestId,
          data: { channel: message.data.channel },
        });
      }
      break;

    case 'unsubscribe':
      if (message.data?.channel) {
        subscriptions.delete(message.data.channel);
        send(ws, {
          type: 'unsubscribed',
          requestId: message.requestId,
          data: { channel: message.data.channel },
        });
      }
      break;

    case 'execute':
      // Execute agent with streaming
      handleExecuteStream(connection, message, allConnections);
      break;

    default:
      sendError(ws, `Unknown message type: ${message.type}`);
  }
}

/**
 * Handle agent execution with streaming
 */
async function handleExecuteStream(
  connection: WSConnection,
  message: WSMessage,
  allConnections: Map<string, WSConnection>
) {
  const { platform, ws } = connection;
  const { agentId, input } = message.data || {};

  if (!agentId || !input) {
    sendError(ws, 'Missing agentId or input', new Error('Invalid request'));
    return;
  }

  const agent = platform.getAgent(agentId);
  if (!agent) {
    sendError(ws, 'Agent not found', new Error(`Agent ${agentId} not found`));
    return;
  }

  const executionId = uuidv4();
  const logger = platform.getLogger();

  try {
    // Send execution started
    send(ws, {
      type: 'execution_started',
      requestId: message.requestId,
      data: { executionId, agentId },
    });

    // Execute agent
    const startTime = Date.now();
    const result = await agent.execute(input);
    const duration = Date.now() - startTime;

    // Send execution completed
    send(ws, {
      type: 'execution_completed',
      requestId: message.requestId,
      data: {
        executionId,
        agentId,
        status: result.status,
        output: result.output,
        duration,
        iterations: result.iterations,
        toolCalls: result.toolCalls.length,
        cost: result.cost,
      },
    });

    logger.info('Agent execution completed via WebSocket', {
      executionId,
      agentId,
      duration,
    });
  } catch (error) {
    send(ws, {
      type: 'execution_error',
      requestId: message.requestId,
      data: {
        executionId,
        agentId,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    logger.error('Agent execution failed via WebSocket', {
      executionId,
      agentId,
      error: error instanceof Error ? error.stack : String(error),
    });
  }
}

/**
 * Broadcast message to all subscribed connections
 */
export function broadcastToSubscribers(
  allConnections: Map<string, WSConnection>,
  channel: string,
  message: WSMessage
) {
  allConnections.forEach((connection) => {
    if (connection.subscriptions.has(channel)) {
      send(connection.ws, message);
    }
  });
}

/**
 * Send message to WebSocket
 */
function send(ws: WebSocket, message: WSMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    }));
  }
}

/**
 * Send error message
 */
function sendError(ws: WebSocket, message: string, error?: Error) {
  send(ws, {
    type: 'error',
    error: message,
    data: error && process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
  });
}
