/**
 * Scalix Code REPL
 *
 * Interactive conversational interface for Scalix Code
 * Manages multi-turn conversations, tool execution, and agent coordination
 */

import * as readline from 'readline';
import chalk from 'chalk';
import { ScalixConversationEngine } from '../../core/src/conversation/engine';
import { ScalixMainAgent } from '../../core/src/agents/main-agent';
import { ScalixHookRegistry } from '../../core/src/hooks/registry';
import { ToolRegistry } from '../../core/src/tools/registry';
import { ConversationState, ConversationTurn } from '../../core/src/conversation/types';
import { styledBanner, animateExecution, printSuccess, printError, printInfo } from '../../core/src/utils/logo';

interface REPLOptions {
  projectPath: string;
  verbose?: boolean;
  quiet?: boolean;
}

/**
 * Scalix Code REPL implementation
 */
export class ScalixCodeREPL {
  private engine: ScalixConversationEngine | null = null;
  private state: ConversationState | null = null;
  private rl: readline.Interface | null = null;
  private options: REPLOptions;
  private isRunning = false;
  private commandHistory: string[] = [];

  constructor(options: REPLOptions) {
    this.options = options;
  }

  /**
   * Start the REPL
   */
  async start(): Promise<void> {
    try {
      // Show banner
      console.clear();
      styledBanner();

      // Initialize components
      await this.initialize();

      // Show welcome message
      this.showWelcome();

      // Start REPL loop
      await this.startREPLLoop();
    } catch (error) {
      console.error('Failed to start Scalix Code:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the REPL
   */
  async stop(): Promise<void> {
    if (this.engine && this.state) {
      await this.engine.endSession(this.state.sessionId);
      console.log(chalk.cyan('\n✨ Session ended. Goodbye!\n'));
    }
    if (this.rl) {
      this.rl.close();
    }
    this.isRunning = false;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async initialize(): Promise<void> {
    // Create components
    const mainAgent = new ScalixMainAgent();
    const hookRegistry = new ScalixHookRegistry();
    const toolRegistry = new ToolRegistry();

    // Register tools
    await toolRegistry.registerBuiltins();
    await toolRegistry.registerScalixCodeTools();

    // Create conversation engine
    const toolMap = new Map<string, any>();
    for (const tool of toolRegistry.getAll()) {
      toolMap.set(tool.name, { handler: tool.execute });
    }

    this.engine = new ScalixConversationEngine(mainAgent, toolMap);

    // Start session
    this.state = await this.engine.startSession(this.options.projectPath);

    // Setup readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private showWelcome(): void {
    console.log(chalk.bold.cyan('\n🚀 Welcome to Scalix Code!\n'));
    console.log(chalk.cyan('Your intelligent coding assistant.\n'));
    console.log(chalk.dim('Commands:'));
    console.log(chalk.dim('  /help       - Show available commands'));
    console.log(chalk.dim('  /tools      - List available tools'));
    console.log(chalk.dim('  /exit       - Exit Scalix Code'));
    console.log(chalk.dim('  /clear      - Clear screen'));
    console.log(chalk.dim('  /history    - Show command history\n'));

    console.log(chalk.green('What would you like help with?\n'));
  }

  private async startREPLLoop(): Promise<void> {
    this.isRunning = true;

    while (this.isRunning && this.rl && this.engine && this.state) {
      try {
        // Check for pending confirmations
        const pendingConfirmations = this.engine.getPendingConfirmations();
        if (pendingConfirmations.length > 0) {
          console.log(chalk.yellow('\n⏳ Pending confirmations:'));
          for (const confirmation of pendingConfirmations) {
            console.log(chalk.yellow(`  ${confirmation.title}`));
            if (confirmation.details) {
              console.log(chalk.dim(`  ${confirmation.details}`));
            }
          }
          console.log('');
        }

        // Read user input
        const input = await this.readInput();

        if (!input || input.trim().length === 0) {
          continue;
        }

        // Handle commands
        if (input.startsWith('/')) {
          await this.handleCommand(input);
          continue;
        }

        // Check if confirming pending operation
        if (input.toLowerCase() === 'yes' || input.toLowerCase() === 'approve') {
          if (pendingConfirmations.length > 0) {
            await this.confirmLastOperation('approve');
            continue;
          }
        } else if (input.toLowerCase() === 'no' || input.toLowerCase() === 'reject') {
          if (pendingConfirmations.length > 0) {
            await this.confirmLastOperation('reject');
            continue;
          }
        }

        // Process user message
        await this.processUserMessage(input);
      } catch (error) {
        if (error instanceof Error && error.message === 'EOF') {
          // User pressed Ctrl+D
          await this.stop();
          break;
        }
        console.error(chalk.red(`Error: ${error}`));
      }
    }
  }

  private readInput(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.rl) {
        resolve('');
        return;
      }

      this.rl.question(chalk.bold.cyan('> '), (input) => {
        if (input === null) {
          throw new Error('EOF');
        }
        resolve(input);
      });
    });
  }

  private async processUserMessage(userMessage: string): Promise<void> {
    if (!this.engine || !this.state) {
      printError('REPL not initialized');
      return;
    }

    // Add to history
    this.commandHistory.push(userMessage);

    // Show thinking indicator
    await animateExecution('Processing your request', 2000);

    try {
      // Process with conversation engine
      const turn: ConversationTurn = await this.engine.processUserInput(userMessage, this.state);

      // Display response
      console.log(chalk.cyan('\n─────────────────────────────────────\n'));
      console.log(turn.agentResponse);

      // Show tool calls if any
      if (turn.toolCalls.length > 0) {
        console.log(chalk.dim(`\n📋 Tools used: ${turn.toolCalls.map((t) => t.name).join(', ')}`));
      }

      // Show metrics
      if (turn.duration > 1000) {
        console.log(chalk.dim(`⏱️  ${(turn.duration / 1000).toFixed(2)}s`));
      }
      if (turn.cost.costUSD > 0) {
        console.log(chalk.dim(`💰 $${turn.cost.costUSD.toFixed(4)}`));
      }

      console.log(chalk.cyan('\n─────────────────────────────────────\n'));
    } catch (error) {
      printError(`Failed to process message: ${error}`);
    }
  }

  private async handleCommand(input: string): Promise<void> {
    const parts = input.split(' ');
    const command = parts[0].substring(1).toLowerCase();

    switch (command) {
      case 'help':
        this.showHelp();
        break;

      case 'tools':
        this.showTools();
        break;

      case 'exit':
      case 'quit':
        await this.stop();
        break;

      case 'clear':
        console.clear();
        styledBanner();
        break;

      case 'history':
        this.showHistory();
        break;

      case 'status':
        this.showStatus();
        break;

      default:
        printError(`Unknown command: ${command}`);
        console.log(chalk.dim('Type /help for available commands'));
    }
  }

  private showHelp(): void {
    console.log(chalk.bold.cyan('\n📖 Scalix Code Commands\n'));
    console.log(chalk.cyan('/help       - Show this help message'));
    console.log(chalk.cyan('/tools      - List available tools'));
    console.log(chalk.cyan('/status     - Show session status'));
    console.log(chalk.cyan('/history    - Show command history'));
    console.log(chalk.cyan('/clear      - Clear the screen'));
    console.log(chalk.cyan('/exit       - Exit Scalix Code'));

    console.log(chalk.bold.cyan('\n💡 Tips\n'));
    console.log(chalk.cyan('- Ask natural language questions about your code'));
    console.log(chalk.cyan('- Tell me what you want to create or fix'));
    console.log(chalk.cyan('- I can read, write, and execute commands'));
    console.log(chalk.cyan('- Use /tools to see what I can do\n'));
  }

  private showTools(): void {
    console.log(chalk.bold.cyan('\n🛠️  Available Tools\n'));

    console.log(chalk.bold.cyan('File Operations'));
    console.log(chalk.green('  readFile      - Read file contents'));
    console.log(chalk.green('  writeFile     - Write/update a file'));
    console.log(chalk.green('  createFile    - Create a new file'));
    console.log(chalk.green('  deleteFile    - Delete a file'));
    console.log(chalk.green('  listFiles     - List files matching pattern'));
    console.log(chalk.green('  findInFiles   - Search file contents'));

    console.log(chalk.bold.cyan('\nGit Operations'));
    console.log(chalk.green('  gitStatus     - Show git status'));
    console.log(chalk.green('  gitDiff       - Show git diff'));
    console.log(chalk.green('  gitCommit     - Commit changes'));
    console.log(chalk.green('  gitPush       - Push to remote'));
    console.log(chalk.green('  gitLog        - Show commit history'));
    console.log(chalk.green('  gitAdd        - Stage files'));

    console.log(chalk.bold.cyan('\nCommand Execution'));
    console.log(chalk.green('  bashExec      - Execute bash command'));
    console.log(chalk.green('  runTests      - Run test suite'));
    console.log(chalk.green('  build         - Build project'));
    console.log(chalk.green('  lint          - Run linter'));

    console.log('');
  }

  private showHistory(): void {
    if (this.commandHistory.length === 0) {
      console.log(chalk.dim('No command history'));
      return;
    }

    console.log(chalk.bold.cyan('\n📜 Command History\n'));
    for (let i = 0; i < this.commandHistory.length; i++) {
      console.log(chalk.cyan(`${i + 1}. ${this.commandHistory[i]}`));
    }
    console.log('');
  }

  private showStatus(): void {
    if (!this.state) {
      printError('Session not initialized');
      return;
    }

    console.log(chalk.bold.cyan('\n📊 Session Status\n'));
    console.log(chalk.cyan(`Project: ${this.state.projectPath}`));
    console.log(chalk.cyan(`Branch: ${this.state.context.gitBranch}`));
    console.log(chalk.cyan(`Turns: ${this.state.turns.length}`));
    console.log(chalk.cyan(`Agent: ${this.state.context.selectedAgent}`));
    console.log(chalk.cyan(`Cost: $${this.state.metadata.totalCost.toFixed(4)}`));
    console.log(chalk.cyan(`Duration: ${(this.state.metadata.totalDuration / 1000).toFixed(2)}s`));
    console.log('');
  }

  private async confirmLastOperation(response: 'approve' | 'reject' | 'modify' | 'escalate'): Promise<void> {
    if (!this.engine) {
      printError('Engine not initialized');
      return;
    }

    try {
      const pendingConfirmations = this.engine.getPendingConfirmations();
      if (pendingConfirmations.length === 0) {
        console.log(chalk.dim('No pending confirmations'));
        return;
      }

      const lastConfirmation = pendingConfirmations[pendingConfirmations.length - 1];
      const result = await this.engine.confirmOperation(lastConfirmation.id, response);

      if (result.approved) {
        printSuccess(`✅ Operation approved: ${result.message}`);
      } else {
        console.log(chalk.yellow(`⚠️ ${result.message}`));
      }
    } catch (error) {
      printError(`Failed to confirm operation: ${error}`);
    }
  }
}

/**
 * Start Scalix Code REPL
 */
export async function startScalixCodeREPL(projectPath: string, options?: Partial<REPLOptions>): Promise<void> {
  const repl = new ScalixCodeREPL({
    projectPath,
    ...options,
  });

  await repl.start();
}
