import { randomUUID } from 'node:crypto';
import { Payment } from '../../domain/payment/Payment';
import type {
  IPaymentGateway,
  CustomerData,
} from '../../domain/payment/PaymentGateway';
import type { IPaymentRepository } from '../../domain/payment/PaymentRepository';
import type { PaymentMethod } from '../../domain/payment/PaymentValueObjects';
import type { IOrderRepository } from '../../domain/order/OrderRepository';
import type { UserRepository } from '../../domain/user/UserRepository';
import type { ITransactionManager } from '../shared/ITransactionManager';
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableError,
} from '../../shared/errors/AppError';

export interface InitiatePaymentDTO {
  orderId: string;
  buyerId: string;
  method: PaymentMethod;
  acceptanceToken: string;
  personalDataAuthToken: string;
  paymentMethodData?: Record<string, unknown>;
  redirectUrl?: string;
  customerData?: CustomerData;
  ipAddress?: string;
}

export class InitiatePaymentUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly gateway: IPaymentGateway,
    private readonly userRepo: UserRepository,
    private readonly txManager: ITransactionManager,
  ) {}

  async execute(input: InitiatePaymentDTO): Promise<Payment> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) throw new NotFoundError('ORDER_NOT_FOUND', 'Order not found');
    if (!order.isOwnedBy(input.buyerId))
      throw new ForbiddenError(
        'ORDER_FORBIDDEN',
        'You do not have access to this order',
      );
    if (order.status !== 'PENDING')
      throw new UnprocessableError(
        'ORDER_NOT_PAYABLE',
        `Order is in status '${order.status}' and cannot be paid`,
      );

    const buyer = await this.userRepo.findById(input.buyerId);
    if (!buyer) throw new NotFoundError('USER_NOT_FOUND', 'Buyer not found');

    const payment = Payment.create({
      id: randomUUID(),
      orderId: order.id,
      buyerId: input.buyerId,
      amountCOP: order.total,
      method: input.method,
    });

    const gatewayResult = await this.gateway.initiatePayment({
      paymentId: payment.id,
      amountCOP: payment.amountCOP,
      customerEmail: buyer.email,
      method: input.method,
      acceptanceToken: input.acceptanceToken,
      personalDataAuthToken: input.personalDataAuthToken,
      paymentMethodData: input.paymentMethodData,
      redirectUrl: input.redirectUrl,
      customerData: input.customerData,
      ipAddress: input.ipAddress,
    });

    const updatedPayment = payment.applyWompiEvent({
      wompiTransactionId: gatewayResult.wompiTransactionId,
      wompiStatus: gatewayResult.wompiStatus,
      redirectUrl: gatewayResult.redirectUrl,
    });

    const updatedOrder = order
      .transitionTo('AWAITING_PAYMENT')
      .linkPayment(payment.id);

    await this.txManager.runInTransaction(async (session) => {
      await this.paymentRepo.save(updatedPayment, session);
      await this.orderRepo.update(updatedOrder, session);
    });

    return updatedPayment;
  }
}
