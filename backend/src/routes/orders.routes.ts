import { Router } from "express";

import {
  createOrder,
  deleteOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
} from "../controllers/orders.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const ordersRouter = Router();

ordersRouter.get("/", requireAuth, listOrders);

ordersRouter.get("/:id", requireAuth, getOrderById);

ordersRouter.post("/", requireAuth, createOrder);

ordersRouter.patch("/:id/status", requireAuth, requireRole(["admin"]), updateOrderStatus);

ordersRouter.delete("/:id", requireAuth, deleteOrder);

export { ordersRouter };
