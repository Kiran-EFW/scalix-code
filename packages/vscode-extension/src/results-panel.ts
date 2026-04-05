import * as vscode from 'vscode';
import { AgentResult } from './types';

export class ResultsPanel {
  private panel: vscode.WebviewPanel | null = null;
  private lastResult: AgentResult | null = null;

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

    if (this.lastResult) {
      this.updateContent(this.lastResult);
    } else {
      this.panel.webview.html = this.getEmptyHtml();
    }
  }

  setResult(result: AgentResult): void {
    this.lastResult = result;

    if (this.panel) {
      this.updateContent(result);
    }
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
          .status.error {
            background: var(--vscode-testing-iconFailed);
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
          <h2>${result.agentId}</h2>
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
                <strong>${tool.name}</strong>
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
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h2 {
            color: var(--vscode-editor-foreground);
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="icon">📊</div>
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
