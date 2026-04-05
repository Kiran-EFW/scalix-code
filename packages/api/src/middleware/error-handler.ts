/**
 * Error Handler Middleware
 *
 * Centralized error handling for all API errors
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorHandler(
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const platform = req.context?.platform;
  const requestId = req.context?.requestId;

  // Log error
  if (platform) {
    platform.getLogger().error(`API Error: ${error.message}`, {
      requestId,
      error: error instanceof Error ? error.stack : String(error),
      path: req.path,
      method: req.method,
    });
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      requestId,
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    });
  }

  // API errors
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      requestId,
      details: error.details,
    });
  }

  // Generic errors
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    requestId,
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
