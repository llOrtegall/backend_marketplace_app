import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

function logUnhandledError(err: Error): void {
  if (process.env.NODE_ENV === 'test') return;
  console.error(
    JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message: err.message,
      stack: err.stack,
      name: err.name,
    }),
  );
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  logUnhandledError(err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
