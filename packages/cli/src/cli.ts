#!/usr/bin/env node

/**
 * Scalix CLAW CLI
 *
 * Terminal client for agent orchestration
 */

import { Command } from 'commander';
import { version } from './version';
import { agentCommand } from './commands/agent';
import { executeCommand } from './commands/execute';
import { listCommand } from './commands/list';
import { statsCommand } from './commands/stats';
import { repl } from './repl';

const program = new Command();

program
  .name('claw')
  .description('Scalix CLAW - Agent Orchestration Platform CLI')
  .version(version)
  .option('-H, --host <host>', 'API server host', 'localhost')
  .option('-p, --port <port>', 'API server port', '3000')
  .option('-D, --debug', 'Enable debug logging');

// Agent commands
program.addCommand(agentCommand);

// Execution commands
program.addCommand(executeCommand);

// Query commands
program.addCommand(listCommand);
program.addCommand(statsCommand);

// REPL command
program
  .command('repl')
  .description('Start interactive REPL session')
  .action(async (options, cmd) => {
    const host = cmd.optsWithGlobals().host;
    const port = cmd.optsWithGlobals().port;
    const debug = cmd.optsWithGlobals().debug;
    await repl({ host, port, debug });
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

export { program };
