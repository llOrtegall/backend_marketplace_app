import type { NextFunction, Request, Response } from "express";

import { productsService } from "../services/products.service";
import { handleControllerError } from "./controller-error-handler";
import { validateProduct } from "../schema/validateProduct";

const parseOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const parseOptionalBoolean = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return value;
};

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
    if (!req.file) {
      return res.status(400).json({ error: "Product image is required" });
    }

    const normalizedBody = {
      ...req.body,
      price: parseOptionalNumber(req.body.price),
      stock: parseOptionalNumber(req.body.stock),
      isActive: parseOptionalBoolean(req.body.isActive),
    };

    const { success, data, error } = validateProduct(normalizedBody);

    if (!success) {
      return res.status(400).json({ error });
    }

    const result = await productsService.createProduct(data, req.file);

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
    const normalizedBody = {
      ...req.body,
      price: parseOptionalNumber(req.body.price),
      stock: parseOptionalNumber(req.body.stock),
      isActive: parseOptionalBoolean(req.body.isActive),
    };

    const { success, data, error } = validateProduct(normalizedBody);

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