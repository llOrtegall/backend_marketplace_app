import type { NextFunction, Request, Response } from 'express';
import {
  makeGetUserUseCase,
  makeListUsersUseCase,
  makePromoteToAdminUseCase,
  makeUpdateUserStatusUseCase,
} from '../../application/user/user.factory';
import { ForbiddenError } from '../../shared/errors/AppError';
import type { UpdateStatusBody } from './user.schemas';
import { toUserDTO } from './user.types';

export async function getUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const requesterId = req.auth!.sub;
    const requesterRole = req.auth!.role;
    const targetId = req.params.id;

    // Users can only see their own profile; admins/superadmin can see anyone
    if (requesterRole === 'user' && requesterId !== targetId) {
      return next(new ForbiddenError('FORBIDDEN', 'Access denied'));
    }

    const user = await makeGetUserUseCase().execute(targetId);
    res.json({ success: true, data: toUserDTO(user) });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, ...filters } = req.query as any;
    const result = await makeListUsersUseCase().execute({
      filters,
      page,
      limit,
    });
    res.json({
      success: true,
      data: result.items.map(toUserDTO),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(
  req: Request<{ id: string }, object, UpdateStatusBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await makeUpdateUserStatusUseCase().execute({
      targetId: req.params.id,
      actorId: req.auth!.sub,
      status: req.body.status,
    });
    res.json({ success: true, data: toUserDTO(user) });
  } catch (err) {
    next(err);
  }
}

export async function promoteToAdmin(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await makePromoteToAdminUseCase().execute({
      targetId: req.params.id,
      actorId: req.auth!.sub,
    });
    res.json({ success: true, data: toUserDTO(user) });
  } catch (err) {
    next(err);
  }
}
