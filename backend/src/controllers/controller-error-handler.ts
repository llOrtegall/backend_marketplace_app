import type { NextFunction, Response } from "express";
import { BaseError } from "sequelize";

import { ServiceError } from "../errors/service.error";

export const handleControllerError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof BaseError) {
    console.error("Database error:", error.message);
    return res.status(500).json({ message: "A database error occurred." });
  }

  console.error("Unexpected error:", error);
  return next(error);
};
