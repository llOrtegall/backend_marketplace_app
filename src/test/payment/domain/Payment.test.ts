import { describe, expect, it } from 'bun:test';
import { Payment } from '../../../domain/payment/Payment';
import {
  TERMINAL_PAYMENT_STATUSES,
  WOMPI_TO_DOMAIN_STATUS,
} from '../../../domain/payment/PaymentValueObjects';
import { AppError } from '../../../shared/errors/AppError';
import {
  makeApprovedPayment,
  makeDeclinedPayment,
  makePayment,
} from '../../helpers/paymentFixtures';

describe('Payment.create', () => {
  it('crea el pago con status INITIATED', () => {
    const payment = Payment.create({
      id: 'payment-new',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      amountCOP: 150000,
      method: 'CARD',
    });

    expect(payment.status).toBe('INITIATED');
  });

  it('crea el pago con wompiTransactionId null', () => {
    const payment = Payment.create({
      id: 'payment-new',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      amountCOP: 150000,
      method: 'NEQUI',
    });

    expect(payment.wompiTransactionId).toBeNull();
  });

  it('crea el pago con wompiRedirectUrl null', () => {
    const payment = Payment.create({
      id: 'payment-new',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      amountCOP: 150000,
      method: 'PSE',
    });

    expect(payment.wompiRedirectUrl).toBeNull();
  });

  it('crea el pago con failureReason null', () => {
    const payment = Payment.create({
      id: 'payment-new',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      amountCOP: 150000,
      method: 'CARD',
    });

    expect(payment.failureReason).toBeNull();
  });

  it('crea el pago con processedAt null', () => {
    const payment = Payment.create({
      id: 'payment-new',
      orderId: 'order-1',
      buyerId: 'buyer-1',
      amountCOP: 150000,
      method: 'CARD',
    });

    expect(payment.processedAt).toBeNull();
  });

  it('asigna los campos de identidad correctamente', () => {
    const payment = Payment.create({
      id: 'payment-42',
      orderId: 'order-99',
      buyerId: 'buyer-7',
      amountCOP: 200000,
      method: 'BANCOLOMBIA_TRANSFER',
    });

    expect(payment.id).toBe('payment-42');
    expect(payment.orderId).toBe('order-99');
    expect(payment.buyerId).toBe('buyer-7');
    expect(payment.amountCOP).toBe(200000);
    expect(payment.method).toBe('BANCOLOMBIA_TRANSFER');
  });
});

describe('Payment.applyWompiEvent', () => {
  it('transiciona a PENDING con evento Wompi PENDING', () => {
    const payment = makePayment();
    const updated = payment.applyWompiEvent({
      wompiTransactionId: 'wompi-tx-1',
      wompiStatus: 'PENDING',
    });

    expect(updated.status).toBe('PENDING');
  });

  it('transiciona a APPROVED con evento Wompi APPROVED', () => {
    const payment = makePayment();
    const updated = payment.applyWompiEvent({
      wompiTransactionId: 'wompi-tx-1',
      wompiStatus: 'APPROVED',
    });

    expect(updated.status).toBe('APPROVED');
  });

  it('transiciona a DECLINED con evento Wompi DECLINED', () => {
    const payment = makePayment();
    const updated = payment.applyWompiEvent({
      wompiTransactionId: 'wompi-tx-1',
      wompiStatus: 'DECLINED',
    });

    expect(updated.status).toBe('DECLINED');
  });

  it('transiciona a VOIDED con evento Wompi VOIDED', () => {
    const payment = makePayment();
    const updated = payment.applyWompiEvent({
      wompiTransactionId: 'wompi-tx-1',
      wompiStatus: 'VOIDED',
    });

    expect(updated.status).toBe('VOIDED');
  });

  it('transiciona a ERROR con evento Wompi ERROR', () => {
    const payment = makePayment();
    const updated = payment.applyWompiEvent({
      wompiTransactionId: 'wompi-tx-1',
      wompiStatus: 'ERROR',
    });

    expect(updated.status).toBe('ERROR');
  });

  it('vincula el wompiTransactionId al aplicar el evento', () => {
    const payment = makePayment();
    const updated = payment.applyWompiEvent({
      wompiTransactionId: 'tx-abc-123',
      wompiStatus: 'APPROVED',
    });

    expect(updated.wompiTransactionId).toBe('tx-abc-123');
  });

  it('asigna processedAt cuando el nuevo estado es terminal', () => {
    const payment = makePayment();
    const updated = payment.applyWompiEvent({
      wompiTransactionId: 'tx-1',
      wompiStatus: 'APPROVED',
    });

    expect(updated.processedAt).toBeInstanceOf(Date);
  });

  it('mantiene processedAt null cuando el nuevo estado no es terminal', () => {
    const payment = makePayment();
    const updated = payment.applyWompiEvent({
      wompiTransactionId: 'tx-1',
      wompiStatus: 'PENDING',
    });

    expect(updated.processedAt).toBeNull();
  });

  it('lanza AppError PAYMENT_ALREADY_TERMINAL si el pago ya es APPROVED', () => {
    const payment = makeApprovedPayment();

    expect(() =>
      payment.applyWompiEvent({
        wompiTransactionId: 'tx-nuevo',
        wompiStatus: 'DECLINED',
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'PAYMENT_ALREADY_TERMINAL',
        statusCode: 422,
      }),
    );
  });

  it('lanza AppError PAYMENT_ALREADY_TERMINAL si el pago ya es DECLINED', () => {
    const payment = makeDeclinedPayment();

    expect(() =>
      payment.applyWompiEvent({
        wompiTransactionId: 'tx-nuevo',
        wompiStatus: 'APPROVED',
      }),
    ).toThrow(AppError);
  });

  it('no muta el pago original', () => {
    const payment = makePayment();
    payment.applyWompiEvent({
      wompiTransactionId: 'tx-1',
      wompiStatus: 'APPROVED',
    });

    expect(payment.status).toBe('INITIATED');
  });
});

describe('Payment.isTerminal', () => {
  it('retorna true para status APPROVED', () => {
    const payment = makeApprovedPayment();
    expect(payment.isTerminal()).toBe(true);
  });

  it('retorna true para status DECLINED', () => {
    const payment = makeDeclinedPayment();
    expect(payment.isTerminal()).toBe(true);
  });

  it('retorna true para status VOIDED', () => {
    const payment = makePayment({ status: 'VOIDED' });
    expect(payment.isTerminal()).toBe(true);
  });

  it('retorna true para status ERROR', () => {
    const payment = makePayment({ status: 'ERROR' });
    expect(payment.isTerminal()).toBe(true);
  });

  it('retorna false para status INITIATED', () => {
    const payment = makePayment({ status: 'INITIATED' });
    expect(payment.isTerminal()).toBe(false);
  });

  it('retorna false para status PENDING', () => {
    const payment = makePayment({ status: 'PENDING' });
    expect(payment.isTerminal()).toBe(false);
  });
});

describe('Payment.isApproved', () => {
  it('retorna true solo para status APPROVED', () => {
    const payment = makeApprovedPayment();
    expect(payment.isApproved()).toBe(true);
  });

  it('retorna false para status DECLINED', () => {
    const payment = makeDeclinedPayment();
    expect(payment.isApproved()).toBe(false);
  });

  it('retorna false para status INITIATED', () => {
    const payment = makePayment({ status: 'INITIATED' });
    expect(payment.isApproved()).toBe(false);
  });

  it('retorna false para status PENDING', () => {
    const payment = makePayment({ status: 'PENDING' });
    expect(payment.isApproved()).toBe(false);
  });

  it('retorna false para status ERROR', () => {
    const payment = makePayment({ status: 'ERROR' });
    expect(payment.isApproved()).toBe(false);
  });
});

describe('TERMINAL_PAYMENT_STATUSES', () => {
  it('contiene APPROVED', () => {
    expect(TERMINAL_PAYMENT_STATUSES.has('APPROVED')).toBe(true);
  });

  it('contiene DECLINED', () => {
    expect(TERMINAL_PAYMENT_STATUSES.has('DECLINED')).toBe(true);
  });

  it('contiene VOIDED', () => {
    expect(TERMINAL_PAYMENT_STATUSES.has('VOIDED')).toBe(true);
  });

  it('contiene ERROR', () => {
    expect(TERMINAL_PAYMENT_STATUSES.has('ERROR')).toBe(true);
  });

  it('no contiene INITIATED', () => {
    expect(TERMINAL_PAYMENT_STATUSES.has('INITIATED')).toBe(false);
  });

  it('no contiene PENDING', () => {
    expect(TERMINAL_PAYMENT_STATUSES.has('PENDING')).toBe(false);
  });
});

describe('WOMPI_TO_DOMAIN_STATUS', () => {
  it('mapea PENDING de Wompi a PENDING de dominio', () => {
    expect(WOMPI_TO_DOMAIN_STATUS.PENDING).toBe('PENDING');
  });

  it('mapea APPROVED de Wompi a APPROVED de dominio', () => {
    expect(WOMPI_TO_DOMAIN_STATUS.APPROVED).toBe('APPROVED');
  });

  it('mapea DECLINED de Wompi a DECLINED de dominio', () => {
    expect(WOMPI_TO_DOMAIN_STATUS.DECLINED).toBe('DECLINED');
  });

  it('mapea VOIDED de Wompi a VOIDED de dominio', () => {
    expect(WOMPI_TO_DOMAIN_STATUS.VOIDED).toBe('VOIDED');
  });

  it('mapea ERROR de Wompi a ERROR de dominio', () => {
    expect(WOMPI_TO_DOMAIN_STATUS.ERROR).toBe('ERROR');
  });
});
