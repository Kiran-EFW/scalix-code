# Getting Started with Scalix Code

## Installation

### From npm (Recommended)

```bash
npm install -g scalix-code
scalix-code
```

### From Source

```bash
git clone https://github.com/scalix-org/scalix-code
cd scalix-code
npm install
npm run build
npm run cli
```

## Configuration

Create `~/.scalix/config.json`:

```json
{
  "llmProvider": "anthropic",
  "modelId": "claude-3-5-sonnet-20241022",
  "apiKey": "$ANTHROPIC_API_KEY",
  "guardrails": {
    "confirmDestructive": true,
    "enforceClaudeMd": true,
    "logAuditTrail": true
  },
  "observability": {
    "tracingEnabled": true,
    "metricsEnabled": true,
    "logsEnabled": true
  }
}
```

## Your First Command

```bash
scalix-code
```

You'll see a prompt:

```
> 
```

Try these commands:

### 1. Understand Your Project

```
> analyze this codebase structure
```

Scalix Code will:
- List all files and directories
- Identify the project type (Node, React, Python, etc)
- Show the architecture overview

### 2. Find Issues

```
> find security vulnerabilities in src/auth.ts
```

Scalix Code will:
- Analyze the file
- Point out issues with file:line references
- Suggest fixes with code examples

### 3. Write Code

```
> write unit tests for src/utils/helpers.ts
```

Scalix Code will:
- Create test files
- Ask for confirmation before writing
- Show you the tests to review

### 4. Make Changes

```
> update the README with latest features
> commit these changes with message "docs: update README"
```

Scalix Code will:
- Run the commands
- Show what changed
- Ask for confirmation on git operations

## Understanding Confirmations

Scalix Code requires confirmation for:

✅ **Requires confirmation:**
- Delete files (especially .git, package.json, src/)
- Force push to main
- Run rm -rf commands
- Drop databases
- Any destructive operation

⚠️ **Shows warning:**
- Modify files >100KB
- Unsafe command chains
- Operations that need review

These are safety guardrails. You can:
- Type `yes` or `approve` to confirm
- Type `no` or `reject` to cancel
- Type `details` to see more information

## Project Guidelines

If your project has a `CLAUDE.md` file, Scalix Code will:
- Read your project guidelines
- Respect naming conventions
- Follow your architecture rules
- Enforce your testing standards

Create a `CLAUDE.md` file in your project root:

```markdown
# Project Guidelines

## Architecture
- Use TypeScript for all code
- Organize by feature, not by type
- Keep components under 300 lines

## Testing
- Write tests before implementation
- Aim for >80% coverage
- Use Vitest, not Jest

## Naming
- Variables: camelCase
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE

## Security
- No API keys in code
- Validate all inputs
- Use prepared statements for SQL
```

Scalix Code will check your code against these guidelines.

## Common Tasks

### Analyze Your Code

```
> find code quality issues in src/
> check for TypeScript errors
> analyze the project structure
```

### Generate Tests

```
> write unit tests for src/auth.ts
> create integration tests for api/
> add test coverage for error cases
```

### Refactor

```
> refactor src/utils.ts to use modern JavaScript
> rename getUserID to getUserId throughout the codebase
> extract common logic from these files
```

### Debug

```
> help me understand why this test is failing
> trace through the execution flow of this function
> find where this bug is coming from
```

### Automate

```
> create a GitHub Actions workflow for testing
> set up a pre-commit hook to run linting
> generate API documentation from code comments
```

## Tips & Tricks

### Use Context

Scalix Code remembers context across turns:

```
> analyze src/auth.ts for security issues
[Scalix finds 3 issues]

> write tests for the issues you found
[Scalix writes tests for those specific issues]

> create a PR with these changes
[Scalix commits the tests]
```

### Ask Clarifying Questions

```
> how would you refactor this function?
[Scalix explains the approach]

> what are the tradeoffs?
[Scalix discusses pros and cons]

> show me an example
[Scalix provides code example]
```

### Get Help

```
> explain this error message
> how do I use this library?
> what's the best practice here?
```

## Troubleshooting

### "Permission denied" errors

Make sure you have read/write access to the directory:

```bash
chmod -R u+w .
```

### "API key not found"

Set your API key:

```bash
export ANTHROPIC_API_KEY=sk-...
```

Or add it to config.json (see Configuration above).

### "CLAUDE.md violations"

Review your CLAUDE.md guidelines and either:
- Fix the code to match guidelines
- Update the guidelines if they're outdated

### "Confirmation timeout"

Confirmations expire after 5 minutes. You can:
- Type `yes` to confirm
- Type `no` to cancel
- Type `details` to see more

## Next Steps

1. **Read the docs:**
   - [Architecture](ARCHITECTURE.md) - How it works
   - [Plugins](PLUGINS.md) - Extend with custom agents
   - [Guardrails](GUARDRAILS.md) - Understand safety

2. **Try examples:**
   - `examples/` - Full working examples
   - `examples/basic-chat` - Simple conversation
   - `examples/plugin-dev` - Build a plugin

3. **Contribute:**
   - Report bugs on GitHub
   - Submit plugin ideas
   - Help with documentation

## Get Support

- **Docs**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Issues**: GitHub issues for bugs
- **Discord**: Join the community
- **Email**: support@scalix.dev

---

Happy coding! 🚀
