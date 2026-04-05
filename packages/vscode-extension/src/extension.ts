import * as vscode from 'vscode';
import { CommandManager } from './commands';
import { ResultsPanel } from './results-panel';
import { StatusBarManager } from './status-bar';
import { onConfigChange, getScalixConfig } from './config';

let commandManager: CommandManager;
let resultsPanel: ResultsPanel;
let statusBar: StatusBarManager;
let configChangeDisposable: vscode.Disposable;

export function activate(context: vscode.ExtensionContext): void {
  // Initialize components
  resultsPanel = new ResultsPanel();
  statusBar = new StatusBarManager();

  commandManager = new CommandManager(resultsPanel, statusBar);

  // Register commands
  const commands = [
    vscode.commands.registerCommand('scalix.analyzeCode', () => commandManager.analyzeCode()),
    vscode.commands.registerCommand('scalix.explainCode', () => commandManager.explainCode()),
    vscode.commands.registerCommand('scalix.scanSecurity', () => commandManager.scanSecurity()),
    vscode.commands.registerCommand('scalix.calculateMetrics', () =>
      commandManager.calculateMetrics()
    ),
    vscode.commands.registerCommand('scalix.openResults', () => commandManager.openResults()),
    vscode.commands.registerCommand('scalix.configure', () => commandManager.configure()),
  ];

  commands.forEach((cmd) => context.subscriptions.push(cmd));

  // Watch for config changes
  configChangeDisposable = onConfigChange((config) => {
    // Reinitialize client with new config if needed
    const isDebug = config.debug;
    if (isDebug) {
      const outputChannel = vscode.window.createOutputChannel('Scalix Debug');
      outputChannel.appendLine('Scalix configuration updated');
      outputChannel.appendLine(`API URL: ${config.apiUrl}`);
      outputChannel.appendLine(`Model: ${config.model}`);
    }
  });

  context.subscriptions.push(configChangeDisposable);

  // Set up auto-analyze on startup if configured
  const config = getScalixConfig();
  if (config.autoAnalyzeOnOpen && vscode.workspace.workspaceFolders) {
    setTimeout(() => {
      commandManager.analyzeCode().catch((error) => {
        vscode.window.showErrorMessage(`Auto-analyze failed: ${error.message}`);
      });
    }, 2000); // Delay to ensure VS Code is fully loaded
  }

  // Status bar item
  context.subscriptions.push(statusBar);

  // Show activation message in debug mode
  if (config.debug) {
    const outputChannel = vscode.window.createOutputChannel('Scalix');
    outputChannel.appendLine('Scalix Code extension activated');
    outputChannel.appendLine(`Connected to: ${config.apiUrl}`);
    outputChannel.show(true);
  }
}

export function deactivate(): void {
  if (configChangeDisposable) {
    configChangeDisposable.dispose();
  }

  if (resultsPanel) {
    resultsPanel.dispose();
  }

  if (statusBar) {
    statusBar.dispose();
  }
}
