/**
 * Agent Execution Commands
 */

import { Command } from 'commander';
import ora from 'ora';
import { getClient } from '../utils/client';
import { success, error, header, highlight, formatDuration, formatCost, formatTable, formatStatus } from '../utils/formatting';

export const executeCommand = new Command('exec')
  .description('Execute agents');

// Execute agent
executeCommand
  .command('run <agentId> <input...>')
  .description('Execute an agent')
  .action(async (agentId, input, options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const inputText = input.join(' ');
    const spinner = ora(`Executing agent ${highlight(agentId)}...`).start();

    try {
      const result = await client.execute({
        agentId,
        input: inputText,
      });

      spinner.succeed('Execution completed');

      header('Execution Result');
      console.log(`Status: ${formatStatus(result.status)}`);
      console.log(`Duration: ${formatDuration(result.duration)}`);
      console.log(`Iterations: ${result.iterations}`);
      console.log(`Tool Calls: ${result.toolCalls?.length || 0}`);
      console.log(`Cost: ${formatCost(result.cost.costUSD)}`);

      if (result.output) {
        header('Output');
        console.log(result.output);
      }

      if (result.toolCalls && result.toolCalls.length > 0) {
        header('Tool Calls');
        const data = [
          ['Tool', 'Arguments'],
          ...result.toolCalls.map((call: any) => [
            call.toolName,
            JSON.stringify(call.arguments),
          ]),
        ];
        console.log(formatTable(data));
      }

      if (result.error) {
        header('Error');
        error(result.error);
      }
    } catch (err) {
      spinner.fail('Execution failed');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// Get execution history
executeCommand
  .command('history <agentId>')
  .description('Get execution history for an agent')
  .option('-l, --limit <count>', 'Number of results', '10')
  .option('-o, --offset <count>', 'Offset for pagination', '0')
  .action(async (agentId, options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const limit = parseInt(options.limit);
    const offset = parseInt(options.offset);

    const spinner = ora(`Fetching execution history for ${highlight(agentId)}...`).start();

    try {
      const result = await client.getExecutionHistory(agentId, limit, offset);
      spinner.succeed(`Found ${result.total} execution(s)`);

      if (result.executions.length === 0) {
        console.log('No executions found');
        return;
      }

      header(`Execution History (${result.executions.length}/${result.total})`);
      const data = [
        ['Execution ID', 'Status', 'Duration', 'Iterations', 'Cost'],
        ...result.executions.map((exec: any) => [
          exec.executionId.substring(0, 8),
          formatStatus(exec.status),
          formatDuration(exec.duration),
          String(exec.iterations),
          formatCost(exec.cost.costUSD),
        ]),
      ];
      console.log(formatTable(data));
    } catch (err) {
      spinner.fail('Failed to fetch history');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
