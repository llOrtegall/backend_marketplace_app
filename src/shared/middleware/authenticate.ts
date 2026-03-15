import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { UnauthorizedError } from '../errors/AppError';

export interface AuthPayload {
  sub: string; // userId
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.auth = payload;
  } catch {
    // invalid token → ignore silently, do not block the request
  }
  next();
}

export function requireAuth(req: { auth?: AuthPayload }): AuthPayload {
  if (!req.auth) throw new UnauthorizedError('Authentication required');
  return req.auth;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed token'));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
