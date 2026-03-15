import type { Order } from '../../domain/order/Order';
import type { IOrderRepository } from '../../domain/order/OrderRepository';
import { isPrivilegedRole } from '../../domain/user/UserValueObjects';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

export interface GetOrderDTO {
  orderId: string;
  requesterId: string;
  requesterRole: UserRole;
}

export class GetOrderUseCase {
  constructor(private readonly repo: IOrderRepository) {}

  async execute(input: GetOrderDTO): Promise<Order> {
    const order = await this.repo.findById(input.orderId);
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');
    const isPrivileged = isPrivilegedRole(input.requesterRole);
    if (!order.isOwnedBy(input.requesterId) && !isPrivileged)
      throw new ForbiddenError(
        'ORDER_FORBIDDEN',
        'You do not have access to this order',
      );
    return order;
  }
}
