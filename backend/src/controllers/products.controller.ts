import type { Request, Response } from "express";
import { BaseError } from "sequelize";

import { productsService } from "../services/products.service";
import { ServiceError } from "../errors/service.error";
import { validateProduct } from "../schema/validateProduct";
import { uploadProductImageToR2, getProductImageSignedUrl } from "../lib/r2";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await productsService.getAllProducts();

    const data = await Promise.all(
      products.map(async (p) => ({
        ...p.toJSON(),
        imageUrl: await getProductImageSignedUrl(p.image),
      }))
    );

    res.json({ data });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof BaseError) {
      console.error("Database error:", error.message);
      res.status(500).json({ message: "A database error occurred while fetching products." });
      return;
    }
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An error occurred while fetching products." });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await productsService.getProductById(id);
    const imageUrl = await getProductImageSignedUrl(product!.image);

    res.json({ ...product!.toJSON(), imageUrl });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof BaseError) {
      console.error("Database error:", error.message);
      res.status(500).json({ message: "A database error occurred while fetching the product." });
      return;
    }
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An error occurred while fetching the product." });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const parsed = validateProduct(req.body);

    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid product data" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "Product image is required" });
      return;
    }

    const imageKey = await uploadProductImageToR2(req.file);
    const product = await productsService.createProduct({
      ...parsed.data,
      image: imageKey,
    } as any);

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof BaseError) {
      console.error("Database error:", error.message);
      res.status(500).json({ message: "A database error occurred while creating the product." });
      return;
    }
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An error occurred while creating the product." });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const partialSchema = validateProduct(req.body);
    if (!partialSchema.success) {
      res.status(400).json({ message: partialSchema.error.issues[0]?.message ?? "Invalid product data" });
      return;
    }

    let updateData: Record<string, unknown> = { ...partialSchema.data };

    if (req.file) {
      const imageKey = await uploadProductImageToR2(req.file);
      updateData.image = imageKey;
    }

    const product = await productsService.updateProduct(id, updateData as any);

    const imageUrl = await getProductImageSignedUrl(product!.image);
    res.json({ ...product!.toJSON(), imageUrl });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof BaseError) {
      console.error("Database error:", error.message);
      res.status(500).json({ message: "A database error occurred while updating the product." });
      return;
    }
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An error occurred while updating the product." });
  }
};

export const deactivateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await productsService.deactivateProduct(id);
    res.json({ message: "Product deactivated" });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof BaseError) {
      console.error("Database error:", error.message);
      res.status(500).json({ message: "A database error occurred while deactivating the product." });
      return;
    }
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An error occurred while deactivating the product." });
  }
};
