/**
 * Agent State Machine
 *
 * Manages agent lifecycle state transitions
 */

import { AgentState } from './types';

/**
 * State transition validator
 */
export class AgentStateMachine {
  private currentState: AgentState = AgentState.IDLE;

  /**
   * Get current state
   */
  getState(): AgentState {
    return this.currentState;
  }

  /**
   * Transition to new state
   * Validates that transition is allowed
   */
  transition(newState: AgentState): void {
    const isValid = this.isValidTransition(this.currentState, newState);

    if (!isValid) {
      throw new Error(
        `Invalid state transition: ${this.currentState} -> ${newState}`
      );
    }

    this.currentState = newState;
  }

  /**
   * Check if transition is valid
   */
  private isValidTransition(from: AgentState, to: AgentState): boolean {
    const validTransitions: Record<AgentState, AgentState[]> = {
      [AgentState.IDLE]: [
        AgentState.INITIALIZING,
        AgentState.PAUSED,
        AgentState.CANCELLED,
      ],
      [AgentState.INITIALIZING]: [
        AgentState.EXECUTING,
        AgentState.ERRORED,
        AgentState.CANCELLED,
      ],
      [AgentState.EXECUTING]: [
        AgentState.WAITING,
        AgentState.COMPLETED,
        AgentState.PAUSED,
        AgentState.ERRORED,
        AgentState.CANCELLED,
      ],
      [AgentState.WAITING]: [
        AgentState.EXECUTING,
        AgentState.PAUSED,
        AgentState.ERRORED,
        AgentState.CANCELLED,
      ],
      [AgentState.PAUSED]: [
        AgentState.EXECUTING,
        AgentState.CANCELLED,
        AgentState.ERRORED,
      ],
      [AgentState.COMPLETED]: [AgentState.IDLE],
      [AgentState.ERRORED]: [AgentState.IDLE],
      [AgentState.CANCELLED]: [AgentState.IDLE],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Check if state is terminal
   */
  isTerminal(): boolean {
    return [
      AgentState.COMPLETED,
      AgentState.ERRORED,
      AgentState.CANCELLED,
    ].includes(this.currentState);
  }

  /**
   * Reset state machine
   */
  reset(): void {
    this.currentState = AgentState.IDLE;
  }
}
