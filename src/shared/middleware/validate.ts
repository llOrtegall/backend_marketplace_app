import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../errors/AppError';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(
        new ValidationError('Validation failed', result.error.flatten()),
      );
    }
    req[target] = result.data;
    next();
  };
}
