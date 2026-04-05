import * as vscode from 'vscode';
import WebSocket from 'ws';
import { AgentResult } from './types';

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
  data?: unknown;
  error?: string;
  timestamp?: string;
}

export interface ExecutionProgress {
  executionId: string;
  agentId: string;
  status: 'started' | 'progress' | 'completed' | 'error';
  progress?: number;
  message?: string;
  output?: string;
  duration?: number;
  iterations?: number;
  cost?: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  };
}

type ProgressCallback = (progress: ExecutionProgress) => void;
type ErrorCallback = (error: string) => void;

interface PendingExecution {
  requestId: string;
  onProgress: ProgressCallback;
  onError: ErrorCallback;
  timeout: NodeJS.Timeout;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private apiUrl: string;
  private timeout: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pendingExecutions = new Map<string, PendingExecution>();
  private isConnecting = false;
  private onConnected: (() => void)[] = [];
  private onDisconnected: (() => void)[] = [];

  constructor(apiUrl: string, timeout = 30000) {
    this.apiUrl = apiUrl;
    this.timeout = timeout;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for connection to complete
        this.onConnected.push(resolve);
        return;
      }

      this.isConnecting = true;

      try {
        // Convert http(s) URL to ws(s)
        const wsUrl = this.apiUrl
          .replace(/^https?/, 'ws')
          .replace(/\/$/, '');

        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          this.reconnectAttempts = 0;
          this.isConnecting = false;

          // Fire all pending callbacks
          const callbacks = [...this.onConnected];
          this.onConnected = [];
          callbacks.forEach((cb) => cb());

          resolve();
        });

        this.ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString()) as WSMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        this.ws.on('close', () => {
          this.ws = null;
          this.isConnecting = false;

          // Fire disconnect callbacks
          const callbacks = [...this.onDisconnected];
          this.onDisconnected = [];
          callbacks.forEach((cb) => cb());

          // Attempt reconnect
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          this.isConnecting = false;
          console.error('WebSocket error:', error);
          reject(error);
        });
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Cancel all pending executions
    this.pendingExecutions.forEach((execution) => {
      clearTimeout(execution.timeout);
    });
    this.pendingExecutions.clear();
  }

  /**
   * Execute agent with real-time progress streaming
   */
  async executeWithProgress(
    agentId: string,
    input: string,
    onProgress: ProgressCallback,
    onError: ErrorCallback
  ): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      onError('Not connected to WebSocket server');
      return;
    }

    const requestId = this.generateRequestId();

    // Store execution handlers
    const timeout = setTimeout(() => {
      this.pendingExecutions.delete(requestId);
      onError('Execution timeout');
    }, this.timeout);

    this.pendingExecutions.set(requestId, {
      requestId,
      onProgress,
      onError,
      timeout,
    });

    // Send execution request
    const message: WSMessage = {
      type: 'execute',
      requestId,
      data: {
        agentId,
        input,
      },
    };

    this.ws.send(JSON.stringify(message));

    // Initial progress
    onProgress({
      executionId: requestId,
      agentId,
      status: 'started',
      message: 'Starting execution...',
    });
  }

  /**
   * Subscribe to channel for updates
   */
  subscribe(channel: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const requestId = this.generateRequestId();
    const message: WSMessage = {
      type: 'subscribe',
      requestId,
      data: { channel },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channel: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const requestId = this.generateRequestId();
    const message: WSMessage = {
      type: 'unsubscribe',
      requestId,
      data: { channel },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Cancel execution
   */
  cancel(executionId: string): void {
    const execution = this.pendingExecutions.get(executionId);
    if (execution) {
      clearTimeout(execution.timeout);
      this.pendingExecutions.delete(executionId);
      execution.onError('Execution cancelled');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Register connection callback
   */
  onConnect(callback: () => void): void {
    this.onConnected.push(callback);
  }

  /**
   * Register disconnection callback
   */
  onDisconnect(callback: () => void): void {
    this.onDisconnected.push(callback);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WSMessage): void {
    const { requestId, type, data } = message;

    if (!requestId) {
      return;
    }

    const execution = this.pendingExecutions.get(requestId);
    if (!execution) {
      return;
    }

    switch (type) {
      case 'execution_started':
        execution.onProgress({
          executionId: data?.executionId || requestId,
          agentId: data?.agentId || '',
          status: 'started',
          message: 'Execution started',
        });
        break;

      case 'execution_progress':
        execution.onProgress({
          executionId: data?.executionId || requestId,
          agentId: data?.agentId || '',
          status: 'progress',
          progress: data?.progress,
          message: data?.message,
        });
        break;

      case 'execution_completed':
        clearTimeout(execution.timeout);
        this.pendingExecutions.delete(requestId);
        execution.onProgress({
          executionId: data?.executionId || requestId,
          agentId: data?.agentId || '',
          status: 'completed',
          output: data?.output,
          duration: data?.duration,
          iterations: data?.iterations,
          cost: data?.cost,
        });
        break;

      case 'execution_error':
        clearTimeout(execution.timeout);
        this.pendingExecutions.delete(requestId);
        execution.onError(data?.error || 'Unknown error');
        break;

      case 'error':
        clearTimeout(execution.timeout);
        this.pendingExecutions.delete(requestId);
        execution.onError(message.error || 'Unknown error');
        break;
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
      this.connect().catch((error) => {
        console.error('Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Create and cache WebSocket client
 */
let cachedClient: WebSocketClient | null = null;

export function getWebSocketClient(apiUrl: string, timeout = 30000): WebSocketClient {
  if (!cachedClient) {
    cachedClient = new WebSocketClient(apiUrl, timeout);
  }
  return cachedClient;
}

export function closeWebSocketClient(): void {
  if (cachedClient) {
    cachedClient.disconnect();
    cachedClient = null;
  }
}
