import { beforeEach, describe, expect, it } from 'bun:test';
import { UpdateProductUseCase } from '../../../application/product/updateProduct.usecase';
import { UnprocessableError } from '../../../shared/errors/AppError';
import {
  createMockProductRepository,
  type MockProductRepository,
} from '../../helpers/mockRepositories';
import { makeDeletedProduct, makeProduct } from '../../helpers/productFixtures';

describe('UpdateProductUseCase', () => {
  let repo: MockProductRepository;
  let useCase: UpdateProductUseCase;

  const product = makeProduct({ id: 'product-1', sellerId: 'seller-1' });
  const deletedProduct = makeDeletedProduct({
    id: 'deleted-1',
    sellerId: 'seller-1',
  });

  beforeEach(() => {
    repo = createMockProductRepository([product, deletedProduct]);
    useCase = new UpdateProductUseCase(repo);
  });

  it('owner actualiza nombre del producto', async () => {
    const updated = await useCase.execute({
      productId: 'product-1',
      requesterId: 'seller-1',
      requesterRole: 'user',
      name: 'Nuevo Nombre',
    });

    expect(updated.name).toBe('Nuevo Nombre');
  });

  it('update parcial preserva los campos no modificados', async () => {
    const updated = await useCase.execute({
      productId: 'product-1',
      requesterId: 'seller-1',
      requesterRole: 'user',
      name: 'Nuevo Nombre',
    });

    expect(updated.price).toBe(product.price);
    expect(updated.stock).toBe(product.stock);
    expect(updated.category).toBe(product.category);
  });

  it('persiste el producto actualizado', async () => {
    await useCase.execute({
      productId: 'product-1',
      requesterId: 'seller-1',
      requesterRole: 'user',
      name: 'Actualizado',
    });

    expect(repo.updatedProducts[0]?.name).toBe('Actualizado');
  });

  it('lanza NotFoundError cuando el producto no existe', async () => {
    await expect(
      useCase.execute({
        productId: 'no-existe',
        requesterId: 'seller-1',
        requesterRole: 'user',
        name: 'X',
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', statusCode: 404 });
  });

  it("lanza NotFoundError cuando el producto está 'deleted'", async () => {
    await expect(
      useCase.execute({
        productId: 'deleted-1',
        requesterId: 'seller-1',
        requesterRole: 'user',
        name: 'X',
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', statusCode: 404 });
  });

  it('lanza ForbiddenError PRODUCT_FORBIDDEN cuando el requesterId no es el seller', async () => {
    await expect(
      useCase.execute({
        productId: 'product-1',
        requesterId: 'otro-seller',
        requesterRole: 'user',
        name: 'Hack',
      }),
    ).rejects.toMatchObject({ code: 'PRODUCT_FORBIDDEN', statusCode: 403 });
  });

  it('admin puede actualizar producto que no es suyo', async () => {
    const updated = await useCase.execute({
      productId: 'product-1',
      requesterId: 'admin-user',
      requesterRole: 'admin',
      name: 'Actualizado por Admin',
    });

    expect(updated.name).toBe('Actualizado por Admin');
  });

  it('superadmin puede actualizar producto que no es suyo', async () => {
    const updated = await useCase.execute({
      productId: 'product-1',
      requesterId: 'superadmin-user',
      requesterRole: 'superadmin',
      name: 'Actualizado por SuperAdmin',
    });

    expect(updated.name).toBe('Actualizado por SuperAdmin');
  });

  it('lanza UnprocessableError si el nuevo precio es inválido', async () => {
    await expect(
      useCase.execute({
        productId: 'product-1',
        requesterId: 'seller-1',
        requesterRole: 'user',
        price: -1,
      }),
    ).rejects.toThrow(UnprocessableError);
  });

  it('no persiste nada si el update falla por precio inválido', async () => {
    await useCase
      .execute({
        productId: 'product-1',
        requesterId: 'seller-1',
        requesterRole: 'user',
        price: 0,
      })
      .catch(() => {});

    expect(repo.updatedProducts).toHaveLength(0);
  });
});
