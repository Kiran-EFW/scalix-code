/**
 * Observability Types
 *
 * Tracing, metrics, and logging for production observability.
 */

/**
 * Trace span - represents a unit of work
 */
export interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  status: 'success' | 'error' | 'timeout';
  attributes: Record<string, unknown>;
  events: TraceEvent[];
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Event within a trace span
 */
export interface TraceEvent {
  name: string;
  timestamp: Date;
  attributes?: Record<string, unknown>;
}

/**
 * Metric - quantitative measurement
 */
export interface Metric {
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  labels: Record<string, string>;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

/**
 * Tracer interface
 */
export interface Tracer {
  /**
   * Start a new trace span
   */
  startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan;

  /**
   * End a trace span
   */
  endSpan(span: TraceSpan, status: 'success' | 'error' | 'timeout'): void;

  /**
   * Record an event within a span
   */
  recordEvent(span: TraceSpan, event: TraceEvent): void;

  /**
   * Get all traces
   */
  getTraces(): TraceSpan[];

  /**
   * Clear all traces
   */
  clear(): void;
}

/**
 * Metrics collector
 */
export interface MetricsCollector {
  /**
   * Record a metric
   */
  recordMetric(metric: Metric): void;

  /**
   * Get all metrics
   */
  getMetrics(): Metric[];

  /**
   * Clear all metrics
   */
  clear(): void;
}
