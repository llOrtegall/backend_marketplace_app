import { beforeEach, describe, expect, it } from 'bun:test';
import { CreateOrderUseCase } from '../../../application/order/createOrder.usecase';
import { NotFoundError } from '../../../shared/errors/AppError';
import {
  createMockOrderRepository,
  createMockProductRepository,
  type MockOrderRepository,
  type MockProductRepository,
} from '../../helpers/mockRepositories';
import {
  makeProduct,
  makeInactiveProduct,
} from '../../helpers/productFixtures';
import { Price, Stock } from '../../../domain/product/ProductValueObjects';

describe('CreateOrderUseCase', () => {
  let orderRepo: MockOrderRepository;
  let productRepo: MockProductRepository;
  let useCase: CreateOrderUseCase;

  const productActivo = makeProduct({
    id: 'product-1',
    name: 'Laptop Pro',
    price: Price.create(1299.99),
    stock: Stock.create(10),
    status: 'active',
  });

  beforeEach(() => {
    orderRepo = createMockOrderRepository();
    productRepo = createMockProductRepository([productActivo]);
    useCase = new CreateOrderUseCase(orderRepo, productRepo);
  });

  it('crea una orden con status PENDING', async () => {
    const order = await useCase.execute({
      buyerId: 'buyer-1',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(order.status).toBe('PENDING');
  });

  it('persiste la orden en el repositorio', async () => {
    await useCase.execute({
      buyerId: 'buyer-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    expect(orderRepo.savedOrders).toHaveLength(1);
  });

  it('asigna un id UUID v4 no vacío', async () => {
    const order = await useCase.execute({
      buyerId: 'buyer-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    expect(order.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('calcula el total en base al precio del producto y la cantidad', async () => {
    const order = await useCase.execute({
      buyerId: 'buyer-1',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    expect(order.total).toBe(2599.98);
  });

  it('genera ids únicos en cada ejecución', async () => {
    const o1 = await useCase.execute({
      buyerId: 'buyer-1',
      items: [{ productId: 'product-1', quantity: 1 }],
    });
    const o2 = await useCase.execute({
      buyerId: 'buyer-2',
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    expect(o1.id).not.toBe(o2.id);
  });

  it('lanza UnprocessableError ORDER_EMPTY si items está vacío', async () => {
    await expect(
      useCase.execute({ buyerId: 'buyer-1', items: [] }),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'ORDER_EMPTY', statusCode: 422 }),
    );
  });

  it('lanza NotFoundError PRODUCT_NOT_FOUND si el producto no existe', async () => {
    await expect(
      useCase.execute({
        buyerId: 'buyer-1',
        items: [{ productId: 'producto-inexistente', quantity: 1 }],
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'PRODUCT_NOT_FOUND', statusCode: 404 }),
    );
  });

  it('lanza NotFoundError si el producto está inactivo', async () => {
    const productoInactivo = makeInactiveProduct({ id: 'product-inactive' });
    productRepo._store.set('product-inactive', productoInactivo);

    await expect(
      useCase.execute({
        buyerId: 'buyer-1',
        items: [{ productId: 'product-inactive', quantity: 1 }],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('lanza UnprocessableError INSUFFICIENT_STOCK si no hay stock suficiente', async () => {
    const productoPocoStock = makeProduct({
      id: 'product-low',
      stock: Stock.create(1),
      status: 'active',
    });
    productRepo._store.set('product-low', productoPocoStock);

    await expect(
      useCase.execute({
        buyerId: 'buyer-1',
        items: [{ productId: 'product-low', quantity: 5 }],
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: 'INSUFFICIENT_STOCK', statusCode: 422 }),
    );
  });

  it('no persiste nada si el input es inválido', async () => {
    await useCase.execute({ buyerId: 'buyer-1', items: [] }).catch(() => {});

    expect(orderRepo.savedOrders).toHaveLength(0);
  });
});
