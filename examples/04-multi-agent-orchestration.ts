/**
 * Multi-Agent Orchestration Example
 *
 * Shows how to create and coordinate multiple agents using the platform
 */

import { createPlatform } from '@scalix/core';

async function main() {
  console.log('🚀 Scalix Code - Multi-Agent Orchestration\n');

  // Create platform
  const platform = createPlatform({ debug: false });

  // Register built-in tools
  const toolRegistry = platform.getToolRegistry();
  await (toolRegistry as any).registerBuiltins();

  // Create multiple agents
  console.log('🤖 Creating agents...');

  const agentA = await platform.createAgent({
    id: 'analyzer',
    name: 'Data Analyzer',
    description: 'Analyzes data and extracts insights',
    model: {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
    },
    tools: ['echo'],
    systemPrompt:
      'You are a data analyst. When given data, analyze it and provide insights.',
  });

  const agentB = await platform.createAgent({
    id: 'summarizer',
    name: 'Summarizer',
    description: 'Summarizes text and creates reports',
    model: {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
    },
    tools: ['echo'],
    systemPrompt:
      'You are a technical writer. Create concise summaries of provided information.',
  });

  const agentC = await platform.createAgent({
    id: 'validator',
    name: 'Validator',
    description: 'Validates analysis and checks quality',
    model: {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
    },
    tools: ['echo'],
    systemPrompt:
      'You are a quality assurance specialist. Check the quality and accuracy of provided content.',
  });

  console.log(`✅ Created ${platform.getAgents().length} agents`);
  console.log();

  // Sequential execution (A → B → C)
  console.log('📊 Sequential Workflow (Analysis → Summary → Validation)\n');

  const input = 'Sales increased 25% in Q1 2026, costs decreased 10%';

  // Step 1: Analyzer
  console.log('1️⃣  Analyzing data...');
  const analysisResult = await agentA.execute(input);
  console.log(`   Status: ${analysisResult.status}`);
  console.log(`   Duration: ${analysisResult.duration}ms`);
  console.log();

  // Step 2: Summarizer (uses analysis output)
  console.log('2️⃣  Summarizing analysis...');
  const summaryInput = `Please summarize this analysis: ${analysisResult.output}`;
  const summaryResult = await agentB.execute(summaryInput);
  console.log(`   Status: ${summaryResult.status}`);
  console.log(`   Duration: ${summaryResult.duration}ms`);
  console.log();

  // Step 3: Validator (uses summary)
  console.log('3️⃣  Validating summary...');
  const validationInput = `Please validate this summary: ${summaryResult.output}`;
  const validationResult = await agentC.execute(validationInput);
  console.log(`   Status: ${validationResult.status}`);
  console.log(`   Duration: ${validationResult.duration}ms`);
  console.log();

  // Calculate total metrics
  const totalDuration = analysisResult.duration + summaryResult.duration + validationResult.duration;
  const totalCost = analysisResult.cost.costUSD + summaryResult.cost.costUSD + validationResult.cost.costUSD;
  const totalTokens = analysisResult.cost.inputTokens + analysisResult.cost.outputTokens +
                      summaryResult.cost.inputTokens + summaryResult.cost.outputTokens +
                      validationResult.cost.inputTokens + validationResult.cost.outputTokens;

  console.log('📈 Workflow Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`Total Iterations: ${analysisResult.iterations + summaryResult.iterations + validationResult.iterations}`);
  console.log(`Total Tokens: ${totalTokens}`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();

  // Show platform statistics
  const stats = platform.getStats();
  console.log('📊 Platform Statistics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Agents: ${stats.agents}`);
  console.log(`Tools: ${stats.tools}`);
  console.log(`Traces: ${stats.traces}`);
  console.log(`Metrics: ${stats.metrics}`);
  console.log(`Logs: ${stats.logs}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();

  // Cleanup
  await platform.shutdown();
  console.log('✅ Example completed');
}

main().catch(console.error);
