import { beforeEach, describe, expect, it } from 'bun:test';
import { GetPaymentUseCase } from '../../../application/payment/getPayment.usecase';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError';
import {
  createMockPaymentRepository,
  type MockPaymentRepository,
} from '../../helpers/mockRepositories';
import { makePayment } from '../../helpers/paymentFixtures';

describe('GetPaymentUseCase', () => {
  let repo: MockPaymentRepository;
  let useCase: GetPaymentUseCase;

  const pagoExistente = makePayment({
    id: 'payment-1',
    orderId: 'order-1',
    buyerId: 'buyer-1',
  });

  beforeEach(() => {
    repo = createMockPaymentRepository([pagoExistente]);
    useCase = new GetPaymentUseCase(repo);
  });

  it('retorna el pago cuando el requester es el buyer', async () => {
    const payment = await useCase.execute({
      paymentId: 'payment-1',
      requesterId: 'buyer-1',
      requesterRole: 'user',
    });

    expect(payment.id).toBe('payment-1');
  });

  it('retorna el pago cuando el requester es admin', async () => {
    const payment = await useCase.execute({
      paymentId: 'payment-1',
      requesterId: 'admin-99',
      requesterRole: 'admin',
    });

    expect(payment.id).toBe('payment-1');
  });

  it('retorna el pago cuando el requester es superadmin', async () => {
    const payment = await useCase.execute({
      paymentId: 'payment-1',
      requesterId: 'superadmin-1',
      requesterRole: 'superadmin',
    });

    expect(payment.id).toBe('payment-1');
  });

  it('lanza NotFoundError PAYMENT_NOT_FOUND si el pago no existe', async () => {
    await expect(
      useCase.execute({
        paymentId: 'pago-inexistente',
        requesterId: 'buyer-1',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'PAYMENT_NOT_FOUND', statusCode: 404 }),
    );
  });

  it('lanza ForbiddenError PAYMENT_FORBIDDEN si el user no es el buyer', async () => {
    await expect(
      useCase.execute({
        paymentId: 'payment-1',
        requesterId: 'buyer-otro',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'PAYMENT_FORBIDDEN', statusCode: 403 }),
    );
  });

  it('lanza ForbiddenError y no NotFoundError cuando el user es incorrecto', async () => {
    await expect(
      useCase.execute({
        paymentId: 'payment-1',
        requesterId: 'buyer-distinto',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('lanza NotFoundError antes de ForbiddenError cuando el pago no existe', async () => {
    await expect(
      useCase.execute({
        paymentId: 'no-existe',
        requesterId: 'buyer-distinto',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
