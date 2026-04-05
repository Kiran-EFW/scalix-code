import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';

// Mock VS Code APIs
vi.mock('vscode', () => ({
  window: {
    createStatusBarItem: vi.fn(() => ({
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    withProgress: vi.fn(async (options, task) => task()),
    createWebviewPanel: vi.fn(() => ({
      webview: { html: '' },
      reveal: vi.fn(),
      onDidDispose: vi.fn(),
    })),
    activeTextEditor: undefined,
  },
  workspace: {
    workspaceFolders: undefined,
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key, defaultValue) => defaultValue),
    })),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
    textDocuments: [],
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  ViewColumn: { Two: 2 },
  ProgressLocation: { Notification: 1 },
  StatusBarAlignment: { Right: 2 },
}));

describe('VS Code Extension', () => {
  describe('Extension Activation', () => {
    it('should load extension module without errors', async () => {
      // This test just verifies imports work
      const extension = await import('./extension');
      expect(extension.activate).toBeDefined();
      expect(extension.deactivate).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should load config module', async () => {
      const config = await import('./config');
      expect(config.getScalixConfig).toBeDefined();
      expect(config.validateConfig).toBeDefined();
      expect(config.onConfigChange).toBeDefined();
    });
  });

  describe('Client', () => {
    it('should load client module', async () => {
      const client = await import('./client');
      expect(client.getScalixClient).toBeDefined();
      expect(client.executeAgent).toBeDefined();
      expect(client.getAgents).toBeDefined();
      expect(client.checkServerHealth).toBeDefined();
    });
  });

  describe('Commands', () => {
    it('should load commands module', async () => {
      const { CommandManager } = await import('./commands');
      expect(CommandManager).toBeDefined();
    });
  });

  describe('Results Panel', () => {
    it('should load results panel module', async () => {
      const { ResultsPanel } = await import('./results-panel');
      expect(ResultsPanel).toBeDefined();
    });
  });

  describe('Status Bar', () => {
    it('should load status bar module', async () => {
      const { StatusBarManager } = await import('./status-bar');
      expect(StatusBarManager).toBeDefined();
    });
  });

  describe('Utilities', () => {
    it('should load utils module', async () => {
      const utils = await import('./utils');
      expect(utils.getExecutionContext).toBeDefined();
      expect(utils.formatDuration).toBeDefined();
      expect(utils.formatTokens).toBeDefined();
    });
  });

  describe('Types', () => {
    it('should have TypeScript types defined', async () => {
      // This verifies types compile
      const types = await import('./types');
      expect(types).toBeDefined();
    });
  });
});
