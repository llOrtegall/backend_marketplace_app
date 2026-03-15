import type { DbSession } from '../shared/DbSession';
import type { Payment } from './Payment';

export interface IPaymentRepository {
  findById(id: string, session?: DbSession): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  save(payment: Payment, session?: DbSession): Promise<void>;
  update(payment: Payment, session?: DbSession): Promise<void>;
}
