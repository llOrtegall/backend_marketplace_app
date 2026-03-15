import type { Payment } from '../../domain/payment/Payment';

export interface PaymentDTO {
  id: string;
  orderId: string;
  amountCOP: number;
  method: string;
  status: string;
  wompiTransactionId: string | null;
  wompiRedirectUrl: string | null;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toPaymentDTO(payment: Payment): PaymentDTO {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amountCOP: payment.amountCOP,
    method: payment.method,
    status: payment.status,
    wompiTransactionId: payment.wompiTransactionId,
    wompiRedirectUrl: payment.wompiRedirectUrl,
    failureReason: payment.failureReason,
    processedAt: payment.processedAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}
