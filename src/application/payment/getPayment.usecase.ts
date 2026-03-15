import type { Payment } from '../../domain/payment/Payment';
import type { IPaymentRepository } from '../../domain/payment/PaymentRepository';
import { isPrivilegedRole } from '../../domain/user/UserValueObjects';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

export interface GetPaymentDTO {
  paymentId: string;
  requesterId: string;
  requesterRole: UserRole;
}

export class GetPaymentUseCase {
  constructor(private readonly repo: IPaymentRepository) {}

  async execute(input: GetPaymentDTO): Promise<Payment> {
    const payment = await this.repo.findById(input.paymentId);
    if (!payment)
      throw new NotFoundError('PAYMENT_NOT_FOUND', 'Payment not found');
    const isPrivileged = isPrivilegedRole(input.requesterRole);
    if (payment.buyerId !== input.requesterId && !isPrivileged)
      throw new ForbiddenError(
        'PAYMENT_FORBIDDEN',
        'You do not have access to this payment',
      );
    return payment;
  }
}
