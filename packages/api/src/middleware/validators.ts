/**
 * Request Validators
 *
 * Validation middleware for common request patterns
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from './error-handler';

/**
 * Validate request body against schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      (req as any).validatedBody = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      (req as any).validatedQuery = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate path parameters
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      (req as any).validatedParams = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Generic request validator - checks body format
 */
export function requestValidator(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Validate JSON was parsed
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    if (!req.is('application/json')) {
      return next(
        new ApiError(400, 'Content-Type must be application/json', 'BAD_REQUEST')
      );
    }
  }

  next();
}
