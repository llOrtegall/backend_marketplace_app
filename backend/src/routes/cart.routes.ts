import { Router } from "express";

import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../controllers/cart.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const cartRouter = Router();

cartRouter.get("/", requireAuth, requireAdmin, getCart);

cartRouter.post("/items", requireAuth, requireAdmin, addCartItem);

cartRouter.patch("/items/:id", requireAuth, requireAdmin, updateCartItem);

cartRouter.delete("/items/:id", requireAuth, requireAdmin, removeCartItem);

cartRouter.delete("/", requireAuth, requireAdmin, clearCart);

export { cartRouter };
