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
      makeInactiveProduct({ id: 'inactive-1' }),
      makeDeletedProduct({ id: 'deleted-1' }),
    ]);
    useCase = new GetProductUseCase(repo);
  });

  it('retorna producto activo por id', async () => {
    const product = await useCase.execute('active-1');

    expect(product.id).toBe('active-1');
    expect(product.status).toBe('active');
  });

  it("retorna producto inactivo (solo 'deleted' está bloqueado)", async () => {
    const product = await useCase.execute('inactive-1');

    expect(product.status).toBe('inactive');
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
