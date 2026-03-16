import { beforeEach, describe, expect, it } from 'bun:test';
import { ConfirmOrderUseCase } from '../../../application/order/confirmOrder.usecase';
import {
  createMockOrderRepository,
  type MockOrderRepository,
} from '../../helpers/mockRepositories';
import { makeOrderWithStatus } from '../../helpers/orderFixtures';

describe('ConfirmOrderUseCase', () => {
  let repo: MockOrderRepository;
  let useCase: ConfirmOrderUseCase;

  const ordenAwaiting = makeOrderWithStatus('AWAITING_PAYMENT', {
    id: 'order-1',
    buyerId: 'buyer-1',
  });

  beforeEach(() => {
    repo = createMockOrderRepository([ordenAwaiting]);
    useCase = new ConfirmOrderUseCase(repo);
  });

  it('confirma una orden en estado AWAITING_PAYMENT', async () => {
    await useCase.execute({ orderId: 'order-1' });

    const ordenActualizada = repo._store.get('order-1');
    expect(ordenActualizada?.status).toBe('CONFIRMED');
  });

  it('llama a update en el repositorio con la orden confirmada', async () => {
    await useCase.execute({ orderId: 'order-1' });

    expect(repo.updatedOrders).toHaveLength(1);
    expect(repo.updatedOrders.at(0)?.status).toBe('CONFIRMED');
  });

  it('lanza NotFoundError ORDER_NOT_FOUND si la orden no existe', async () => {
    await expect(
      useCase.execute({ orderId: 'orden-inexistente' }),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND', statusCode: 404 });
  });

  it('lanza AppError ORDER_INVALID_TRANSITION si la orden ya está CONFIRMED', async () => {
    const ordenConfirmada = makeOrderWithStatus('CONFIRMED', {
      id: 'order-confirmed',
    });
    repo._store.set('order-confirmed', ordenConfirmada);

    await expect(
      useCase.execute({ orderId: 'order-confirmed' }),
    ).rejects.toMatchObject({ code: 'ORDER_INVALID_TRANSITION' });
  });

  it('lanza AppError ORDER_INVALID_TRANSITION si la orden ya está CANCELLED', async () => {
    const ordenCancelada = makeOrderWithStatus('CANCELLED', {
      id: 'order-cancelled',
    });
    repo._store.set('order-cancelled', ordenCancelada);

    await expect(
      useCase.execute({ orderId: 'order-cancelled' }),
    ).rejects.toMatchObject({ code: 'ORDER_INVALID_TRANSITION' });
  });
});
