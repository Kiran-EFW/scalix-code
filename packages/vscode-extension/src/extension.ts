import * as vscode from 'vscode';
import { CommandManager } from './commands';
import { ResultsPanel } from './results-panel';
import { StatusBarManager } from './status-bar';
import { onConfigChange, getScalixConfig } from './config';
import { getWebSocketClient, closeWebSocketClient } from './websocket-client';
import { ScalixDiagnosticsProvider } from './diagnostics-provider';
import { ScalixHoverProvider } from './hover-provider';
import { ScalixCodeActionsProvider } from './code-actions-provider';

let commandManager: CommandManager;
let resultsPanel: ResultsPanel;
let statusBar: StatusBarManager;
let diagnosticsProvider: ScalixDiagnosticsProvider;
let configChangeDisposable: vscode.Disposable;

export function activate(context: vscode.ExtensionContext): void {
  // Initialize components
  resultsPanel = new ResultsPanel();
  statusBar = new StatusBarManager();

  diagnosticsProvider = new ScalixDiagnosticsProvider();

  commandManager = new CommandManager(resultsPanel, statusBar);

  // Register providers
  const allLanguages = { scheme: 'file' };

  const hoverProvider = new ScalixHoverProvider();
  const hoverDisposable = vscode.languages.registerHoverProvider(allLanguages, hoverProvider);
  context.subscriptions.push(hoverDisposable);

  const codeActionsProvider = new ScalixCodeActionsProvider();
  const codeActionsDisposable = vscode.languages.registerCodeActionsProvider(
    allLanguages,
    codeActionsProvider,
    { providedCodeActionKinds: ScalixCodeActionsProvider.providedCodeActionKinds }
  );
  context.subscriptions.push(codeActionsDisposable);

  context.subscriptions.push(diagnosticsProvider);

  // Initialize WebSocket connection
  const config = getScalixConfig();
  initializeWebSocket(config.apiUrl, config.timeout);

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
    vscode.commands.registerCommand('scalix.cancelExecution', () =>
      commandManager.cancelExecution()
    ),
  ];

  commands.forEach((cmd) => context.subscriptions.push(cmd));

  // Watch for config changes
  configChangeDisposable = onConfigChange((newConfig) => {
    // Reinitialize WebSocket if URL changed
    initializeWebSocket(newConfig.apiUrl, newConfig.timeout);

    const isDebug = newConfig.debug;
    if (isDebug) {
      const outputChannel = vscode.window.createOutputChannel('Scalix Debug');
      outputChannel.appendLine('Scalix configuration updated');
      outputChannel.appendLine(`API URL: ${newConfig.apiUrl}`);
      outputChannel.appendLine(`Model: ${newConfig.model}`);
    }
  });

  context.subscriptions.push(configChangeDisposable);

  // Set up auto-analyze on startup if configured
  if (config.autoAnalyzeOnOpen && vscode.workspace.workspaceFolders) {
    setTimeout(() => {
      commandManager.analyzeCode().catch((error) => {
        vscode.window.showErrorMessage(`Auto-analyze failed: ${error.message}`);
      });
    }, 2000);
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

function initializeWebSocket(apiUrl: string, timeout: number): void {
  closeWebSocketClient();
  const wsClient = getWebSocketClient(apiUrl, timeout);
  commandManager.setWebSocketClient(wsClient);

  wsClient.connect().catch(() => {
    // WebSocket connection failed - will fall back to REST
  });
}

export function deactivate(): void {
  closeWebSocketClient();

  if (configChangeDisposable) {
    configChangeDisposable.dispose();
  }

  if (diagnosticsProvider) {
    diagnosticsProvider.dispose();
  }

  if (resultsPanel) {
    resultsPanel.dispose();
  }

  if (statusBar) {
    statusBar.dispose();
  }
}
