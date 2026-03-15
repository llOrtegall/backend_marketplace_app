import { Schema, model } from 'mongoose';
import type {
  PaymentMethod,
  PaymentStatus,
} from '../../domain/payment/PaymentValueObjects';

export interface PaymentDocument {
  _id: string;
  orderId: string;
  buyerId: string;
  amountCOP: number;
  method: PaymentMethod;
  status: PaymentStatus;
  wompiTransactionId: string | null;
  wompiRedirectUrl: string | null;
  failureReason: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    _id: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    buyerId: { type: String, required: true, index: true },
    amountCOP: { type: Number, required: true },
    method: {
      type: String,
      enum: [
        'CARD',
        'BANCOLOMBIA_TRANSFER',
        'NEQUI',
        'PSE',
        'BANCOLOMBIA_QR',
        'DAVIPLATA',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['INITIATED', 'PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'],
      default: 'INITIATED',
      index: true,
    },
    wompiTransactionId: { type: String, default: null },
    wompiRedirectUrl: { type: String, default: null },
    failureReason: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, _id: false },
);

paymentSchema.index({ orderId: 1, status: 1 });

export const PaymentModel = model<PaymentDocument>('Payment', paymentSchema);
