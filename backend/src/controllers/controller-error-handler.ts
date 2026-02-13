import type { NextFunction, Response } from "express";

import { ServiceError } from "../errors/service.error";

export const handleControllerError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return next(error);
};