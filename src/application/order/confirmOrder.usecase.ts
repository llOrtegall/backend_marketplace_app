import type { IOrderRepository } from '../../domain/order/OrderRepository';
import type { DbSession } from '../../domain/shared/DbSession';
import { NotFoundError } from '../../shared/errors/AppError';

export interface ConfirmOrderDTO {
  orderId: string;
  session?: DbSession;
}

export class ConfirmOrderUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(input: ConfirmOrderDTO): Promise<void> {
    const order = await this.orderRepo.findById(input.orderId, input.session);
    if (!order)
      throw new NotFoundError(
        'ORDER_NOT_FOUND',
        `Order '${input.orderId}' not found`,
      );
    const confirmed = order.confirm();
    await this.orderRepo.update(confirmed, input.session);
  }
}
