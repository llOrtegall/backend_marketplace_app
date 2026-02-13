import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { authService } from "../services/auth.service";
import { handleControllerError } from "./controller-error-handler";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body as {
      fullName?: string;
      email?: string;
      password?: string;
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body as { email?: string; password?: string });

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refresh(req.body as { refreshToken?: string });

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.me(req.user?.id);

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};