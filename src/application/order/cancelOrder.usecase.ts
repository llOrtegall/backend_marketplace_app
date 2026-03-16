import type { IOrderRepository } from '../../domain/order/OrderRepository';
import type { IProductRepository } from '../../domain/product/ProductRepository';
import { isPrivilegedRole } from '../../domain/user/UserValueObjects';
import type { UserRole } from '../../domain/user/UserValueObjects';
import type { ITransactionManager } from '../shared/ITransactionManager';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

export interface CancelOrderDTO {
  orderId: string;
  requesterId: string;
  requesterRole: UserRole;
}

export class CancelOrderUseCase {
  constructor(
    private readonly repo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly txManager: ITransactionManager,
  ) {}

  async execute(input: CancelOrderDTO): Promise<void> {
    const order = await this.repo.findById(input.orderId);
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');

    const isPrivileged = isPrivilegedRole(input.requesterRole);
    if (!order.isOwnedBy(input.requesterId) && !isPrivileged)
      throw new ForbiddenError(
        'ORDER_FORBIDDEN',
        'You do not have access to this order',
      );

    const cancelled = order.cancel();
    const shouldRestoreStock = ['PENDING', 'AWAITING_PAYMENT'].includes(
      order.status,
    );

    await this.txManager.runInTransaction(async (session) => {
      if (shouldRestoreStock) {
        for (const item of order.items) {
          await this.productRepo.restoreStock(
            item.productId,
            item.quantity,
            session,
          );
        }
      }
      await this.repo.update(cancelled, session);
    });
  }
}
