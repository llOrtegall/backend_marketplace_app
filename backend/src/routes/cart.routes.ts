import { Router } from "express";

import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../controllers/cart.controller";
import { requireAuth } from "../middleware/auth.middleware";

const cartRouter = Router();

cartRouter.get("/", requireAuth, getCart);

cartRouter.post("/items", requireAuth, addCartItem);

cartRouter.patch("/items/:id", requireAuth, updateCartItem);

cartRouter.delete("/items/:id", requireAuth, removeCartItem);

cartRouter.delete("/", requireAuth, clearCart);

export { cartRouter };
