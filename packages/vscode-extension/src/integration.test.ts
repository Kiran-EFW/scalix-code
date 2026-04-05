import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock VS Code APIs ──────────────────────────────────────────────────────────
vi.mock('vscode', () => ({
  window: {
    createStatusBarItem: vi.fn(() => ({
      text: '',
      tooltip: '',
      command: undefined,
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    withProgress: vi.fn(async (_options: any, task: any) => {
      return task(
        { report: vi.fn() },
        { onCancellationRequested: vi.fn(), isCancellationRequested: false }
      );
    }),
    createWebviewPanel: vi.fn(() => ({
      webview: { html: '' },
      reveal: vi.fn(),
      onDidDispose: vi.fn(() => ({ dispose: vi.fn() })),
      dispose: vi.fn(),
    })),
    activeTextEditor: {
      document: {
        uri: { fsPath: '/test/workspace/src/index.ts' },
        languageId: 'typescript',
        getText: vi.fn(() => 'const x = 1;'),
      },
      selection: { isEmpty: true },
    },
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    })),
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: unknown) => {
        const overrides: Record<string, unknown> = {
          apiUrl: 'http://localhost:3000',
          apiKey: 'test-key',
          model: 'gpt-4',
          maxTokens: 4000,
          timeout: 30000,
          enableSecurityScan: true,
          autoAnalyzeOnOpen: false,
          debug: false,
        };
        return overrides[key] ?? defaultValue;
      }),
    })),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
    textDocuments: [{ uri: { fsPath: '/test/workspace/src/index.ts' } }],
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  languages: {
    registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerCodeActionsProvider: vi.fn(() => ({ dispose: vi.fn() })),
    createDiagnosticCollection: vi.fn(() => ({
      set: vi.fn(),
      clear: vi.fn(),
      delete: vi.fn(),
      dispose: vi.fn(),
    })),
  },
  ViewColumn: { Two: 2 },
  ProgressLocation: { Notification: 1 },
  StatusBarAlignment: { Right: 2 },
  DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
  Range: class {
    constructor(
      public startLine: number,
      public startCharacter: number,
      public endLine: number,
      public endCharacter: number
    ) {}
  },
  Location: class {
    constructor(public uri: any, public range: any) {}
  },
  Diagnostic: class {
    source?: string;
    code?: string;
    relatedInformation?: any[];
    constructor(public range: any, public message: string, public severity: number) {}
  },
  DiagnosticRelatedInformation: class {
    constructor(public location: any, public message: string) {}
  },
  Uri: {
    file: (path: string) => ({
      fsPath: path,
      toString: () => `file://${path}`,
      scheme: 'file',
    }),
  },
  CancellationTokenSource: class {
    token = { onCancellationRequested: vi.fn(), isCancellationRequested: false };
    cancel = vi.fn();
    dispose = vi.fn();
  },
}));

// ── Mock SDK with controllable behavior ─────────────────────────────────────
const mockExecute = vi.fn();
const mockGetAgents = vi.fn();

vi.mock('@scalix/sdk', () => ({
  createClient: vi.fn(() => ({
    execute: mockExecute,
    getAgents: mockGetAgents,
  })),
}));

// ── Mock ws ─────────────────────────────────────────────────────────────────
vi.mock('ws', () => {
  const MockWebSocket = vi.fn();
  MockWebSocket.OPEN = 1;
  MockWebSocket.CONNECTING = 0;
  return { default: MockWebSocket, WebSocket: MockWebSocket };
});

// ══════════════════════════════════════════════════════════════════════════════
// Integration Tests
// ══════════════════════════════════════════════════════════════════════════════

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Command -> Client -> SDK flow', () => {
    it('should execute analyzeCode and display results on success', async () => {
      const mockResult = {
        executionId: 'exec-123',
        agentId: 'codebase-analyzer',
        status: 'success',
        output: 'Architecture analysis: MVC pattern detected',
        toolCalls: [{ id: 't1', name: 'read-file', arguments: {} }],
        cost: { inputTokens: 500, outputTokens: 200, totalCost: 0.01 },
        duration: 2500,
        iterations: 3,
      };

      // Mock getAgents for health check
      mockGetAgents.mockResolvedValue([]);
      mockExecute.mockResolvedValue(mockResult);

      const { CommandManager } = await import('./commands');
      const { ResultsPanel } = await import('./results-panel');
      const { StatusBarManager } = await import('./status-bar');

      const panel = new ResultsPanel();
      const statusBar = new StatusBarManager();
      const setResultSpy = vi.spyOn(panel, 'setResult');
      const showSpy = vi.spyOn(panel, 'show');

      const cm = new CommandManager(panel, statusBar);
      await cm.analyzeCode();

      expect(mockGetAgents).toHaveBeenCalled();
      expect(mockExecute).toHaveBeenCalled();
      expect(setResultSpy).toHaveBeenCalledWith(mockResult);
    });

    it('should show error when server is unreachable', async () => {
      const vscode = await import('vscode');
      mockGetAgents.mockRejectedValue(new Error('ECONNREFUSED'));

      const { CommandManager } = await import('./commands');
      const { ResultsPanel } = await import('./results-panel');
      const { StatusBarManager } = await import('./status-bar');

      const cm = new CommandManager(new ResultsPanel(), new StatusBarManager());
      await cm.analyzeCode();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Cannot connect')
      );
    });

    it('should show error when agent execution fails', async () => {
      const vscode = await import('vscode');

      mockGetAgents.mockResolvedValue([]);
      mockExecute.mockResolvedValue({
        status: 'failure',
        error: { message: 'Agent timeout' },
        output: '',
        toolCalls: [],
        cost: { inputTokens: 0, outputTokens: 0, totalCost: 0 },
        duration: 30000,
        iterations: 0,
      });

      const { CommandManager } = await import('./commands');
      const { ResultsPanel } = await import('./results-panel');
      const { StatusBarManager } = await import('./status-bar');

      const cm = new CommandManager(new ResultsPanel(), new StatusBarManager());
      await cm.analyzeCode();

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('failed')
      );
    });
  });

  describe('Security scan -> Diagnostics flow', () => {
    it('should parse scan output and create diagnostics', async () => {
      const { ScalixDiagnosticsProvider } = await import('./diagnostics-provider');
      const provider = new ScalixDiagnosticsProvider();

      const scanOutput = [
        '[CRITICAL] src/db.ts:42 - SQL injection in raw query',
        '  Suggestion: Use parameterized queries instead',
        '  Code: CWE-89',
        '[HIGH] src/auth.ts:15 - Hardcoded credentials detected',
        '  Suggestion: Use environment variables',
        '[MEDIUM] src/api.ts:88 - Missing rate limiting on endpoint',
        '[LOW] src/utils.ts:5 - Console.log left in production code',
        '[INFO] src/config.ts:1 - Consider using strict mode',
      ].join('\n');

      const findings = provider.parseSecurityOutput(scanOutput, '/project');

      expect(findings).toHaveLength(5);

      // Verify critical finding
      expect(findings[0].severity).toBe('critical');
      expect(findings[0].file).toBe('/project/src/db.ts');
      expect(findings[0].line).toBe(42);
      expect(findings[0].message).toBe('SQL injection in raw query');
      expect(findings[0].suggestion).toBe('Use parameterized queries instead');
      expect(findings[0].code).toBe('CWE-89');

      // Verify high finding
      expect(findings[1].severity).toBe('high');
      expect(findings[1].suggestion).toBe('Use environment variables');

      // Verify severity levels
      expect(findings[2].severity).toBe('medium');
      expect(findings[3].severity).toBe('low');
      expect(findings[4].severity).toBe('info');

      // Set findings as diagnostics
      provider.setFindings(findings);
    });
  });

  describe('Results Panel rendering', () => {
    it('should render success result HTML', async () => {
      const vscode = await import('vscode');
      const { ResultsPanel } = await import('./results-panel');

      const panel = new ResultsPanel();

      // Create and show panel first
      panel.show({} as any);

      // Set a result
      panel.setResult({
        executionId: 'exec-1',
        agentId: 'codebase-analyzer',
        status: 'success',
        output: 'Analysis complete: 15 files, MVC architecture',
        toolCalls: [
          { id: 't1', name: 'read-file', arguments: { path: '/src/app.ts' } },
          { id: 't2', name: 'list-directory', arguments: { path: '/src' } },
        ],
        cost: { inputTokens: 1000, outputTokens: 500, totalCost: 0.025 },
        duration: 3200,
        iterations: 5,
      });

      expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
    });

    it('should render streaming progress HTML', async () => {
      const { ResultsPanel } = await import('./results-panel');
      const panel = new ResultsPanel();

      panel.show({} as any);
      panel.showExecutionStarted('security-analyzer', 'exec-2');

      panel.updateProgress({
        executionId: 'exec-2',
        agentId: 'security-analyzer',
        status: 'progress',
        progress: 0.5,
        message: 'Scanning src/auth.ts...',
      });
    });

    it('should render error HTML', async () => {
      const { ResultsPanel } = await import('./results-panel');
      const panel = new ResultsPanel();

      panel.show({} as any);
      panel.showExecutionError('test-agent', 'Connection timeout');
    });
  });

  describe('Status bar state management', () => {
    it('should cycle through status states', async () => {
      const { StatusBarManager } = await import('./status-bar');
      const sb = new StatusBarManager();

      // Initial state
      sb.setRunning(false);

      // Running state
      sb.setRunning(true);

      // Success state
      sb.setLastResult('Analysis complete', {
        inputTokens: 100,
        outputTokens: 50,
        totalCost: 0.005,
      });

      // Error state
      sb.setError(new Error('Connection failed'));

      // Back to not running
      sb.setRunning(false);

      sb.dispose();
    });
  });

  describe('Extension lifecycle', () => {
    it('should activate and deactivate cleanly', async () => {
      const extension = await import('./extension');

      const mockContext = {
        subscriptions: [] as any[],
      } as any;

      // Activate
      extension.activate(mockContext);
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);

      // Deactivate
      extension.deactivate();
    });
  });

  describe('Cancel execution flow', () => {
    it('should cancel via CommandManager', async () => {
      const { CommandManager } = await import('./commands');
      const { ResultsPanel } = await import('./results-panel');
      const { StatusBarManager } = await import('./status-bar');

      const cm = new CommandManager(new ResultsPanel(), new StatusBarManager());

      // Cancel when nothing is running should not throw
      cm.cancelExecution();
    });
  });
});
