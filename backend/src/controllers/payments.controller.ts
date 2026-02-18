import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { paymentsService } from "../services/payments.service";
import { handleControllerError } from "./controller-error-handler";

export const wompiCheckout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await paymentsService.checkoutWithWompi(
      String(req.user?.id),
      req.user?.email,
      req.body as {
        items?: Array<{ productId: string; quantity: number }>;
      },
    );

    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const wompiWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentsService.processWompiWebhook(
      req.body as Record<string, unknown>,
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const wompiPaymentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await paymentsService.getWompiPaymentStatus(
      String(req.user?.id),
      String(req.query.reference ?? ""),
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};