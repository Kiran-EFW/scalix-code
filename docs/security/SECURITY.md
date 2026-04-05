# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in Scalix Code, please report it responsibly.

**DO NOT** create public GitHub issues for security vulnerabilities.

### How to Report

1. Email: security@scalix-code.dev
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | 24 hours |
| Initial Assessment | 48 hours |
| Fix Development | 7 days (critical), 30 days (other) |
| Public Disclosure | After fix is released |

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.5.x | Yes |
| 0.4.x | Security fixes only |
| < 0.4 | No |

## Security Measures

### Built-in Protections

1. **Input Validation**: All tool inputs are validated for length and dangerous patterns
2. **Rate Limiting**: Per-tool rate limiting prevents abuse
3. **Execution Timeout**: All tool and agent executions have configurable timeouts
4. **Error Isolation**: Tool failures do not crash the host process
5. **Security Scanner**: Built-in scanner detects 34 vulnerability patterns

### Recommended Deployment Security

1. Run behind a reverse proxy with TLS termination
2. Use strong database passwords and rotate regularly
3. Store API keys in environment variables or secret managers
4. Enable audit logging in production
5. Use network policies to restrict internal access
6. Run containers as non-root users
7. Keep dependencies updated

### Self-Hosted Security Benefits

- All data stays in your infrastructure
- No external data transmission except LLM API calls
- Full control over access policies
- No vendor lock-in or data residency concerns
