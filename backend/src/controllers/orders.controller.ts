import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ordersService } from "../services/orders.service";
import { handleControllerError } from "./controller-error-handler";

export const getUserOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await ordersService.getUserOrders(String(req.user?.id));
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await ordersService.getOrderById(
      String(req.user?.id),
      String(req.params.id),
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};
