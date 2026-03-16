import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import type { IUserRepository } from '../../domain/user/UserRepository';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { AppError, UnauthorizedError } from '../errors/AppError';

export interface AuthPayload {
  sub: string; // userId
  role: UserRole;
}

async function assertActiveAuthenticatedUser(
  userRepo: IUserRepository,
  userId: string,
): Promise<void> {
  const user = await userRepo.findById(userId);

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (!user.isActive()) {
    throw new AppError('ACCOUNT_INACTIVE', 'Your account is not active', 403);
  }
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function makeOptionalAuthenticate(
  userRepo: IUserRepository,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async function optionalAuthenticate(
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
      await assertActiveAuthenticatedUser(userRepo, payload.sub);
      req.auth = payload;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      next(new UnauthorizedError('Invalid or expired token')); // token presente pero inválido → 401
    }
  };
}

export function requireAuth(req: { auth?: AuthPayload }): AuthPayload {
  if (!req.auth) throw new UnauthorizedError('Authentication required');
  return req.auth;
}

export function makeAuthenticate(
  userRepo: IUserRepository,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
  ) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or malformed token'));
    }

    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      await assertActiveAuthenticatedUser(userRepo, payload.sub);
      req.auth = payload;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };
}
