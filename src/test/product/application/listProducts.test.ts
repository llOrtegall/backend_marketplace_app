import { beforeEach, describe, expect, it } from 'bun:test';
import { ListProductsUseCase } from '../../../application/product/listProducts.usecase';
import {
  createMockProductRepository,
  type MockProductRepository,
} from '../../helpers/mockRepositories';
import {
  makeInactiveProduct,
  makeProduct,
} from '../../helpers/productFixtures';

const defaultPagination = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt' as const,
  order: 'desc' as const,
};

describe('ListProductsUseCase', () => {
  let repo: MockProductRepository;
  let useCase: ListProductsUseCase;

  beforeEach(() => {
    repo = createMockProductRepository([
      makeProduct({
        id: 'active-1',
        category: 'electronics',
        sellerId: 'seller-1',
      }),
      makeProduct({ id: 'active-2', category: 'hogar', sellerId: 'seller-2' }),
      makeInactiveProduct({ id: 'inactive-1', sellerId: 'seller-1' }),
    ]);
    useCase = new ListProductsUseCase(repo);
  });

  it("aplica status 'active' por defecto cuando no se pasa filtro de status", async () => {
    const result = await useCase.execute({
      filters: {},
      pagination: defaultPagination,
    });

    expect(result.items.every((p) => p.status === 'active')).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  it('propaga filtros de category al repositorio', async () => {
    const result = await useCase.execute({
      filters: { category: 'electronics' },
      pagination: defaultPagination,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.category).toBe('electronics');
  });

  it('propaga filtros de sellerId al repositorio', async () => {
    const result = await useCase.execute({
      filters: { sellerId: 'seller-1' },
      pagination: defaultPagination,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.sellerId).toBe('seller-1');
  });

  it('retorna paginación correcta en el resultado', async () => {
    const result = await useCase.execute({
      filters: {},
      pagination: { page: 1, limit: 1, sortBy: 'createdAt', order: 'desc' },
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('usuario anónimo no puede ver productos inactivos: se fuerza a active', async () => {
    const result = await useCase.execute({
      filters: { status: 'inactive' },
      pagination: defaultPagination,
    });

    expect(result.items.every((p) => p.status === 'active')).toBe(true);
  });

  it('admin puede ver todos los productos inactivos', async () => {
    const result = await useCase.execute({
      filters: { status: 'inactive' },
      pagination: defaultPagination,
      requesterRole: 'admin',
    });

    expect(result.items.every((p) => p.status === 'inactive')).toBe(true);
    expect(result.items).toHaveLength(1);
  });

  it('user autenticado no puede ver productos inactivos aunque sea seller', async () => {
    const result = await useCase.execute({
      filters: { status: 'inactive' },
      pagination: defaultPagination,
      requesterId: 'seller-1',
      requesterRole: 'user',
    });

    expect(result.items.every((p) => p.status === 'active')).toBe(true);
  });
});
