/**
 * Scalix Code Conversation Engine
 *
 * Manages multi-turn conversational loop with context awareness, hooks, and plugins
 */

import { v4 as uuidv4 } from 'uuid';

import {
  ConversationState,
  ConversationTurn,
  ConversationContext,
  ConversationEngine,
  MainAgent,
  ToolCall,
  ToolResult,
  HookRegistry,
  PluginManager,
  SessionMetadata,
  HookContext,
  ConversationMetrics,
} from './types';
import { GuardrailsSystem, Operation } from '../guardrails/system';
import { CommunicationManager, UserInteraction } from '../guardrails/communication';

/**
 * Main conversation engine implementation
 */
export class ScalixConversationEngine implements ConversationEngine {
  private sessions: Map<string, ConversationState> = new Map();
  private mainAgent: MainAgent;
  private toolRegistry: Map<string, any>;
  private guardrailsSystem: GuardrailsSystem;
  private communicationManager: CommunicationManager;
  private pendingConfirmations: Map<string, { confirmed: boolean; response?: string }> = new Map();

  constructor(
    mainAgent: MainAgent,
    toolRegistry: Map<string, any>,
    _sessionStoragePath: string = '~/.scalix/sessions'
  ) {
    this.mainAgent = mainAgent;
    this.toolRegistry = toolRegistry;
    this.guardrailsSystem = new GuardrailsSystem();
    this.communicationManager = new CommunicationManager();
  }

  /**
   * Start a new conversation session
   */
  async startSession(projectPath: string): Promise<ConversationState> {
    const sessionId = uuidv4();
    const state: ConversationState = {
      sessionId,
      createdAt: new Date(),
      projectPath,
      turns: [],
      context: this.initializeContext(projectPath),
      metadata: this.initializeMetadata(),
      pluginManager: {} as PluginManager,
      hookRegistry: {} as HookRegistry,
    };

    this.sessions.set(sessionId, state);

    // Execute SessionStart hooks
    await this.executeHooks('SessionStart', state);

    return state;
  }

  /**
   * End a conversation session
   */
  async endSession(sessionId: string): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Execute SessionEnd hooks
    await this.executeHooks('SessionEnd', state);

    // Persist session to storage
    await this.persistSession(state);

    // Remove from memory
    this.sessions.delete(sessionId);
  }

  /**
   * Resume a previous conversation session
   */
  async resumeSession(sessionId: string): Promise<ConversationState> {
    // Load from storage
    const state = await this.loadSession(sessionId);
    if (!state) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add back to active sessions
    this.sessions.set(sessionId, state);

    return state;
  }

  /**
   * Process user input and generate agent response with tool calls
   */
  async processUserInput(
    input: string,
    state: ConversationState
  ): Promise<ConversationTurn> {
    const turnId = uuidv4();
    const startTime = Date.now();

    try {
      // 1. Update context with any recent changes
      await this.updateConversationContext(state);

      // 2. Get agent response
      const agentResult = await this.mainAgent.processMessage(input, state);

      // 3. Execute tool calls with hook validation
      const toolResults: ToolResult[] = [];
      const toolCallRecords = [];

      for (const toolCall of agentResult.toolCalls) {
        const toolRecord = {
          id: toolCall.id,
          name: toolCall.name,
          args: toolCall.args,
          timestamp: new Date(),
          duration: 0,
          status: 'pending' as const,
          cost: { costUSD: 0, inputTokens: 0, outputTokens: 0 },
        };

        // 1. Validate against guardrails
        const operation: Operation = {
          id: uuidv4(),
          type: this.mapToolTypeToOperation(toolCall.name),
          action: toolCall.name,
          target: toolCall.args?.target || toolCall.args?.path,
          args: toolCall.args,
          timestamp: new Date(),
          context: {
            userPreferences: state.context.userPreferences,
            fileSize: toolCall.args?.size,
          },
        };

        const validationResult = await this.guardrailsSystem.validateOperation(operation);

        // Handle guardrail violations
        if (!validationResult.valid) {
          console.warn(`🚫 Operation blocked: ${validationResult.violations.map((v) => v.message).join('; ')}`);
          continue;
        }

        // Request confirmation if needed
        if (validationResult.requiresConfirmation && state.context.userPreferences.confirmDestructive) {
          const confirmRequest = this.guardrailsSystem.createConfirmationRequest(
            operation.id,
            operation,
            validationResult.violations
          );

          // Show confirmation message
          const confirmationMessage = this.communicationManager.formatInteraction({
            id: confirmRequest.id,
            type: 'confirmation',
            severity: validationResult.severity,
            title: 'Confirm Operation',
            message: confirmRequest.message,
            options: confirmRequest.options.map((opt) => ({
              id: opt.value,
              label: opt.label,
              description: opt.description,
            })),
            timestamp: new Date(),
          });

          console.warn(confirmationMessage);

          // Store pending confirmation
          this.pendingConfirmations.set(confirmRequest.id, { confirmed: false });

          // Skip tool execution until confirmation
          continue;
        }

        // Execute PreToolUse hooks
        const hookContext = this.createHookContext('PreToolUse', state, toolCall);
        const modifications = await this.executeHooks('PreToolUse', state, hookContext);

        // Check if tool was blocked
        const blocked = modifications.some((m) => m.blocked);
        if (blocked) {
          console.warn(`⚠️ Tool ${toolCall.name} was blocked by hook`);
          continue;
        }

        // Execute tool
        const toolResult = await this.executeTool(toolCall, state);
        toolResults.push(toolResult);
        toolRecord.status = toolResult.success ? 'completed' : 'failed';
        toolRecord.duration = toolResult.duration;

        // Execute PostToolUse hooks
        await this.executeHooks('PostToolUse', state);

        toolCallRecords.push(toolRecord);
      }

      // 4. Create turn record
      const duration = Date.now() - startTime;
      const turn: ConversationTurn = {
        id: turnId,
        timestamp: new Date(),
        userMessage: input,
        agentResponse: agentResult.response,
        agentId: agentResult.agentId,
        toolCalls: toolCallRecords,
        toolResults,
        hookExecutions: [],
        duration,
        cost: {
          costUSD: (agentResult.inputTokens + agentResult.outputTokens) * 0.00001,
          inputTokens: agentResult.inputTokens,
          outputTokens: agentResult.outputTokens,
        },
        inputTokens: agentResult.inputTokens,
        outputTokens: agentResult.outputTokens,
        isError: false,
      };

      // 5. Update session
      state.turns.push(turn);
      this.updateSessionMetadata(state, agentResult.agentId, toolCallRecords);

      // 6. Execute TurnComplete hooks
      await this.executeHooks('TurnComplete', state);

      return turn;
    } catch (error) {
      const duration = Date.now() - startTime;
      const turn: ConversationTurn = {
        id: turnId,
        timestamp: new Date(),
        userMessage: input,
        agentResponse: '',
        agentId: this.mainAgent.id,
        toolCalls: [],
        toolResults: [],
        hookExecutions: [],
        duration,
        cost: { costUSD: 0, inputTokens: 0, outputTokens: 0 },
        inputTokens: 0,
        outputTokens: 0,
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      state.turns.push(turn);
      return turn;
    }
  }

  /**
   * Switch to a different agent
   */
  async switchAgent(agentId: string, state: ConversationState): Promise<void> {
    state.context.selectedAgent = agentId;
    state.context.agentHistory.push(agentId);

    // Execute AgentSwitch hooks
    await this.executeHooks('AgentSwitch', state);
  }

  /**
   * Execute a tool call
   */
  async executeTool(toolCall: ToolCall, state: ConversationState): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.toolRegistry.get(toolCall.name);

    if (!tool) {
      return {
        toolCallId: toolCall.id,
        success: false,
        error: `Tool ${toolCall.name} not found`,
        duration: Date.now() - startTime,
      };
    }

    try {
      const output = await tool.handler(toolCall.args, { conversationState: state });
      return {
        toolCallId: toolCall.id,
        success: true,
        output: JSON.stringify(output),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        toolCallId: toolCall.id,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Update conversation memory
   */
  updateMemory(key: string, value: any, state: ConversationState): void {
    state.context.memory.set(key, value);
  }

  /**
   * Retrieve conversation memory
   */
  getMemory(key: string, state: ConversationState): any {
    return state.context.memory.get(key);
  }

  /**
   * Get conversation metrics
   */
  async getMetrics(sessionId: string): Promise<ConversationMetrics> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { metadata } = state;

    return {
      sessionId,
      totalDuration: metadata.totalDuration,
      totalCost: metadata.totalCost,
      turnCount: metadata.totalTurns,
      agentMetrics: Object.fromEntries(metadata.agentUsage),
      toolMetrics: Object.fromEntries(metadata.toolUsage),
      traces: [], // TODO: Integrate with observability
    };
  }

  /**
   * Get conversation history
   */
  async getHistory(sessionId: string, limit: number = 50): Promise<ConversationTurn[]> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return state.turns.slice(-limit);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private initializeContext(projectPath: string): ConversationContext {
    return {
      projectPath,
      projectName: projectPath.split('/').pop() || 'unknown',
      gitBranch: 'main',
      gitStatus: {
        modified: [],
        untracked: [],
        staged: [],
        ahead: 0,
        behind: 0,
      },
      recentFiles: [],
      agentHistory: ['main'],
      selectedAgent: 'main',
      userPreferences: {
        confirmDestructive: true,
        explainReasons: true,
        autoCommit: false,
      },
      memory: new Map(),
      fileCache: new Map(),
    };
  }

  private initializeMetadata(): SessionMetadata {
    return {
      totalTurns: 0,
      totalTokens: 0,
      totalCost: 0,
      totalDuration: 0,
      agentSwitches: 0,
      agentUsage: {},
      toolCalls: 0,
      toolUsage: {},
      hookExecutions: 0,
      hookBlocks: 0,
    };
  }

  private async updateConversationContext(_state: ConversationState): Promise<void> {
    // TODO: Update git status, recent files, etc.
  }

  private createHookContext(
    _event: string,
    state: ConversationState,
    toolCall?: ToolCall
  ): HookContext {
    return {
      conversationState: state,
      event: '' as any,
      toolCall,
      warn: (message: string) => console.warn(message),
      confirm: async (_prompt: string) => {
        // TODO: Implement interactive confirmation
        return true;
      },
      log: (message: string) => console.log(message),
    };
  }

  private async executeHooks(
    _event: string,
    _state: ConversationState,
    _context?: HookContext
  ): Promise<any[]> {
    // TODO: Hook execution logic
    return [];
  }

  private updateSessionMetadata(
    state: ConversationState,
    agentId: string,
    toolCalls: any[]
  ): void {
    const { metadata } = state;

    metadata.totalTurns++;
    metadata.toolCalls += toolCalls.length;

    // Update agent usage
    if (!metadata.agentUsage[agentId]) {
      metadata.agentUsage[agentId] = {
        name: agentId,
        turnCount: 0,
        duration: 0,
        cost: 0,
        errorCount: 0,
        lastUsed: new Date(),
      };
    }
    metadata.agentUsage[agentId].turnCount++;
    metadata.agentUsage[agentId].lastUsed = new Date();

    // Update tool usage
    for (const toolCall of toolCalls) {
      if (!metadata.toolUsage[toolCall.name]) {
        metadata.toolUsage[toolCall.name] = {
          name: toolCall.name,
          callCount: 0,
          successCount: 0,
          errorCount: 0,
          duration: 0,
          cost: 0,
          lastUsed: new Date(),
        };
      }
      metadata.toolUsage[toolCall.name].callCount++;
      metadata.toolUsage[toolCall.name].duration += toolCall.duration;
      metadata.toolUsage[toolCall.name].lastUsed = new Date();
    }
  }

  private async persistSession(state: ConversationState): Promise<void> {
    // TODO: Persist to ~/.scalix/sessions/{sessionId}.json
  }

  private async loadSession(_sessionId: string): Promise<ConversationState | null> {
    // TODO: Load from ~/.scalix/sessions/{sessionId}.json
    return null;
  }

  /**
   * Confirm a pending operation
   */
  async confirmOperation(confirmationId: string, response: 'approve' | 'reject' | 'modify' | 'escalate'): Promise<{ approved: boolean; message: string }> {
    const result = await this.guardrailsSystem.respondToConfirmation(confirmationId, response);
    this.pendingConfirmations.set(confirmationId, { confirmed: result.approved, response });
    return result;
  }

  /**
   * Get pending confirmations
   */
  getPendingConfirmations(): UserInteraction[] {
    return this.communicationManager.getPendingConfirmations();
  }

  /**
   * Map tool name to operation type
   */
  private mapToolTypeToOperation(toolName: string): 'file' | 'git' | 'bash' | 'api' | 'ai' {
    if (toolName.startsWith('read') || toolName.startsWith('write') || toolName.startsWith('delete') || toolName.startsWith('list') || toolName.startsWith('find')) {
      return 'file';
    }
    if (toolName.startsWith('git')) {
      return 'git';
    }
    if (toolName.startsWith('bash') || toolName === 'runTests' || toolName === 'build' || toolName === 'lint') {
      return 'bash';
    }
    return 'api';
  }
}
