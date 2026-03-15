import { beforeEach, describe, expect, it } from 'bun:test';
import { GetOrderUseCase } from '../../../application/order/getOrder.usecase';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError';
import {
  createMockOrderRepository,
  type MockOrderRepository,
} from '../../helpers/mockRepositories';
import { makeOrder } from '../../helpers/orderFixtures';

describe('GetOrderUseCase', () => {
  let repo: MockOrderRepository;
  let useCase: GetOrderUseCase;

  const ordenExistente = makeOrder({ id: 'order-1', buyerId: 'buyer-1' });

  beforeEach(() => {
    repo = createMockOrderRepository([ordenExistente]);
    useCase = new GetOrderUseCase(repo);
  });

  it('retorna la orden cuando el requester es el buyer', async () => {
    const order = await useCase.execute({
      orderId: 'order-1',
      requesterId: 'buyer-1',
      requesterRole: 'user',
    });

    expect(order.id).toBe('order-1');
  });

  it('retorna la orden cuando el requester es admin', async () => {
    const order = await useCase.execute({
      orderId: 'order-1',
      requesterId: 'admin-99',
      requesterRole: 'admin',
    });

    expect(order.id).toBe('order-1');
  });

  it('retorna la orden cuando el requester es superadmin', async () => {
    const order = await useCase.execute({
      orderId: 'order-1',
      requesterId: 'superadmin-1',
      requesterRole: 'superadmin',
    });

    expect(order.id).toBe('order-1');
  });

  it('lanza NotFoundError ORDER_NOT_FOUND si la orden no existe', async () => {
    await expect(
      useCase.execute({
        orderId: 'orden-inexistente',
        requesterId: 'buyer-1',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'ORDER_NOT_FOUND', statusCode: 404 }),
    );
  });

  it('lanza ForbiddenError ORDER_FORBIDDEN si el user no es el buyer', async () => {
    await expect(
      useCase.execute({
        orderId: 'order-1',
        requesterId: 'buyer-otro',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'ORDER_FORBIDDEN', statusCode: 403 }),
    );
  });

  it('lanza ForbiddenError y no NotFoundError cuando el user es incorrecto', async () => {
    await expect(
      useCase.execute({
        orderId: 'order-1',
        requesterId: 'buyer-distinto',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('lanza NotFoundError antes de ForbiddenError cuando la orden no existe', async () => {
    await expect(
      useCase.execute({
        orderId: 'no-existe',
        requesterId: 'buyer-distinto',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
