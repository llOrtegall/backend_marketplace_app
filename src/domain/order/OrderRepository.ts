import type { ClientSession } from 'mongoose';
import type { PaginatedResult } from '../../shared/types/ApiResponse';
import type { Order } from './Order';
import type { OrderStatus } from './OrderValueObjects';

export interface OrderFilters {
  buyerId?: string;
  status?: OrderStatus;
}
export interface OrderPaginationOptions {
  page: number;
  limit: number;
}

export interface IOrderRepository {
  findById(id: string, session?: ClientSession): Promise<Order | null>;
  findAll(
    filters: OrderFilters,
    pagination: OrderPaginationOptions,
  ): Promise<PaginatedResult<Order>>;
  save(order: Order): Promise<void>;
  update(order: Order, session?: ClientSession): Promise<void>;
}
