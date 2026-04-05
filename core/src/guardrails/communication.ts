/**
 * Communication Guardrails
 *
 * Manages user interaction patterns, confirmation flows, and communication safety
 * Inspired by Claude Code's chat guardrails and interaction patterns
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Communication interaction types
 */
export type InteractionType =
  | 'question'           // Ask clarifying question
  | 'confirmation'       // Require confirmation
  | 'warning'            // Warn user
  | 'error'              // Report error
  | 'suggestion'         // Suggest action
  | 'progress'           // Report progress
  | 'summary';           // Summary of completed work

export type InteractionSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * User interaction
 */
export interface UserInteraction {
  id: string;
  type: InteractionType;
  severity?: InteractionSeverity;
  title: string;
  message: string;
  details?: string;
  options?: InteractionOption[];
  context?: Record<string, any>;
  timestamp: Date;
  expiresAt?: Date;
  userResponse?: UserResponse;
  metadata?: Record<string, any>;
}

/**
 * Interaction option
 */
export interface InteractionOption {
  id: string;
  label: string;
  description?: string;
  isDefault?: boolean;
  requiresConfirm?: boolean;
}

/**
 * User response to interaction
 */
export interface UserResponse {
  interactionId: string;
  option: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Phase-based workflow with checkpoints
 */
export interface WorkflowPhase {
  id: string;
  number: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  tasks: WorkflowTask[];
  checkpoints: WorkflowCheckpoint[];
  duration?: number;
}

/**
 * Workflow task
 */
export interface WorkflowTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  optional?: boolean;
}

/**
 * Workflow checkpoint
 */
export interface WorkflowCheckpoint {
  id: string;
  name: string;
  type: 'gate' | 'decision' | 'review';
  requiredConfirmation?: boolean;
  blocking?: boolean;
  approved?: boolean;
}

/**
 * Confidence-based recommendation
 */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-100
  category: 'quality' | 'performance' | 'security' | 'convention' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  canAutoApply: boolean;
  suggestedAction?: string;
  references?: string[];
}

/**
 * Communication Manager
 */
export class CommunicationManager {
  private interactions: Map<string, UserInteraction> = new Map();
  private workflows: Map<string, WorkflowPhase[]> = new Map();
  private recommendations: Recommendation[] = [];
  private pendingConfirmations: Map<string, UserInteraction> = new Map();
  private interactionHistory: UserInteraction[] = [];
  private _maxHistorySize = 500;

  /**
   * Ask a clarifying question
   */
  askQuestion(
    title: string,
    message: string,
    options: InteractionOption[]
  ): UserInteraction {
    const interaction: UserInteraction = {
      id: uuidv4(),
      type: 'question',
      title,
      message,
      options,
      timestamp: new Date(),
    };

    this.interactions.set(interaction.id, interaction);
    this.pendingConfirmations.set(interaction.id, interaction);

    return interaction;
  }

  /**
   * Request confirmation
   */
  requestConfirmation(
    title: string,
    message: string,
    severity: InteractionSeverity = 'high',
    details?: string
  ): UserInteraction {
    const interaction: UserInteraction = {
      id: uuidv4(),
      type: 'confirmation',
      severity,
      title,
      message,
      details,
      options: [
        { id: 'approve', label: 'Approve', isDefault: false },
        { id: 'reject', label: 'Reject', isDefault: true },
        { id: 'modify', label: 'Modify', requiresConfirm: true },
      ],
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    };

    this.interactions.set(interaction.id, interaction);
    this.pendingConfirmations.set(interaction.id, interaction);

    return interaction;
  }

  /**
   * Send warning message
   */
  warn(title: string, message: string, details?: string): UserInteraction {
    const interaction: UserInteraction = {
      id: uuidv4(),
      type: 'warning',
      severity: 'high',
      title,
      message,
      details,
      timestamp: new Date(),
    };

    this.interactions.set(interaction.id, interaction);
    this.interactionHistory.push(interaction);

    return interaction;
  }

  /**
   * Report error
   */
  reportError(title: string, message: string, details?: string): UserInteraction {
    const interaction: UserInteraction = {
      id: uuidv4(),
      type: 'error',
      severity: 'critical',
      title,
      message,
      details,
      timestamp: new Date(),
    };

    this.interactions.set(interaction.id, interaction);
    this.interactionHistory.push(interaction);

    return interaction;
  }

  /**
   * Suggest action
   */
  suggestAction(title: string, message: string, action: string): UserInteraction {
    const interaction: UserInteraction = {
      id: uuidv4(),
      type: 'suggestion',
      title,
      message,
      options: [
        { id: 'accept', label: 'Accept suggestion', isDefault: true },
        { id: 'reject', label: 'Reject' },
        { id: 'modify', label: 'Modify' },
      ],
      timestamp: new Date(),
      metadata: { suggestedAction: action },
    };

    this.interactions.set(interaction.id, interaction);

    return interaction;
  }

  /**
   * Report progress
   */
  reportProgress(title: string, message: string): UserInteraction {
    const interaction: UserInteraction = {
      id: uuidv4(),
      type: 'progress',
      title,
      message,
      timestamp: new Date(),
    };

    this.interactionHistory.push(interaction);
    return interaction;
  }

  /**
   * Respond to interaction
   */
  respond(interactionId: string, optionId: string): void {
    const interaction = this.interactions.get(interactionId);
    if (!interaction) {
      throw new Error(`Interaction not found: ${interactionId}`);
    }

    interaction.userResponse = {
      interactionId,
      option: optionId,
      timestamp: new Date(),
    };

    this.pendingConfirmations.delete(interactionId);
    this.interactionHistory.push(interaction);
  }

  /**
   * Get pending confirmations
   */
  getPendingConfirmations(): UserInteraction[] {
    return Array.from(this.pendingConfirmations.values());
  }

  /**
   * Create workflow with phases
   */
  createWorkflow(id: string, phases: WorkflowPhase[]): void {
    this.workflows.set(id, phases);
  }

  /**
   * Update workflow phase status
   */
  updatePhaseStatus(
    workflowId: string,
    phaseId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  ): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const phase = workflow.find((p) => p.id === phaseId);
    if (!phase) {
      throw new Error(`Phase not found: ${phaseId}`);
    }

    phase.status = status;
  }

  /**
   * Complete workflow task
   */
  completeTask(workflowId: string, phaseId: string, taskId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const phase = workflow.find((p) => p.id === phaseId);
    if (!phase) {
      throw new Error(`Phase not found: ${phaseId}`);
    }

    const task = phase.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.completed = true;
  }

  /**
   * Add recommendation
   */
  addRecommendation(
    title: string,
    description: string,
    confidence: number,
    category: 'quality' | 'performance' | 'security' | 'convention' | 'error',
    severity: 'low' | 'medium' | 'high' | 'critical',
    canAutoApply: boolean = false
  ): Recommendation {
    // Filter low-confidence recommendations (< 50%)
    if (confidence < 50) {
      return {
        id: uuidv4(),
        title,
        description,
        confidence,
        category,
        severity,
        canAutoApply,
      };
    }

    const recommendation: Recommendation = {
      id: uuidv4(),
      title,
      description,
      confidence,
      category,
      severity,
      canAutoApply,
    };

    this.recommendations.push(recommendation);
    return recommendation;
  }

  /**
   * Get high-confidence recommendations
   */
  getRecommendations(minConfidence: number = 80): Recommendation[] {
    return this.recommendations.filter((r) => r.confidence >= minConfidence);
  }

  /**
   * Get interaction history
   */
  getHistory(limit: number = 100): UserInteraction[] {
    return this.interactionHistory.slice(-limit);
  }

  /**
   * Format interaction for display
   */
  formatInteraction(interaction: UserInteraction): string {
    const severity = interaction.severity ? `[${interaction.severity.toUpperCase()}] ` : '';
    let output = `${severity}${interaction.title}\n`;
    output += `${interaction.message}\n`;

    if (interaction.details) {
      output += `\nDetails:\n${interaction.details}\n`;
    }

    if (interaction.options && interaction.options.length > 0) {
      output += '\nOptions:\n';
      interaction.options.forEach((opt) => {
        const defaultMarker = opt.isDefault ? ' (default)' : '';
        output += `  • ${opt.label}${defaultMarker}`;
        if (opt.description) {
          output += ` - ${opt.description}`;
        }
        output += '\n';
      });
    }

    return output;
  }
}

/**
 * Create communication manager
 */
export function createCommunicationManager(): CommunicationManager {
  return new CommunicationManager();
}
