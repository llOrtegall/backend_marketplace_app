import { ServiceError } from "../errors/service.error";
import { Order, OrderItem, Product } from "../models";
import { getProductImageSignedUrl } from "../lib/r2";

export class OrdersService {
  async getUserOrders(userId: string) {
    const orders = await Order.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    if (!orders.length) {
      return { data: [] };
    }

    const orderIds = orders.map((o) => o.id);

    const orderItems = await OrderItem.findAll({
      where: { orderId: orderIds },
    });

    const productIds = [...new Set(orderItems.map((i) => i.productId))];
    const products = await Product.findAll({
      where: { id: productIds },
      attributes: ["id", "name", "image", "price"],
    });

    const imageUrlMap = new Map(
      await Promise.all(
        products.map(async (p) => [p.id, await getProductImageSignedUrl(p.image)] as const),
      ),
    );

    const productsById = new Map(products.map((p) => [p.id, p]));

    const itemsByOrderId = new Map<string, typeof orderItems>();
    for (const item of orderItems) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, []);
      }
      itemsByOrderId.get(item.orderId)!.push(item);
    }

    const data = orders.map((order) => ({
      ...order.toJSON(),
      items: (itemsByOrderId.get(order.id) ?? []).map((item) => {
        const product = productsById.get(item.productId);
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          product: product
            ? {
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: imageUrlMap.get(product.id) ?? null,
              }
            : null,
        };
      }),
    }));

    return { data };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await Order.findByPk(orderId);

    if (!order) {
      throw new ServiceError(404, "Order not found");
    }

    if (order.userId !== userId) {
      throw new ServiceError(403, "Insufficient permissions");
    }

    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id },
    });

    const productIds = [...new Set(orderItems.map((i) => i.productId))];
    const products = await Product.findAll({
      where: { id: productIds },
      attributes: ["id", "name", "image", "price"],
    });

    const imageUrlMap = new Map(
      await Promise.all(
        products.map(async (p) => [p.id, await getProductImageSignedUrl(p.image)] as const),
      ),
    );

    const productsById = new Map(products.map((p) => [p.id, p]));

    return {
      data: {
        ...order.toJSON(),
        items: orderItems.map((item) => {
          const product = productsById.get(item.productId);
          return {
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            product: product
              ? {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: imageUrlMap.get(product.id) ?? null,
                }
              : null,
          };
        }),
      },
    };
  }
}

export const ordersService = new OrdersService();
