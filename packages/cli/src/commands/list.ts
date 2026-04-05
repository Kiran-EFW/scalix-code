/**
 * List Commands
 */

import { Command } from 'commander';
import ora from 'ora';
import { getClient } from '../utils/client';
import { header, formatTable, formatDuration } from '../utils/formatting';
import { error } from '../utils/formatting';

export const listCommand = new Command('list')
  .description('List resources');

// List logs
listCommand
  .command('logs')
  .description('List recent logs')
  .option('-l, --level <level>', 'Log level filter')
  .option('--limit <count>', 'Number of logs', '20')
  .action(async (options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const spinner = ora('Fetching logs...').start();

    try {
      const result = await client.getLogs(options.level, parseInt(options.limit));
      spinner.succeed(`Found ${result.total} log(s)`);

      if (result.logs.length === 0) {
        console.log('No logs found');
        return;
      }

      header('Recent Logs');
      const data = [
        ['Timestamp', 'Level', 'Message'],
        ...result.logs.map((log: any) => [
          new Date(log.timestamp).toLocaleTimeString(),
          log.level,
          log.message.substring(0, 60),
        ]),
      ];
      console.log(formatTable(data));
    } catch (err) {
      spinner.fail('Failed to fetch logs');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// List traces
listCommand
  .command('traces')
  .description('List recent traces')
  .option('--limit <count>', 'Number of traces', '20')
  .action(async (options, cmd) => {
    const { host, port, debug } = cmd.optsWithGlobals();
    const client = getClient({ host, port, debug });

    const spinner = ora('Fetching traces...').start();

    try {
      const result = await client.getTraces(parseInt(options.limit));
      spinner.succeed(`Found ${result.total} trace(s)`);

      if (result.traces.length === 0) {
        console.log('No traces found');
        return;
      }

      header('Recent Traces');
      const data = [
        ['Trace ID', 'Spans', 'Duration', 'Status'],
        ...result.traces.map((trace: any) => [
          trace.traceId.substring(0, 8),
          String(trace.spans),
          formatDuration(trace.duration),
          trace.status,
        ]),
      ];
      console.log(formatTable(data));
    } catch (err) {
      spinner.fail('Failed to fetch traces');
      error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });
