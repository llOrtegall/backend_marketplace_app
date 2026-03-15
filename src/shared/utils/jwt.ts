import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import type { UserRole } from '../../domain/user/UserValueObjects';
import type { AuthPayload } from '../middleware/authenticate';

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

export function signAccessToken(payload: {
  sub: string;
  role: UserRole;
}): string {
  return jwt.sign(
    { sub: payload.sub, role: payload.role } as AuthPayload,
    env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES },
  );
}

export function signRefreshToken(userId: string): {
  token: string;
  expiresAt: Date;
} {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);
  const token = jwt.sign(
    { sub: userId, type: 'refresh', jti: randomUUID() },
    env.JWT_SECRET,
    { expiresIn: '15d' },
  );
  return { token, expiresAt };
}

export function verifyRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, env.JWT_SECRET) as {
    sub: string;
    type: string;
  };
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return { sub: payload.sub };
}
