import type { Order } from '../../domain/order/Order';

export interface OrderItemDTO {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDTO {
  id: string;
  buyerId: string;
  items: OrderItemDTO[];
  total: number;
  status: string;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toOrderDTO(order: Order): OrderDTO {
  return {
    id: order.id,
    buyerId: order.buyerId,
    items: order.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
    total: order.total,
    status: order.status,
    paymentId: order.paymentId,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
