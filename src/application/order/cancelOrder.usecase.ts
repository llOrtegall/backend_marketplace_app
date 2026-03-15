import type { IOrderRepository } from '../../domain/order/OrderRepository';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

export interface CancelOrderDTO {
  orderId: string;
  requesterId: string;
  requesterRole: UserRole;
}

export class CancelOrderUseCase {
  constructor(private readonly repo: IOrderRepository) {}

  async execute(input: CancelOrderDTO): Promise<void> {
    const order = await this.repo.findById(input.orderId);
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');
    const isPrivileged =
      input.requesterRole === 'admin' || input.requesterRole === 'superadmin';
    if (!order.isOwnedBy(input.requesterId) && !isPrivileged)
      throw new ForbiddenError(
        'ORDER_FORBIDDEN',
        'You do not have access to this order',
      );
    const cancelled = order.cancel();
    await this.repo.update(cancelled);
  }
}
