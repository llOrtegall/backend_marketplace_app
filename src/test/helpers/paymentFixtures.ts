import { Payment, type PaymentProps } from '../../domain/payment/Payment';
import type {
  PaymentMethod,
  PaymentStatus,
} from '../../domain/payment/PaymentValueObjects';

function baseProps(): PaymentProps {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    buyerId: 'buyer-1',
    amountCOP: 200000,
    method: 'CARD' as PaymentMethod,
    status: 'INITIATED' as PaymentStatus,
    wompiTransactionId: null,
    wompiRedirectUrl: null,
    failureReason: null,
    processedAt: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };
}

export function makePayment(overrides: Partial<PaymentProps> = {}): Payment {
  return Payment.reconstitute({ ...baseProps(), ...overrides });
}

export function makeApprovedPayment(
  overrides: Partial<PaymentProps> = {},
): Payment {
  return Payment.reconstitute({
    ...baseProps(),
    status: 'APPROVED',
    wompiTransactionId: 'wompi-tx-1',
    processedAt: new Date('2025-01-01T01:00:00Z'),
    ...overrides,
  });
}

export function makeDeclinedPayment(
  overrides: Partial<PaymentProps> = {},
): Payment {
  return Payment.reconstitute({
    ...baseProps(),
    status: 'DECLINED',
    wompiTransactionId: 'wompi-tx-1',
    failureReason: 'Fondos insuficientes',
    processedAt: new Date('2025-01-01T01:00:00Z'),
    ...overrides,
  });
}
