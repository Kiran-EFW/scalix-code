/**
 * Plugin Types
 *
 * Plugin system for extending CLAW capabilities.
 * Plugins can add commands, agents, skills, and hooks.
 */

/**
 * Plugin configuration
 */
export interface PluginConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
}

/**
 * Command definition for a plugin
 */
export interface CommandDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Agent definition for a plugin
 */
export interface AgentDefinition {
  name: string;
  description: string;
  create: () => Promise<unknown>;
}

/**
 * Skill definition - domain-specific expertise
 */
export interface SkillDefinition {
  name: string;
  description: string;
  triggers: string[];
  guidance: string;
}

/**
 * Hook definition - event handlers
 */
export enum HookEvent {
  AGENT_START = 'agent:start',
  AGENT_END = 'agent:end',
  TOOL_CALL = 'tool:call',
  TOOL_RESULT = 'tool:result',
  WORKFLOW_START = 'workflow:start',
  WORKFLOW_END = 'workflow:end',
  PLUGIN_LOAD = 'plugin:load',
  PLUGIN_UNLOAD = 'plugin:unload',
}

export interface HookDefinition {
  event: HookEvent;
  handler: (context: Record<string, unknown>) => Promise<void>;
}

/**
 * Plugin interface
 */
export interface Plugin {
  readonly config: PluginConfig;

  /**
   * Initialize the plugin
   */
  initialize?(): Promise<void>;

  /**
   * Shutdown the plugin
   */
  shutdown?(): Promise<void>;

  /**
   * Get plugin commands
   */
  getCommands?(): CommandDefinition[];

  /**
   * Get plugin agents
   */
  getAgents?(): AgentDefinition[];

  /**
   * Get plugin skills
   */
  getSkills?(): SkillDefinition[];

  /**
   * Get plugin hooks
   */
  getHooks?(): HookDefinition[];
}

/**
 * Plugin loader interface
 */
export interface PluginLoader {
  /**
   * Load a plugin from a directory
   */
  load(path: string): Promise<Plugin>;

  /**
   * Unload a plugin
   */
  unload(name: string): Promise<void>;

  /**
   * Get loaded plugins
   */
  getLoadedPlugins(): Plugin[];
}
