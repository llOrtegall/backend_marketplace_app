import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ordersService } from "../services/orders.service";
import { handleControllerError } from "./controller-error-handler";

export const listOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ordersService.listOrders(req.user);
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ordersService.getOrderById(String(req.params.id), req.user);
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ordersService.createOrder(String(req.user?.id), req.body as { total?: number | string });
    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await ordersService.updateOrderStatus(
      String(req.params.id),
      req.body as { status?: "pending" | "paid" | "cancelled" },
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const deleteOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ordersService.deleteOrder(String(req.params.id), req.user);
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};