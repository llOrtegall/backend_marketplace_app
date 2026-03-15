import type { Product } from '../../domain/product/Product';
import type { ProductRepository } from '../../domain/product/ProductRepository';
import { NotFoundError } from '../../shared/errors/AppError';

export class GetProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.repo.findById(id);
    if (!product || product.status === 'deleted') {
      throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');
    }
    return product;
  }
}
