/**
 * Test Fixtures
 *
 * Standard test data and configurations for testing
 */

import type { AgentConfig, ExecutionResult, ToolCall } from '@scalix/core';

/**
 * Default test agent configuration
 */
export const defaultAgentConfig: AgentConfig = {
  id: 'test-agent',
  name: 'Test Agent',
  description: 'A test agent',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
  },
  tools: ['echo', 'get_current_time'],
  systemPrompt: 'You are a helpful test agent.',
  maxIterations: 5,
  timeout: 30000,
};

/**
 * Minimal agent configuration
 */
export const minimalAgentConfig: AgentConfig = {
  id: 'minimal-agent',
  name: 'Minimal Agent',
  model: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
  },
};

/**
 * Test agent with all optional fields
 */
export const fullAgentConfig: AgentConfig = {
  id: 'full-agent',
  name: 'Full Agent',
  description: 'Agent with all optional fields',
  model: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
  },
  tools: ['echo', 'get_current_time', 'random_number'],
  systemPrompt: 'You are a comprehensive test agent with all features enabled.',
  maxIterations: 10,
  timeout: 60000,
};

/**
 * Test execution result
 */
export const defaultExecutionResult: ExecutionResult = {
  executionId: 'exec-test-123',
  agentId: 'test-agent',
  status: 'completed',
  output: 'Test execution completed successfully',
  error: null,
  duration: 1250,
  iterations: 2,
  toolCalls: [
    {
      toolName: 'echo',
      arguments: { message: 'Hello' },
      result: 'Hello',
    },
  ],
  cost: {
    inputTokens: 150,
    outputTokens: 50,
    costUSD: 0.0025,
  },
  trace: [],
};

/**
 * Failed execution result
 */
export const failedExecutionResult: ExecutionResult = {
  executionId: 'exec-failed-456',
  agentId: 'test-agent',
  status: 'failed',
  output: null,
  error: 'Agent execution failed: timeout exceeded',
  duration: 30000,
  iterations: 1,
  toolCalls: [],
  cost: {
    inputTokens: 100,
    outputTokens: 0,
    costUSD: 0.001,
  },
  trace: [],
};

/**
 * Execution result with multiple tool calls
 */
export const multiToolExecutionResult: ExecutionResult = {
  executionId: 'exec-multi-789',
  agentId: 'test-agent',
  status: 'completed',
  output: 'Executed multiple tools successfully',
  error: null,
  duration: 2500,
  iterations: 3,
  toolCalls: [
    {
      toolName: 'echo',
      arguments: { message: 'First' },
      result: 'First',
    },
    {
      toolName: 'get_current_time',
      arguments: {},
      result: '2026-04-05T12:00:00.000Z',
    },
    {
      toolName: 'random_number',
      arguments: { min: 1, max: 100 },
      result: 42,
    },
  ],
  cost: {
    inputTokens: 300,
    outputTokens: 100,
    costUSD: 0.0045,
  },
  trace: [],
};

/**
 * Test input strings
 */
export const testInputs = {
  simple: 'What is 2+2?',
  complex: 'Please analyze the following data and provide insights: [complex data here]',
  empty: '',
  long: 'A'.repeat(10000),
  withSpecialChars: 'Test with !@#$%^&*() special characters',
  multiline: 'Line 1\nLine 2\nLine 3',
};

/**
 * Test tool configurations
 */
export const testTools = [
  {
    name: 'echo',
    description: 'Echo back the input',
    parameters: { type: 'object', properties: { message: { type: 'string' } } },
  },
  {
    name: 'get_current_time',
    description: 'Get the current time',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'random_number',
    description: 'Generate a random number',
    parameters: {
      type: 'object',
      properties: {
        min: { type: 'number' },
        max: { type: 'number' },
      },
    },
  },
];

/**
 * Test workflow configurations
 */
export const testWorkflows = {
  sequential: {
    id: 'workflow-seq',
    name: 'Sequential Workflow',
    pattern: 'sequential' as const,
    steps: [
      { agentId: 'agent-1', input: 'First step' },
      { agentId: 'agent-2', input: 'Second step' },
      { agentId: 'agent-3', input: 'Third step' },
    ],
  },
  parallel: {
    id: 'workflow-par',
    name: 'Parallel Workflow',
    pattern: 'parallel' as const,
    steps: [
      { agentId: 'agent-1', input: 'Task 1' },
      { agentId: 'agent-2', input: 'Task 2' },
      { agentId: 'agent-3', input: 'Task 3' },
    ],
  },
};

/**
 * Performance test configurations
 */
export const performanceConfigs = {
  light: {
    agents: 10,
    executionsPerAgent: 5,
    expectedDurationMs: 1000,
  },
  medium: {
    agents: 50,
    executionsPerAgent: 10,
    expectedDurationMs: 5000,
  },
  heavy: {
    agents: 100,
    executionsPerAgent: 20,
    expectedDurationMs: 15000,
  },
};

/**
 * Error test cases
 */
export const errorCases = {
  invalidAgentId: {
    agentId: 'nonexistent-agent',
    expectedError: 'Agent not found',
  },
  emptyInput: {
    input: '',
    expectedError: 'Input cannot be empty',
  },
  timeout: {
    input: 'Very complex task',
    timeout: 100, // Very short timeout
    expectedError: 'timeout',
  },
  toolNotFound: {
    toolName: 'nonexistent_tool',
    expectedError: 'Tool not found',
  },
};

/**
 * API test cases
 */
export const apiTestCases = {
  createAgent: {
    body: defaultAgentConfig,
    expectedStatus: 201,
  },
  getAgent: {
    params: { agentId: 'test-agent' },
    expectedStatus: 200,
  },
  listAgents: {
    expectedStatus: 200,
  },
  executeAgent: {
    body: {
      agentId: 'test-agent',
      input: 'Test input',
    },
    expectedStatus: 200,
  },
  deleteAgent: {
    params: { agentId: 'test-agent' },
    expectedStatus: 200,
  },
};

/**
 * CLI test cases
 */
export const cliTestCases = {
  agentList: {
    command: 'agent list',
    expectedOutput: 'agents',
  },
  agentCreate: {
    command: 'agent create test "Test Agent"',
    expectedOutput: 'created',
  },
  agentGet: {
    command: 'agent get test-agent',
    expectedOutput: 'Test Agent',
  },
  agentDelete: {
    command: 'agent delete test-agent',
    expectedOutput: 'deleted',
  },
  stats: {
    command: 'stats',
    expectedOutput: 'agents',
  },
};
