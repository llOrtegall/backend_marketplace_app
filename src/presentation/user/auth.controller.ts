import type { NextFunction, Request, Response } from 'express';
import {
  makeLoginUserUseCase,
  makeLogoutUserUseCase,
  makeRefreshTokenUseCase,
  makeRegisterUserUseCase,
} from '../../application/user/user.factory';
import type { LoginBody, RegisterBody } from './user.schemas';
import { toUserDTO } from './user.types';

export async function register(
  req: Request<object, object, RegisterBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await makeRegisterUserUseCase().execute(req.body);
    res.status(201).json({ success: true, data: toUserDTO(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request<object, object, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tokens = await makeLoginUserUseCase().execute(req.body);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tokens = await makeRefreshTokenUseCase().execute(
      req.body.refreshToken,
    );
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await makeLogoutUserUseCase().execute(req.body.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
