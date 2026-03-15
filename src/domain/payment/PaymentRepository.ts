import type { ClientSession } from 'mongoose';
import type { Payment } from './Payment';

export interface IPaymentRepository {
  findById(id: string, session?: ClientSession): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  save(payment: Payment, session?: ClientSession): Promise<void>;
  update(payment: Payment, session?: ClientSession): Promise<void>;
}
