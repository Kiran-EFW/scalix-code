# Guardrails System

Scalix Code has built-in safety features to prevent accidental damage.

## What Are Guardrails?

Rules that protect you from dangerous operations:

```
Operation Requested
  ↓
Match Against Rules
  ↓
🔴 Critical? → BLOCK
🟠 High? → REQUIRE CONFIRMATION
🟡 Medium? → WARN & CONTINUE
🟢 Safe? → EXECUTE
```

## Default Safety Rules

### 🔴 CRITICAL (BLOCKED)

These operations are always blocked:

```
❌ git push --force-with-lease
❌ git push --force
❌ rm -rf /
❌ rm -rf /*
❌ API keys in command arguments
```

You cannot bypass these. They're absolute.

### 🟠 HIGH PRIORITY (CONFIRMATION REQUIRED)

These require your approval:

```
⚠️ Delete package.json
⚠️ Delete .git
⚠️ Delete src/ directory
⚠️ git reset --hard
⚠️ Drop database
⚠️ Delete /home/*
```

You'll see:
```
Scalix Code wants to delete src/

This is a destructive operation. Confirm? (yes/no)
> yes
```

### 🟡 MEDIUM PRIORITY (WARNING)

These show a warning but continue:

```
⚠️ Overwrite file >100KB
⚠️ Unsafe command chains
⚠️ Commands with shell redirection
```

## Project Guidelines (CLAUDE.md)

If your project has a `CLAUDE.md` file, Scalix Code will:
1. Read your guidelines
2. Check new code against them
3. Respect your standards

### Example CLAUDE.md

```markdown
# Project Guidelines

## Code Quality
- All functions must have JSDoc comments
- Test coverage minimum 80%
- No console.log in production code

## Architecture
- Use TypeScript for all new code
- No mixing of sync/async code
- Keep files under 500 lines

## Security
- No API keys in code
- Always validate user input
- Use parameterized queries for SQL

## Testing
- Write tests before implementation
- Use Vitest, not Jest
- Test error cases
```

Scalix Code will check your code:

```
User: write a new function

Scalix Code: I'll write the function with JSDoc comments (your guideline).
I'll also write tests since you require 80% coverage.
```

## Customizing Guardrails

Add custom rules in `~/.scalix/config.json`:

```json
{
  "guardrails": {
    "confirmDestructive": true,
    "enforceClaudeMd": true,
    "logAuditTrail": true,
    
    "rules": [
      {
        "name": "no-console-in-prod",
        "pattern": "console\\.(log|warn|error)\\(",
        "applies_to": ["src/**/*"],
        "excludes": ["src/debug"],
        "severity": "warning",
        "message": "Remove console.log before committing"
      },
      {
        "name": "require-tests",
        "pattern": "^src/.*\\.ts$",
        "severity": "error",
        "message": "All .ts files must have corresponding .test.ts",
        "check": "file_exists_at_path"
      }
    ]
  }
}
```

## Confirmation Workflow

When Scalix Code needs confirmation:

```
> write a function to delete user accounts

Scalix Code wants to create src/deleteUsers.ts

This operation will create a new file with dangerous permissions.
Review the operation details below, then confirm.

File: src/deleteUsers.ts
Lines: 35
Contains: Database deletion, permission checks required

Confirm? (yes/no/details)
```

Options:
- `yes` / `approve` - Go ahead
- `no` / `reject` - Cancel
- `details` - Show more information
- Timeout after 5 minutes - Operation cancelled

## Audit Trail

Every operation is logged. View with:

```
> show audit trail
```

Output:
```
Operation: write file
File: src/users.ts
Status: SUCCESS
Timestamp: 2024-04-05T10:30:00Z
User: kiran
Reason: "write unit tests"

Operation: run bash
Command: npm test
Status: SUCCESS
Timestamp: 2024-04-05T10:30:15Z
...
```

## Common Scenarios

### Scenario 1: Large File Overwrite

```
> update src/utils.ts with new functions

Scalix Code: This file is 150KB. Overwriting large files 
can cause data loss. Confirm?

[You review the changes]

> yes
```

### Scenario 2: Destructive Git Operation

```
> undo the last commit with git reset --hard

Scalix Code: git reset --hard will DISCARD all uncommitted changes.
This cannot be undone. Are you sure?

> no

[Cancelled. Nothing changed]
```

### Scenario 3: CLAUDE.md Violation

```
> write a function

Scalix Code: Writing function with JSDoc comments 
(as required by your CLAUDE.md).

Adding tests for 80% coverage (as required).
```

### Scenario 4: Blocked Operation

```
> push these changes to main with force

Scalix Code: Cannot execute: git push --force

Force push is disabled for safety. 
Use: git push (regular push)
```

## Best Practices

### 1. Review Before Confirming

Always review what Scalix Code plans to do:

```
> yes, details
```

### 2. Keep CLAUDE.md Updated

Update your guidelines when standards change:

```markdown
# Old Standard
- No JSDoc required

# New Standard  
- All functions must have JSDoc
```

### 3. Use Specific Rules

Be specific with guardrail rules:

```json
{
  "pattern": "^src/api/.*\\.ts$",  // Only API files
  "excludes": ["src/api/tests"],   // Except tests
  "severity": "error"               // Enforced
}
```

### 4. Monitor Audit Trail

Check audit logs regularly:

```
> show audit trail from last 7 days
```

## Disabling Guardrails (Not Recommended)

You can disable guardrails in `~/.scalix/config.json`:

```json
{
  "guardrails": {
    "confirmDestructive": false,    // ⚠️ Not safe!
    "enforceClaudeMd": false        // ⚠️ Not safe!
  }
}
```

**Not recommended.** Guardrails protect you from mistakes.

---

See [GETTING_STARTED.md](GETTING_STARTED.md) for more information.
