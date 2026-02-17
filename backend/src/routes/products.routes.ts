import { Router } from "express";

import {
  getAllProducts
} from "../controllers/products.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import { uploadSingleProductImage } from "../middleware/upload.middleware";

const productsRouter = Router();

productsRouter.get("/", getAllProducts);

// productsRouter.get("/:id", getProductById);

// productsRouter.post("/", requireAuth, requireAdmin, uploadSingleProductImage, createProduct);

// productsRouter.put("/:id", requireAuth, requireAdmin, updateProductById);

// productsRouter.delete("/:id", requireAuth, requireAdmin, deactivateProductById);

export { productsRouter };
