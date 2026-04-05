# Scalix CLAW CLI

Terminal client for the Scalix CLAW agent orchestration platform.

## Installation

```bash
npm install -g @scalix/cli
# or
pnpm add -g @scalix/cli
```

## Usage

### Commands

#### Agent Management

```bash
# List all agents
claw agent list
claw agent ls

# Create an agent
claw agent create my-agent "My Agent" \
  --provider anthropic \
  --model claude-3-sonnet-20240229 \
  --tools echo get_current_time

# Get agent details
claw agent get my-agent

# Delete an agent
claw agent delete my-agent
```

#### Execution

```bash
# Execute an agent
claw exec run my-agent "What is the time?"

# Get execution history
claw exec history my-agent
claw exec history my-agent --limit 20 --offset 0
```

#### Monitoring

```bash
# Show platform statistics
claw stats

# List recent logs
claw list logs
claw list logs --level ERROR
claw list logs --limit 30

# List recent traces
claw list traces
claw list traces --limit 20
```

#### Interactive Mode

```bash
# Start REPL
claw repl

# Available REPL commands:
# agent list          - List agents
# agent select <id>   - Select agent to work with
# execute <input>     - Execute selected agent
# stats               - Show statistics
# history             - Show command history
# clear               - Clear screen
# help                - Show help
# exit                - Exit REPL
```

### Options

Global options available on all commands:

```bash
--host <host>    # API server host (default: localhost)
--port <port>    # API server port (default: 3000)
-D, --debug      # Enable debug logging
```

Example:

```bash
claw --host api.example.com --port 8080 stats
```

## Examples

### Create and Execute an Agent

```bash
# Create agent
claw agent create analyzer "Data Analyzer" \
  --provider anthropic \
  --model claude-3-sonnet-20240229 \
  --tools echo get_current_time random_number

# Execute the agent
claw exec run analyzer "Analyze this data: sales increased 25%"

# Get execution history
claw exec history analyzer
```

### Interactive Workflow

```bash
# Start REPL
claw repl

# In REPL:
# > agent select analyzer
# [analyzer] > execute What time is it?
# [analyzer] > stats
# [analyzer] > exit
```

### Monitor Platform

```bash
# Check overall health
claw stats

# View recent activity
claw list logs --level INFO
claw list traces

# Monitor a specific agent
claw agent get analyzer
claw exec history analyzer
```

## Configuration

### Environment Variables

```bash
CLAW_HOST=api.example.com    # API server host
CLAW_PORT=8080               # API server port
CLAW_DEBUG=true              # Enable debug logging
```

Example:

```bash
export CLAW_HOST=localhost
export CLAW_PORT=3000
claw stats
```

### Config File (Future)

Coming in Phase 3C: `~/.claw/config.json` support

## Output Format

The CLI uses color-coded output for easy reading:

- ✓ (Green) - Success messages
- ✗ (Red) - Errors
- ℹ (Blue) - Info messages
- ⚠ (Yellow) - Warnings

Tables are formatted with borders for clarity.

## Error Handling

The CLI provides helpful error messages:

```bash
# If API is not available:
$ claw stats
✗ Cannot connect to API server at localhost:3000

# If agent doesn't exist:
$ claw agent get nonexistent
✗ Agent not found

# If invalid arguments:
$ claw agent create
Error: Missing required argument 'id'
```

## Performance

Commands typically complete in:

- Agent operations: < 500ms
- Statistics: < 200ms
- REPL interactive: < 100ms per command

## Troubleshooting

### "Cannot connect to API server"

Ensure the API server is running:

```bash
# In another terminal, start the API server:
cd packages/api
pnpm run dev
```

### "Agent not found"

List available agents:

```bash
claw agent list
```

### Network Issues

Specify correct host/port:

```bash
claw --host api.example.com --port 8080 agent list
```

Enable debug logging for more details:

```bash
claw --debug agent list
```

## Development

### Building from Source

```bash
cd packages/cli
pnpm install
pnpm build

# Run directly
pnpm run dev

# Or run compiled version
pnpm start
```

### Testing Commands

```bash
# Start API server
cd packages/api
pnpm run dev

# In another terminal, test CLI
cd packages/cli
pnpm run dev

# Or run examples
pnpm dev examples/02-api-client.ts
pnpm dev examples/03-websocket-client.ts
```

## Architecture

The CLI is built with:

- **Commander.js** - Command parsing and routing
- **Chalk** - Terminal colors
- **Ora** - Spinners and loading states
- **Table** - Formatted table output
- **Inquirer** - Interactive prompts (future)

All commands are HTTP-based and use the REST API layer.

## Roadmap

### Phase 3B (Current)
- [x] Basic command structure
- [x] Agent management commands
- [x] Execution commands
- [x] Monitoring commands
- [x] Interactive REPL

### Phase 3C
- [ ] Interactive prompts
- [ ] Config file support (~/.claw/config.json)
- [ ] Command aliasing
- [ ] Output format options (JSON, CSV)
- [ ] Shell completions

### Phase 4+
- [ ] Watch mode for agent execution
- [ ] Real-time metrics dashboard
- [ ] Log streaming
- [ ] Web UI integration

## Contributing

Contributions welcome! Please:

1. Follow TypeScript strict mode
2. Add tests for new commands
3. Update README with new features
4. Keep error messages helpful

## License

MIT - See LICENSE in project root

## Support

For issues and questions:

- 📖 [Documentation](../../VISION.md)
- 🐛 [Report Bugs](https://github.com/scalix/claw/issues)
- 💬 [Discussions](https://github.com/scalix/claw/discussions)
