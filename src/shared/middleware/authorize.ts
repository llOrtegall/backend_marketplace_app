import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.auth.role as UserRole)) {
      return next(
        new ForbiddenError('FORBIDDEN', `Required role: ${roles.join(' or ')}`),
      );
    }
    next();
  };
}
