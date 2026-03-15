import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authRateLimiter } from '../../shared/middleware/rateLimiter';
import { validate } from '../../shared/middleware/validate';
import { login, logout, refreshToken, register } from './auth.controller';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from './user.schemas';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  register,
);
authRouter.post('/login', authRateLimiter, validate(loginSchema), login);
authRouter.post('/refresh', validate(refreshTokenSchema), refreshToken);
authRouter.post('/logout', authenticate, validate(logoutSchema), logout);
