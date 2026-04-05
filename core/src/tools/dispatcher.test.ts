/**
 * Tool Dispatcher Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolDispatcher } from './dispatcher';
import { ToolRegistry } from './registry';

describe('ToolDispatcher', () => {
  let dispatcher: ToolDispatcher;
  let registry: ToolRegistry;

  beforeEach(() => {
    dispatcher = new ToolDispatcher();
    registry = new ToolRegistry();
  });

  describe('initialization', () => {
    it('should create dispatcher instance', () => {
      expect(dispatcher).toBeDefined();
    });

    it('should have rate limiting enabled by default', () => {
      expect(dispatcher).toBeDefined();
    });
  });

  describe('input validation', () => {
    it('should validate input length', async () => {
      const longInput = 'A'.repeat(20000);
      const result = await dispatcher.execute('test-tool', { message: longInput });
      expect(result.success).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject blocked patterns', async () => {
      const blockedInput = { code: 'eval("dangerous code")' };
      const result = await dispatcher.execute('test-tool', blockedInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('blocked');
    });

    it('should accept valid input', async () => {
      const validInput = { message: 'Hello, world!' };
      registry.register({
        name: 'echo',
        description: 'Echo input',
        execute: async (args) => args,
      });
      dispatcher.setRegistry(registry);
      const result = await dispatcher.execute('echo', validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('rate limiting', () => {
    it('should enforce per-tool rate limits', async () => {
      dispatcher.setRateLimit('test-tool', 2, 1000); // 2 calls per 1000ms

      registry.register({
        name: 'test-tool',
        description: 'Test tool',
        execute: async () => 'result',
      });
      dispatcher.setRegistry(registry);

      const result1 = await dispatcher.execute('test-tool', {});
      const result2 = await dispatcher.execute('test-tool', {});
      const result3 = await dispatcher.execute('test-tool', {});

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(false); // Rate limited
    });
  });

  describe('timeout handling', () => {
    it('should timeout long-running tools', async () => {
      registry.register({
        name: 'slow-tool',
        description: 'Slow tool',
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return 'done';
        },
      });
      dispatcher.setRegistry(registry);

      const result = await dispatcher.execute('slow-tool', {}, { timeout: 100 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('error handling', () => {
    it('should handle tool execution errors', async () => {
      registry.register({
        name: 'error-tool',
        description: 'Tool that errors',
        execute: async () => {
          throw new Error('Tool error');
        },
      });
      dispatcher.setRegistry(registry);

      const result = await dispatcher.execute('error-tool', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool error');
    });

    it('should handle missing tools', async () => {
      const result = await dispatcher.execute('nonexistent-tool', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
