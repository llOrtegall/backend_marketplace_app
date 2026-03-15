import type { ClientSession } from 'mongoose';
import { Order } from '../../domain/order/Order';
import type {
  IOrderRepository,
  OrderFilters,
  OrderPaginationOptions,
} from '../../domain/order/OrderRepository';
import {
  Money,
  OrderItem,
  Quantity,
} from '../../domain/order/OrderValueObjects';
import type { PaginatedResult } from '../../shared/types/ApiResponse';
import {
  OrderModel,
  type OrderDocument,
  type OrderItemDocument,
} from './OrderSchema';

export class MongoOrderRepository implements IOrderRepository {
  async findById(id: string, session?: ClientSession): Promise<Order | null> {
    const doc = await OrderModel.findById(id)
      .session(session ?? null)
      .lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(
    filters: OrderFilters,
    pagination: OrderPaginationOptions,
  ): Promise<PaginatedResult<Order>> {
    const query: Record<string, unknown> = {};
    if (filters.buyerId) query.buyerId = filters.buyerId;
    if (filters.status) query.status = filters.status;

    const skip = (pagination.page - 1) * pagination.limit;
    const [docs, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      OrderModel.countDocuments(query),
    ]);

    return {
      items: docs.map((d) => this.toDomain(d)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async save(order: Order): Promise<void> {
    await OrderModel.create(this.toPersistence(order));
  }

  async update(order: Order, session?: ClientSession): Promise<void> {
    await OrderModel.findByIdAndUpdate(order.id, this.toPersistence(order), {
      session: session ?? null,
    });
  }

  private toDomain(doc: OrderDocument): Order {
    return Order.reconstitute({
      id: doc._id,
      buyerId: doc.buyerId,
      items: doc.items.map((i: OrderItemDocument) =>
        OrderItem.fromPersistence({
          productId: i.productId,
          productName: i.productName,
          unitPrice: Money.fromPersistence(i.unitPrice),
          quantity: Quantity.fromPersistence(i.quantity),
          subtotal: Money.fromPersistence(i.subtotal),
        }),
      ),
      total: Money.fromPersistence(doc.total),
      status: doc.status,
      paymentId: doc.paymentId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(order: Order): OrderDocument {
    return {
      _id: order.id,
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
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
