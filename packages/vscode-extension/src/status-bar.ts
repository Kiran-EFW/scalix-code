import * as vscode from 'vscode';
import { ExtensionState } from './types';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private state: ExtensionState = {
    isRunning: false,
    resultPanelVisible: false,
  };

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.updateStatus();
  }

  setRunning(isRunning: boolean): void {
    this.state.isRunning = isRunning;
    this.updateStatus();
  }

  setLastResult(output: string, cost?: { totalCost: number; inputTokens: number; outputTokens: number }): void {
    this.state.lastResult = {
      executionId: '',
      agentId: '',
      status: 'success',
      output,
      toolCalls: [],
      cost: cost || { inputTokens: 0, outputTokens: 0, totalCost: 0 },
      duration: 0,
      iterations: 0,
    };
    this.updateStatus();
  }

  setError(error: Error): void {
    this.state.lastError = error;
    this.updateStatus();
  }

  private updateStatus(): void {
    if (this.state.isRunning) {
      this.statusBarItem.text = '$(sync~spin) Scalix: Analyzing...';
      this.statusBarItem.command = undefined;
    } else if (this.state.lastError) {
      this.statusBarItem.text = '$(error) Scalix: Error';
      this.statusBarItem.tooltip = this.state.lastError.message;
      this.statusBarItem.command = 'scalix.openResults';
    } else if (this.state.lastResult) {
      this.statusBarItem.text = '$(check) Scalix: Ready';
      this.statusBarItem.tooltip = 'Click to view results';
      this.statusBarItem.command = 'scalix.openResults';
    } else {
      this.statusBarItem.text = '$(scalix) Scalix';
      this.statusBarItem.tooltip = 'Scalix Code Analysis';
      this.statusBarItem.command = undefined;
    }

    this.statusBarItem.show();
  }

  show(): void {
    this.statusBarItem.show();
  }

  hide(): void {
    this.statusBarItem.hide();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
