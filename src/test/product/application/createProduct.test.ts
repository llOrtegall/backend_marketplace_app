import { beforeEach, describe, expect, it } from 'bun:test';
import { CreateProductUseCase } from '../../../application/product/createProduct.usecase';
import { UnprocessableError } from '../../../shared/errors/AppError';
import {
  createMockProductRepository,
  type MockProductRepository,
} from '../../helpers/mockRepositories';

describe('CreateProductUseCase', () => {
  let repo: MockProductRepository;
  let useCase: CreateProductUseCase;

  const validInput = {
    name: 'Laptop Pro',
    description: 'High performance laptop',
    price: 1299.99,
    stock: 5,
    category: 'electronics',
    images: ['https://example.com/img.jpg'],
    sellerId: 'seller-1',
  };

  beforeEach(() => {
    repo = createMockProductRepository();
    useCase = new CreateProductUseCase(repo);
  });

  it("crea producto con status 'active'", async () => {
    const product = await useCase.execute(validInput);

    expect(product.status).toBe('active');
  });

  it('persiste el producto en el repositorio', async () => {
    await useCase.execute(validInput);

    expect(repo.savedProducts).toHaveLength(1);
  });

  it('asigna un id UUID v4 no vacío', async () => {
    const product = await useCase.execute(validInput);

    expect(product.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('genera ids únicos por cada creación', async () => {
    const p1 = await useCase.execute({ ...validInput, name: 'P1' });
    const p2 = await useCase.execute({ ...validInput, name: 'P2' });

    expect(p1.id).not.toBe(p2.id);
  });

  it('permite stock 0', async () => {
    const product = await useCase.execute({ ...validInput, stock: 0 });

    expect(product.stock).toBe(0);
  });

  it('lanza UnprocessableError cuando precio es 0', async () => {
    await expect(useCase.execute({ ...validInput, price: 0 })).rejects.toThrow(
      UnprocessableError,
    );
  });

  it('lanza UnprocessableError cuando precio es negativo', async () => {
    await expect(
      useCase.execute({ ...validInput, price: -50 }),
    ).rejects.toThrow(UnprocessableError);
  });

  it('lanza UnprocessableError cuando stock es negativo', async () => {
    await expect(useCase.execute({ ...validInput, stock: -1 })).rejects.toThrow(
      UnprocessableError,
    );
  });

  it('no persiste nada si el input es inválido', async () => {
    await useCase.execute({ ...validInput, price: -1 }).catch(() => {});

    expect(repo.savedProducts).toHaveLength(0);
  });
});
