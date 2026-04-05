/**
 * Scalix Code Guardrails System
 *
 * Safety system preventing harmful operations, ensuring user confirmation
 * for destructive actions, and validating all operations against safety rules
 *
 * Inspired by Claude Code's safety-first approach
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Guardrail action types
 */
export type GuardrailActionType =
  | 'ALLOW'           // Allow operation
  | 'REQUIRE_CONFIRM' // Require user confirmation
  | 'WARN'            // Warn user but allow
  | 'BLOCK'           // Block operation
  | 'ESCALATE';       // Escalate to higher authority

export type GuardrailSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Guardrail rule
 */
export interface GuardrailRule {
  id: string;
  name: string;
  description: string;
  severity: GuardrailSeverity;
  action: GuardrailActionType;
  pattern: RegExp | ((operation: Operation) => boolean);
  message?: string;
  suggestedAlternative?: string;
  requiresApproval?: boolean;
}

/**
 * Operation to validate
 */
export interface Operation {
  id: string;
  type: 'file' | 'git' | 'bash' | 'api' | 'ai';
  action: string;
  target?: string;
  args?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  operationId: string;
  valid: boolean;
  action: GuardrailActionType;
  severity?: GuardrailSeverity;
  violations: GuardrailViolation[];
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  suggestedAlternatives: string[];
  timestamp: Date;
}

/**
 * Guardrail violation
 */
export interface GuardrailViolation {
  ruleId: string;
  ruleName: string;
  severity: GuardrailSeverity;
  message: string;
  suggestedAlternative?: string;
}

/**
 * User confirmation request
 */
export interface ConfirmationRequest {
  id: string;
  operationId: string;
  operation: Operation;
  violations: GuardrailViolation[];
  message: string;
  options: ConfirmationOption[];
  expiresAt: Date;
  requiresApproval: boolean;
}

/**
 * Confirmation option
 */
export interface ConfirmationOption {
  label: string;
  value: 'approve' | 'reject' | 'modify' | 'escalate';
  description?: string;
}

/**
 * Guardrails System
 */
export class GuardrailsSystem {
  private rules: Map<string, GuardrailRule> = new Map();
  private operationLog: Operation[] = [];
  private violationLog: GuardrailViolation[] = [];
  private confirmationHistory: Map<string, ConfirmationRequest> = new Map();
  private maxOperationLogSize = 1000;

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * Register a guardrail rule
   */
  registerRule(rule: GuardrailRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule already registered: ${rule.id}`);
    }
    this.rules.set(rule.id, rule);
  }

  /**
   * Validate an operation against all rules
   */
  async validateOperation(operation: Operation): Promise<ValidationResult> {
    const violations: GuardrailViolation[] = [];
    let action: GuardrailActionType = 'ALLOW';
    let highestSeverity: GuardrailSeverity = 'low';
    let requiresConfirmation = false;

    // Check each rule
    for (const rule of this.rules.values()) {
      if (this.matchesRule(operation, rule)) {
        const violation: GuardrailViolation = {
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: rule.message || `Violation of rule: ${rule.name}`,
          suggestedAlternative: rule.suggestedAlternative,
        };

        violations.push(violation);
        this.violationLog.push(violation);

        // Determine action priority
        if (rule.action === 'BLOCK') {
          action = 'BLOCK';
          highestSeverity = rule.severity;
        } else if (rule.action === 'ESCALATE' && action !== 'BLOCK') {
          action = 'ESCALATE';
          highestSeverity = rule.severity;
        } else if (rule.action === 'REQUIRE_CONFIRM' && action !== 'BLOCK' && action !== 'ESCALATE') {
          action = 'REQUIRE_CONFIRM';
          requiresConfirmation = true;
          if (this.compareSeverity(rule.severity, highestSeverity) > 0) {
            highestSeverity = rule.severity;
          }
        }

        if (rule.requiresApproval) {
          requiresConfirmation = true;
        }
      }
    }

    // Log operation
    this.logOperation(operation);

    // Get suggestions
    const suggestedAlternatives = violations
      .filter((v) => v.suggestedAlternative)
      .map((v) => v.suggestedAlternative!);

    return {
      operationId: operation.id,
      valid: action !== 'BLOCK',
      action,
      severity: highestSeverity,
      violations,
      requiresConfirmation,
      confirmationMessage: this.generateConfirmationMessage(violations),
      suggestedAlternatives,
      timestamp: new Date(),
    };
  }

  /**
   * Create a confirmation request
   */
  createConfirmationRequest(
    operationId: string,
    operation: Operation,
    violations: GuardrailViolation[]
  ): ConfirmationRequest {
    const request: ConfirmationRequest = {
      id: uuidv4(),
      operationId,
      operation,
      violations,
      message: this.generateConfirmationMessage(violations),
      options: [
        {
          label: 'Approve',
          value: 'approve',
          description: 'Proceed with the operation',
        },
        {
          label: 'Reject',
          value: 'reject',
          description: 'Cancel the operation',
        },
        {
          label: 'Modify',
          value: 'modify',
          description: 'Modify the operation',
        },
        {
          label: 'Escalate',
          value: 'escalate',
          description: 'Escalate to higher authority',
        },
      ],
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute expiry
      requiresApproval: violations.some((v) => v.severity === 'critical'),
    };

    this.confirmationHistory.set(request.id, request);
    return request;
  }

  /**
   * Respond to a confirmation request
   */
  async respondToConfirmation(
    confirmationId: string,
    response: 'approve' | 'reject' | 'modify' | 'escalate',
    reason?: string
  ): Promise<{ approved: boolean; message: string }> {
    const request = this.confirmationHistory.get(confirmationId);
    if (!request) {
      throw new Error(`Confirmation request not found: ${confirmationId}`);
    }

    if (response === 'approve') {
      return {
        approved: true,
        message: 'Operation approved and will proceed',
      };
    } else if (response === 'reject') {
      return {
        approved: false,
        message: 'Operation cancelled by user',
      };
    } else if (response === 'modify') {
      return {
        approved: false,
        message: 'Operation requires modification. Please adjust and resubmit.',
      };
    } else if (response === 'escalate') {
      return {
        approved: false,
        message: 'Operation escalated for review by administrator',
      };
    }

    throw new Error(`Invalid response: ${response}`);
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit: number = 50): Operation[] {
    return this.operationLog.slice(-limit);
  }

  /**
   * Get violation history
   */
  getViolationHistory(limit: number = 100): GuardrailViolation[] {
    return this.violationLog.slice(-limit);
  }

  /**
   * Generate confirmation message
   */
  private generateConfirmationMessage(violations: GuardrailViolation[]): string {
    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    const highViolations = violations.filter((v) => v.severity === 'high');

    if (criticalViolations.length > 0) {
      return `⚠️ CRITICAL GUARDRAIL VIOLATION\n\n${criticalViolations.map((v) => `• ${v.message}`).join('\n')}\n\nThis operation requires explicit approval.`;
    }

    if (highViolations.length > 0) {
      return `⚠️ Significant guardrail concerns:\n\n${highViolations.map((v) => `• ${v.message}`).join('\n')}\n\nPlease confirm before proceeding.`;
    }

    return `This operation triggers guardrail checks:\n\n${violations.map((v) => `• ${v.message}`).join('\n')}\n\nDo you want to proceed?`;
  }

  /**
   * Match operation against rule
   */
  private matchesRule(operation: Operation, rule: GuardrailRule): boolean {
    if (typeof rule.pattern === 'function') {
      return rule.pattern(operation);
    }

    const str = `${operation.type}:${operation.action}:${operation.target || ''}`;
    return rule.pattern.test(str);
  }

  /**
   * Log operation
   */
  private logOperation(operation: Operation): void {
    this.operationLog.push(operation);

    // Trim log if too large
    if (this.operationLog.length > this.maxOperationLogSize) {
      this.operationLog = this.operationLog.slice(-this.maxOperationLogSize);
    }
  }

  /**
   * Compare severity levels
   */
  private compareSeverity(s1: GuardrailSeverity, s2: GuardrailSeverity): number {
    const levels = { low: 0, medium: 1, high: 2, critical: 3 };
    return levels[s1] - levels[s2];
  }

  /**
   * Register default safety rules
   */
  private registerDefaultRules(): void {
    // File operations rules
    this.registerRule({
      id: 'file:delete-critical',
      name: 'Delete critical files',
      description: 'Prevent deletion of critical files without confirmation',
      severity: 'critical',
      action: 'REQUIRE_CONFIRM',
      pattern: /file:delete:.*(package\.json|tsconfig\.json|\.env|src\/)/,
      message: 'You are about to delete a critical file',
      suggestedAlternative: 'Consider archiving the file instead of deleting',
      requiresApproval: true,
    });

    this.registerRule({
      id: 'file:overwrite-large',
      name: 'Overwrite large files',
      description: 'Require confirmation for overwriting large files',
      severity: 'high',
      action: 'REQUIRE_CONFIRM',
      pattern: (op) => op.type === 'file' && op.action === 'write' && (op.context?.size || 0) > 100000,
      message: 'You are about to overwrite a large file',
    });

    // Git operations rules
    this.registerRule({
      id: 'git:force-push-main',
      name: 'Force push to main',
      description: 'Block force push to main branch',
      severity: 'critical',
      action: 'BLOCK',
      pattern: /git:(push|reset).*main/,
      message: 'Force push to main branch is not allowed',
      suggestedAlternative: 'Use a feature branch and create a pull request',
    });

    this.registerRule({
      id: 'git:reset-hard',
      name: 'Hard reset',
      description: 'Require confirmation for hard reset',
      severity: 'high',
      action: 'REQUIRE_CONFIRM',
      pattern: /git:reset.*hard/,
      message: 'Hard reset will discard all uncommitted changes',
      requiresApproval: true,
    });

    // Bash execution rules
    this.registerRule({
      id: 'bash:dangerous-rm',
      name: 'Dangerous rm command',
      description: 'Block dangerous recursive deletions',
      severity: 'critical',
      action: 'BLOCK',
      pattern: /bash:.*rm\s+-rf\s+\//,
      message: 'Recursive deletion from root directory is blocked',
      suggestedAlternative: 'Use targeted file deletion instead',
    });

    this.registerRule({
      id: 'bash:database-drop',
      name: 'Drop database',
      description: 'Block database drop commands',
      severity: 'critical',
      action: 'REQUIRE_CONFIRM',
      pattern: /bash:.*(DROP\s+DATABASE|drop\s+table|DELETE\s+FROM)/i,
      message: 'This command will delete database data',
      requiresApproval: true,
    });

    this.registerRule({
      id: 'bash:unsafe-chaining',
      name: 'Unsafe command chaining',
      description: 'Warn about unsafe command chaining patterns',
      severity: 'high',
      action: 'WARN',
      pattern: /bash:.*(&&|;|\|).*(?:rm|dd|mkfs|shutdown)/,
      message: 'Command chaining with potentially dangerous operations detected',
    });

    // AI/API rules
    this.registerRule({
      id: 'api:send-secrets',
      name: 'Send secrets in API',
      description: 'Prevent sending secrets in API calls',
      severity: 'critical',
      action: 'BLOCK',
      pattern: (op) =>
        op.type === 'api' && op.args && ('password' in op.args || 'api_key' in op.args || 'secret' in op.args),
      message: 'Secrets detected in API call',
      suggestedAlternative: 'Use environment variables for sensitive data',
    });

    this.registerRule({
      id: 'ai:large-context',
      name: 'Large context window',
      description: 'Warn about large AI context',
      severity: 'medium',
      action: 'WARN',
      pattern: (op) => op.type === 'ai' && (op.context?.tokens || 0) > 50000,
      message: 'Large context window may be expensive',
    });
  }
}

/**
 * Create guardrails system instance
 */
export function createGuardrailsSystem(): GuardrailsSystem {
  return new GuardrailsSystem();
}
