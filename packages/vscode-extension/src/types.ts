import * as vscode from 'vscode';

export interface AgentResult {
  executionId: string;
  agentId: string;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  output: string;
  toolCalls: ToolCall[];
  cost: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  };
  duration: number;
  iterations: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: ToolResult;
}

export interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
  truncated?: boolean;
  message?: string;
}

export interface ExecutionContext {
  projectPath: string;
  filePath: string;
  selectedText?: string;
  language: string;
  openFiles: string[];
}

export interface ScalixConfig {
  apiUrl: string;
  apiKey?: string;
  model: string;
  maxTokens: number;
  timeout: number;
  enableSecurityScan: boolean;
  autoAnalyzeOnOpen: boolean;
  debug: boolean;
}

export interface ExtensionState {
  isRunning: boolean;
  lastResult?: AgentResult;
  lastError?: Error;
  resultPanelVisible: boolean;
}

export type CommandHandler = (context: vscode.ExtensionContext) => (args?: unknown) => Promise<void>;
