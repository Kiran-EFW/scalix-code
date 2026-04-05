/**
 * API Client Example
 *
 * Shows how to use the HTTP client to interact with the Scalix Code API
 */

import { createClient } from '@scalix/sdk';

async function main() {
  console.log('🚀 Scalix Code - API Client Example\n');

  // Create client pointing to API server
  const client = createClient({
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
  });

  try {
    // Check health
    console.log('📋 Checking API health...');
    const health = await client.health();
    console.log('✅ API is healthy:', health.status);
    console.log();

    // Create an agent
    console.log('🤖 Creating agent...');
    const agent = await client.createAgent({
      id: 'api-demo-agent',
      name: 'API Demo Agent',
      description: 'Agent created via HTTP API',
      model: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
      },
      tools: ['echo', 'get_current_time'],
      systemPrompt: 'You are a helpful assistant.',
      maxIterations: 10,
    });
    console.log('✅ Agent created:', agent.id);
    console.log();

    // List agents
    console.log('📋 Listing agents...');
    const agents = await client.listAgents();
    console.log(`✅ Found ${agents.total} agent(s)`);
    agents.agents.forEach((a: any) => {
      console.log(`  • ${a.name} (${a.id})`);
    });
    console.log();

    // Get agent details
    console.log('📋 Getting agent details...');
    const details = await client.getAgent(agent.id);
    console.log('✅ Agent details:', JSON.stringify(details, null, 2));
    console.log();

    // Execute agent
    console.log('🤖 Executing agent...');
    const result = await client.execute({
      agentId: agent.id,
      input: 'What time is it?',
    });
    console.log('✅ Execution completed');
    console.log('   Status:', result.status);
    console.log('   Duration:', result.duration, 'ms');
    console.log('   Output:', result.output);
    console.log('   Cost:', `$${result.cost.costUSD.toFixed(4)}`);
    console.log();

    // Get execution history
    console.log('📋 Getting execution history...');
    const history = await client.getExecutionHistory(agent.id, 5);
    console.log(`✅ Found ${history.total} execution(s)`);
    history.executions.forEach((exec: any) => {
      console.log(`  • ${exec.executionId} - ${exec.status} (${exec.duration}ms)`);
    });
    console.log();

    // Get platform stats
    console.log('📊 Getting platform stats...');
    const stats = await client.getStats();
    console.log('✅ Platform stats:');
    console.log(`   Health: ${stats.health.status}`);
    console.log(`   Agents: ${stats.stats.agents}`);
    console.log(`   Tools: ${stats.stats.tools}`);
    console.log(`   Traces: ${stats.stats.traces}`);
    console.log(`   Logs: ${stats.stats.logs}`);
    console.log();

    // Get logs
    console.log('📝 Getting logs...');
    const logs = await client.getLogs('INFO', 5);
    console.log(`✅ Found ${logs.total} log entry(s)`);
    logs.logs.slice(0, 3).forEach((log: any) => {
      console.log(`  • [${log.level}] ${log.message}`);
    });
    console.log();

    // Update agent
    console.log('🔄 Updating agent...');
    const updated = await client.updateAgent(agent.id, {
      name: 'Updated API Demo Agent',
      tools: ['echo', 'get_current_time', 'random_number'],
    });
    console.log('✅ Agent updated:', updated.message);
    console.log();

    // Delete agent
    console.log('🗑️  Deleting agent...');
    const deleted = await client.deleteAgent(agent.id);
    console.log('✅ Agent deleted:', deleted.message);
    console.log();

    console.log('🎉 API client example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
