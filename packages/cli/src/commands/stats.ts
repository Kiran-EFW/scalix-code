/**
 * Statistics Commands
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { getClient } from '../utils/client';
import { header, highlight, formatStatus } from '../utils/formatting';
import { error } from '../utils/formatting';

export const statsCommand = new Command('stats')
  .description('Show platform statistics');

statsCommand
  .command('show')
  .alias('s')
  .description('Show platform statistics')
  .action(async (options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const spinner = ora('Fetching platform statistics...').start();

    try {
      const result = await client.getStats();
      spinner.succeed('Platform statistics');

      header('Health');
      console.log(`Status: ${formatStatus(result.health.status)}`);
      console.log(`Agents: ${result.health.agents}`);
      console.log(`Tools: ${result.health.tools}`);
      console.log(`Storage: ${result.health.storage ? chalk.green('OK') : chalk.red('FAIL')}`);

      header('Statistics');
      console.log(`Total Agents: ${highlight(String(result.stats.agents))}`);
      console.log(`Total Tools: ${highlight(String(result.stats.tools))}`);
      console.log(`Total Traces: ${highlight(String(result.stats.traces))}`);
      console.log(`Total Metrics: ${highlight(String(result.stats.metrics))}`);
      console.log(`Total Logs: ${highlight(String(result.stats.logs))}`);

      header('Timestamp');
      console.log(new Date(result.timestamp).toISOString());
    } catch (err) {
      spinner.fail('Failed to fetch statistics');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
