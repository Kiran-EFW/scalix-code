/**
 * Tracer Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultTracer, NoOpTracer } from './tracer';

describe('DefaultTracer', () => {
  let tracer: DefaultTracer;

  beforeEach(() => {
    tracer = new DefaultTracer();
  });

  describe('startSpan', () => {
    it('should create a span with correct name', () => {
      const span = tracer.startSpan('test-span');
      expect(span.name).toBe('test-span');
    });

    it('should assign unique IDs', () => {
      const span1 = tracer.startSpan('span-1');
      const span2 = tracer.startSpan('span-2');
      expect(span1.id).not.toBe(span2.id);
    });

    it('should set start time', () => {
      const span = tracer.startSpan('test');
      expect(span.startTime).toBeInstanceOf(Date);
    });

    it('should include attributes', () => {
      const span = tracer.startSpan('test', { agentId: 'agent-1' });
      expect(span.attributes).toEqual({ agentId: 'agent-1' });
    });

    it('should set parent span ID for nested spans', () => {
      const parent = tracer.startSpan('parent');
      const child = tracer.startSpan('child');
      expect(child.parentId).toBe(parent.id);
    });

    it('should share trace ID for nested spans', () => {
      const parent = tracer.startSpan('parent');
      const child = tracer.startSpan('child');
      expect(child.traceId).toBe(parent.traceId);
    });
  });

  describe('endSpan', () => {
    it('should set end time and duration', () => {
      const span = tracer.startSpan('test');
      tracer.endSpan(span, 'success');
      expect(span.endTime).toBeInstanceOf(Date);
      expect(span.duration).toBeGreaterThanOrEqual(0);
    });

    it('should set status', () => {
      const span = tracer.startSpan('test');
      tracer.endSpan(span, 'error');
      expect(span.status).toBe('error');
    });

    it('should pop from span stack', () => {
      const parent = tracer.startSpan('parent');
      const child = tracer.startSpan('child');
      tracer.endSpan(child, 'success');
      const sibling = tracer.startSpan('sibling');
      expect(sibling.parentId).toBe(parent.id);
    });
  });

  describe('recordEvent', () => {
    it('should add event to span', () => {
      const span = tracer.startSpan('test');
      tracer.recordEvent(span, {
        name: 'tool_called',
        timestamp: new Date(),
        attributes: { toolName: 'echo' },
      });

      expect(span.events).toHaveLength(1);
      expect(span.events[0].name).toBe('tool_called');
    });
  });

  describe('getTraces', () => {
    it('should return all spans', () => {
      tracer.startSpan('span-1');
      tracer.startSpan('span-2');
      expect(tracer.getTraces()).toHaveLength(2);
    });
  });

  describe('getTracesByTraceId', () => {
    it('should filter by trace ID', () => {
      const span1 = tracer.startSpan('span-1');
      tracer.endSpan(span1, 'success');
      tracer.startSpan('span-2');

      const traces = tracer.getTracesByTraceId(span1.traceId);
      expect(traces.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getTraceTree', () => {
    it('should return sorted trace tree', () => {
      const parent = tracer.startSpan('parent');
      const child = tracer.startSpan('child');
      tracer.endSpan(child, 'success');
      tracer.endSpan(parent, 'success');

      const tree = tracer.getTraceTree(parent.traceId);
      expect(tree[0].name).toBe('parent');
    });
  });

  describe('clear', () => {
    it('should clear all spans', () => {
      tracer.startSpan('span-1');
      tracer.clear();
      expect(tracer.getTraces()).toHaveLength(0);
    });
  });

  describe('exportJSON', () => {
    it('should export spans as JSON', () => {
      const span = tracer.startSpan('test');
      tracer.endSpan(span, 'success');

      const json = tracer.exportJSON() as any;
      expect(json.spans).toHaveLength(1);
      expect(json.spans[0].name).toBe('test');
      expect(json.spans[0].status).toBe('success');
    });
  });
});

describe('NoOpTracer', () => {
  let tracer: NoOpTracer;

  beforeEach(() => {
    tracer = new NoOpTracer();
  });

  it('should return span objects from startSpan', () => {
    const span = tracer.startSpan('test');
    expect(span.name).toBe('test');
    expect(span.id).toBeDefined();
  });

  it('should not throw on endSpan', () => {
    const span = tracer.startSpan('test');
    expect(() => tracer.endSpan(span, 'success')).not.toThrow();
  });

  it('should not throw on recordEvent', () => {
    const span = tracer.startSpan('test');
    expect(() =>
      tracer.recordEvent(span, { name: 'event', timestamp: new Date() })
    ).not.toThrow();
  });

  it('should return empty traces', () => {
    expect(tracer.getTraces()).toEqual([]);
  });

  it('should not throw on clear', () => {
    expect(() => tracer.clear()).not.toThrow();
  });
});
