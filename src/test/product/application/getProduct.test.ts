import { beforeEach, describe, expect, it } from 'bun:test';
import { GetProductUseCase } from '../../../application/product/getProduct.usecase';
import {
  createMockProductRepository,
  type MockProductRepository,
} from '../../helpers/mockRepositories';
import {
  makeDeletedProduct,
  makeInactiveProduct,
  makeProduct,
} from '../../helpers/productFixtures';

describe('GetProductUseCase', () => {
  let repo: MockProductRepository;
  let useCase: GetProductUseCase;

  beforeEach(() => {
    repo = createMockProductRepository([
      makeProduct({ id: 'active-1' }),
      makeInactiveProduct({ id: 'inactive-1', sellerId: 'seller-1' }),
      makeDeletedProduct({ id: 'deleted-1' }),
    ]);
    useCase = new GetProductUseCase(repo);
  });

  it('retorna producto activo por id', async () => {
    const product = await useCase.execute('active-1');

    expect(product.id).toBe('active-1');
    expect(product.status).toBe('active');
  });

  it('lanza NotFoundError cuando producto inactivo se accede sin autenticación', async () => {
    await expect(useCase.execute('inactive-1')).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
      statusCode: 404,
    });
  });

  it('retorna producto inactivo para su propio seller', async () => {
    const product = await useCase.execute('inactive-1', {
      requesterId: 'seller-1',
      requesterRole: 'user',
    });

    expect(product.status).toBe('inactive');
  });

  it('retorna producto inactivo para admin', async () => {
    const product = await useCase.execute('inactive-1', {
      requesterId: 'other-user',
      requesterRole: 'admin',
    });

    expect(product.status).toBe('inactive');
  });

  it('retorna producto inactivo para superadmin', async () => {
    const product = await useCase.execute('inactive-1', {
      requesterRole: 'superadmin',
    });

    expect(product.status).toBe('inactive');
  });

  it('lanza NotFoundError cuando usuario no owner intenta acceder a producto inactivo', async () => {
    await expect(
      useCase.execute('inactive-1', {
        requesterId: 'other-user',
        requesterRole: 'user',
      }),
    ).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
      statusCode: 404,
    });
  });

  it('lanza NotFoundError PRODUCT_NOT_FOUND (404) cuando el id no existe', async () => {
    await expect(useCase.execute('no-existe')).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
      statusCode: 404,
    });
  });

  it("lanza NotFoundError cuando el producto tiene status 'deleted'", async () => {
    await expect(useCase.execute('deleted-1')).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
      statusCode: 404,
    });
  });
});
