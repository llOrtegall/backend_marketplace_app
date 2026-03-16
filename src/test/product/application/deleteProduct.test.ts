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

  it("admin hace soft delete de producto activo (status → 'deleted')", async () => {
    await useCase.execute({
      productId: 'active-1',
      requesterId: 'seller-1',
      requesterRole: 'admin',
    });

    const updated = repo.updatedProducts[0];
    expect(updated?.status).toBe('deleted');
  });

  it('popula deletedAt cuando un admin hace soft delete', async () => {
    await useCase.execute({
      productId: 'active-1',
      requesterId: 'seller-1',
      requesterRole: 'admin',
    });

    const updated = repo.updatedProducts[0];
    expect(updated?.deletedAt).toBeInstanceOf(Date);
  });

  it("permite a un admin hacer soft delete desde 'inactive'", async () => {
    await useCase.execute({
      productId: 'inactive-1',
      requesterId: 'seller-1',
      requesterRole: 'admin',
    });

    const updated = repo.updatedProducts[0];
    expect(updated?.status).toBe('deleted');
  });

  it('retorna void cuando un admin elimina el producto', async () => {
    const result = await useCase.execute({
      productId: 'active-1',
      requesterId: 'seller-1',
      requesterRole: 'admin',
    });

    expect(result).toBeUndefined();
  });

  it('lanza NotFoundError cuando el producto no existe', async () => {
    await expect(
      useCase.execute({
        productId: 'no-existe',
        requesterId: 'seller-1',
        requesterRole: 'admin',
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', statusCode: 404 });
  });

  it("lanza NotFoundError cuando el producto ya está 'deleted'", async () => {
    await expect(
      useCase.execute({
        productId: 'deleted-1',
        requesterId: 'seller-1',
        requesterRole: 'admin',
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', statusCode: 404 });
  });

  it('lanza ForbiddenError PRODUCT_FORBIDDEN cuando el requester no es admin ni superadmin', async () => {
    await expect(
      useCase.execute({
        productId: 'active-1',
        requesterId: 'otro-seller',
        requesterRole: 'user',
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_FORBIDDEN', statusCode: 403 });
  });

  it('admin puede hacer soft delete de un producto que no es suyo', async () => {
    await useCase.execute({
      productId: 'active-1',
      requesterId: 'admin-user',
      requesterRole: 'admin',
    });

    const updated = repo.updatedProducts[0];
    expect(updated?.status).toBe('deleted');
  });

  it('superadmin puede hacer soft delete de un producto que no es suyo', async () => {
    await useCase.execute({
      productId: 'inactive-1',
      requesterId: 'superadmin-user',
      requesterRole: 'superadmin',
    });

    const updated = repo.updatedProducts[0];
    expect(updated?.status).toBe('deleted');
  });
});
