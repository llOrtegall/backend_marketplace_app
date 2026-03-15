import { Order, type OrderProps } from '../../domain/order/Order';
import {
  Money,
  OrderItem,
  type OrderStatus,
} from '../../domain/order/OrderValueObjects';

function baseItem(): OrderItem {
  return OrderItem.create({
    productId: 'product-1',
    productName: 'Test Product',
    unitPrice: 100,
    quantity: 2,
  });
}

function baseProps(): OrderProps {
  return {
    id: 'order-1',
    buyerId: 'buyer-1',
    items: [baseItem()],
    total: Money.fromPersistence(200),
    status: 'PENDING',
    paymentId: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };
}

export function makeOrder(overrides: Partial<OrderProps> = {}): Order {
  return Order.reconstitute({ ...baseProps(), ...overrides });
}

export function makeOrderWithStatus(
  status: OrderStatus,
  overrides: Partial<OrderProps> = {},
): Order {
  return Order.reconstitute({ ...baseProps(), status, ...overrides });
}

export function makeOrderItem(
  overrides: Partial<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }> = {},
): OrderItem {
  return OrderItem.create({
    productId: overrides.productId ?? 'product-1',
    productName: overrides.productName ?? 'Test Product',
    unitPrice: overrides.unitPrice ?? 100,
    quantity: overrides.quantity ?? 2,
  });
}

export function makeOrderWithPayment(
  paymentId = 'payment-1',
  overrides: Partial<OrderProps> = {},
): Order {
  return Order.reconstitute({ ...baseProps(), paymentId, ...overrides });
}
