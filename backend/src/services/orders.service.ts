import { ServiceError } from "../errors/service.error";
import { Order } from "../models";
import type { AuthUserPayload } from "../types/auth";

type CreateOrderInput = {
  total?: number | string;
};

type UpdateOrderStatusInput = {
  status?: "pending" | "paid" | "cancelled";
};

export class OrdersService {
  async listOrders(actor?: AuthUserPayload) {
    const where = actor?.role === "admin" ? undefined : { userId: actor?.id };
    const orders = await Order.findAll({ where, order: [["createdAt", "DESC"]] });
    return { data: orders };
  }

  async getOrderById(orderId: string, actor?: AuthUserPayload) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new ServiceError(404, "Order not found");
    }

    if (actor?.role !== "admin" && order.userId !== actor?.id) {
      throw new ServiceError(403, "Insufficient permissions");
    }

    return { data: order };
  }

  async createOrder(userId: string, input: CreateOrderInput) {
    const order = await Order.create({
      userId,
      total: String(input.total ?? 0),
      status: "pending",
    });

    return { data: order };
  }

  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
    const { status } = input;

    if (!status) {
      throw new ServiceError(400, "status is required");
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new ServiceError(404, "Order not found");
    }

    order.status = status;
    await order.save();

    return { data: order };
  }

  async deleteOrder(orderId: string, actor?: AuthUserPayload) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new ServiceError(404, "Order not found");
    }

    const isOwner = order.userId === actor?.id;
    const isAdmin = actor?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new ServiceError(403, "Insufficient permissions");
    }

    await order.destroy();
    return { message: "Order deleted" };
  }
}

export const ordersService = new OrdersService();