# Building Plugins

## Overview

Plugins extend Scalix Code with custom commands, agents, skills, and hooks. They follow a standard lifecycle (initialize, run, shutdown) and integrate through well-defined interfaces.

## Plugin Structure

```typescript
import type { Plugin, PluginConfig } from '@scalix/core/plugins';

const myPlugin: Plugin = {
  config: {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'A custom plugin for Scalix Code',
    author: 'Your Name',
    license: 'MIT',
  },

  async initialize() {
    // Setup: connect to databases, load config, etc.
    console.log('Plugin initialized');
  },

  async shutdown() {
    // Cleanup: close connections, flush buffers, etc.
    console.log('Plugin shut down');
  },

  getCommands() {
    return [
      {
        name: 'my-command',
        description: 'Execute my custom command',
        execute: async (args) => {
          return { result: 'Command executed', args };
        },
      },
    ];
  },

  getAgents() {
    return [
      {
        name: 'my-agent',
        description: 'A custom agent provided by this plugin',
        create: async () => {
          // Return agent configuration or instance
        },
      },
    ];
  },

  getSkills() {
    return [
      {
        name: 'my-skill',
        description: 'Domain-specific expertise',
        triggers: ['when user asks about X', 'when analyzing Y'],
        guidance: 'Use this approach when handling X scenarios...',
      },
    ];
  },

  getHooks() {
    return [
      {
        event: 'agent:start' as any,
        handler: async (context) => {
          console.log('Agent starting:', context);
        },
      },
      {
        event: 'agent:end' as any,
        handler: async (context) => {
          console.log('Agent finished:', context);
        },
      },
    ];
  },
};
```

## Loading Plugins

```typescript
import { PluginLoader } from '@scalix/core/plugins';

const loader = new PluginLoader();

// Load plugin
await loader.load(myPlugin);

// Get all commands from loaded plugins
const commands = loader.getAllCommands();

// Get all agents from loaded plugins
const agents = loader.getAllAgents();

// Unload plugin
await loader.unload('my-plugin');
```

## Plugin Helper

Use `createPlugin` for simple plugins:

```typescript
import { createPlugin } from '@scalix/core/plugins';

const simplePlugin = createPlugin({
  name: 'simple-plugin',
  version: '1.0.0',
  description: 'A simple plugin',
});

// Add functionality after creation
(simplePlugin as any).getCommands = () => [
  { name: 'hello', description: 'Say hello', execute: async () => 'Hello!' },
];
```

## Hook Events

| Event | Trigger | Context |
|-------|---------|---------|
| `agent:start` | Agent execution begins | `{ agentId, input }` |
| `agent:end` | Agent execution completes | `{ agentId, result }` |
| `tool:call` | Tool is about to execute | `{ toolName, arguments }` |
| `tool:result` | Tool execution completed | `{ toolName, result }` |
| `workflow:start` | Workflow begins | `{ workflowId, pattern }` |
| `workflow:end` | Workflow completes | `{ workflowId, results }` |
| `plugin:load` | Plugin is loaded | `{ pluginName }` |
| `plugin:unload` | Plugin is unloaded | `{ pluginName }` |

## Best Practices

1. **Clean initialization**: Connect to resources in `initialize()`, not at import time
2. **Graceful shutdown**: Release all resources in `shutdown()`
3. **Unique names**: Use namespaced names (e.g., `myorg:tool-name`)
4. **Error handling**: Never let plugin errors crash the host
5. **Documentation**: Include clear descriptions for all commands and agents
6. **Versioning**: Follow semver for plugin versions
7. **Testing**: Write unit tests for all plugin functionality
