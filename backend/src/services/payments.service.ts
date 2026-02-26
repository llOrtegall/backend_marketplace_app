import crypto from "node:crypto";
import { type Transaction } from "sequelize";

import { ServiceError } from "../errors/service.error";
import { sequelize } from "../config/database";
import { CartItem, Order, OrderItem, Product } from "../models";

const allowedStatuses = ["APPROVED", "DECLINED", "VOIDED", "ERROR", "PENDING"] as const;
const checkoutCurrency = "COP";

type CheckoutInput = {
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
};

type WebhookPayload = Record<string, unknown>;

const getNestedValue = (value: unknown, path: string): string => {
  const nestedValue = path
    .split(".")
    .reduce<unknown>((acc, segment) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[segment] : undefined), value);

  if (nestedValue === undefined || nestedValue === null) {
    return "";
  }

  return String(nestedValue);
};

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export class PaymentsService {
  private async syncCartItems(
    userId: string,
    items: CheckoutInput["items"],
    transaction?: Transaction,
  ) {
    if (!items || items.length === 0) {
      return;
    }

    const normalizedItems = items
      .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0)
      .map((item) => ({ productId: item.productId, quantity: item.quantity }));

    if (!normalizedItems.length) {
      throw new ServiceError(400, "items payload is invalid");
    }

    await CartItem.destroy({ where: { userId }, transaction });
    await CartItem.bulkCreate(
      normalizedItems.map((item) => ({
        userId,
        productId: item.productId,
        quantity: item.quantity,
      })),
      { transaction },
    );
  }

  private async getValidatedCartSnapshot(userId: string, transaction: Transaction) {
    const cartItems = await CartItem.findAll({
      where: { userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!cartItems.length) {
      throw new ServiceError(400, "Cart is empty");
    }

    const productIds = [...new Set(cartItems.map((item) => item.productId))];
    const products = await Product.findAll({
      where: { id: productIds },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const productsById = new Map(products.map((product) => [product.id, product]));

    const normalizedItems = cartItems.map((item) => {
      const product = productsById.get(item.productId);

      if (!product || !product.isActive) {
        throw new ServiceError(400, "Cart contains unavailable products");
      }

      if (item.quantity > product.stock) {
        throw new ServiceError(400, `Insufficient stock for product ${product.id}`);
      }

      const unitPrice = Number(product.price);
      const subtotal = Number((unitPrice * item.quantity).toFixed(2));

      return {
        product,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const total = Number(
      normalizedItems.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2),
    );

    return {
      items: normalizedItems,
      total,
    };
  }

  private buildCheckoutUrl({
    amountInCents,
    reference,
  }: {
    amountInCents: number;
    reference: string;
  }) {
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

    if (!publicKey || !integritySecret) {
      throw new ServiceError(
        500,
        "WOMPI_PUBLIC_KEY and WOMPI_INTEGRITY_SECRET are required",
      );
    }

    const signature = sha256(`${reference}${amountInCents}${checkoutCurrency}${integritySecret}`);
    const redirectUrl = `${frontendOrigin}/checkout?payment=processing&reference=${encodeURIComponent(reference)}`;
    const params = new URLSearchParams({
      "public-key": publicKey,
      currency: checkoutCurrency,
      "amount-in-cents": String(amountInCents),
      reference,
      "signature:integrity": signature,
      "redirect-url": redirectUrl,
    });

    return `https://checkout.wompi.co/p/?${params.toString()}`;
  }

  async checkoutWithWompi(userId: string, customerEmail: string | undefined, input: CheckoutInput) {
    if (!customerEmail) {
      throw new ServiceError(401, "Authenticated user email is required");
    }

    return sequelize.transaction(async (transaction) => {
      await this.syncCartItems(userId, input.items, transaction);

      const snapshot = await this.getValidatedCartSnapshot(userId, transaction);

      const order = await Order.create(
        {
          userId,
          total: String(snapshot.total),
          status: "pending",
        },
        { transaction },
      );

      await OrderItem.bulkCreate(
        snapshot.items.map((item) => ({
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          subtotal: String(item.subtotal),
        })),
        { transaction },
      );

      const reference = `ORDER-${order.id}`;
      const amountInCents = Math.round(snapshot.total * 100);
      const checkoutUrl = this.buildCheckoutUrl({ amountInCents, reference });

      return {
        data: {
          order,
          wompi: {
            sandbox: true,
            reference,
            amountInCents,
            currency: checkoutCurrency,
            customerEmail,
            checkoutUrl,
          },
          message: "Wompi sandbox checkout created",
        },
      };
    });
  }

  private validateWebhookSignature(payload: WebhookPayload) {
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    if (!eventsSecret) {
      return;
    }

    const signature = (payload.signature ?? {}) as {
      checksum?: string;
      properties?: string[];
    };

    const timestamp = payload.timestamp;
    const checksum = signature.checksum;
    const properties = signature.properties;

    if (!checksum || !timestamp || !Array.isArray(properties) || properties.length === 0) {
      throw new ServiceError(400, "Invalid webhook signature payload");
    }

    const concatenated = properties.map((propertyPath) => getNestedValue(payload.data, propertyPath)).join("");
    const computedChecksum = sha256(`${concatenated}${timestamp}${eventsSecret}`);

    if (computedChecksum !== checksum) {
      throw new ServiceError(401, "Webhook signature verification failed");
    }
  }

  private getTransactionFromWebhook(payload: WebhookPayload) {
    const directTransaction = (payload.data as { transaction?: unknown } | undefined)?.transaction;
    const nestedTransaction = (
      payload.data as { transaction?: unknown; payload?: { transaction?: unknown } } | undefined
    )?.payload?.transaction;

    const transaction = (directTransaction ?? nestedTransaction ?? {}) as {
      reference?: string;
      status?: string;
    };

    return {
      reference: transaction.reference,
      status: transaction.status,
    };
  }

  async processWompiWebhook(payload: WebhookPayload) {
    this.validateWebhookSignature(payload);

    const { reference, status } = this.getTransactionFromWebhook(payload);

    if (!reference || !status || !allowedStatuses.includes(status as (typeof allowedStatuses)[number]) || !reference.startsWith("ORDER-")) {
      throw new ServiceError(400, "Invalid webhook payload");
    }

    const orderId = reference.replace("ORDER-", "");

    return sequelize.transaction(async (transaction) => {
      const order = await Order.findByPk(orderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        throw new ServiceError(404, "Order not found");
      }

      if (order.status === "paid" && status === "APPROVED") {
        return { message: "Webhook already applied" };
      }

      if (
        order.status === "cancelled" &&
        (status === "DECLINED" || status === "VOIDED" || status === "ERROR")
      ) {
        return { message: "Webhook already applied" };
      }

      if (status === "APPROVED") {
        await this.fulfillApprovedOrder(order, transaction);
      }

      if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") {
        order.status = "cancelled";
        await order.save({ transaction });
      }

      return { message: "Webhook processed" };
    });
  }

  private async fulfillApprovedOrder(order: Order, transaction: Transaction) {
    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!orderItems.length) {
      throw new ServiceError(400, "Order has no items to fulfill");
    }

    const productIds = [...new Set(orderItems.map((item) => item.productId))];
    const products = await Product.findAll({
      where: { id: productIds },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const productsById = new Map(products.map((product) => [product.id, product]));

    for (const item of orderItems) {
      const product = productsById.get(item.productId);

      if (!product || !product.isActive) {
        throw new ServiceError(400, "Unable to fulfill paid order due to product availability");
      }

      if (item.quantity > product.stock) {
        throw new ServiceError(400, "Unable to fulfill paid order due to stock mismatch");
      }

      product.stock -= item.quantity;
      await product.save({ transaction });
    }

    order.status = "paid";
    await order.save({ transaction });
    await CartItem.destroy({ where: { userId: order.userId }, transaction });
  }

  private getWompiApiBaseUrl(): string {
    const publicKey = process.env.WOMPI_PUBLIC_KEY ?? "";
    return publicKey.includes("_test_")
      ? "https://sandbox.wompi.co/v1"
      : "https://production.wompi.co/v1";
  }

  async verifyWompiTransaction(userId: string, transactionId: string, reference: string) {
    if (!transactionId) {
      throw new ServiceError(400, "transactionId is required");
    }

    const privateKey = process.env.WOMPI_PRIVATE_KEY;

    if (privateKey) {
      const apiBase = this.getWompiApiBaseUrl();

      let wompiStatus: string | null = null;
      let wompiReference: string | null = null;

      try {
        const res = await fetch(`${apiBase}/transactions/${transactionId}`, {
          headers: { Authorization: `Bearer ${privateKey}` },
        });

        if (res.ok) {
          const body = (await res.json()) as { data: { reference: string; status: string } };
          wompiStatus = body.data.status;
          wompiReference = body.data.reference;
        }
      } catch {
        // Wompi API unavailable — fall through to DB fallback
      }

      if (wompiStatus && wompiReference?.startsWith("ORDER-")) {
        const orderId = wompiReference.replace("ORDER-", "");

        return sequelize.transaction(async (transaction) => {
          const order = await Order.findByPk(orderId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!order) {
            throw new ServiceError(404, "Order not found");
          }

          if (order.userId !== userId) {
            throw new ServiceError(403, "Insufficient permissions");
          }

          if (order.status === "pending") {
            if (wompiStatus === "APPROVED") {
              await this.fulfillApprovedOrder(order, transaction);
            } else if (
              wompiStatus === "DECLINED" ||
              wompiStatus === "VOIDED" ||
              wompiStatus === "ERROR"
            ) {
              order.status = "cancelled";
              await order.save({ transaction });
            }
          }

          return {
            data: {
              reference: wompiReference!,
              orderId: order.id,
              status: order.status,
            },
          };
        });
      }
    }

    // Fallback: return current order status from DB (webhook-dependent path)
    if (!reference?.startsWith("ORDER-")) {
      throw new ServiceError(400, "Valid reference is required when transactionId cannot be verified");
    }

    const orderId = reference.replace("ORDER-", "");
    const order = await Order.findByPk(orderId);

    if (!order) {
      throw new ServiceError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new ServiceError(403, "Insufficient permissions");
    }

    return {
      data: {
        reference,
        orderId: order.id,
        status: order.status,
      },
    };
  }

  async getWompiPaymentStatus(userId: string, reference: string) {
    if (!reference || !reference.startsWith("ORDER-")) {
      throw new ServiceError(400, "reference is required and must start with ORDER-");
    }

    const orderId = reference.replace("ORDER-", "");
    const order = await Order.findByPk(orderId);

    if (!order) {
      throw new ServiceError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new ServiceError(403, "Insufficient permissions");
    }

    return {
      data: {
        reference,
        orderId: order.id,
        status: order.status,
      },
    };
  }
}

export const paymentsService = new PaymentsService();