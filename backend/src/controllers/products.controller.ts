import type { Request, Response } from "express";
import { BaseError } from "sequelize";

import { productsService } from "../services/products.service";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await productsService.getAllProducts();
    res.json(products);
  } catch (error) {
    if (error instanceof BaseError && error.name === "SequelizeDatabaseError") {
      console.error("Database error:", error.message);
      res.status(500).json({ message: "A database error occurred while fetching products." });
      return;
    }

    console.error("Unexpected error:", error);
    res.status(500).json({ message: "An error occurred while fetching products." });
  }
};