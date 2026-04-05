import * as vscode from 'vscode';
import { AgentResult } from './types';
import { ExecutionProgressData } from './websocket-client';

export class ResultsPanel {
  private panel: vscode.WebviewPanel | null = null;
  private lastResult: AgentResult | null = null;
  private currentProgress: ExecutionProgressData | null = null;
  private streamingOutput = '';
  private isStreaming = false;

  show(context: vscode.ExtensionContext): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'scalix-results',
        'Scalix Results',
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );

      this.panel.onDidDispose(() => {
        this.panel = null;
      });
    }

    this.panel.reveal(vscode.ViewColumn.Two);

    if (this.isStreaming) {
      this.updateStreamingContent();
    } else if (this.lastResult) {
      this.updateContent(this.lastResult);
    } else {
      this.panel.webview.html = this.getEmptyHtml();
    }
  }

  setResult(result: AgentResult): void {
    this.lastResult = result;
    this.isStreaming = false;
    this.streamingOutput = '';
    this.currentProgress = null;

    if (this.panel) {
      this.updateContent(result);
    }
  }

  /**
   * Show that an execution has started (streaming mode)
   */
  showExecutionStarted(agentId: string, executionId: string): void {
    this.isStreaming = true;
    this.streamingOutput = '';
    this.currentProgress = {
      executionId,
      agentId,
      progress: 0,
      message: 'Starting execution...',
    };

    if (this.panel) {
      this.updateStreamingContent();
    }
  }

  /**
   * Update progress during streaming execution
   */
  updateProgress(progress: ExecutionProgressData): void {
    this.currentProgress = progress;

    if (progress.message) {
      this.streamingOutput += progress.message + '\n';
    }

    if (this.panel && this.isStreaming) {
      this.updateStreamingContent();
    }
  }

  /**
   * Show execution error in streaming mode
   */
  showExecutionError(agentId: string, error: string): void {
    this.isStreaming = false;

    if (this.panel) {
      this.panel.webview.html = this.getErrorHtml(agentId, error);
    }
  }

  private updateStreamingContent(): void {
    if (!this.panel || !this.currentProgress) {
      return;
    }

    const progress = this.currentProgress;
    const progressPercent = progress.progress != null ? Math.round(progress.progress * 100) : null;

    this.panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-widget-border);
          }
          .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            background: var(--vscode-progressBar-background);
            color: white;
          }
          .progress-bar {
            width: 100%;
            height: 4px;
            background: var(--vscode-input-background);
            border-radius: 2px;
            margin: 10px 0;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-background);
            border-radius: 2px;
            transition: width 0.3s ease;
            ${progressPercent != null ? `width: ${progressPercent}%;` : 'width: 100%; animation: indeterminate 1.5s infinite linear;'}
          }
          @keyframes indeterminate {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .step-info {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin: 10px 0;
          }
          .output {
            background: var(--vscode-input-background);
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            max-height: 500px;
            overflow-y: auto;
          }
          .spinner {
            display: inline-block;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${this.escapeHtml(progress.agentId)}</h2>
          <span class="status"><span class="spinner">&#9696;</span> RUNNING</span>
        </div>

        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>

        ${progress.step ? `<div class="step-info">Step: ${this.escapeHtml(progress.step)}</div>` : ''}
        ${progressPercent != null ? `<div class="step-info">Progress: ${progressPercent}%</div>` : ''}

        <h3>Live Output</h3>
        <div class="output" id="output">${this.escapeHtml(this.streamingOutput || 'Waiting for output...')}</div>

        <script>
          // Auto-scroll output
          const output = document.getElementById('output');
          if (output) {
            output.scrollTop = output.scrollHeight;
          }
        </script>
      </body>
      </html>
    `;
  }

  private updateContent(result: AgentResult): void {
    if (!this.panel) {
      return;
    }

    const html = this.getResultHtml(result);
    this.panel.webview.html = html;
  }

  private getResultHtml(result: AgentResult): string {
    const durationMs = result.duration;
    const durationSec = (durationMs / 1000).toFixed(2);
    const costUSD = result.cost.totalCost.toFixed(4);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-widget-border);
          }
          .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
          }
          .status.success {
            background: var(--vscode-testing-iconPassed);
            color: white;
          }
          .status.error, .status.failure {
            background: var(--vscode-testing-iconFailed);
            color: white;
          }
          .status.cancelled {
            background: var(--vscode-descriptionForeground);
            color: white;
          }
          .metadata {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 20px;
          }
          .metadata-item {
            padding: 8px;
            background: var(--vscode-input-background);
            border-radius: 4px;
          }
          .metadata-label {
            font-weight: bold;
            color: var(--vscode-editor-foreground);
          }
          .output {
            background: var(--vscode-input-background);
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            max-height: 500px;
            overflow-y: auto;
          }
          .error-message {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
          }
          .tools-section {
            margin: 20px 0;
          }
          .tools-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--vscode-editor-foreground);
          }
          .tool-item {
            background: var(--vscode-input-background);
            padding: 8px;
            border-radius: 4px;
            margin: 5px 0;
            font-size: 12px;
          }
          .button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            margin-right: 8px;
          }
          .button:hover {
            background: var(--vscode-button-hoverBackground);
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${this.escapeHtml(result.agentId)}</h2>
          <span class="status ${result.status}">${result.status.toUpperCase()}</span>
        </div>

        <div class="metadata">
          <div class="metadata-item">
            <span class="metadata-label">Duration:</span>
            <span>${durationSec}s</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Cost:</span>
            <span>$${costUSD}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Iterations:</span>
            <span>${result.iterations}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Tokens:</span>
            <span>${result.cost.inputTokens + result.cost.outputTokens}</span>
          </div>
        </div>

        ${result.error ? `
          <div class="error-message">
            <strong>Error:</strong> ${this.escapeHtml(result.error.message)}
          </div>
        ` : ''}

        <h3>Output</h3>
        <div class="output">${this.escapeHtml(result.output)}</div>

        ${result.toolCalls.length > 0 ? `
          <div class="tools-section">
            <div class="tools-title">Tools Used (${result.toolCalls.length})</div>
            ${result.toolCalls.map(tool => `
              <div class="tool-item">
                <strong>${this.escapeHtml(tool.name)}</strong>
                ${tool.result?.truncated ? ' <em>(truncated)</em>' : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div>
          <button class="button" onclick="copyToClipboard()">Copy Output</button>
          <button class="button" onclick="exportJSON()">Export JSON</button>
        </div>

        <script>
          function copyToClipboard() {
            const output = document.querySelector('.output').textContent;
            navigator.clipboard.writeText(output).then(() => {
              alert('Copied to clipboard');
            });
          }

          function exportJSON() {
            const data = ${JSON.stringify(result)};
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'scalix-result.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        </script>
      </body>
      </html>
    `;
  }

  private getErrorHtml(agentId: string, error: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-widget-border);
          }
          .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            background: var(--vscode-testing-iconFailed);
            color: white;
          }
          .error-message {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
            padding: 12px;
            border-radius: 4px;
            margin: 15px 0;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${this.escapeHtml(agentId)}</h2>
          <span class="status">ERROR</span>
        </div>
        <div class="error-message">
          <strong>Execution Failed:</strong><br/>
          ${this.escapeHtml(error)}
        </div>
      </body>
      </html>
    `;
  }

  private getEmptyHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px 20px;
            text-align: center;
            background: var(--vscode-editor-background);
            color: var(--vscode-descriptionForeground);
          }
          h2 {
            color: var(--vscode-editor-foreground);
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <h2>Scalix Results</h2>
        <p>Run a Scalix command to see results here.</p>
      </body>
      </html>
    `;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = null;
    }
  }
}
