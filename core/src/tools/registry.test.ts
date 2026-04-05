/**
 * Tool Registry Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolRegistry } from './registry';
import type { Tool } from './types';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  const createTestTool = (name: string, overrides?: Partial<Tool>): Partial<Tool> => ({
    name,
    description: `Test tool: ${name}`,
    parameters: [],
    execute: vi.fn(async (args) => ({ result: 'ok', args })),
    ...overrides,
  });

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('register', () => {
    it('should register a valid tool', () => {
      registry.register(createTestTool('test-tool'));
      expect(registry.get('test-tool')).toBeDefined();
    });

    it('should throw when registering duplicate tool', () => {
      registry.register(createTestTool('test-tool'));
      expect(() => registry.register(createTestTool('test-tool'))).toThrow(
        'Tool already registered'
      );
    });

    it('should throw when tool name is missing', () => {
      expect(() =>
        registry.register({ description: 'no name', execute: vi.fn() } as any)
      ).toThrow('Tool name is required');
    });

    it('should throw when description is missing', () => {
      expect(() =>
        registry.register({ name: 'no-desc', execute: vi.fn() } as any)
      ).toThrow('Tool description is required');
    });

    it('should throw when execute is not a function', () => {
      expect(() =>
        registry.register({
          name: 'no-exec',
          description: 'missing execute',
          execute: 'not a function',
        } as any)
      ).toThrow('Tool execute must be a function');
    });

    it('should register tool with rate limit', () => {
      registry.register(
        createTestTool('rate-limited', {
          rateLimit: { maxCalls: 10, windowMs: 1000 },
        })
      );
      expect(registry.get('rate-limited')).toBeDefined();
    });

    it('should register tool with empty parameters', () => {
      const tool = createTestTool('no-params');
      delete (tool as any).parameters;
      registry.register(tool);
      expect(registry.get('no-params')).toBeDefined();
    });
  });

  describe('unregister', () => {
    it('should unregister an existing tool', async () => {
      registry.register(createTestTool('removable'));
      await registry.unregister('removable');
      expect(registry.get('removable')).toBeUndefined();
    });

    it('should throw when unregistering non-existent tool', async () => {
      await expect(registry.unregister('nonexistent')).rejects.toThrow(
        'Tool not found'
      );
    });
  });

  describe('get', () => {
    it('should return registered tool', () => {
      registry.register(createTestTool('my-tool'));
      const tool = registry.get('my-tool');
      expect(tool).toBeDefined();
      expect(tool!.name).toBe('my-tool');
    });

    it('should return undefined for unregistered tool', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered tools', () => {
      registry.register(createTestTool('tool-a'));
      registry.register(createTestTool('tool-b'));
      registry.register(createTestTool('tool-c'));

      const tools = registry.getAll();
      expect(tools).toHaveLength(3);
    });

    it('should return empty array when no tools', () => {
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('execute', () => {
    it('should execute a registered tool', async () => {
      registry.register(createTestTool('exec-tool'));

      const result = await registry.execute({
        id: 'call-1',
        toolName: 'exec-tool',
        arguments: { input: 'test' },
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it('should return error for unregistered tool', async () => {
      const result = await registry.execute({
        id: 'call-1',
        toolName: 'nonexistent',
        arguments: {},
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('not found');
    });
  });

  describe('getAvailable', () => {
    it('should return all tools for any agent', () => {
      registry.register(createTestTool('tool-1'));
      registry.register(createTestTool('tool-2'));

      const available = registry.getAvailable('agent-1');
      expect(available).toHaveLength(2);
    });
  });

  describe('registerBuiltins', () => {
    it('should register built-in tools', async () => {
      await registry.registerBuiltins();

      expect(registry.get('echo')).toBeDefined();
      expect(registry.get('get_current_time')).toBeDefined();
      expect(registry.get('random_number')).toBeDefined();
    });

    it('should have working echo tool', async () => {
      await registry.registerBuiltins();
      const echo = registry.get('echo')!;
      const result = await echo.execute({ message: 'hello' });
      expect(result).toEqual({ echoed: 'hello' });
    });

    it('should have working get_current_time tool', async () => {
      await registry.registerBuiltins();
      const timeTool = registry.get('get_current_time')!;
      const result = (await timeTool.execute({})) as { time: string };
      expect(result.time).toBeDefined();
    });

    it('should have working random_number tool', async () => {
      await registry.registerBuiltins();
      const rng = registry.get('random_number')!;
      const result = (await rng.execute({ min: 1, max: 10 })) as { number: number };
      expect(result.number).toBeGreaterThanOrEqual(1);
      expect(result.number).toBeLessThanOrEqual(10);
    });
  });
});
