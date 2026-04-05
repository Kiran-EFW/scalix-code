import * as vscode from 'vscode';
import { ScalixConfig } from './types';

export function getScalixConfig(): ScalixConfig {
  const config = vscode.workspace.getConfiguration('scalix');

  return {
    apiUrl: config.get<string>('apiUrl', 'http://localhost:3000'),
    apiKey: config.get<string>('apiKey', ''),
    model: config.get<string>('model', 'gpt-4'),
    maxTokens: config.get<number>('maxTokens', 4000),
    timeout: config.get<number>('timeout', 30000),
    enableSecurityScan: config.get<boolean>('enableSecurityScan', true),
    autoAnalyzeOnOpen: config.get<boolean>('autoAnalyzeOnOpen', false),
    debug: config.get<boolean>('debug', false),
  };
}

export function onConfigChange(callback: (config: ScalixConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('scalix')) {
      callback(getScalixConfig());
    }
  });
}

export function validateConfig(config: ScalixConfig): string[] {
  const errors: string[] = [];

  if (!config.apiUrl) {
    errors.push('API URL is not configured');
  }

  if (config.maxTokens < 500 || config.maxTokens > 16000) {
    errors.push('Max tokens must be between 500 and 16000');
  }

  if (config.timeout < 5000 || config.timeout > 120000) {
    errors.push('Timeout must be between 5000 and 120000 milliseconds');
  }

  return errors;
}
