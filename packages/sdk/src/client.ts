/**
 * HTTP Client for Scalix CLAW API
 *
 * Provides a typed client for interacting with the REST API
 */

import type { AgentConfig, ExecutionResult, Agent } from '@scalix/core';

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface CreateAgentRequest {
  id: string;
  name: string;
  description?: string;
  model: {
    provider: 'anthropic' | 'openai' | 'google';
    model: string;
  };
  tools?: string[];
  systemPrompt?: string;
  maxIterations?: number;
  timeout?: number;
}

export interface ExecuteRequest {
  agentId: string;
  input: string;
  context?: Record<string, any>;
}

export class CLAWClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${error.error || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Agent Management

  async createAgent(request: CreateAgentRequest) {
    return this.request('/api/agents', 'POST', request);
  }

  async listAgents() {
    return this.request('/api/agents', 'GET');
  }

  async getAgent(agentId: string) {
    return this.request(`/api/agents/${agentId}`, 'GET');
  }

  async updateAgent(
    agentId: string,
    updates: Partial<CreateAgentRequest>
  ) {
    return this.request(`/api/agents/${agentId}`, 'PUT', updates);
  }

  async deleteAgent(agentId: string) {
    return this.request(`/api/agents/${agentId}`, 'DELETE');
  }

  // Execution

  async execute(request: ExecuteRequest) {
    return this.request('/api/executions', 'POST', request);
  }

  async getExecutionHistory(agentId: string, limit = 10, offset = 0) {
    return this.request(
      `/api/executions/${agentId}?limit=${limit}&offset=${offset}`,
      'GET'
    );
  }

  async getExecution(agentId: string, executionId: string) {
    return this.request(`/api/executions/${agentId}/${executionId}`, 'GET');
  }

  // Observability

  async getTraces(limit = 50, offset = 0) {
    return this.request(
      `/api/observability/traces?limit=${limit}&offset=${offset}`,
      'GET'
    );
  }

  async getTrace(traceId: string) {
    return this.request(`/api/observability/traces/${traceId}`, 'GET');
  }

  async getLogs(level?: string, limit = 50, offset = 0) {
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (level) query.append('level', level);
    return this.request(`/api/observability/logs?${query}`, 'GET');
  }

  async getMetrics(metricName?: string) {
    const query = metricName ? `?metric=${metricName}` : '';
    return this.request(`/api/observability/metrics${query}`, 'GET');
  }

  async getMetricsPrometheus() {
    const response = await fetch(`${this.baseUrl}/api/observability/metrics/prometheus`);
    return await response.text();
  }

  async getStats() {
    return this.request('/api/observability/stats', 'GET');
  }

  // Health

  async health() {
    return this.request('/health', 'GET');
  }

  async ready() {
    return this.request('/ready', 'GET');
  }
}

/**
 * Create a client instance
 */
export function createClient(config: ClientConfig): CLAWClient {
  return new CLAWClient(config);
}
