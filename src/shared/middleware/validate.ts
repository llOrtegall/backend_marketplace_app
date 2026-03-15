import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../errors/AppError';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodType, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(
        new ValidationError('Validation failed', result.error.flatten()),
      );
    }
    // Express 5 makes req.query a non-writable property; use defineProperty as fallback
    try {
      req[target] = result.data;
    } catch {
      Object.defineProperty(req, target, {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    next();
  };
}
