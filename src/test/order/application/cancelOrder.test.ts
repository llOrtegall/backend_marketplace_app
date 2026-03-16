import { beforeEach, describe, expect, it } from 'bun:test';
import { CancelOrderUseCase } from '../../../application/order/cancelOrder.usecase';
import { NotFoundError } from '../../../shared/errors/AppError';
import {
  createMockOrderRepository,
  createMockProductRepository,
  type MockOrderRepository,
} from '../../helpers/mockRepositories';
import { createMockTransactionManager } from '../../helpers/mockTransactionManager';
import { makeOrder, makeOrderWithStatus } from '../../helpers/orderFixtures';
import { makeProduct } from '../../helpers/productFixtures';
import { Stock } from '../../../domain/product/ProductValueObjects';

describe('CancelOrderUseCase', () => {
  let repo: MockOrderRepository;
  let useCase: CancelOrderUseCase;

  const product = makeProduct({
    id: 'product-1',
    stock: Stock.create(8),
    status: 'active',
  });
  const ordenPending = makeOrder({ id: 'order-1', buyerId: 'buyer-1' });

  beforeEach(() => {
    repo = createMockOrderRepository([ordenPending]);
    const productRepo = createMockProductRepository([product]);
    useCase = new CancelOrderUseCase(
      repo,
      productRepo,
      createMockTransactionManager(),
    );
  });

  it('cancela la orden cuando el requester es el buyer', async () => {
    await useCase.execute({
      orderId: 'order-1',
      requesterId: 'buyer-1',
      requesterRole: 'user',
    });

    const ordenActualizada = repo._store.get('order-1');
    expect(ordenActualizada?.status).toBe('CANCELLED');
  });

  it('cancela la orden cuando el requester es admin', async () => {
    await useCase.execute({
      orderId: 'order-1',
      requesterId: 'admin-1',
      requesterRole: 'admin',
    });

    const ordenActualizada = repo._store.get('order-1');
    expect(ordenActualizada?.status).toBe('CANCELLED');
  });

  it('cancela la orden cuando el requester es superadmin', async () => {
    await useCase.execute({
      orderId: 'order-1',
      requesterId: 'superadmin-1',
      requesterRole: 'superadmin',
    });

    const ordenActualizada = repo._store.get('order-1');
    expect(ordenActualizada?.status).toBe('CANCELLED');
  });

  it('llama a update en el repositorio con la orden cancelada', async () => {
    await useCase.execute({
      orderId: 'order-1',
      requesterId: 'buyer-1',
      requesterRole: 'user',
    });

    expect(repo.updatedOrders).toHaveLength(1);
    expect(repo.updatedOrders.at(0)?.status).toBe('CANCELLED');
  });

  it('restaura el stock del producto al cancelar una orden PENDING', async () => {
    const productRepo = createMockProductRepository([product]);
    const localUseCase = new CancelOrderUseCase(
      repo,
      productRepo,
      createMockTransactionManager(),
    );

    await localUseCase.execute({
      orderId: 'order-1',
      requesterId: 'buyer-1',
      requesterRole: 'user',
    });

    const updatedProduct = productRepo._store.get('product-1');
    expect(updatedProduct?.stock).toBe(10); // 8 + 2 (quantity from fixture)
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

  it('lanza ForbiddenError y no actualiza el repositorio', async () => {
    await useCase
      .execute({
        orderId: 'order-1',
        requesterId: 'buyer-otro',
        requesterRole: 'user',
      })
      .catch(() => {});

    expect(repo.updatedOrders).toHaveLength(0);
  });

  it('lanza AppError ORDER_INVALID_TRANSITION si la orden ya está CANCELLED', async () => {
    const ordenCancelada = makeOrderWithStatus('CANCELLED', {
      id: 'order-cancelled',
    });
    repo._store.set('order-cancelled', ordenCancelada);

    await expect(
      useCase.execute({
        orderId: 'order-cancelled',
        requesterId: 'buyer-1',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'ORDER_INVALID_TRANSITION' }),
    );
  });

  it('lanza NotFoundError antes que ForbiddenError cuando la orden no existe', async () => {
    await expect(
      useCase.execute({
        orderId: 'no-existe',
        requesterId: 'buyer-otro',
        requesterRole: 'user',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
