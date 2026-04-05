/**
 * Interactive REPL Mode
 */

import * as readline from 'readline';
import chalk from 'chalk';
import { getClient, testConnection } from './utils/client';
import { success, error, warning, header, highlight, formatDuration, formatCost, formatStatus } from './utils/formatting';
import { printWelcome, printGoodbye } from './utils/logo';

interface ReplContext {
  client: ReturnType<typeof getClient>;
  currentAgent: string | null;
  history: string[];
  debug: boolean;
}

export async function repl(config: any): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const context: ReplContext = {
    client: getClient(config),
    currentAgent: null,
    history: [],
    debug: config.debug || false,
  };

  // Print welcome banner
  printWelcome();

  // Test connection
  const connected = await testConnection(config);
  if (!connected) {
    error(`Cannot connect to API server at ${config.host}:${config.port}`);
    rl.close();
    process.exit(1);
  }

  console.log(`Connected to ${highlight(`${config.host}:${config.port}`)}`);
  console.log(`Type ${highlight('help')} for available commands\n`);

  const prompt = (): void => {
    const prefix = context.currentAgent ? `[${highlight(context.currentAgent)}]` : '[]';
    rl.question(`${prefix} > `, (input) => {
      handleInput(input.trim(), context, rl).catch((err) => {
        error(String(err));
        prompt();
      });
    });
  };

  prompt();
}

async function handleInput(
  input: string,
  context: ReplContext,
  rl: readline.Interface
): Promise<void> {
  if (!input) {
    const prompt = context.currentAgent ? `[${highlight(context.currentAgent)}]` : '[]';
    rl.question(`${prompt} > `, (nextInput) => {
      handleInput(nextInput.trim(), context, rl).catch((err) => {
        error(String(err));
      });
    });
    return;
  }

  // Add to history
  context.history.push(input);

  const [command, ...args] = input.split(/\s+/);

  try {
    switch (command.toLowerCase()) {
      case 'help':
        showHelp();
        break;

      case 'quit':
      case 'exit':
        printGoodbye();
        rl.close();
        process.exit(0);

      case 'agent':
        if (args[0] === 'list' || args[0] === 'ls') {
          await showAgents(context);
        } else if (args[0] === 'select') {
          context.currentAgent = args[1] || null;
          if (context.currentAgent) {
            success(`Selected agent: ${highlight(context.currentAgent)}`);
          }
        } else {
          warning(`Unknown agent command: ${args[0]}`);
        }
        break;

      case 'exec':
      case 'execute':
        if (!context.currentAgent) {
          error('No agent selected. Use: agent select <agentId>');
        } else {
          await executeAgent(context, args.join(' '));
        }
        break;

      case 'stats':
        await showStats(context);
        break;

      case 'clear':
        console.clear();
        break;

      case 'history':
        showHistory(context);
        break;

      default:
        warning(`Unknown command: ${command}`);
        console.log(`Type ${highlight('help')} for available commands`);
    }
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
  }

  // Continue REPL
  const prompt = context.currentAgent ? `[${highlight(context.currentAgent)}]` : '[]';
  rl.question(`${prompt} > `, (nextInput) => {
    handleInput(nextInput.trim(), context, rl).catch((err) => {
      error(String(err));
    });
  });
}

function showHelp(): void {
  header('Available Commands');
  console.log(`
  ${highlight('agent list|ls')}           - List all agents
  ${highlight('agent select <id>')}        - Select an agent to work with
  ${highlight('execute|exec <input>')}     - Execute current agent
  ${highlight('stats')}                    - Show platform statistics
  ${highlight('history')}                  - Show command history
  ${highlight('clear')}                    - Clear screen
  ${highlight('help')}                     - Show this help
  ${highlight('exit|quit')}                - Exit REPL
  `);
}

async function showAgents(context: ReplContext): Promise<void> {
  try {
    const result = await context.client.listAgents();
    if (result.agents.length === 0) {
      console.log('No agents found');
      return;
    }

    header(`Agents (${result.total})`);
    result.agents.forEach((agent: any) => {
      const mark = context.currentAgent === agent.id ? '▶ ' : '  ';
      console.log(`${mark}${highlight(agent.id)} - ${agent.name}`);
    });
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
  }
}

async function executeAgent(context: ReplContext, input: string): Promise<void> {
  try {
    console.log(); // Add spacing
    const spinner = require('ora')(`Executing...`).start();

    const result = await context.client.execute({
      agentId: context.currentAgent!,
      input,
    });

    spinner.succeed('Execution completed');

    header('Result');
    console.log(`Status: ${formatStatus(result.status)}`);
    console.log(`Duration: ${formatDuration(result.duration)}`);
    console.log(`Cost: ${formatCost(result.cost.costUSD)}`);

    if (result.output) {
      header('Output');
      console.log(result.output);
    }
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
  }
}

async function showStats(context: ReplContext): Promise<void> {
  try {
    const result = await context.client.getStats();

    header('Platform Statistics');
    console.log(`Health: ${formatStatus(result.health.status)}`);
    console.log(`Agents: ${result.stats.agents}`);
    console.log(`Tools: ${result.stats.tools}`);
    console.log(`Traces: ${result.stats.traces}`);
    console.log(`Logs: ${result.stats.logs}`);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
  }
}

function showHistory(context: ReplContext): void {
  if (context.history.length === 0) {
    console.log('No command history');
    return;
  }

  header('Command History');
  context.history.forEach((cmd, index) => {
    console.log(`${String(index + 1).padStart(3, ' ')} ${cmd}`);
  });
}
