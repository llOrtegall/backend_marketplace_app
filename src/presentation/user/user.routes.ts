import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import {
  getUser,
  listUsers,
  promoteToAdmin,
  updateUserStatus,
} from './user.controller';
import { listUsersQuerySchema, updateStatusSchema } from './user.schemas';

export const userRouter = Router();

// Own profile or admin/superadmin
userRouter.get('/:id', authenticate, getUser);

// Admin + superadmin only
userRouter.get(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  validate(listUsersQuerySchema, 'query'),
  listUsers,
);

userRouter.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'superadmin'),
  validate(updateStatusSchema),
  updateUserStatus,
);

// Superadmin only
userRouter.post(
  '/:id/promote',
  authenticate,
  authorize('superadmin'),
  promoteToAdmin,
);
