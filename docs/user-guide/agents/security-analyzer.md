# Security Analyzer Agent

## Overview

The Security Analyzer agent scans code for security vulnerabilities, suspicious patterns, and compliance issues. It uses pattern matching, AST analysis, and dependency scanning to identify potential security risks.

## Capabilities

- Detect OWASP Top 10 vulnerabilities
- Scan for hardcoded credentials and secrets
- Identify insecure cryptographic practices
- Check for injection vulnerabilities (SQL, XSS, command injection)
- Analyze dependency vulnerabilities
- Verify authentication and authorization patterns
- Check CORS and security header configurations

## Vulnerability Types Detected

| Type | Severity | Description |
|------|----------|-------------|
| `SQL_INJECTION` | Critical | SQL queries with unparameterized user input |
| `XSS_INJECTION` | Critical | Cross-site scripting vulnerabilities |
| `EVAL_USAGE` | Critical | Use of eval() or Function constructor |
| `HARDCODED_CREDENTIALS` | Critical | Passwords, API keys, or secrets in code |
| `COMMAND_INJECTION` | Critical | Shell command injection risks |
| `INSECURE_CRYPTO` | High | Weak cryptographic algorithms (MD5, SHA1) |
| `UNSAFE_DESERIALIZATION` | High | Unsafe deserialization of untrusted data |
| `MISSING_INPUT_VALIDATION` | High | User input used without validation |
| `INSECURE_CORS` | High | Overly permissive CORS configuration |
| `MISSING_AUTHENTICATION` | High | API endpoints without auth checks |
| `RACE_CONDITION` | Medium | Time-of-check-time-of-use issues |
| `INSECURE_RANDOMNESS` | Medium | Math.random() used for security purposes |

## Configuration

```typescript
const securityAnalyzerConfig = {
  id: 'security-analyzer',
  name: 'Security Analyzer',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.2,
    maxTokens: 4096,
  },
  tools: ['readFile', 'findInFiles', 'security-scanner', 'dependency-analyzer'],
  systemPrompt: `You are a security expert. Analyze code for vulnerabilities
    and provide actionable remediation guidance.`,
  maxIterations: 15,
  timeout: 120000,
};
```

## Usage Examples

### Scan a File

```typescript
const result = await agent.execute('Scan src/api/routes.ts for security issues');
```

### Full Project Scan

```typescript
const result = await agent.execute('Perform a security audit of this project');
```

### Check Specific Vulnerability Types

```typescript
const result = await agent.execute(
  'Check all API endpoints for SQL injection and XSS vulnerabilities'
);
```

## Output Format

```
## Security Scan Report

### Summary
- Files scanned: 45
- Critical: 2
- High: 5
- Medium: 3
- Low: 1

### Critical Findings

#### 1. SQL Injection - src/api/users.ts:42
**Risk**: User input directly interpolated into SQL query
**Code**: `db.query(\`SELECT * FROM users WHERE id = \${req.params.id}\`)`
**Fix**: Use parameterized queries
```typescript
db.query('SELECT * FROM users WHERE id = $1', [req.params.id])
```

#### 2. Hardcoded API Key - src/config.ts:15
**Risk**: API key committed to version control
**Fix**: Use environment variables
```typescript
const apiKey = process.env.API_KEY;
```
```

## Integration with CI/CD

```yaml
# GitHub Actions example
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npx scalix-code security-scan --format sarif --output results.sarif
    - uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: results.sarif
```

## Best Practices

1. Run security scans on every PR
2. Set severity thresholds for blocking merges
3. Review and update security patterns regularly
4. Combine automated scanning with manual code review
5. Track remediation progress over time
