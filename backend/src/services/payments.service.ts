import crypto from "node:crypto";

import { ServiceError } from "../errors/service.error";
import { CartItem, Order, Product, User } from "../models";

const allowedStatuses = ["APPROVED", "DECLINED", "PENDING"] as const;
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
  private async syncCartItems(userId: string, items: CheckoutInput["items"]) {
    if (!items || items.length === 0) {
      return;
    }

    const normalizedItems = items
      .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0)
      .map((item) => ({ productId: item.productId, quantity: item.quantity }));

    if (!normalizedItems.length) {
      throw new ServiceError(400, "items payload is invalid");
    }

    await CartItem.destroy({ where: { userId } });
    await CartItem.bulkCreate(
      normalizedItems.map((item) => ({
        userId,
        productId: item.productId,
        quantity: item.quantity,
      })),
    );
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
    await this.syncCartItems(userId, input.items);

    for (const item of await CartItem.findAll({
      where: { userId },
      include: [{ model: Product, as: "product" }],
    })) {
      const product = (item as CartItem & { product?: Product }).product;

      if (!product || !product.isActive) {
        throw new ServiceError(400, "Cart contains unavailable products");
      }

      if (item.quantity > product.stock) {
        throw new ServiceError(400, `Insufficient stock for product ${product.id}`);
      }
    }

    const total = Number(
      (await CartItem.findAll({
        where: { userId },
        include: [{ model: Product, as: "product" }],
      }))
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

    const reference = `ORDER-${order.id}`;
    const amountInCents = Math.round(total * 100);
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
      const cartItems = await CartItem.findAll({
        where: { userId: order.userId },
        include: [{ model: Product, as: "product" }],
      });

      for (const item of cartItems) {
        const product = (item as CartItem & { product?: Product }).product;
        if (!product || item.quantity > product.stock) {
          throw new ServiceError(400, "Unable to fulfill paid order due to stock mismatch");
        }

        product.stock -= item.quantity;
        await product.save();
      }

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