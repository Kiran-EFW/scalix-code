# Building Plugins for Scalix Code

Scalix Code is extensible. You can build custom commands, agents, skills, and integrations.

## Plugin Structure

```
my-plugin/
├── plugin.json              # Metadata
├── commands/
│   ├── my-command.ts
│   └── another-command.ts
├── agents/
│   └── my-agent.ts
├── hooks/
│   └── my-hook.ts
├── .mcp.json               # MCP servers (optional)
└── README.md               # Documentation
```

## Plugin Types

### 1. Commands

Add slash commands like `/test` or `/lint`:

```typescript
// commands/test.ts
export const command = {
  name: 'test',
  description: 'Run the test suite',
  action: async (args, context) => {
    const result = await context.tools.bash(`npm test ${args}`);
    return result.output;
  },
};
```

Usage:
```
> /test
> /test --watch
```

### 2. Custom Agents

Define specialized agents for specific domains:

```typescript
// agents/security-specialist.ts
export const agent = {
  name: 'security-specialist',
  description: 'Find security vulnerabilities and provide fixes',
  role: 'Security Expert',
  tools: ['codebase_search', 'analyze_file', 'get_file_content'],
  systemPrompt: `You are a security expert. Find vulnerabilities in code...`,
};
```

### 3. Hooks

React to events in the conversation:

```typescript
// hooks/log-all-tools.ts
export const hook = {
  name: 'log-all-tools',
  trigger: 'PreToolUse',
  action: async (context) => {
    console.log(`Executing tool: ${context.toolName}`);
    console.log(`Arguments: ${JSON.stringify(context.args)}`);
  },
};
```

**Available Hooks:**
- `SessionStart` - Conversation begins
- `SessionEnd` - Conversation ends
- `PreToolUse` - Before executing tool
- `PostToolUse` - After executing tool
- `AgentInit` - Agent created
- `AgentShutdown` - Agent destroyed

### 4. MCP Servers

Integrate external services:

```json
{
  "email-api": {
    "command": "/usr/local/bin/email-mcp-server",
    "env": {
      "API_KEY": "${EMAIL_API_KEY}"
    }
  },
  "slack-api": {
    "command": "/usr/local/bin/slack-mcp-server",
    "env": {
      "SLACK_TOKEN": "${SLACK_TOKEN}"
    }
  }
}
```

## Installation

### From Local Directory

```bash
# In your plugin directory
scalix-code /plugin /path/to/my-plugin
```

### From GitHub

```bash
scalix-code /plugin install github:username/my-plugin
```

### From npm

```bash
scalix-code /plugin install npm:@username/scalix-plugin
```

## Plugin Manifest (plugin.json)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom Scalix Code plugin",
  "author": "Your Name",
  "license": "MIT",
  
  "scalix": {
    "minVersion": "0.5.0",
    "commands": ["commands/*.ts"],
    "agents": ["agents/*.ts"],
    "hooks": ["hooks/*.ts"],
    "mcp": ".mcp.json"
  },
  
  "dependencies": {
    "axios": "^1.0.0"
  }
}
```

## Complete Example: Email Plugin

```typescript
// plugin.json
{
  "name": "email-plugin",
  "version": "1.0.0",
  "description": "Send emails from Scalix Code",
  "scalix": {
    "commands": ["commands/*.ts"],
    "agents": ["agents/*.ts"],
    "mcp": ".mcp.json"
  }
}

// commands/send-email.ts
export const command = {
  name: 'send-email',
  description: 'Send an email',
  action: async (to, subject, body, context) => {
    const result = await context.tools.api('POST', 'https://api.email-service.com/send', {
      to,
      subject,
      body,
    });
    return `Email sent to ${to}`;
  },
};

// agents/email-specialist.ts
export const agent = {
  name: 'email-specialist',
  description: 'Compose and send professional emails',
  tools: ['send-email', 'get_file_content'],
  systemPrompt: `You are an email composition specialist...`,
};

// .mcp.json
{
  "email-service": {
    "command": "./mcp/email-server",
    "env": {
      "EMAIL_API_KEY": "${EMAIL_API_KEY}"
    }
  }
}
```

## Best Practices

### 1. Type Safety
Always use TypeScript and strict mode:

```typescript
interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  attachments?: string[];
}

export const command = {
  name: 'send-email',
  action: async (options: EmailOptions, context) => {
    // Implementation
  },
};
```

### 2. Error Handling
Handle errors gracefully:

```typescript
export const command = {
  name: 'my-command',
  action: async (args, context) => {
    try {
      const result = await context.tools.bash('some-command');
      return result.output;
    } catch (error) {
      throw new Error(`Command failed: ${error.message}`);
    }
  },
};
```

### 3. Configuration
Use environment variables:

```typescript
const apiKey = process.env.MY_SERVICE_API_KEY;
if (!apiKey) {
  throw new Error('MY_SERVICE_API_KEY environment variable not set');
}
```

### 4. Documentation
Document your plugin clearly:

```markdown
# Email Plugin

Send emails from Scalix Code.

## Installation

\`\`\`bash
scalix-code /plugin install github:username/email-plugin
\`\`\`

## Usage

\`\`\`
> /send-email john@example.com "Hello" "This is the body"
\`\`\`

## Configuration

Set environment variable:
\`\`\`
export EMAIL_API_KEY=sk-...
\`\`\`
```

## Testing Plugins

```bash
# Build your plugin
npm run build

# Test in development
scalix-code /plugin /path/to/my-plugin --dev

# Run tests
npm test
```

## Publishing Plugins

### To npm

```bash
npm publish
```

Then install with:
```bash
scalix-code /plugin install npm:@username/scalix-plugin
```

### To GitHub

Push to GitHub and install with:
```bash
scalix-code /plugin install github:username/my-plugin
```

## Plugin API Reference

### Context Object

Available in all plugin methods:

```typescript
interface Context {
  // Tool execution
  tools: {
    bash(command: string): Promise<Result>;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    deleteFile(path: string): Promise<void>;
    api(method: string, url: string, data?: any): Promise<any>;
    git(command: string): Promise<Result>;
  };
  
  // Session info
  sessionId: string;
  projectPath: string;
  gitStatus: GitStatus;
  
  // Agent control
  agent: {
    ask(question: string): Promise<string>;
    runAgent(name: string, task: string): Promise<Result>;
  };
  
  // Logging
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}
```

---

See [GETTING_STARTED.md](GETTING_STARTED.md) for more information on using plugins.
