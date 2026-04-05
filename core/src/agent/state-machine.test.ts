/**
 * Agent State Machine Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentStateMachine } from './state-machine';
import { AgentState } from './types';

describe('AgentStateMachine', () => {
  let sm: AgentStateMachine;

  beforeEach(() => {
    sm = new AgentStateMachine();
  });

  describe('initial state', () => {
    it('should start in IDLE state', () => {
      expect(sm.getState()).toBe(AgentState.IDLE);
    });

    it('should not be in terminal state initially', () => {
      expect(sm.isTerminal()).toBe(false);
    });
  });

  describe('valid transitions', () => {
    it('should transition from IDLE to INITIALIZING', () => {
      sm.transition(AgentState.INITIALIZING);
      expect(sm.getState()).toBe(AgentState.INITIALIZING);
    });

    it('should transition from INITIALIZING to EXECUTING', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      expect(sm.getState()).toBe(AgentState.EXECUTING);
    });

    it('should transition from EXECUTING to WAITING', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.WAITING);
      expect(sm.getState()).toBe(AgentState.WAITING);
    });

    it('should transition from WAITING to EXECUTING', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.WAITING);
      sm.transition(AgentState.EXECUTING);
      expect(sm.getState()).toBe(AgentState.EXECUTING);
    });

    it('should transition from EXECUTING to COMPLETED', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.COMPLETED);
      expect(sm.getState()).toBe(AgentState.COMPLETED);
    });

    it('should transition from EXECUTING to ERRORED', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.ERRORED);
      expect(sm.getState()).toBe(AgentState.ERRORED);
    });

    it('should transition from EXECUTING to PAUSED', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.PAUSED);
      expect(sm.getState()).toBe(AgentState.PAUSED);
    });

    it('should transition from PAUSED to EXECUTING', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.PAUSED);
      sm.transition(AgentState.EXECUTING);
      expect(sm.getState()).toBe(AgentState.EXECUTING);
    });

    it('should transition from EXECUTING to CANCELLED', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.CANCELLED);
      expect(sm.getState()).toBe(AgentState.CANCELLED);
    });

    it('should transition from IDLE to CANCELLED', () => {
      sm.transition(AgentState.CANCELLED);
      expect(sm.getState()).toBe(AgentState.CANCELLED);
    });

    it('should transition from COMPLETED to IDLE', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.COMPLETED);
      sm.transition(AgentState.IDLE);
      expect(sm.getState()).toBe(AgentState.IDLE);
    });

    it('should transition from ERRORED to IDLE', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.ERRORED);
      sm.transition(AgentState.IDLE);
      expect(sm.getState()).toBe(AgentState.IDLE);
    });
  });

  describe('invalid transitions', () => {
    it('should throw on IDLE to EXECUTING', () => {
      expect(() => sm.transition(AgentState.EXECUTING)).toThrow(
        'Invalid state transition'
      );
    });

    it('should throw on IDLE to COMPLETED', () => {
      expect(() => sm.transition(AgentState.COMPLETED)).toThrow(
        'Invalid state transition'
      );
    });

    it('should throw on COMPLETED to EXECUTING', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.COMPLETED);
      expect(() => sm.transition(AgentState.EXECUTING)).toThrow(
        'Invalid state transition'
      );
    });

    it('should throw on INITIALIZING to WAITING', () => {
      sm.transition(AgentState.INITIALIZING);
      expect(() => sm.transition(AgentState.WAITING)).toThrow(
        'Invalid state transition'
      );
    });
  });

  describe('terminal states', () => {
    it('should identify COMPLETED as terminal', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.COMPLETED);
      expect(sm.isTerminal()).toBe(true);
    });

    it('should identify ERRORED as terminal', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.ERRORED);
      expect(sm.isTerminal()).toBe(true);
    });

    it('should identify CANCELLED as terminal', () => {
      sm.transition(AgentState.CANCELLED);
      expect(sm.isTerminal()).toBe(true);
    });

    it('should not identify EXECUTING as terminal', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      expect(sm.isTerminal()).toBe(false);
    });

    it('should not identify WAITING as terminal', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.WAITING);
      expect(sm.isTerminal()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to IDLE state', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.reset();
      expect(sm.getState()).toBe(AgentState.IDLE);
    });

    it('should allow transitions after reset', () => {
      sm.transition(AgentState.INITIALIZING);
      sm.transition(AgentState.EXECUTING);
      sm.transition(AgentState.COMPLETED);
      sm.reset();
      sm.transition(AgentState.INITIALIZING);
      expect(sm.getState()).toBe(AgentState.INITIALIZING);
    });
  });
});
