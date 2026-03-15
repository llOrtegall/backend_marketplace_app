import { beforeEach, describe, expect, it } from 'bun:test';
import { ListOrdersUseCase } from '../../../application/order/listOrders.usecase';
import {
  createMockOrderRepository,
  type MockOrderRepository,
} from '../../helpers/mockRepositories';
import { makeOrder, makeOrderWithStatus } from '../../helpers/orderFixtures';
import { Money } from '../../../domain/order/OrderValueObjects';

describe('ListOrdersUseCase', () => {
  let repo: MockOrderRepository;
  let useCase: ListOrdersUseCase;

  const ordenBuyer1Pending = makeOrder({ id: 'order-1', buyerId: 'buyer-1' });
  const ordenBuyer1Confirmed = makeOrderWithStatus('CONFIRMED', {
    id: 'order-2',
    buyerId: 'buyer-1',
    total: Money.fromPersistence(500),
  });
  const ordenBuyer2Pending = makeOrder({
    id: 'order-3',
    buyerId: 'buyer-2',
    total: Money.fromPersistence(300),
  });

  beforeEach(() => {
    repo = createMockOrderRepository([
      ordenBuyer1Pending,
      ordenBuyer1Confirmed,
      ordenBuyer2Pending,
    ]);
    useCase = new ListOrdersUseCase(repo);
  });

  it('un user solo ve sus propias órdenes', async () => {
    const result = await useCase.execute({
      requesterId: 'buyer-1',
      requesterRole: 'user',
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items.every((o) => o.buyerId === 'buyer-1')).toBe(true);
  });

  it('un admin ve todas las órdenes', async () => {
    const result = await useCase.execute({
      requesterId: 'admin-1',
      requesterRole: 'admin',
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(3);
  });

  it('un superadmin ve todas las órdenes', async () => {
    const result = await useCase.execute({
      requesterId: 'superadmin-1',
      requesterRole: 'superadmin',
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(3);
  });

  it('filtra por status cuando se proporciona', async () => {
    const result = await useCase.execute({
      requesterId: 'admin-1',
      requesterRole: 'admin',
      status: 'CONFIRMED',
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items.at(0)?.status).toBe('CONFIRMED');
  });

  it('un user puede filtrar sus propias órdenes por status', async () => {
    const result = await useCase.execute({
      requesterId: 'buyer-1',
      requesterRole: 'user',
      status: 'PENDING',
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items.at(0)?.status).toBe('PENDING');
    expect(result.items.at(0)?.buyerId).toBe('buyer-1');
  });

  it('retorna PaginatedResult con campos correctos', async () => {
    const result = await useCase.execute({
      requesterId: 'admin-1',
      requesterRole: 'admin',
      page: 1,
      limit: 10,
    });

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('totalPages');
  });

  it('aplica paginación correctamente', async () => {
    const result = await useCase.execute({
      requesterId: 'admin-1',
      requesterRole: 'admin',
      page: 1,
      limit: 2,
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
  });

  it('retorna página 2 correctamente', async () => {
    const result = await useCase.execute({
      requesterId: 'admin-1',
      requesterRole: 'admin',
      page: 2,
      limit: 2,
    });

    expect(result.items).toHaveLength(1);
    expect(result.page).toBe(2);
  });

  it('retorna lista vacía si el user no tiene órdenes', async () => {
    const result = await useCase.execute({
      requesterId: 'buyer-sin-ordenes',
      requesterRole: 'user',
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
