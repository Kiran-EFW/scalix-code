import * as vscode from 'vscode';
import { getScalixConfig, validateConfig } from './config';
import { executeAgent, checkServerHealth } from './client';
import {
  getExecutionContext,
  showExecutingProgress,
  showSuccessMessage,
  showErrorMessage,
} from './utils';
import { ResultsPanel } from './results-panel';
import { StatusBarManager } from './status-bar';

export class CommandManager {
  constructor(
    private resultsPanel: ResultsPanel,
    private statusBar: StatusBarManager
  ) {}

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
    const context = vscode.window.activeTextEditor?.document.uri.fsPath || '';
    try {
      this.resultsPanel.show({} as any);
      showSuccessMessage('Results panel opened');
    } catch (error) {
      showErrorMessage('Failed to open results panel');
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
