/**
 * Plugin Loader
 *
 * Load and manage plugins dynamically
 */

import type { Plugin, PluginConfig } from './types';

/**
 * Plugin loader implementation
 */
export class PluginLoader {
  private loadedPlugins = new Map<string, Plugin>();

  /**
   * Load a plugin from a module or path
   */
  async load(pathOrModule: string | Plugin): Promise<Plugin> {
    let plugin: Plugin;

    // If it's already a plugin, use it directly
    if (typeof pathOrModule === 'object' && 'config' in pathOrModule) {
      plugin = pathOrModule as Plugin;
    } else {
      // In a real implementation, this would use dynamic import
      // For now, we'll throw an error
      throw new Error(
        'Dynamic plugin loading from paths requires a full implementation'
      );
    }

    // Check if already loaded
    if (this.loadedPlugins.has(plugin.config.name)) {
      throw new Error(`Plugin already loaded: ${plugin.config.name}`);
    }

    // Initialize plugin
    if (plugin.initialize) {
      await plugin.initialize();
    }

    // Store plugin
    this.loadedPlugins.set(plugin.config.name, plugin);

    return plugin;
  }

  /**
   * Unload a plugin
   */
  async unload(name: string): Promise<void> {
    const plugin = this.loadedPlugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin not loaded: ${name}`);
    }

    // Shutdown plugin
    if (plugin.shutdown) {
      await plugin.shutdown();
    }

    this.loadedPlugins.delete(name);
  }

  /**
   * Get loaded plugins
   */
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get a plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.loadedPlugins.get(name);
  }

  /**
   * Get all commands from loaded plugins
   */
  getAllCommands() {
    const commands: any[] = [];

    for (const plugin of this.loadedPlugins.values()) {
      if (plugin.getCommands) {
        commands.push(...plugin.getCommands());
      }
    }

    return commands;
  }

  /**
   * Get all agents from loaded plugins
   */
  getAllAgents() {
    const agents: any[] = [];

    for (const plugin of this.loadedPlugins.values()) {
      if (plugin.getAgents) {
        agents.push(...plugin.getAgents());
      }
    }

    return agents;
  }

  /**
   * Get all skills from loaded plugins
   */
  getAllSkills() {
    const skills: any[] = [];

    for (const plugin of this.loadedPlugins.values()) {
      if (plugin.getSkills) {
        skills.push(...plugin.getSkills());
      }
    }

    return skills;
  }

  /**
   * Get all hooks from loaded plugins
   */
  getAllHooks() {
    const hooks: any[] = [];

    for (const plugin of this.loadedPlugins.values()) {
      if (plugin.getHooks) {
        hooks.push(...plugin.getHooks());
      }
    }

    return hooks;
  }
}

/**
 * Create a simple plugin
 */
export function createPlugin(config: PluginConfig): Plugin {
  return {
    config,
    initialize: async () => {
      // Default initialization
    },
    shutdown: async () => {
      // Default shutdown
    },
  };
}
