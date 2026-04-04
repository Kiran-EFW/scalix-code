/**
 * Tracer Implementation
 *
 * Simple in-memory tracer for distributed tracing
 * Compatible with OpenTelemetry standards
 */

import { v4 as uuid } from 'uuid';
import type { TraceSpan, TraceEvent, Tracer } from './types';

/**
 * Tracer implementation
 */
export class DefaultTracer implements Tracer {
  private spans = new Map<string, TraceSpan>();
  private spanStack: string[] = [];

  /**
   * Start a new trace span
   */
  startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan {
    const span: TraceSpan = {
      id: uuid(),
      traceId: this.getOrCreateTraceId(),
      parentId: this.spanStack[this.spanStack.length - 1],
      name,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      status: 'success',
      attributes: attributes || {},
      events: [],
    };

    this.spans.set(span.id, span);
    this.spanStack.push(span.id);

    return span;
  }

  /**
   * End a trace span
   */
  endSpan(span: TraceSpan, status: 'success' | 'error' | 'timeout'): void {
    const endTime = new Date();
    const duration = endTime.getTime() - span.startTime.getTime();

    span.endTime = endTime;
    span.duration = duration;
    span.status = status;

    // Pop from stack
    this.spanStack.pop();
  }

  /**
   * Record an event within a span
   */
  recordEvent(span: TraceSpan, event: TraceEvent): void {
    span.events.push(event);
  }

  /**
   * Get all traces
   */
  getTraces(): TraceSpan[] {
    return Array.from(this.spans.values());
  }

  /**
   * Get traces by trace ID
   */
  getTracesByTraceId(traceId: string): TraceSpan[] {
    return Array.from(this.spans.values()).filter((s) => s.traceId === traceId);
  }

  /**
   * Get trace tree
   */
  getTraceTree(traceId: string): TraceSpan[] {
    return this.getTracesByTraceId(traceId).sort((a, b) => {
      // Root spans first, then by start time
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      return a.startTime.getTime() - b.startTime.getTime();
    });
  }

  /**
   * Clear all traces
   */
  clear(): void {
    this.spans.clear();
    this.spanStack = [];
  }

  /**
   * Get or create trace ID
   */
  private getOrCreateTraceId(): string {
    if (this.spanStack.length === 0) {
      return uuid();
    }

    const rootSpan = this.spans.get(this.spanStack[0]);
    return rootSpan?.traceId || uuid();
  }

  /**
   * Export traces in JSON format
   */
  exportJSON(): unknown {
    const traces = this.getTraces();
    return {
      spans: traces.map((span) => ({
        traceId: span.traceId,
        spanId: span.id,
        parentSpanId: span.parentId,
        name: span.name,
        startTime: span.startTime.toISOString(),
        endTime: span.endTime.toISOString(),
        duration: span.duration,
        status: span.status,
        attributes: span.attributes,
        events: span.events.map((e) => ({
          name: e.name,
          timestamp: e.timestamp.toISOString(),
          attributes: e.attributes,
        })),
      })),
      totalDuration: Math.max(
        ...(traces.map((s) => s.endTime.getTime()) || [0])
      ) - Math.min(...(traces.map((s) => s.startTime.getTime()) || [0])),
    };
  }
}

/**
 * No-op tracer for testing
 */
export class NoOpTracer implements Tracer {
  startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan {
    return {
      id: uuid(),
      traceId: uuid(),
      name,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      status: 'success',
      attributes: attributes || {},
      events: [],
    };
  }

  endSpan(span: TraceSpan, status: 'success' | 'error' | 'timeout'): void {
    // No-op
  }

  recordEvent(span: TraceSpan, event: TraceEvent): void {
    // No-op
  }

  getTraces(): TraceSpan[] {
    return [];
  }

  clear(): void {
    // No-op
  }
}
