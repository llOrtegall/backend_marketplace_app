import { Router } from "express";

import { getUserOrders, getOrderById } from "../controllers/orders.controller";
import { requireAuth } from "../middleware/auth.middleware";

const ordersRouter = Router();

ordersRouter.get("/", requireAuth, getUserOrders);

ordersRouter.get("/:id", requireAuth, getOrderById);

export { ordersRouter };
