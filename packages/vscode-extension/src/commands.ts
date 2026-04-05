import * as vscode from 'vscode';
import { getScalixConfig, validateConfig } from './config';
import { executeAgent, checkServerHealth } from './client';
import { WebSocketClient, ExecutionProgress, getWebSocketClient } from './websocket-client';
import {
  getExecutionContext,
  showExecutingProgress,
  showSuccessMessage,
  showErrorMessage,
} from './utils';
import { ResultsPanel } from './results-panel';
import { StatusBarManager } from './status-bar';
import { AgentResult } from './types';

export class CommandManager {
  private wsClient: WebSocketClient | null = null;
  private activeCancellation: vscode.CancellationTokenSource | null = null;

  constructor(
    private resultsPanel: ResultsPanel,
    private statusBar: StatusBarManager
  ) {}

  setWebSocketClient(client: WebSocketClient): void {
    this.wsClient = client;
  }

  async analyzeCode(): Promise<void> {
    const config = getScalixConfig();
    const errors = validateConfig(config);

    if (errors.length > 0) {
      showErrorMessage(`Configuration error: ${errors[0]}`);
      return;
    }

    const context = getExecutionContext();

    if (!context.projectPath) {
      showErrorMessage('No workspace folder found. Please open a workspace first.');
      return;
    }

    await this.executeAgentCommand(
      'codebase-analyzer',
      'Analyze this codebase for architecture, structure, and patterns.',
      config
    );
  }

  async explainCode(): Promise<void> {
    const config = getScalixConfig();
    const errors = validateConfig(config);

    if (errors.length > 0) {
      showErrorMessage(`Configuration error: ${errors[0]}`);
      return;
    }

    const context = getExecutionContext();

    if (!context.filePath) {
      showErrorMessage('No active editor. Please open a file first.');
      return;
    }

    const input = context.selectedText
      ? `Explain this code:\n\n${context.selectedText}`
      : `Explain this file:\n${context.filePath}`;

    await this.executeAgentCommand('code-explainer', input, config);
  }

  async scanSecurity(): Promise<void> {
    const config = getScalixConfig();
    const errors = validateConfig(config);

    if (errors.length > 0) {
      showErrorMessage(`Configuration error: ${errors[0]}`);
      return;
    }

    const context = getExecutionContext();

    if (!context.filePath && !context.projectPath) {
      showErrorMessage('No workspace or file context. Please open a file or workspace.');
      return;
    }

    const input = context.filePath
      ? `Scan this file for security issues:\n${context.filePath}`
      : `Scan the codebase for security vulnerabilities`;

    await this.executeAgentCommand('security-analyzer', input, config);
  }

  async calculateMetrics(): Promise<void> {
    const config = getScalixConfig();
    const errors = validateConfig(config);

    if (errors.length > 0) {
      showErrorMessage(`Configuration error: ${errors[0]}`);
      return;
    }

    const context = getExecutionContext();

    if (!context.filePath) {
      showErrorMessage('No active editor. Please open a file first.');
      return;
    }

    const input = `Calculate code metrics for:\n${context.filePath}`;

    await this.executeAgentCommand('metrics-calculator', input, config);
  }

  async configure(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'scalix');
  }

  async openResults(): Promise<void> {
    try {
      this.resultsPanel.show({} as any);
      showSuccessMessage('Results panel opened');
    } catch {
      showErrorMessage('Failed to open results panel');
    }
  }

  /**
   * Cancel the currently running execution
   */
  cancelExecution(): void {
    if (this.activeCancellation) {
      this.activeCancellation.cancel();
      this.activeCancellation.dispose();
      this.activeCancellation = null;
      this.statusBar.setRunning(false);
      showSuccessMessage('Execution cancelled');
    }
  }

  private async executeAgentCommand(
    agentId: string,
    input: string,
    config: ReturnType<typeof getScalixConfig>
  ): Promise<void> {
    // Check server health first
    const isHealthy = await showExecutingProgress(
      'Checking Scalix server...',
      () => checkServerHealth(config)
    );

    if (!isHealthy) {
      showErrorMessage(
        `Cannot connect to Scalix server at ${config.apiUrl}. Please check your configuration.`
      );
      return;
    }

    const context = getExecutionContext();
    this.statusBar.setRunning(true);

    // Try WebSocket streaming first, fall back to REST
    if (this.wsClient && this.wsClient.isConnected()) {
      await this.executeViaWebSocket(agentId, input, config);
    } else {
      await this.executeViaRest(agentId, input, config, context);
    }
  }

  /**
   * Execute via WebSocket with real-time progress streaming
   */
  private async executeViaWebSocket(
    agentId: string,
    input: string,
    config: ReturnType<typeof getScalixConfig>
  ): Promise<void> {
    if (!this.wsClient) {
      return;
    }

    this.activeCancellation = new vscode.CancellationTokenSource();
    const cancellation = this.activeCancellation;

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Running Scalix: ${agentId}...`,
          cancellable: true,
        },
        async (progress, token) => {
          return new Promise<void>((resolve, reject) => {
            // Handle VS Code cancellation
            token.onCancellationRequested(() => {
              this.wsClient?.cancel(agentId);
              this.statusBar.setRunning(false);
              resolve();
            });

            // Handle programmatic cancellation
            cancellation.token.onCancellationRequested(() => {
              this.wsClient?.cancel(agentId);
              this.statusBar.setRunning(false);
              resolve();
            });

            this.resultsPanel.showExecutionStarted(agentId, '');

            this.wsClient!.executeWithProgress(
              agentId,
              input,
              (execProgress: ExecutionProgress) => {
                if (execProgress.status === 'progress') {
                  const pct = execProgress.progress
                    ? Math.round(execProgress.progress * 100)
                    : undefined;
                  progress.report({
                    message: execProgress.message || 'Processing...',
                    increment: pct,
                  });
                  this.resultsPanel.updateProgress(execProgress);
                } else if (execProgress.status === 'completed') {
                  const result: AgentResult = {
                    executionId: execProgress.executionId,
                    agentId: execProgress.agentId,
                    status: 'success',
                    output: execProgress.output || '',
                    toolCalls: [],
                    cost: execProgress.cost || { inputTokens: 0, outputTokens: 0, totalCost: 0 },
                    duration: execProgress.duration || 0,
                    iterations: execProgress.iterations || 0,
                  };

                  this.resultsPanel.setResult(result);
                  this.resultsPanel.show({} as any);
                  this.statusBar.setLastResult(result.output, result.cost);
                  this.statusBar.setRunning(false);
                  showSuccessMessage(
                    `Analysis complete in ${((result.duration) / 1000).toFixed(2)}s`
                  );
                  resolve();
                }
              },
              (error: string) => {
                this.resultsPanel.showExecutionError(agentId, error);
                this.statusBar.setError(new Error(error));
                this.statusBar.setRunning(false);
                showErrorMessage(`Analysis failed: ${error}`);
                resolve();
              }
            );
          });
        }
      );
    } finally {
      if (this.activeCancellation === cancellation) {
        this.activeCancellation.dispose();
        this.activeCancellation = null;
      }
    }
  }

  /**
   * Execute via REST (fallback when WebSocket is not available)
   */
  private async executeViaRest(
    agentId: string,
    input: string,
    config: ReturnType<typeof getScalixConfig>,
    context: ReturnType<typeof getExecutionContext>
  ): Promise<void> {
    try {
      const result = await showExecutingProgress(
        `Running Scalix: ${agentId}...`,
        () => executeAgent(config, agentId, input, context)
      );

      if (result.status === 'success') {
        this.resultsPanel.setResult(result);
        this.resultsPanel.show({} as any);
        this.statusBar.setLastResult(result.output, result.cost);
        showSuccessMessage(`Analysis complete in ${(result.duration / 1000).toFixed(2)}s`);
      } else {
        const errorMsg = result.error?.message || 'Unknown error';
        this.statusBar.setError(new Error(errorMsg));
        showErrorMessage(`Analysis failed: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.statusBar.setError(new Error(errorMsg));
      showErrorMessage(`Failed to execute analysis: ${errorMsg}`);
    } finally {
      this.statusBar.setRunning(false);
    }
  }
}
