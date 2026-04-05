/**
 * Example: Code Analysis with Developer Agents
 *
 * Demonstrates how to use Scalix Code's built-in developer agents:
 * - CodebaseAnalyzer: Understand project structure
 * - CodeExplainer: Explain how code works
 * - SecurityAnalyzer: Find security issues
 */

import { ScalixCodePlatform } from '../core/src/platform';
import { createDefaultProvider } from '../core/src/agent/llm-provider';
import {
  codebaseAnalyzerConfig,
  codeExplainerConfig,
  securityAnalyzerConfig,
} from '../core/src/agents';
import { createToolRegistry } from '../core/src/tools';

async function runExample() {
  console.log('🔍 Scalix Code Developer Agents Example\n');

  // Create platform with real LLM provider
  const platform = ScalixCodePlatform.createPlatform({
    llmProvider: createDefaultProvider(),
  });

  // Get tool registry
  const toolRegistry = createToolRegistry();

  // Example 1: Analyze codebase
  console.log('📊 Example 1: Analyzing codebase structure...\n');
  const codebaseAgent = await platform.createAgent(codebaseAnalyzerConfig);

  const codebaseResult = await codebaseAgent.execute({
    goal: 'Analyze the structure of this project and explain its architecture',
    context: {
      projectPath: process.cwd(),
      fileContext: ['package.json', 'src/'],
    },
  });

  console.log('✅ Codebase Analysis Result:');
  console.log(`Status: ${codebaseResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Tools used: ${codebaseResult.toolCalls.map(t => t.name).join(', ')}`);
  console.log(`Cost: $${codebaseResult.cost.costUSD.toFixed(6)}\n`);

  // Example 2: Explain code
  console.log('💡 Example 2: Explaining code functionality...\n');
  const explainerAgent = await platform.createAgent(codeExplainerConfig);

  const explainResult = await explainerAgent.execute({
    goal: 'Explain how the agent executor works and show the key function calls',
    context: {
      filePath: 'core/src/agent/executor.ts',
    },
  });

  console.log('✅ Code Explanation Result:');
  console.log(`Status: ${explainResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Iterations: ${explainResult.iterations}`);
  console.log(`Cost: $${explainResult.cost.costUSD.toFixed(6)}\n`);

  // Example 3: Security analysis
  console.log('🔒 Example 3: Scanning code for security issues...\n');
  const securityAgent = await platform.createAgent(securityAnalyzerConfig);

  const securityResult = await securityAgent.execute({
    goal: 'Scan this codebase for potential security vulnerabilities and report findings',
    context: {
      projectPath: process.cwd(),
      fileTypes: ['.ts', '.js'],
    },
  });

  console.log('✅ Security Analysis Result:');
  console.log(`Status: ${securityResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Tools used: ${securityResult.toolCalls.map(t => t.name).join(', ')}`);
  console.log(`Cost: $${securityResult.cost.costUSD.toFixed(6)}\n`);

  // Summary
  console.log('📈 Summary:');
  const totalCost = codebaseResult.cost.costUSD + explainResult.cost.costUSD + securityResult.cost.costUSD;
  console.log(`Total operations: 3`);
  console.log(`Total cost: $${totalCost.toFixed(6)}`);
  console.log(`Total iterations: ${codebaseResult.iterations + explainResult.iterations + securityResult.iterations}`);

  // Shutdown
  await platform.shutdown();
  console.log('\n✨ Example complete!');
}

// Run the example
runExample().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
