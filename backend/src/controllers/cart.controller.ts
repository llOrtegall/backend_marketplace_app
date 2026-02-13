import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { cartService } from "../services/cart.service";
import { handleControllerError } from "./controller-error-handler";

export const getCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await cartService.getCart(String(req.user?.id));
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const addCartItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await cartService.addItem(String(req.user?.id), req.body as {
      productId?: string;
      quantity?: number;
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const updateCartItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await cartService.updateItem(
      String(req.user?.id),
      String(req.params.id),
      (req.body as { quantity?: number }).quantity,
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const removeCartItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await cartService.removeItem(String(req.user?.id), String(req.params.id));
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await cartService.clearCart(String(req.user?.id));
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};