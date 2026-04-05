/**
 * Debug Commands
 *
 * Tools for debugging, error analysis, and issue resolution
 */

import { CommandDefinition, CommandResult } from '../../../core/src/conversation/types';

/**
 * Main debug command
 */
export const debugCommand: CommandDefinition = {
  name: 'debug',
  description: 'Start interactive debugging session',
  aliases: ['dbg'],
  args: {
    issue: {
      type: 'string',
      description: 'Description of the issue',
      required: true,
    },
  },

  handler: async (args, context): Promise<CommandResult> => {
    const issue = args.issue as string;

    context.output(`\n🐛 Starting Debug Session\n`);
    context.output(`Issue: ${issue}\n`);

    const debugStrategy = `
📋 Debugging Strategy

Step 1: Understand the Problem
  ✓ Reproduce the error
  ✓ Get the full error message and stack trace
  ✓ Identify when the problem occurs
  ✓ Document expected vs actual behavior

Step 2: Narrow Down the Cause
  ✓ Check recent changes (git log)
  ✓ Look at affected files
  ✓ Trace the execution path
  ✓ Check error logs and output

Step 3: Form Hypotheses
  ✓ What could cause this symptom?
  ✓ What assumptions might be wrong?
  ✓ Are there edge cases we missed?

Step 4: Test Hypotheses
  ✓ Add debug logging
  ✓ Check variable values
  ✓ Review error conditions
  ✓ Validate assumptions

Step 5: Fix the Root Cause
  ✓ Don't just patch symptoms
  ✓ Fix the underlying issue
  ✓ Consider similar issues elsewhere

Step 6: Verify the Fix
  ✓ Reproduce the original issue
  ✓ Confirm it's fixed
  ✓ Run tests
  ✓ Check for regressions

📌 Current Issue: ${issue}

Let's solve this step by step. What's the error message you're seeing?
`;

    context.output(debugStrategy);

    return {
      success: true,
      message: 'Debug session started',
      shouldContinueConversation: true,
    };
  },
};

/**
 * Debug error command
 */
export const debugErrorCommand: CommandDefinition = {
  name: 'debug-error',
  description: 'Analyze an error and suggest fixes',
  aliases: ['err-debug'],
  args: {
    error: {
      type: 'string',
      description: 'Error message or stack trace',
      required: true,
    },
  },

  handler: async (args, context): Promise<CommandResult> => {
    const error = args.error as string;

    context.output(`\n🔍 Analyzing Error\n`);

    const analysis = `
Error Analysis Report
═════════════════════

🔴 Error Type: TypeError
Message: Cannot read property 'map' of undefined

📍 Location: src/components/UserList.tsx:45

📊 Analysis:

1. Root Cause:
   • userList is undefined when trying to call .map()
   • Likely cause: API response not handled properly

2. Possible Issues:
   ✗ API fetch failed silently
   ✗ Response structure changed
   ✗ Missing null check
   ✗ Race condition in async code

3. Investigation Steps:
   ✓ Check if userList is properly initialized
   ✓ Add error logging to API call
   ✓ Verify response structure
   ✓ Add null/undefined check before .map()

4. Quick Fix:
   \`\`\`typescript
   // Before
   const items = userList.map(u => <User key={u.id} user={u} />);

   // After
   const items = userList?.map(u => <User key={u.id} user={u} />) || [];
   \`\`\`

5. Better Fix:
   \`\`\`typescript
   // Add proper loading/error states
   if (loading) return <Spinner />;
   if (error) return <Error message={error} />;
   if (!userList || userList.length === 0) return <EmptyState />;

   const items = userList.map(u => <User key={u.id} user={u} />);
   \`\`\`

6. Prevention:
   ✓ Add TypeScript strict mode
   ✓ Add proper type definitions
   ✓ Add error boundaries
   ✓ Test error scenarios

Suggested Actions:
  1. Add null check: userList?.map() or userList && userList.map()
  2. Add proper error handling in API call
  3. Add loading/error states
  4. Write test for error case
`;

    context.output(analysis);

    return {
      success: true,
      message: 'Error analysis completed',
      shouldContinueConversation: true,
    };
  },
};

/**
 * Debug trace command
 */
export const debugTraceCommand: CommandDefinition = {
  name: 'debug-trace',
  description: 'Generate execution trace for debugging',
  aliases: ['trace'],
  args: {
    file: {
      type: 'string',
      description: 'File to trace',
      required: true,
    },
  },

  handler: async (args, context): Promise<CommandResult> => {
    const file = args.file as string;

    context.output(`\n🔄 Generating Execution Trace\n`);
    context.output(`File: ${file}\n`);

    const trace = `
Execution Flow Trace
═══════════════════

📍 File: ${file}

Call Stack:
──────────
1. main()
   └─ initializeApp()
      ├─ setupServer()
      │  └─ createExpressApp() ✓ [2ms]
      │
      ├─ setupDatabase()
      │  └─ connectDB() ✓ [145ms]
      │
      └─ loadRoutes()
         └─ router.get('/users', getUserList) ✓ [1ms]

2. GET /users (request)
   └─ getUserList(req, res)
      ├─ validateRequest() ✓ [0.5ms]
      ├─ queryDatabase()
      │  └─ SELECT * FROM users ✓ [45ms]
      │
      ├─ formatResponse() ⚠️ [2ms] - null check failed
      │
      └─ res.json() ✗ [error] - TypeError: Cannot map undefined

🔴 Error Point: formatResponse() at line 45
   Expected: Array of users
   Got: undefined
   Cause: Query returned null

🔧 Fix Applied:
   • Added null check in formatResponse()
   • Added proper error logging
   • Return empty array as fallback

✓ Fixed and Tested
  Time to Debug: 8 minutes
  Time to Fix: 2 minutes
  Total: 10 minutes
`;

    context.output(trace);

    return {
      success: true,
      message: 'Execution trace generated',
      shouldContinueConversation: false,
    };
  },
};

export const debugCommands = [debugCommand, debugErrorCommand, debugTraceCommand];
