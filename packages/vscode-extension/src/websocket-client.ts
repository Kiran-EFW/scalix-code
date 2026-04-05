/**
 * WebSocket Client for real-time agent execution streaming
 *
 * Connects to the Scalix API WebSocket server and handles
 * execution progress, results, and cancellation.
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { ScalixConfig, AgentResult } from './types';

/**
 * WebSocket message types (aligned with packages/api/src/websocket.ts)
 */
export type WSMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'execute'
  | 'cancel'
  | 'execution_started'
  | 'execution_progress'
  | 'execution_completed'
  | 'execution_error'
  | 'log'
  | 'trace'
  | 'metric'
  | 'error'
  | 'ping'
  | 'pong'
  | 'connected'
  | 'subscribed'
  | 'unsubscribed';

export interface WSMessage {
  type: WSMessageType;
  requestId?: string;
  data?: any;
  error?: string;
  timestamp?: string;
}

export interface ExecutionProgressData {
  executionId: string;
  agentId: string;
  step?: string;
  progress?: number;
  message?: string;
}

export interface ExecutionCompletedData {
  executionId: string;
  agentId: string;
  status: string;
  output: string;
  duration: number;
  iterations: number;
  toolCalls: number;
  cost: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  };
}

export interface ExecutionErrorData {
  executionId: string;
  agentId: string;
  error: string;
}

export type WebSocketClientEvent =
  | 'connected'
  | 'disconnected'
  | 'execution_started'
  | 'execution_progress'
  | 'execution_completed'
  | 'execution_error'
  | 'log'
  | 'error';

/**
 * WebSocket client for communicating with the Scalix API server.
 * Provides real-time execution streaming and cancellation support.
 */
export class ScalixWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: ScalixConfig;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private _isConnected = false;
  private requestCounter = 0;
  private pendingExecutions = new Map<string, {
    resolve: (result: AgentResult) => void;
    reject: (error: Error) => void;
  }>();

  constructor(config: ScalixConfig) {
    super();
    this.config = config;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws) {
      this.disconnect();
    }

    const wsUrl = this.config.apiUrl.replace(/^http/, 'ws');
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      this._isConnected = true;
      this.emit('connected');
      this.startPingInterval();
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        this.handleMessage(message);
      } catch {
        // Ignore malformed messages
      }
    });

    this.ws.on('close', () => {
      this._isConnected = false;
      this.stopPingInterval();
      this.emit('disconnected');
      this.scheduleReconnect();
    });

    this.ws.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPingInterval();

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    this._isConnected = false;

    // Reject all pending executions
    for (const [requestId, pending] of this.pendingExecutions) {
      pending.reject(new Error('WebSocket disconnected'));
    }
    this.pendingExecutions.clear();
  }

  /**
   * Execute an agent via WebSocket with streaming progress updates.
   * Returns a promise that resolves with the final result.
   */
  executeAgent(
    agentId: string,
    input: string,
    context?: Record<string, unknown>
  ): { requestId: string; promise: Promise<AgentResult>; cancel: () => void } {
    const requestId = this.nextRequestId();

    const promise = new Promise<AgentResult>((resolve, reject) => {
      if (!this._isConnected || !this.ws) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.pendingExecutions.set(requestId, { resolve, reject });

      this.send({
        type: 'execute',
        requestId,
        data: { agentId, input, context },
      });
    });

    const cancel = () => {
      this.cancelExecution(requestId);
    };

    return { requestId, promise, cancel };
  }

  /**
   * Cancel a running execution
   */
  cancelExecution(requestId: string): void {
    this.send({
      type: 'cancel' as WSMessageType,
      requestId,
    });

    const pending = this.pendingExecutions.get(requestId);
    if (pending) {
      pending.reject(new Error('Execution cancelled'));
      this.pendingExecutions.delete(requestId);
    }
  }

  /**
   * Subscribe to a channel for receiving updates
   */
  subscribe(channel: string): void {
    this.send({
      type: 'subscribe',
      data: { channel },
    });
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.send({
      type: 'unsubscribe',
      data: { channel },
    });
  }

  /**
   * Update configuration and reconnect if needed
   */
  updateConfig(config: ScalixConfig): void {
    const urlChanged = this.config.apiUrl !== config.apiUrl;
    this.config = config;

    if (urlChanged && this._isConnected) {
      this.disconnect();
      this.connect();
    }
  }

  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'connected':
        // Server acknowledged connection
        break;

      case 'execution_started':
        this.emit('execution_started', {
          requestId: message.requestId,
          executionId: message.data?.executionId,
          agentId: message.data?.agentId,
        });
        break;

      case 'execution_progress':
        this.emit('execution_progress', {
          requestId: message.requestId,
          ...message.data,
        } as ExecutionProgressData);
        break;

      case 'execution_completed': {
        const completedData = message.data as ExecutionCompletedData;
        this.emit('execution_completed', {
          requestId: message.requestId,
          ...completedData,
        });

        const pending = this.pendingExecutions.get(message.requestId || '');
        if (pending) {
          pending.resolve({
            executionId: completedData.executionId,
            agentId: completedData.agentId,
            status: completedData.status as AgentResult['status'],
            output: completedData.output,
            duration: completedData.duration,
            iterations: completedData.iterations,
            toolCalls: [],
            cost: completedData.cost || { inputTokens: 0, outputTokens: 0, totalCost: 0 },
          });
          this.pendingExecutions.delete(message.requestId || '');
        }
        break;
      }

      case 'execution_error': {
        const errorData = message.data as ExecutionErrorData;
        this.emit('execution_error', {
          requestId: message.requestId,
          ...errorData,
        });

        const pendingErr = this.pendingExecutions.get(message.requestId || '');
        if (pendingErr) {
          pendingErr.reject(new Error(errorData.error || 'Execution failed'));
          this.pendingExecutions.delete(message.requestId || '');
        }
        break;
      }

      case 'log':
        this.emit('log', message.data);
        break;

      case 'pong':
        // Keep-alive response received
        break;

      case 'error':
        this.emit('error', new Error(message.error || 'Unknown WebSocket error'));
        break;

      default:
        break;
    }
  }

  private send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  private nextRequestId(): string {
    return `req_${++this.requestCounter}_${Date.now()}`;
  }

  private startPingInterval(): void {
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  dispose(): void {
    this.disconnect();
    this.removeAllListeners();
  }
}
