import type { ITransactionManager } from '../shared/ITransactionManager';
import type { IOrderRepository } from '../../domain/order/OrderRepository';
import type { IPaymentRepository } from '../../domain/payment/PaymentRepository';
import type { IProductRepository } from '../../domain/product/ProductRepository';
import type { WompiTransactionData } from '../../domain/payment/PaymentGateway';
import type { ConfirmOrderUseCase } from '../order/confirmOrder.usecase';
import { NotFoundError } from '../../shared/errors/AppError';

export class HandleWompiEventUseCase {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly confirmOrder: ConfirmOrderUseCase,
    private readonly txManager: ITransactionManager,
  ) {}

  async execute(txData: WompiTransactionData): Promise<void> {
    await this.txManager.runInTransaction(async (session) => {
      const payment = await this.paymentRepo.findById(
        txData.reference,
        session,
      );
      if (!payment)
        throw new NotFoundError(
          'PAYMENT_NOT_FOUND',
          `Payment '${txData.reference}' not found`,
        );

      if (payment.isTerminal()) return; // idempotency: already processed

      const updatedPayment = payment.applyWompiEvent({
        wompiTransactionId: txData.id,
        wompiStatus: txData.status,
      });

      await this.paymentRepo.update(updatedPayment, session);

      const order = await this.orderRepo.findById(payment.orderId, session);
      if (!order)
        throw new NotFoundError(
          'ORDER_NOT_FOUND',
          `Order '${payment.orderId}' not found`,
        );

      if (updatedPayment.isApproved()) {
        await this.confirmOrder.execute({ orderId: order.id, session });
      } else if (updatedPayment.isTerminal()) {
        // DECLINED, VOIDED, ERROR → restaurar stock y cancelar orden
        for (const item of order.items) {
          await this.productRepo.restoreStock(
            item.productId,
            item.quantity,
            session,
          );
        }
        const cancelledOrder = order.cancel();
        await this.orderRepo.update(cancelledOrder, session);
      }
    });
  }
}
