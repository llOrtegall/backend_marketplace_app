import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { usersService } from "../services/users.service";
import { handleControllerError } from "./controller-error-handler";

export const listUsers = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await usersService.listUsers();
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await usersService.getUserById(String(req.params.id), req.user);
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const updateUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await usersService.updateUserById(
      String(req.params.id),
      req.body as { fullName?: string; role?: "admin" | "customer" },
      req.user,
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const deleteUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await usersService.deleteUserById(String(req.params.id));
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};