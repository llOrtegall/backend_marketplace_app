import type { NextFunction, Request, Response } from 'express';
import {
  makeGetUserUseCase,
  makeListUsersUseCase,
  makePromoteToAdminUseCase,
  makeUpdateUserStatusUseCase,
} from '../../application/user/user.factory';
import { requireAuth } from '../../shared/middleware/authenticate';
import type { ListUsersQuery, UpdateStatusBody } from './user.schemas';
import { toUserDTO } from './user.types';

export async function getUser(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub, role } = requireAuth(req);
    const user = await makeGetUserUseCase().execute(req.params.id, sub, role);
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
    const { page, limit, ...filters } = req.query as unknown as ListUsersQuery;
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
    const { sub: actorId } = requireAuth(req);
    const user = await makeUpdateUserStatusUseCase().execute({
      targetId: req.params.id,
      actorId,
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
    const { sub: actorId } = requireAuth(req);
    const user = await makePromoteToAdminUseCase().execute({
      targetId: req.params.id,
      actorId,
    });
    res.json({ success: true, data: toUserDTO(user) });
  } catch (err) {
    next(err);
  }
}
