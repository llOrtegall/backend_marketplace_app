import { Router } from "express";

import {
  createProduct,
  deactivateProductById,
  getProductById,
  listProducts,
  updateProductById,
} from "../controllers/products.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import { uploadSingleProductImage } from "../middleware/upload.middleware";

const productsRouter = Router();

productsRouter.get("/", listProducts);

productsRouter.get("/:id", getProductById);

productsRouter.post("/", requireAuth, requireAdmin, uploadSingleProductImage, createProduct);

productsRouter.put("/:id", requireAuth, requireAdmin, updateProductById);

productsRouter.delete("/:id", requireAuth, requireAdmin, deactivateProductById);

export { productsRouter };
