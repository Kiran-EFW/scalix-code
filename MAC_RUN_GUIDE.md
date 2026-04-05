# 🍎 Scalix Code - Mac Setup & Run Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
# Make sure you have pnpm installed
brew install pnpm

# Or update if already installed
brew upgrade pnpm

# Navigate to project
cd /Users/kiranravi/Dev/Scalix-ORG/RETAIL/scalix-code

# Install dependencies
pnpm install
```

### 2. Build Core Package
```bash
cd core
pnpm run build
```

### 3. Run Development Server
```bash
# Option A: Run API server
pnpm --filter @scalix/api run dev

# Option B: Run CLI
pnpm --filter @scalix/cli run dev

# Option C: Run all in watch mode
pnpm run dev
```

---

## Complete Setup Guide

### Prerequisites
- **macOS**: 10.15+ (tested on latest)
- **Node.js**: 20.0.0+ (have v22.14.0 ✓)
- **npm**: 10.0.0+ (have 10.9.2 ✓)
- **pnpm**: 8.0.0+ (have 10.33.0 ✓)
- **git**: 2.0.0+ (have 2.50.1 ✓)

### Step 1: Environment Setup

```bash
# Verify Node.js
node --version          # Should be v20+
npm --version           # Should be v10+

# Install pnpm if needed
npm install -g pnpm

# Verify pnpm
pnpm --version          # Should be v10+
```

### Step 2: Clone & Navigate

```bash
# Navigate to project directory
cd /Users/kiranravi/Dev/Scalix-ORG/RETAIL/scalix-code

# Verify you're in the right place
pwd  # Should end with /scalix-code
ls   # Should show: core, packages, examples, docs, etc.
```

### Step 3: Install & Build

```bash
# Clean install (if needed)
pnpm install --force

# Build core package
cd core
pnpm run build

# Build all packages (optional)
cd ..
pnpm run build
```

### Step 4: Run Development Server

```bash
# Option 1: API Server (recommended for testing)
pnpm --filter @scalix/api run dev

# Option 2: CLI Tool
pnpm --filter @scalix/cli run dev

# Option 3: Full watch mode (all packages)
pnpm run dev

# Option 4: Run specific example
npx tsx examples/01-hello-world.ts
```

---

## Common Commands

### Development
```bash
# Start development server
pnpm run dev

# Watch mode for specific package
cd packages/api && pnpm run dev

# Build specific package
cd core && pnpm run build
```

### Testing
```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run specific test file
pnpm run test -- --grep "agent"
```

### Code Quality
```bash
# Lint code
pnpm run lint

# Format code
pnpm run format

# Type check
pnpm run type-check
```

### Package Management
```bash
# List installed packages
pnpm ls

# Update dependencies
pnpm update

# Add new dependency
pnpm add <package-name>

# Add dev dependency
pnpm add -D <package-name>
```

---

## Troubleshooting on Mac

### Issue: `pnpm: command not found`
**Solution:**
```bash
# Install pnpm globally
npm install -g pnpm

# Or use with npm
npx pnpm install
```

### Issue: `Permission denied` errors
**Solution:**
```bash
# Fix permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm

# Or reinstall without sudo
npm install -g pnpm --no-optional
```

### Issue: `Port 3000 already in use`
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm --filter @scalix/api run dev
```

### Issue: TypeScript errors after changes
**Solution:**
```bash
# Clear build cache
pnpm run clean

# Reinstall
pnpm install

# Rebuild
pnpm run build
```

### Issue: Out of memory during build
**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# Or build packages individually
cd core && pnpm run build
cd ../packages/api && pnpm run build
```

---

## Architecture Overview

### Project Structure
```
scalix-code/
├── core/                    # Main agent engine
│   └── src/
│       ├── agent/          # Agent implementation
│       ├── tools/          # Tool definitions
│       ├── orchestration/  # Multi-agent coordination
│       ├── storage/        # Memory & checkpoints
│       └── observability/  # Logging & metrics
│
├── packages/
│   ├── api/                # REST/WebSocket server
│   ├── cli/                # Command-line interface
│   ├── sdk/                # Developer SDK
│   ├── vscode-extension/   # VS Code plugin
│   └── marketplace/        # Plugin registry
│
├── examples/               # Usage examples
├── docs/                   # Documentation
└── package.json            # Root package config
```

### Key Files
- `package.json` - Root configuration
- `pnpm-workspace.yaml` - Workspace definition
- `tsconfig.json` - TypeScript config
- `tsconfig.base.json` - Base TS config

---

## Running Examples

### Hello World
```bash
npx tsx examples/01-hello-world.ts
```

### API Client
```bash
npx tsx examples/02-api-client.ts
```

### WebSocket Client
```bash
npx tsx examples/03-websocket-client.ts
```

### Multi-Agent Orchestration
```bash
npx tsx examples/04-multi-agent-orchestration.ts
```

### Code Analysis
```bash
npx tsx examples/05-code-analysis.ts
```

---

## Git Workflow

### Check Status
```bash
git status              # See current changes
git log --oneline       # See commit history
git branch             # See all branches
```

### Commit Changes
```bash
git add .
git commit -m "your message"
git push origin main
```

### Create Feature Branch
```bash
git checkout -b feature/my-feature
git push origin feature/my-feature
```

---

## Performance Tips for Mac

### 1. Increase Memory Limit
```bash
# In your ~/.zshrc or ~/.bash_profile
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. Use M1/M2 Optimizations
```bash
# These should auto-detect but can be forced
export npm_config_arch=arm64
```

### 3. Parallel Builds
```bash
# Use pnpm's parallel execution
pnpm --recursive run build --parallel
```

### 4. Cache Clearing
```bash
# Clear npm cache
npm cache clean --force

# Clear pnpm cache
pnpm store prune
```

---

## Useful Mac Commands

### Monitor Process
```bash
# See what's using CPU/Memory
top

# See open files/ports
lsof

# Kill process by port
lsof -ti:3000 | xargs kill -9
```

### File Operations
```bash
# Show hidden files in Finder
defaults write com.apple.finder AppleShowAllFiles -bool true
killall Finder

# Hide hidden files again
defaults write com.apple.finder AppleShowAllFiles -bool false
killall Finder
```

---

## VS Code Setup (Optional)

### Recommended Extensions
1. **ESLint** - Linting
2. **Prettier** - Code formatting
3. **TypeScript Vue Plugin** - Vue support
4. **Vitest** - Test runner UI

### Settings
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## Documentation

### Quick Links
- **START_HERE.md** - Project overview
- **docs/INDEX.md** - Full documentation index
- **docs/developer-guide/** - Architecture guides
- **docs/user-guide/** - User documentation
- **FINAL_PROJECT_STATUS.md** - Complete status

### Key Documents
- [Architecture Decisions](docs/ARCHITECTURE.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [Testing Guide](docs/TESTING.md)
- [Deployment Guide](docs/ops-guide/deployment.md)

---

## Support & Help

### Check Logs
```bash
# View npm logs
cat ~/.npm/_logs/latest-debug.log

# View pnpm logs
cat ~/.pnpm/logs/latest.log
```

### Get Help
```bash
# Get help on commands
pnpm --help
pnpm run --help

# Check node version info
node --version
npm --version
pnpm --version
```

---

## Next Steps

1. **Setup Complete?**
   ```bash
   pnpm install
   cd core && pnpm run build
   ```

2. **Start Coding**
   ```bash
   pnpm run dev
   ```

3. **Run Tests**
   ```bash
   pnpm run test
   ```

4. **Try Examples**
   ```bash
   npx tsx examples/01-hello-world.ts
   ```

5. **Check Docs**
   - Read START_HERE.md
   - Explore docs/ directory
   - Review code in core/src

---

## System Info (Your Mac)

**Verified Working:**
- ✅ Node.js: v22.14.0
- ✅ npm: 10.9.2
- ✅ pnpm: 10.33.0
- ✅ git: 2.50.1
- ✅ macOS: Arm64 (Apple Silicon)
- ✅ Memory: 16 GB
- ✅ CPU: 10 cores

**All tools verified and ready to use!**

---

**Last Updated:** April 5, 2026  
**Status:** ✅ Ready for Development  
**Tested On:** macOS (Arm64) with Node.js v22
