/**
 * Hello World Example
 *
 * Simple example showing basic agent creation and execution
 */

import { createPlatform } from '../core/src/platform';

async function main() {
  console.log('🚀 Scalix CLAW - Hello World Example\n');

  // Create platform instance
  const platform = createPlatform({ debug: true });

  // Register built-in tools
  const toolRegistry = platform.getToolRegistry();
  await (toolRegistry as any).registerBuiltins();

  // Create an agent
  const agent = await platform.createAgent({
    id: 'hello-agent',
    name: 'Hello Agent',
    description: 'A simple agent that says hello',
    model: {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
    },
    tools: ['echo', 'get_current_time'],
    systemPrompt:
      'You are a helpful assistant. When the user greets you, respond warmly and tell them the current time.',
  });

  console.log('✅ Agent created:', agent.name);
  console.log('📋 Agent ID:', agent.id);
  console.log('🛠️  Tools available:', agent.config.tools.join(', '));
  console.log();

  // Execute the agent
  console.log('🤖 Executing agent with input: "Hello!"...\n');
  const result = await agent.execute('Hello! What time is it?');

  // Display results
  console.log('📊 Execution Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Status:', result.status);
  console.log('Duration:', result.duration, 'ms');
  console.log('Iterations:', result.iterations);
  console.log('Tool Calls:', result.toolCalls.length);
  console.log('Cost:', `$${result.cost.costUSD.toFixed(4)}`);
  console.log('Output:', result.output);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();

  // Display observability data
  if (result.toolCalls.length > 0) {
    console.log('🔧 Tool Calls:');
    result.toolCalls.forEach((call) => {
      console.log(
        `  • ${call.toolName}(${JSON.stringify(call.arguments)})`
      );
    });
    console.log();
  }

  // Display execution trace
  console.log('📈 Execution Trace:');
  result.trace.forEach((span) => {
    console.log(`  • ${span.name} (${span.duration}ms)`);
    span.events.forEach((event) => {
      console.log(`    - ${event.name}`);
    });
  });
  console.log();

  // Display platform stats
  const stats = platform.getStats();
  console.log('📊 Platform Stats:');
  console.log(`  Agents: ${stats.agents}`);
  console.log(`  Tools: ${stats.tools}`);
  console.log(`  Traces: ${stats.traces}`);
  console.log(`  Metrics: ${stats.metrics}`);
  console.log();

  // Shutdown
  await platform.shutdown();
  console.log('✅ Platform shutdown complete');
}

main().catch(console.error);
