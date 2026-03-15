import { randomUUID } from 'node:crypto';
import { Order } from '../../domain/order/Order';
import type { IOrderRepository } from '../../domain/order/OrderRepository';
import type { ProductRepository } from '../../domain/product/ProductRepository';
import {
  NotFoundError,
  UnprocessableError,
} from '../../shared/errors/AppError';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}
export interface CreateOrderDTO {
  buyerId: string;
  items: CreateOrderItemInput[];
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(input: CreateOrderDTO): Promise<Order> {
    if (!input.items.length)
      throw new UnprocessableError(
        'ORDER_EMPTY',
        'Order must have at least one item',
      );

    const orderItems = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.productRepo.findById(item.productId);
        if (!product || product.status !== 'active')
          throw new NotFoundError(
            'PRODUCT_NOT_FOUND',
            `Product '${item.productId}' not found or not available`,
          );
        if (product.stock < item.quantity)
          throw new UnprocessableError(
            'INSUFFICIENT_STOCK',
            `Insufficient stock for product '${product.name}'`,
          );
        return {
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
        };
      }),
    );

    const order = Order.create({
      id: randomUUID(),
      buyerId: input.buyerId,
      items: orderItems,
    });
    await this.orderRepo.save(order);
    return order;
  }
}
