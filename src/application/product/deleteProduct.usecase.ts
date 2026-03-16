import type { IProductRepository } from '../../domain/product/ProductRepository';
import { NotFoundError } from '../../shared/errors/AppError';

export interface DeleteProductDTO {
  productId: string;
  requesterId: string;
}

export class DeleteProductUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(input: DeleteProductDTO): Promise<void> {
    const product = await this.repo.findById(input.productId);
    if (!product || product.status === 'deleted') {
      throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');
    }

    const deleted = product.softDelete();
    await this.repo.update(deleted);
  }
}
