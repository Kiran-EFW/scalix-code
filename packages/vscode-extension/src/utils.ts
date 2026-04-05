import * as vscode from 'vscode';
import { ExecutionContext } from './types';

export function getExecutionContext(): ExecutionContext {
  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace.workspaceFolders?.[0];

  return {
    projectPath: workspace?.uri.fsPath || '',
    filePath: editor?.document.uri.fsPath || '',
    selectedText: editor?.selection && !editor.selection.isEmpty
      ? editor.document.getText(editor.selection)
      : undefined,
    language: editor?.document.languageId || '',
    openFiles: vscode.workspace.textDocuments.map((d) => d.uri.fsPath),
  };
}

export async function showExecutingProgress<T>(
  title: string,
  task: () => Promise<T>
): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false,
    },
    () => task()
  );
}

export function showSuccessMessage(message: string, duration = 3000): void {
  vscode.window.showInformationMessage(message);
}

export function showErrorMessage(message: string): void {
  vscode.window.showErrorMessage(message);
}

export function showWarningMessage(message: string): void {
  vscode.window.showWarningMessage(message);
}

export async function showQuickPick<T extends vscode.QuickPickItem>(
  items: T[],
  placeholder?: string
): Promise<T | undefined> {
  return vscode.window.showQuickPick(items, { placeholder });
}

export function createOutputChannel(name: string): vscode.OutputChannel {
  return vscode.window.createOutputChannel(name);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  return `${(tokens / 1000).toFixed(1)}k tokens`;
}

export function sanitizeForDisplay(text: string): string {
  // Remove control characters but preserve newlines
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}
