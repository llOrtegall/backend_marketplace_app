import { beforeEach, describe, expect, it } from 'bun:test';
import { DeleteProductUseCase } from '../../../application/product/deleteProduct.usecase';
import {
  createMockProductRepository,
  type MockProductRepository,
} from '../../helpers/mockRepositories';
import {
  makeDeletedProduct,
  makeInactiveProduct,
  makeProduct,
} from '../../helpers/productFixtures';

describe('DeleteProductUseCase', () => {
  let repo: MockProductRepository;
  let useCase: DeleteProductUseCase;

  const activeProduct = makeProduct({ id: 'active-1', sellerId: 'seller-1' });
  const inactiveProduct = makeInactiveProduct({
    id: 'inactive-1',
    sellerId: 'seller-1',
  });
  const deletedProduct = makeDeletedProduct({
    id: 'deleted-1',
    sellerId: 'seller-1',
  });

  beforeEach(() => {
    repo = createMockProductRepository([
      activeProduct,
      inactiveProduct,
      deletedProduct,
    ]);
    useCase = new DeleteProductUseCase(repo);
  });

  it("hace soft delete de producto activo (status → 'deleted')", async () => {
    await useCase.execute({ productId: 'active-1', requesterId: 'seller-1' });

    const updated = repo.updatedProducts[0];
    expect(updated?.status).toBe('deleted');
  });

  it('popula deletedAt al hacer el soft delete', async () => {
    await useCase.execute({ productId: 'active-1', requesterId: 'seller-1' });

    const updated = repo.updatedProducts[0];
    expect(updated?.deletedAt).toBeInstanceOf(Date);
  });

  it("permite soft delete desde 'inactive' (transición válida)", async () => {
    await useCase.execute({ productId: 'inactive-1', requesterId: 'seller-1' });

    const updated = repo.updatedProducts[0];
    expect(updated?.status).toBe('deleted');
  });

  it('no retorna nada (void)', async () => {
    const result = await useCase.execute({
      productId: 'active-1',
      requesterId: 'seller-1',
    });

    expect(result).toBeUndefined();
  });

  it('lanza NotFoundError cuando el producto no existe', async () => {
    await expect(
      useCase.execute({ productId: 'no-existe', requesterId: 'seller-1' }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', statusCode: 404 });
  });

  it("lanza NotFoundError cuando el producto ya está 'deleted'", async () => {
    await expect(
      useCase.execute({ productId: 'deleted-1', requesterId: 'seller-1' }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', statusCode: 404 });
  });

  it('lanza ForbiddenError PRODUCT_FORBIDDEN cuando el requesterId no es el seller', async () => {
    await expect(
      useCase.execute({ productId: 'active-1', requesterId: 'otro-seller' }),
    ).rejects.toMatchObject({ code: 'PRODUCT_FORBIDDEN', statusCode: 403 });
  });
});
