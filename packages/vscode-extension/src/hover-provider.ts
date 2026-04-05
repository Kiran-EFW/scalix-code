/**
 * Hover Provider
 *
 * Provides inline code explanations when hovering over code.
 * Caches results by file URI + position to avoid repeated API calls.
 */

import * as vscode from 'vscode';
import { getScalixConfig } from './config';
import { executeAgent, checkServerHealth } from './client';
import { getExecutionContext } from './utils';

interface CacheEntry {
  explanation: string;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class ScalixHoverProvider implements vscode.HoverProvider {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Set<string>();

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    // Only trigger on word boundaries
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    if (!word || word.length < 3) {
      return null;
    }

    // Get surrounding context (the line and a few lines around it)
    const startLine = Math.max(0, position.line - 2);
    const endLine = Math.min(document.lineCount - 1, position.line + 2);
    const contextRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
    const contextText = document.getText(contextRange);

    const cacheKey = this.getCacheKey(document.uri, position.line, word);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return this.createHover(cached.explanation, wordRange);
    }

    // Avoid duplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return null;
    }

    // Fetch explanation asynchronously
    this.pendingRequests.add(cacheKey);

    try {
      const config = getScalixConfig();
      const healthy = await checkServerHealth(config);
      if (!healthy || token.isCancellationRequested) {
        return null;
      }

      const context = getExecutionContext();
      const input = `Briefly explain this code construct in 1-2 sentences:\n\`\`\`${document.languageId}\n${contextText}\n\`\`\`\n\nFocus on: "${word}" at line ${position.line + 1}`;

      const result = await executeAgent(config, 'code-explainer', input, context);

      if (token.isCancellationRequested) {
        return null;
      }

      if (result.status === 'success' && result.output) {
        this.cache.set(cacheKey, {
          explanation: result.output,
          timestamp: Date.now(),
        });

        return this.createHover(result.output, wordRange);
      }
    } catch {
      // Silently fail - hover is non-critical
    } finally {
      this.pendingRequests.delete(cacheKey);
    }

    return null;
  }

  /**
   * Clear the explanation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cached entries for a specific file
   */
  clearFileCache(uri: vscode.Uri): void {
    const prefix = uri.toString();
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  private createHover(explanation: string, range: vscode.Range): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`**Scalix Explanation**\n\n`);
    markdown.appendMarkdown(explanation);
    markdown.isTrusted = true;
    return new vscode.Hover(markdown, range);
  }

  private getCacheKey(uri: vscode.Uri, line: number, word: string): string {
    return `${uri.toString()}:${line}:${word}`;
  }
}
