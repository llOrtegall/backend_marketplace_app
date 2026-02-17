import type { Request, Response } from "express";

import { productsService } from "../services/products.service";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await productsService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};