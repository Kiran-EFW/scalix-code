/**
 * Observability Routes
 *
 * GET /api/observability/traces        - Get traces
 * GET /api/observability/traces/:id    - Get trace details
 * GET /api/observability/logs          - Get logs
 * GET /api/observability/metrics       - Get metrics
 * GET /api/observability/stats         - Get platform stats
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/index';

const router = Router();

/**
 * Get All Traces
 * GET /api/observability/traces
 */
router.get(
  '/traces',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const tracer = platform.getTracer();
    const traces = tracer.getTraces();

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const paginated = traces.slice(offset, offset + limit);

    res.json({
      total: traces.length,
      limit,
      offset,
      traces: paginated.map((trace) => ({
        traceId: trace.traceId,
        spans: trace.spans.length,
        duration: trace.duration,
        status: trace.status,
      })),
    });
  })
);

/**
 * Get Trace Details
 * GET /api/observability/traces/:traceId
 */
router.get(
  '/traces/:traceId',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const tracer = platform.getTracer();
    const traces = tracer.getTraces();

    const trace = traces.find((t) => t.traceId === req.params.traceId);

    if (!trace) {
      return res.status(404).json({
        error: 'Trace not found',
        traceId: req.params.traceId,
      });
    }

    res.json({
      traceId: trace.traceId,
      spans: trace.spans.map((span) => ({
        spanId: span.spanId,
        name: span.name,
        parentId: span.parentId,
        startTime: span.startTime,
        duration: span.duration,
        status: span.status,
        attributes: span.attributes,
        events: span.events,
      })),
      duration: trace.duration,
      status: trace.status,
    });
  })
);

/**
 * Get Logs
 * GET /api/observability/logs
 */
router.get(
  '/logs',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const logger = platform.getLogger();
    const logs = (logger as any).getLogs?.() || [];

    const level = req.query.level as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let filtered = logs;
    if (level) {
      filtered = logs.filter((log: any) => log.level === level.toUpperCase());
    }

    const paginated = filtered.slice(offset, offset + limit);

    res.json({
      total: filtered.length,
      limit,
      offset,
      logs: paginated.map((log: any) => ({
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        context: log.context,
        error: log.error,
      })),
    });
  })
);

/**
 * Get Metrics
 * GET /api/observability/metrics
 */
router.get(
  '/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const metrics = platform.getMetricsCollector();
    const allMetrics = (metrics as any).getMetrics?.() || [];

    const metricName = req.query.metric as string;
    let filtered = allMetrics;

    if (metricName) {
      filtered = allMetrics.filter((m: any) => m.name === metricName);
    }

    res.json({
      total: filtered.length,
      metrics: filtered.map((metric: any) => ({
        name: metric.name,
        type: metric.type,
        value: metric.value,
        labels: metric.labels,
        timestamp: metric.timestamp,
      })),
    });
  })
);

/**
 * Get Prometheus-format Metrics
 * GET /api/observability/metrics/prometheus
 */
router.get(
  '/metrics/prometheus',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const metrics = platform.getMetricsCollector();
    const prometheus = (metrics as any).exportPrometheus?.() || '';

    res.type('text/plain').send(prometheus);
  })
);

/**
 * Get Platform Statistics
 * GET /api/observability/stats
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const platform = req.context!.platform;
    const stats = platform.getStats();
    const health = await platform.health();

    res.json({
      health: {
        status: health.status,
        agents: health.agents,
        tools: health.tools,
        storage: health.storage,
      },
      stats: {
        agents: stats.agents,
        tools: stats.tools,
        traces: stats.traces,
        metrics: stats.metrics,
        logs: stats.logs,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
