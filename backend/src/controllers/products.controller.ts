import type { NextFunction, Request, Response } from "express";

import { productsService } from "../services/products.service";
import { handleControllerError } from "./controller-error-handler";

export const listProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productsService.listProducts();
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productsService.getProductById(String(req.params.id));
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productsService.createProduct(req.body as {
      name?: string;
      description?: string | null;
      price?: number | string;
      stock?: number;
      isActive?: boolean;
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const updateProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productsService.updateProductById(
      String(req.params.id),
      req.body as {
        name?: string;
        description?: string | null;
        price?: number | string;
        stock?: number;
        isActive?: boolean;
      },
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const deactivateProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productsService.deactivateProductById(String(req.params.id));
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};