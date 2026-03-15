import type { ITransactionManager } from '../shared/ITransactionManager';
import type { IOrderRepository } from '../../domain/order/OrderRepository';
import type { IPaymentRepository } from '../../domain/payment/PaymentRepository';
import type { IProductRepository } from '../../domain/product/ProductRepository';
import type { WompiTransactionData } from '../../domain/payment/PaymentGateway';
import { NotFoundError } from '../../shared/errors/AppError';

export class HandleWompiEventUseCase {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
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
        // Deduct stock for each item and confirm order
        for (const item of order.items) {
          const product = await this.productRepo.findById(
            item.productId,
            session,
          );
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            const updatedProduct = product.update({ stock: newStock });
            await this.productRepo.update(updatedProduct, session);
          }
        }
        const confirmedOrder = order.confirm();
        await this.orderRepo.update(confirmedOrder, session);
      } else if (updatedPayment.isTerminal()) {
        // DECLINED, VOIDED, ERROR → cancel order
        const cancelledOrder = order.cancel();
        await this.orderRepo.update(cancelledOrder, session);
      }
    });
  }
}
