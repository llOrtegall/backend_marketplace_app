import { Router } from "express";

import {
  createOrder,
  deleteOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
} from "../controllers/orders.controller";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const ordersRouter = Router();

ordersRouter.get("/", requireAuth, requireAdmin, listOrders);

ordersRouter.get("/:id", requireAuth, requireAdmin, getOrderById);

ordersRouter.post("/", requireAuth, requireAdmin, createOrder);

ordersRouter.patch("/:id/status", requireAuth, requireAdmin, updateOrderStatus);

ordersRouter.delete("/:id", requireAuth, requireAdmin, deleteOrder);

export { ordersRouter };
