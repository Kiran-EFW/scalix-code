/**
 * Platform Factory
 *
 * Create a complete CLAW platform instance with all dependencies
 */

import type { Agent, AgentConfig } from './agent/types';
import type { ToolRegistry as ToolRegistryInterface } from './tools/types';
import { ToolRegistry } from './tools/registry';
import { DefaultTracer } from './observability/tracer';
import { DefaultLogger } from './observability/logger';
import { DefaultMetricsCollector } from './observability/metrics';
import { InMemoryStorage } from './storage/storage';
import { PluginLoader } from './plugins/loader';
import { createAgent, validateAgentConfig } from './agent/agent';
import { MockLLMProvider } from './agent/llm-provider';
import { WorkflowCoordinator } from './orchestration/coordinator';

/**
 * Platform configuration
 */
export interface PlatformConfig {
  debug?: boolean;
  maxAgents?: number;
  maxTools?: number;
}

/**
 * CLAW Platform
 */
export class CLAWPlatform {
  private toolRegistry: ToolRegistryInterface;
  private tracer = new DefaultTracer();
  private logger: DefaultLogger;
  private metricsCollector = new DefaultMetricsCollector();
  private storage = new InMemoryStorage();
  private pluginLoader = new PluginLoader();
  private coordinator = new WorkflowCoordinator();
  private agents = new Map<string, Agent>();
  private llmProvider = new MockLLMProvider();

  constructor(private config: PlatformConfig = {}) {
    this.logger = new DefaultLogger(config.debug ? 'debug' : 'info');
    this.toolRegistry = new ToolRegistry();

    this.logger.info('CLAW Platform initialized', {
      debug: config.debug,
      maxAgents: config.maxAgents,
      maxTools: config.maxTools,
    });
  }

  /**
   * Create an agent
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    validateAgentConfig(config);

    if (
      this.config.maxAgents &&
      this.agents.size >= this.config.maxAgents
    ) {
      throw new Error(
        `Max agents reached: ${this.config.maxAgents}`
      );
    }

    const agent = createAgent(config, {
      tools: this.toolRegistry,
      tracer: this.tracer,
      storage: this.storage,
      logger: this.logger,
      llmProvider: this.llmProvider,
    });

    this.agents.set(config.id, agent);

    this.logger.info(`Agent created: ${config.name}`, { agentId: config.id });

    return agent;
  }

  /**
   * Get an agent
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all agents
   */
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
    await this.storage.deleteMemory(agentId);
    this.logger.info(`Agent deleted: ${agentId}`);
  }

  /**
   * Get tool registry
   */
  getToolRegistry(): ToolRegistryInterface {
    return this.toolRegistry;
  }

  /**
   * Get tracer
   */
  getTracer() {
    return this.tracer;
  }

  /**
   * Get logger
   */
  getLogger() {
    return this.logger;
  }

  /**
   * Get metrics collector
   */
  getMetricsCollector() {
    return this.metricsCollector;
  }

  /**
   * Get storage
   */
  getStorage() {
    return this.storage;
  }

  /**
   * Get plugin loader
   */
  getPluginLoader() {
    return this.pluginLoader;
  }

  /**
   * Get coordinator
   */
  getCoordinator() {
    return this.coordinator;
  }

  /**
   * Get platform health
   */
  async health(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    agents: number;
    tools: number;
    storage: boolean;
  }> {
    const storageHealth = await this.storage.health();

    return {
      status: storageHealth ? 'healthy' : 'degraded',
      agents: this.agents.size,
      tools: this.toolRegistry.getAll().length,
      storage: storageHealth,
    };
  }

  /**
   * Get platform statistics
   */
  getStats(): {
    agents: number;
    tools: number;
    traces: number;
    metrics: number;
    logs: number;
  } {
    return {
      agents: this.agents.size,
      tools: this.toolRegistry.getAll().length,
      traces: this.tracer.getTraces().length,
      metrics: this.metricsCollector.getMetrics().length,
      logs: this.logger['logs']?.length || 0,
    };
  }

  /**
   * Reset platform (clear all data)
   */
  reset(): void {
    this.agents.clear();
    this.tracer.clear();
    this.metricsCollector.clear();
    this.storage.clear();
    this.logger['logs'] = [];
    this.logger.info('Platform reset');
  }

  /**
   * Shutdown platform
   */
  async shutdown(): Promise<void> {
    // Unload plugins
    for (const plugin of this.pluginLoader.getLoadedPlugins()) {
      await this.pluginLoader.unload(plugin.config.name);
    }

    this.logger.info('Platform shutdown complete');
  }
}

/**
 * Create a new platform instance
 */
export function createPlatform(config?: PlatformConfig): CLAWPlatform {
  return new CLAWPlatform(config);
}
