import type {
  IOrderRepository,
  OrderFilters,
} from '../../domain/order/OrderRepository';
import type { OrderStatus } from '../../domain/order/OrderValueObjects';
import { isPrivilegedRole } from '../../domain/user/UserValueObjects';
import type { UserRole } from '../../domain/user/UserValueObjects';
import type { PaginatedResult } from '../../shared/types/ApiResponse';
import type { Order } from '../../domain/order/Order';

export interface ListOrdersDTO {
  requesterId: string;
  requesterRole: UserRole;
  status?: OrderStatus;
  page: number;
  limit: number;
}

export class ListOrdersUseCase {
  constructor(private readonly repo: IOrderRepository) {}

  async execute(input: ListOrdersDTO): Promise<PaginatedResult<Order>> {
    const isPrivileged = isPrivilegedRole(input.requesterRole);
    const filters: OrderFilters = {
      status: input.status,
      ...(isPrivileged ? {} : { buyerId: input.requesterId }),
    };
    return this.repo.findAll(filters, { page: input.page, limit: input.limit });
  }
}
