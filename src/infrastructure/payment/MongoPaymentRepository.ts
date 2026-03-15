import type { ClientSession } from 'mongoose';
import type { DbSession } from '../../domain/shared/DbSession';
import { Payment } from '../../domain/payment/Payment';
import type { IPaymentRepository } from '../../domain/payment/PaymentRepository';
import { PaymentModel, type PaymentDocument } from './PaymentSchema';

export class MongoPaymentRepository implements IPaymentRepository {
  async findById(id: string, session?: DbSession): Promise<Payment | null> {
    const doc = await PaymentModel.findById(id)
      .session((session as ClientSession) ?? null)
      .lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const doc = await PaymentModel.findOne({ orderId }).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async save(payment: Payment, session?: DbSession): Promise<void> {
    await PaymentModel.create([this.toPersistence(payment)], {
      session: (session as ClientSession) ?? null,
    });
  }

  async update(payment: Payment, session?: DbSession): Promise<void> {
    await PaymentModel.findByIdAndUpdate(
      payment.id,
      this.toPersistence(payment),
      { session: (session as ClientSession) ?? null },
    );
  }

  private toDomain(doc: PaymentDocument): Payment {
    return Payment.reconstitute({
      id: doc._id,
      orderId: doc.orderId,
      buyerId: doc.buyerId,
      amountCOP: doc.amountCOP,
      method: doc.method,
      status: doc.status,
      wompiTransactionId: doc.wompiTransactionId,
      wompiRedirectUrl: doc.wompiRedirectUrl,
      failureReason: doc.failureReason,
      processedAt: doc.processedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(payment: Payment): PaymentDocument {
    return {
      _id: payment.id,
      orderId: payment.orderId,
      buyerId: payment.buyerId,
      amountCOP: payment.amountCOP,
      method: payment.method,
      status: payment.status,
      wompiTransactionId: payment.wompiTransactionId,
      wompiRedirectUrl: payment.wompiRedirectUrl,
      failureReason: payment.failureReason,
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
