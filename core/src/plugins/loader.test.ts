/**
 * Plugin Loader Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginLoader, createPlugin } from './loader';
import type { Plugin, PluginConfig } from './types';

describe('PluginLoader', () => {
  let loader: PluginLoader;

  const createTestPlugin = (name: string, overrides?: Partial<Plugin>): Plugin => ({
    config: { name, version: '1.0.0', description: `Test plugin: ${name}` },
    initialize: vi.fn(async () => {}),
    shutdown: vi.fn(async () => {}),
    ...overrides,
  });

  beforeEach(() => {
    loader = new PluginLoader();
  });

  describe('load', () => {
    it('should load a plugin object', async () => {
      const plugin = createTestPlugin('test-plugin');
      const loaded = await loader.load(plugin);

      expect(loaded.config.name).toBe('test-plugin');
    });

    it('should call initialize on load', async () => {
      const plugin = createTestPlugin('init-plugin');
      await loader.load(plugin);

      expect(plugin.initialize).toHaveBeenCalled();
    });

    it('should throw when loading duplicate plugin', async () => {
      const plugin = createTestPlugin('dup-plugin');
      await loader.load(plugin);

      await expect(loader.load(createTestPlugin('dup-plugin'))).rejects.toThrow(
        'Plugin already loaded'
      );
    });

    it('should throw when loading from path', async () => {
      await expect(loader.load('/some/path')).rejects.toThrow(
        'Dynamic plugin loading'
      );
    });

    it('should work without initialize method', async () => {
      const plugin = createTestPlugin('no-init');
      delete plugin.initialize;

      const loaded = await loader.load(plugin);
      expect(loaded.config.name).toBe('no-init');
    });
  });

  describe('unload', () => {
    it('should unload a loaded plugin', async () => {
      const plugin = createTestPlugin('unload-me');
      await loader.load(plugin);
      await loader.unload('unload-me');

      expect(loader.getPlugin('unload-me')).toBeUndefined();
    });

    it('should call shutdown on unload', async () => {
      const plugin = createTestPlugin('shutdown-test');
      await loader.load(plugin);
      await loader.unload('shutdown-test');

      expect(plugin.shutdown).toHaveBeenCalled();
    });

    it('should throw when unloading unknown plugin', async () => {
      await expect(loader.unload('nonexistent')).rejects.toThrow(
        'Plugin not loaded'
      );
    });

    it('should work without shutdown method', async () => {
      const plugin = createTestPlugin('no-shutdown');
      delete plugin.shutdown;
      await loader.load(plugin);

      await expect(loader.unload('no-shutdown')).resolves.toBeUndefined();
    });
  });

  describe('getLoadedPlugins', () => {
    it('should return all loaded plugins', async () => {
      await loader.load(createTestPlugin('p1'));
      await loader.load(createTestPlugin('p2'));
      await loader.load(createTestPlugin('p3'));

      expect(loader.getLoadedPlugins()).toHaveLength(3);
    });

    it('should return empty array when no plugins', () => {
      expect(loader.getLoadedPlugins()).toHaveLength(0);
    });
  });

  describe('getPlugin', () => {
    it('should return plugin by name', async () => {
      await loader.load(createTestPlugin('findable'));

      const plugin = loader.getPlugin('findable');
      expect(plugin).toBeDefined();
      expect(plugin!.config.name).toBe('findable');
    });

    it('should return undefined for unknown plugin', () => {
      expect(loader.getPlugin('unknown')).toBeUndefined();
    });
  });

  describe('getAllCommands', () => {
    it('should aggregate commands from plugins', async () => {
      const plugin = createTestPlugin('cmd-plugin', {
        getCommands: () => [
          { name: 'cmd1', description: 'Command 1', execute: vi.fn() },
          { name: 'cmd2', description: 'Command 2', execute: vi.fn() },
        ],
      });
      await loader.load(plugin);

      expect(loader.getAllCommands()).toHaveLength(2);
    });

    it('should return empty for plugins without commands', async () => {
      await loader.load(createTestPlugin('no-cmds'));
      expect(loader.getAllCommands()).toHaveLength(0);
    });
  });

  describe('getAllAgents', () => {
    it('should aggregate agents from plugins', async () => {
      const plugin = createTestPlugin('agent-plugin', {
        getAgents: () => [
          { name: 'agent1', description: 'Agent 1', create: vi.fn() },
        ],
      });
      await loader.load(plugin);

      expect(loader.getAllAgents()).toHaveLength(1);
    });
  });

  describe('getAllSkills', () => {
    it('should aggregate skills from plugins', async () => {
      const plugin = createTestPlugin('skill-plugin', {
        getSkills: () => [
          { name: 'skill1', description: 'Skill 1', triggers: ['test'], guidance: 'Test' },
        ],
      });
      await loader.load(plugin);

      expect(loader.getAllSkills()).toHaveLength(1);
    });
  });

  describe('getAllHooks', () => {
    it('should aggregate hooks from plugins', async () => {
      const plugin = createTestPlugin('hook-plugin', {
        getHooks: () => [
          { event: 'agent:start' as any, handler: vi.fn() },
        ],
      });
      await loader.load(plugin);

      expect(loader.getAllHooks()).toHaveLength(1);
    });
  });
});

describe('createPlugin', () => {
  it('should create a plugin with config', () => {
    const config: PluginConfig = {
      name: 'test',
      version: '1.0.0',
      description: 'Test plugin',
    };

    const plugin = createPlugin(config);
    expect(plugin.config).toEqual(config);
    expect(plugin.initialize).toBeDefined();
    expect(plugin.shutdown).toBeDefined();
  });

  it('should have working initialize', async () => {
    const plugin = createPlugin({ name: 'test', version: '1.0.0' });
    await expect(plugin.initialize!()).resolves.toBeUndefined();
  });

  it('should have working shutdown', async () => {
    const plugin = createPlugin({ name: 'test', version: '1.0.0' });
    await expect(plugin.shutdown!()).resolves.toBeUndefined();
  });
});
