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
      req.body as { forcedStatus?: "APPROVED" | "DECLINED" | "PENDING" },
    );

    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const wompiWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentsService.processWompiWebhook(
      req.body as {
        data?: {
          transaction?: {
            reference?: string;
            status?: "APPROVED" | "DECLINED" | "PENDING";
          };
        };
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};