import crypto from "node:crypto";

import { ServiceError } from "../errors/service.error";
import { CartItem, Order, Product } from "../models";

const allowedStatuses = ["APPROVED", "DECLINED", "PENDING"] as const;

type CheckoutInput = {
  forcedStatus?: (typeof allowedStatuses)[number];
};

type WebhookPayload = {
  data?: {
    transaction?: {
      reference?: string;
      status?: "APPROVED" | "DECLINED" | "PENDING";
    };
  };
};

export class PaymentsService {
  async checkoutWithWompi(userId: string, input: CheckoutInput) {
    const { forcedStatus } = input;

    if (forcedStatus && !allowedStatuses.includes(forcedStatus)) {
      throw new ServiceError(
        400,
        `forcedStatus must be one of: ${allowedStatuses.join(", ")}`,
      );
    }

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [{ model: Product, as: "product" }],
    });

    if (!cartItems.length) {
      throw new ServiceError(400, "Cart is empty");
    }

    for (const item of cartItems) {
      const product = (item as CartItem & { product?: Product }).product;

      if (!product || !product.isActive) {
        throw new ServiceError(400, "Cart contains unavailable products");
      }

      if (item.quantity > product.stock) {
        throw new ServiceError(400, `Insufficient stock for product ${product.id}`);
      }
    }

    const total = Number(
      cartItems
        .reduce((acc, item) => {
          const product = (item as CartItem & { product?: Product }).product;
          return acc + Number(product?.price ?? 0) * item.quantity;
        }, 0)
        .toFixed(2),
    );

    const order = await Order.create({
      userId,
      total: String(total),
      status: "pending",
    });

    const simulatedStatus =
      forcedStatus && allowedStatuses.includes(forcedStatus)
        ? forcedStatus
        : allowedStatuses[Math.floor(Math.random() * allowedStatuses.length)];

    const wompiTransaction = {
      id: `wompi_${crypto.randomUUID()}`,
      reference: `ORDER-${order.id}`,
      amountInCents: Math.round(total * 100),
      currency: "COP",
      status: simulatedStatus,
      sandbox: true,
    };

    if (simulatedStatus === "APPROVED") {
      for (const item of cartItems) {
        const product = (item as CartItem & { product?: Product }).product;

        if (!product) {
          throw new ServiceError(400, "Cart contains unavailable products");
        }

        product.stock -= item.quantity;
        await product.save();
      }

      order.status = "paid";
      await order.save();
      await CartItem.destroy({ where: { userId } });
    }

    if (simulatedStatus === "DECLINED") {
      order.status = "cancelled";
      await order.save();
    }

    return {
      data: {
        order,
        wompi: wompiTransaction,
        message: "Wompi sandbox checkout simulated",
      },
    };
  }

  async processWompiWebhook(payload: WebhookPayload) {
    const reference = payload.data?.transaction?.reference;
    const status = payload.data?.transaction?.status;

    if (!reference || !status || !reference.startsWith("ORDER-")) {
      throw new ServiceError(400, "Invalid webhook payload");
    }

    const orderId = reference.replace("ORDER-", "");
    const order = await Order.findByPk(orderId);

    if (!order) {
      throw new ServiceError(404, "Order not found");
    }

    if (order.status === "paid" && status === "APPROVED") {
      return { message: "Webhook already applied" };
    }

    if (order.status === "cancelled" && status === "DECLINED") {
      return { message: "Webhook already applied" };
    }

    if (status === "APPROVED") {
      order.status = "paid";
      await order.save();
      await CartItem.destroy({ where: { userId: order.userId } });
    }

    if (status === "DECLINED") {
      order.status = "cancelled";
      await order.save();
    }

    return { message: "Webhook processed" };
  }
}

export const paymentsService = new PaymentsService();