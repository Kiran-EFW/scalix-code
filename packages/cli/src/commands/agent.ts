/**
 * Agent Management Commands
 */

import { Command } from 'commander';
import ora from 'ora';
import { getClient } from '../utils/client';
import { success, error, header, highlight, formatTable } from '../utils/formatting';

export const agentCommand = new Command('agent')
  .description('Manage agents');

// Create agent
agentCommand
  .command('create <id> <name>')
  .description('Create a new agent')
  .option('-d, --description <desc>', 'Agent description')
  .option('-m, --model <model>', 'Model name', 'claude-3-sonnet-20240229')
  .option('-p, --provider <provider>', 'LLM provider', 'anthropic')
  .option('-t, --tools <tools...>', 'Available tools', ['echo'])
  .option('-s, --system-prompt <prompt>', 'System prompt')
  .action(async (id, name, options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const spinner = ora('Creating agent...').start();

    try {
      const agent = await client.createAgent({
        id,
        name,
        description: options.description,
        model: {
          provider: options.provider,
          model: options.model,
        },
        tools: options.tools,
        systemPrompt: options.systemPrompt,
      });

      spinner.succeed('Agent created');
      success(`ID: ${highlight(agent.id)}`);
      success(`Name: ${agent.name}`);
      success(`Tools: ${agent.tools.join(', ')}`);
    } catch (err) {
      spinner.fail('Failed to create agent');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// List agents
agentCommand
  .command('list')
  .alias('ls')
  .description('List all agents')
  .action(async (options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const spinner = ora('Fetching agents...').start();

    try {
      const result = await client.listAgents();
      spinner.succeed(`Found ${result.total} agent(s)`);

      if (result.agents.length === 0) {
        console.log('No agents found');
        return;
      }

      header('Agents');
      const data = [
        ['ID', 'Name', 'Provider', 'Model', 'Tools'],
        ...result.agents.map((agent: any) => [
          agent.id,
          agent.name,
          agent.model.provider,
          agent.model.model,
          agent.tools.join(', '),
        ]),
      ];
      console.log(formatTable(data));
    } catch (err) {
      spinner.fail('Failed to fetch agents');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Get agent details
agentCommand
  .command('get <agentId>')
  .description('Get agent details')
  .action(async (agentId, options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const spinner = ora(`Fetching agent ${highlight(agentId)}...`).start();

    try {
      const agent = await client.getAgent(agentId);
      spinner.succeed('Agent details');

      header(agent.name);
      console.log(`ID: ${agent.id}`);
      console.log(`Description: ${agent.description || 'N/A'}`);
      console.log(`Provider: ${agent.model.provider}`);
      console.log(`Model: ${agent.model.model}`);
      console.log(`Tools: ${agent.tools.join(', ')}`);
      console.log(`System Prompt: ${agent.systemPrompt || 'N/A'}`);
      console.log(`Max Iterations: ${agent.maxIterations || 'default'}`);
      console.log(`Timeout: ${agent.timeout || 'default'} ms`);
    } catch (err) {
      spinner.fail('Failed to fetch agent');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Delete agent
agentCommand
  .command('delete <agentId>')
  .description('Delete an agent')
  .option('-f, --force', 'Skip confirmation')
  .action(async (agentId, options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const spinner = ora(`Deleting agent ${highlight(agentId)}...`).start();

    try {
      await client.deleteAgent(agentId);
      spinner.succeed('Agent deleted');
      success(`Agent ${highlight(agentId)} has been deleted`);
    } catch (err) {
      spinner.fail('Failed to delete agent');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
