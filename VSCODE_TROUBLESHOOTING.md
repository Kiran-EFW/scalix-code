# VS Code Extension Troubleshooting Guide

## Quick Diagnostics

First, enable debug logging:
1. Open VS Code Settings (Code > Preferences > Settings)
2. Search for "scalix.debug"
3. Enable the checkbox
4. Open Output panel (View > Output)
5. Select "Scalix" from dropdown
6. Reproduce the issue and check logs

## Common Issues & Solutions

### Connection Issues

#### "Cannot connect to Scalix server"

**Symptoms:**
- Error message when running any command
- No results appear
- Status bar shows disconnected

**Solutions:**

1. **Verify API server is running:**
   ```bash
   # In terminal, check if Scalix API is running
   curl http://localhost:3000/health
   
   # Should return: {"status": "ok", "timestamp": "..."}
   ```

2. **Check API URL configuration:**
   - Open Settings (Cmd+, / Ctrl+,)
   - Search for "scalix.apiUrl"
   - Verify it matches your server URL (default: http://localhost:3000)
   - If using remote server, ensure firewall allows connection

3. **Check network connectivity:**
   ```bash
   # Test connection
   ping localhost
   
   # If using remote server
   ping your.server.com
   
   # Test specific port
   nc -zv localhost 3000
   ```

4. **Check VS Code extension logs:**
   - Open Output (View > Output)
   - Select "Scalix Debug" channel
   - Look for connection errors
   - Screenshot error for debugging

5. **Restart extension:**
   - Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
   - Type "Developer: Reload Window"
   - Press Enter

#### "Connection timeout"

**Symptoms:**
- Command runs but doesn't complete
- Progress indicator never finishes
- After 30 seconds shows "Timeout"

**Solutions:**

1. **Increase timeout setting:**
   - Settings > Search "scalix.timeout"
   - Increase from default 30000ms to 60000ms (1 minute)
   - For complex analyses, try 120000ms (2 minutes)

2. **Check server performance:**
   - Open Scalix API server logs
   - Look for slow queries or errors
   - Check server CPU/memory usage

3. **Reduce complexity:**
   - For large projects, analyze smaller portions
   - Run "Scalix: Calculate Metrics" on single files first
   - Check what's in openFiles list (might be many files)

4. **Check network latency:**
   ```bash
   ping -c 3 localhost
   # If average > 50ms, network is slow
   ```

### Authentication Issues

#### "API key rejected" or "Unauthorized"

**Symptoms:**
- Command starts but fails with auth error
- Works locally but not with remote server
- "401 Unauthorized" in debug logs

**Solutions:**

1. **Verify API key is set correctly:**
   - Settings > Search "scalix.apiKey"
   - Confirm the key matches your server configuration
   - No extra spaces or quotes

2. **Check server authentication:**
   - If server requires authentication, verify:
     - Server is configured to require auth
     - Your API key is registered in server
     - API key hasn't expired or been revoked

3. **Test with curl:**
   ```bash
   # Without auth
   curl http://localhost:3000/health
   
   # With auth
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        http://localhost:3000/health
   ```

### Command Failures

#### "Command failed: Agent not found"

**Symptoms:**
- Error message mentions unknown agent
- Specific command always fails
- Other commands work fine

**Solutions:**

1. **Verify agents are available:**
   - Open Settings > "scalix.apiUrl"
   - Run this in terminal:
     ```bash
     curl http://localhost:3000/api/agents
     ```
   - Should return list of agents including:
     - codebase-analyzer
     - code-explainer
     - security-analyzer

2. **Check server logs:**
   - Look for errors about missing agents
   - Verify core agents are initialized
   - Check that Phase 4 is complete

3. **Restart API server:**
   ```bash
   # Stop the server (Ctrl+C in terminal)
   # Rebuild
   cd packages/api
   pnpm run build
   
   # Start again
   pnpm run dev
   ```

#### "Analysis failed with unknown error"

**Symptoms:**
- Generic error message
- No details in status bar
- Debug logs don't help

**Solutions:**

1. **Enable maximum debug logging:**
   - Settings > "scalix.debug" = true
   - Output panel should show detailed logs
   - Look for stack traces

2. **Check input validation:**
   - Verify selected code is valid syntax
   - For security scan, ensure file exists
   - For metrics, verify it's supported language

3. **Check API server health:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Check server logs:**
   - Look at the terminal where API server runs
   - Check for errors or exceptions
   - Verify request body was valid JSON

### Performance Issues

#### "Commands take too long to run"

**Symptoms:**
- Analysis takes > 1 minute
- Progress bar seems stuck
- System becomes unresponsive

**Solutions:**

1. **Reduce `maxTokens`:**
   - Settings > "scalix.maxTokens"
   - Lower from 4000 to 2000 for faster responses
   - Trade-off: Less detailed explanations

2. **Reduce analysis scope:**
   - Instead of whole codebase, analyze single files
   - Select specific code instead of entire file
   - Use simpler operations (explain vs analyze)

3. **Check system resources:**
   ```bash
   # macOS
   top -n 1 | head -20
   
   # Linux
   top -bn 1 | head -20
   
   # Windows
   tasklist
   ```
   - If CPU/memory maxed out, close other apps

4. **Check network bandwidth:**
   ```bash
   # If using remote server
   # Check upload/download speeds
   speedtest-cli  # Python tool
   ```

#### "Results panel is slow to load"

**Symptoms:**
- Command completes but results take time
- Results panel displays slowly
- Scrolling is janky

**Solutions:**

1. **Disable syntax highlighting (if available):**
   - Right-click in results panel
   - Toggle "syntax highlighting" off
   - Faster rendering for large outputs

2. **Clear previous results:**
   - Results may accumulate
   - Click "Clear" button in results panel
   - Restart extension if needed

3. **Check VS Code performance:**
   - Help > "Show All Commands"
   - Search "Performance"
   - Check for slow extensions

### Security Scanning Issues

#### "Security scan finds no issues" (but expecting issues)

**Symptoms:**
- Scan runs successfully
- Returns "No issues found" for suspicious code
- Seems to miss vulnerabilities

**Solutions:**

1. **Verify security scanner is working:**
   - Test with known vulnerable code:
     ```javascript
     // SQL injection example
     const query = `SELECT * FROM users WHERE id = ${userId}`;
     ```
   - Run security scan
   - Should flag as vulnerability

2. **Check scanner configuration:**
   - Settings > "scalix.enableSecurityScan" = true
   - Verify security-analyzer agent is available
   - Check server logs for scanner errors

3. **Update model/knowledge:**
   - Security scanning depends on LLM knowledge
   - Ensure using up-to-date model (gpt-4 recommended)
   - Some vulnerabilities might not be recognized

4. **Check file language:**
   - Scanner works best on common languages
   - May have limited support for obscure languages
   - Try on JavaScript/Python/Java first

#### "Security issues appear but seem incorrect"

**Symptoms:**
- False positives reported
- Issues flagged that aren't actually vulnerable
- Suggestions don't make sense

**Solutions:**

1. **False positives are expected:**
   - AI-based security scanning has limitations
   - Not perfect at understanding context
   - Manual review recommended before fixing

2. **Report false positives:**
   - GitHub Issues: https://github.com/scalix-org/scalix-code/issues
   - Include code snippet and explanation why it's false positive
   - Helps improve scanner accuracy

3. **Use in conjunction with other tools:**
   - Consider alongside ESLint, SonarQube, etc.
   - Multiple tools provide better coverage
   - Use Scalix for analysis + explanations

### Hover & Code Actions Issues

#### "Hover explanations not appearing"

**Symptoms:**
- Hover over code shows nothing
- Used to work, now broken
- Works on some files but not others

**Solutions:**

1. **Check hover provider is registered:**
   - Settings > "scalix.hover" (if exists)
   - Or check extension is enabled (Extensions panel)

2. **Wait for cache to populate:**
   - Hover explanations are cached
   - First hover on a function might be slower
   - Subsequent hovers use cache (5 min TTL)

3. **Check file type:**
   - Hover works best on code files
   - May not work on markdown, JSON, etc.
   - Works on: JS, TS, Python, Java, Go, etc.

4. **Hover might be disabled:**
   - Some VS Code settings disable hover
   - Settings > Search "editor.hover"
   - Ensure enabled

#### "Code actions don't appear for security issues"

**Symptoms:**
- Security diagnostics appear in Problems panel
- Right-click shows no code actions
- Used to show "Explain" and "Scan" options

**Solutions:**

1. **Click on the diagnostic:**
   - Click on the error/warning line number
   - Code actions appear in lightbulb menu

2. **Check Problems panel is visible:**
   - View > Problems (or Cmd+Shift+M / Ctrl+Shift+M)
   - Diagnostics should appear
   - Filter by "Scalix"

3. **Verify security scanner ran:**
   - Run "Scalix: Scan for Security Issues" command
   - Results should populate Problems panel
   - Then code actions become available

4. **Restart extension:**
   - Reload window (Cmd+Shift+P > "Reload Window")
   - Code actions should reappear

### Settings & Configuration Issues

#### "Settings changes don't take effect"

**Symptoms:**
- Change API URL but still connects to old one
- Change model but old model still used
- Changes ignored after save

**Solutions:**

1. **Verify settings file syntax:**
   - Settings > Open Raw Settings
   - Look for JSON syntax errors
   - Ensure proper quotes and commas

2. **Reload extension:**
   - Cmd+Shift+P / Ctrl+Shift+P
   - Type "Developer: Reload Window"
   - Press Enter

3. **Check scope of settings:**
   - User settings vs Workspace settings
   - Workspace settings override user settings
   - If local .vscode/settings.json exists, that wins

4. **Verify setting names:**
   - Common typos: "scalix.api_url" vs "scalix.apiUrl"
   - Use IntelliSense to auto-complete
   - Copy from documentation

#### "Cannot find setting in GUI"

**Symptoms:**
- Can't find setting in preferences
- Search for "scalix" returns nothing
- Need to use JSON editing

**Solutions:**

1. **Use JSON settings directly:**
   - Settings > Open Settings (JSON)
   - Add configuration directly:
     ```json
     {
       "scalix.apiUrl": "http://localhost:3000",
       "scalix.debug": true
     }
     ```

2. **Use command line:**
   ```bash
   # From terminal
   code --user-data-dir=/path/to/profile \
        --extensions-dir=/path/to/extensions
   ```

3. **Check extension is installed:**
   - Extensions panel (Cmd+Shift+X / Ctrl+Shift+X)
   - Search "Scalix Code"
   - Ensure it's installed and enabled

### Extension Not Showing Up

#### "Extension not installed or not visible"

**Symptoms:**
- Can't find extension in marketplace
- Commands don't appear in command palette
- No "Scalix" options in settings

**Solutions:**

1. **Install extension:**
   - Extensions panel (Cmd+Shift+X)
   - Search "Scalix Code"
   - Click Install button
   - Reload VS Code

2. **Check if already installed:**
   - Extensions panel
   - Search "Scalix"
   - Should show with checkmark if installed

3. **Manual installation:**
   ```bash
   # If VSIX file exists
   code --install-extension scalix-vscode-0.5.0.vsix
   
   # Reload VS Code
   ```

4. **Check VS Code version:**
   - Help > About
   - Requires VS Code 1.85.0+
   - If older, update VS Code first

## Getting Help

If none of these solutions work:

1. **Collect Debug Information:**
   - Enable `scalix.debug`
   - Reproduce issue
   - Copy logs from Output panel

2. **Create GitHub Issue:**
   - Go to https://github.com/scalix-org/scalix-code/issues
   - Click "New Issue"
   - Include:
     - VS Code version
     - Extension version
     - OS (macOS/Linux/Windows)
     - Steps to reproduce
     - Debug logs
     - Expected vs actual behavior

3. **Include Details:**
   ```markdown
   - **VS Code Version:** 1.87.0
   - **OS:** macOS 14.0
   - **Extension Version:** 0.5.0
   - **Scalix Server Version:** 0.5.0
   
   **Steps to Reproduce:**
   1. Open project with X files
   2. Run "Scalix: Analyze Code"
   3. See error...
   
   **Debug Logs:**
   [Paste logs here]
   ```

## Server-Side Troubleshooting

If issues persist, check the API server:

```bash
# Check server is running
lsof -i :3000

# Check server logs
cd packages/api
tail -f logs/scalix.log

# Test server directly
curl http://localhost:3000/health

# Check specific endpoint
curl http://localhost:3000/api/agents
curl http://localhost:3000/api/agents/codebase-analyzer
```

## Performance Baseline

Expected performance (on 2024 hardware):

| Operation | Expected Time | Notes |
|-----------|----------------|-------|
| Codebase Analysis | 10-30 seconds | Whole project |
| Code Explanation | 5-15 seconds | Per function |
| Security Scan | 10-20 seconds | Per file |
| Metrics Calculation | 1-5 seconds | Per file |
| Hover Explanation | 5-10 sec (first) | Cached after |

If significantly slower, check:
- Network latency
- LLM model speed
- System resources
- File/project size

---

**Last Updated:** April 5, 2026  
**Maintained By:** Scalix Core Team  
**Report Issues:** https://github.com/scalix-org/scalix-code/issues
