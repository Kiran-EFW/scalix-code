# VS Code Marketplace Publishing Guide

This guide walks through packaging and publishing the Scalix Code VS Code extension to the official marketplace.

## Prerequisites

1. **VS Code Extension Requirements Met**
   - All source code committed and tested
   - `package.json` manifest completed
   - `README.md` with screenshots and usage
   - `CHANGELOG.md` with version notes
   - `.vscodeignore` configured

2. **Microsoft Account**
   - Visual Studio Code Marketplace account
   - Publisher account created and verified

3. **Tools Installed**
   - VS Code Command Line Interface (vsce)
   - Node.js 20.0.0+
   - pnpm

## Step 1: Create Publisher Account

1. Visit https://marketplace.visualstudio.com/manage/publishers
2. Sign in with Microsoft account
3. Create new publisher with namespace (e.g., `scalix-org`)
4. Verify email address

## Step 2: Generate Personal Access Token

1. In Azure DevOps (https://dev.azure.com/):
   - Create new PAT with "Marketplace (publish)" scope
   - Keep scope minimal for security
   - Copy token immediately (can't retrieve later)

## Step 3: Configure vsce Locally

```bash
# Globally install vsce
npm install -g @vscode/vsce

# Login with your publisher account
vsce login scalix-org
# Paste your PAT when prompted
```

## Step 4: Prepare Extension Package

```bash
# Navigate to extension directory
cd packages/vscode-extension

# Clean build artifacts
pnpm run clean

# Install dependencies
pnpm install

# Build the extension
pnpm run build

# Verify everything compiles
pnpm run type-check
pnpm run lint

# Run tests
pnpm run test
```

## Step 5: Create vsix Package

```bash
# Create the package (locally, don't publish yet)
vsce package

# This creates scalix-vscode-0.5.0.vsix file
# Size should be < 50MB (VS Code limit)

# Verify package contents
unzip -l scalix-vscode-0.5.0.vsix | head -20
```

## Step 6: Test Locally Before Publishing

```bash
# Install the extension locally
code --install-extension scalix-vscode-0.5.0.vsix

# Open VS Code
# Test all commands and features work correctly:
# - Ctrl+Shift+P -> "Scalix: Analyze Code"
# - Ctrl+Shift+P -> "Scalix: Explain Code"
# - Ctrl+Shift+P -> "Scalix: Scan for Security Issues"
# - Ctrl+Shift+P -> "Scalix: Calculate Metrics"
# - Check settings in VS Code preferences
# - Test context menu integration

# Uninstall after testing
code --uninstall-extension scalix-org.scalix-vscode
```

## Step 7: Update Marketplace Metadata

In `package.json`, ensure these fields are set:

```json
{
  "publisher": "scalix-org",
  "displayName": "Scalix Code",
  "description": "AI-powered code analysis, explanation, and security scanning directly in VS Code",
  "icon": "media/icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/scalix-org/scalix-code"
  },
  "bugs": {
    "url": "https://github.com/scalix-org/scalix-code/issues"
  },
  "homepage": "https://github.com/scalix-org/scalix-code",
  "keywords": [
    "ai",
    "code-analysis",
    "code-explanation",
    "security",
    "metrics",
    "refactoring"
  ]
}
```

## Step 8: Create Icon

The extension needs a 128x128px PNG icon:

1. Create `packages/vscode-extension/media/icon.png` (128x128px)
2. Ensure icon is clear at small sizes
3. Use solid colors for better visibility in marketplace
4. Recommended: Scalix logo

## Step 9: Write Changelog

Create `packages/vscode-extension/CHANGELOG.md`:

```markdown
# Change Log

All notable changes to the Scalix Code extension will be documented in this file.

## [0.5.0] - 2026-04-05

### Added
- Initial release of Scalix Code VS Code extension
- Code analysis with codebase-analyzer agent
- Code explanation with code-explainer agent
- Security scanning with security-analyzer agent
- Code metrics calculation
- Real-time WebSocket integration for streaming results
- Diagnostics provider for security issues in Problems panel
- Hover provider for inline code explanations
- Code actions for quick fixes
- Status bar integration
- Configuration management via VS Code settings
- Comprehensive documentation and user guide

### Features
- 6 core commands via command palette
- Context menu integration
- WebView results panel with syntax highlighting
- Live progress tracking
- Auto-reconnection with exponential backoff
- Graceful fallback to REST API
- Configurable API server URL and model selection
- Debug logging support
```

## Step 10: Publish to Marketplace

```bash
# From extension directory
cd packages/vscode-extension

# Publish to marketplace
vsce publish

# Or specify version explicitly
vsce publish 0.5.0

# Or publish with message
vsce publish 0.5.0 -m "Initial release of Scalix Code VS Code extension"
```

The command will:
1. Validate the package
2. Upload to marketplace
3. Make it available for installation

## Step 11: Verify Publication

1. Visit https://marketplace.visualstudio.com/items?itemName=scalix-org.scalix-vscode
2. Verify all information displays correctly:
   - Icon appears
   - Description is correct
   - Installation instructions work
   - Links work (repo, issues, etc.)

2. Test installation from marketplace:
   ```bash
   # In a fresh VS Code window
   # Extensions -> Search "Scalix Code"
   # Click Install
   # Verify it installs without errors
   ```

## Version Bumping for Future Releases

```bash
# Update version in package.json
npm version patch  # or minor, major

# Rebuild and publish
pnpm run build
vsce publish
```

## Key Files for Marketplace

| File | Purpose | Size Limit |
|------|---------|-----------|
| `icon.png` | Extension icon | 128x128px |
| `README.md` | Marketplace description | No limit |
| `CHANGELOG.md` | Release notes | No limit |
| `media/` | Screenshots and GIFs | Recommended |
| `.vscodeignore` | Exclude from package | N/A |

## Marketplace Guidelines

1. **Icon & Images**
   - Must be clear at small sizes
   - PNG format preferred
   - 128x128px minimum for icon
   - Screenshots in README help adoption

2. **Description**
   - First line is marketplace summary
   - Should be under 200 characters
   - Include key features

3. **README Quality**
   - Professional tone
   - Clear usage instructions
   - Configuration examples
   - Troubleshooting section
   - Security/Privacy statement

4. **Security**
   - No malware or suspicious code
   - No telemetry without disclosure
   - Respect user privacy
   - Clear data handling

## Troubleshooting

### "Cannot authenticate with given token"
- Regenerate PAT in Azure DevOps
- Re-run `vsce login`
- Ensure publisher name matches

### "Icon file not found"
- Create `media/icon.png` (128x128px)
- Reference in `package.json`: `"icon": "media/icon.png"`

### "Package too large"
- VS Code limit is 50MB
- Use `.vscodeignore` to exclude:
  ```
  **/*.test.ts
  **/__tests__/**
  node_modules/@types/**
  dist/**
  coverage/**
  ```

### Extension not appearing in search
- Can take 30 minutes to 1 hour
- Verify publisher name is correct
- Search uses keywords in `package.json`

## Marketing After Publication

1. **GitHub Release**
   - Create release with changelog
   - Attach vsix file
   - Tag version (v0.5.0)

2. **Documentation**
   - Update project README with marketplace link
   - Add installation instructions
   - Link to changelog

3. **Community**
   - Announce on social media
   - Post to VS Code extensions community
   - Submit to newsletter (optional)

## References

- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI Reference](https://github.com/microsoft/vscode-vsce)
- [Marketplace Policies](https://marketplace.visualstudio.com/vscode/policies/vsmarketplace)
- [Extension Guidelines](https://code.visualstudio.com/api/extension-guides/overview)

---

**Next Steps After Publication:**
1. Monitor reviews and ratings
2. Address user feedback
3. Plan Phase 6: Feature Parity Agents
4. Plan JetBrains plugin (Phase 5.2)
5. Community marketplace (Phase 7)
