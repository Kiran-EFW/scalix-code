# Scalix Code - VS Code Extension

AI-powered code analysis, explanation, and security scanning directly in VS Code.

## Features

### Code Analysis
- **Analyze Codebase** - Understand your project's architecture, structure, and dependencies
- **Explain Code** - Get detailed explanations of any code snippet or file
- **Security Scanning** - Detect security vulnerabilities in your code
- **Metrics Calculation** - Analyze code complexity, lines of code, and quality metrics

### Real-time Integration
- Seamless integration with VS Code command palette
- Context menu integration for quick access
- Status bar indicators for execution status
- WebView panel for detailed results

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Scalix Code"
4. Click Install

## Configuration

The extension requires a running Scalix API server. Configure it in VS Code settings:

```json
{
  "scalix.apiUrl": "http://localhost:3000",
  "scalix.apiKey": "",
  "scalix.model": "gpt-4",
  "scalix.maxTokens": 4000,
  "scalix.timeout": 30000,
  "scalix.enableSecurityScan": true,
  "scalix.autoAnalyzeOnOpen": false,
  "scalix.debug": false
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | `http://localhost:3000` | URL of the Scalix API server |
| `apiKey` | string | `` | API key for authentication (if required) |
| `model` | string | `gpt-4` | LLM model to use (gpt-4, gpt-3.5-turbo, claude-3-sonnet) |
| `maxTokens` | number | `4000` | Maximum tokens for LLM responses (500-16000) |
| `timeout` | number | `30000` | Timeout for agent execution in milliseconds (5000-120000) |
| `enableSecurityScan` | boolean | `true` | Enable security scanning on file save |
| `autoAnalyzeOnOpen` | boolean | `false` | Automatically analyze codebase when opening a workspace |
| `debug` | boolean | `false` | Enable debug logging in output channel |

## Usage

### Commands

Access commands via Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- **Scalix: Analyze Code** - Analyze the current workspace
- **Scalix: Explain Code** - Explain selected code or active file
- **Scalix: Scan for Security Issues** - Scan for vulnerabilities
- **Scalix: Calculate Metrics** - Calculate code metrics
- **Scalix: Configure** - Open Scalix settings
- **Scalix: Open Results Panel** - Show the results panel

### Context Menu

Right-click in the editor for quick access to:
- Explain Code
- Analyze Code
- Scan for Security Issues

### Status Bar

The status bar shows:
- Current execution status
- Last result availability
- Click to open results panel

## Requirements

- VS Code 1.85.0 or later
- Node.js 20.0.0 or later
- Running Scalix API server (see [scalix-code](https://github.com/scalix-org/scalix-code))

## Starting the Scalix API Server

```bash
# Install Scalix Code
git clone https://github.com/scalix-org/scalix-code
cd scalix-code
pnpm install

# Start the API server
pnpm run dev
# or
cd packages/api
pnpm run dev
```

The server will start on http://localhost:3000 by default.

## Troubleshooting

### Connection Error
If you see "Cannot connect to Scalix server", check:
1. Scalix API server is running
2. `scalix.apiUrl` matches your server URL
3. Firewall/network allows connection to the API server

### Commands Not Working
1. Check the debug output channel for errors
2. Enable `scalix.debug` to see detailed logs
3. Verify your configuration in VS Code settings

### Performance Issues
1. Increase `scalix.timeout` if analyses take longer
2. Reduce `scalix.maxTokens` for faster responses
3. Check your network connection to the API server

## Security

- All communication with the API server is direct (no intermediaries)
- Your code and API key are only sent to the configured server
- API keys are stored in VS Code's secure storage

## Privacy

This extension does not collect any telemetry or usage data. All analysis happens on your Scalix server instance.

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/scalix-org/scalix-code/issues
- Documentation: https://github.com/scalix-org/scalix-code

## License

MIT

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](https://github.com/scalix-org/scalix-code/blob/main/CONTRIBUTING.md) for guidelines.
