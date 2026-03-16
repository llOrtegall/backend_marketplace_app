import { randomUUID } from 'node:crypto';
import { Order } from '../../domain/order/Order';
import type { IOrderRepository } from '../../domain/order/OrderRepository';
import type { IProductRepository } from '../../domain/product/ProductRepository';
import type { ITransactionManager } from '../shared/ITransactionManager';
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
    private readonly productRepo: IProductRepository,
    private readonly txManager: ITransactionManager,
  ) {}

  async execute(input: CreateOrderDTO): Promise<Order> {
    if (!input.items.length)
      throw new UnprocessableError(
        'ORDER_EMPTY',
        'Order must have at least one item',
      );

    let createdOrder: Order | null = null;

    await this.txManager.runInTransaction(async (session) => {
      const orderItems: {
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
      }[] = [];

      for (const item of input.items) {
        const product = await this.productRepo.decrementStockIfAvailable(
          item.productId,
          item.quantity,
          session,
        );

        if (!product) {
          const existing = await this.productRepo.findById(
            item.productId,
            session,
          );
          if (!existing || existing.status !== 'active') {
            throw new NotFoundError(
              'PRODUCT_NOT_FOUND',
              `Product '${item.productId}' not found or not available`,
            );
          }
          throw new UnprocessableError(
            'INSUFFICIENT_STOCK',
            `Insufficient stock for product '${existing.name}'`,
          );
        }

        orderItems.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
        });
      }

      const order = Order.create({
        id: randomUUID(),
        buyerId: input.buyerId,
        items: orderItems,
      });
      await this.orderRepo.save(order, session);
      createdOrder = order;
    });

    return createdOrder!;
  }
}
