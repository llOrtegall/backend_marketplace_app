import { Router } from "express";

import {
  createProduct,
  deactivateProductById,
  getProductById,
  listProducts,
  updateProductById,
} from "../controllers/products.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const productsRouter = Router();

productsRouter.get("/", listProducts);

productsRouter.get("/:id", getProductById);

productsRouter.post("/", requireAuth, requireRole(["admin"]), createProduct);

productsRouter.put("/:id", requireAuth, requireRole(["admin"]), updateProductById);

productsRouter.delete("/:id", requireAuth, requireRole(["admin"]), deactivateProductById);

export { productsRouter };
