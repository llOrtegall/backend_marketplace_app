import type { NextFunction, Request, Response } from "express";

import { productsService } from "../services/products.service";
import { handleControllerError } from "./controller-error-handler";
import { validateProduct } from "../schema/validateProduct";

export const listProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productsService.listProducts();
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params) {
    return res.status(400).json({ error: "Product ID is required in the URL parameters" });
  }

  const id = String(req.params.id);

  try {
    const result = await productsService.getProductById(id);
    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { success, data, error } = validateProduct(req.body);

    if (!success) {
      return res.status(400).json({ error });
    }

    const result = await productsService.createProduct(data);

    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(error, res, next);
  }
};

export const updateProductById = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params) {
    return res.status(400).json({ error: "Product ID is required in the URL parameters" });
  }

  const id = String(req.params.id);

  try {
    const { success, data, error } = validateProduct(req.body);

    if (!success) {
      return res.status(400).json({ error });
    }

    const result = await productsService.updateProductById(id, data);

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