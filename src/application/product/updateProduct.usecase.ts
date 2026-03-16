import type { Product, UpdateProductInput } from '../../domain/product/Product';
import type { IProductRepository } from '../../domain/product/ProductRepository';
import { NotFoundError } from '../../shared/errors/AppError';

export interface UpdateProductDTO extends UpdateProductInput {
  productId: string;
  requesterId: string;
}

export class UpdateProductUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(input: UpdateProductDTO): Promise<Product> {
    const product = await this.repo.findById(input.productId);
    if (!product || product.status === 'deleted') {
      throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');
    }

    const { productId: _pid, requesterId: _rid, ...changes } = input;
    const updated = product.update(changes);
    await this.repo.update(updated);
    return updated;
  }
}
