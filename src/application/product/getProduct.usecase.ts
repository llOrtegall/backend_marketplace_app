import type { Product } from '../../domain/product/Product';
import type { ProductRepository } from '../../domain/product/ProductRepository';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { NotFoundError } from '../../shared/errors/AppError';

export interface GetProductContext {
  requesterId?: string;
  requesterRole?: UserRole;
}

export class GetProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(id: string, ctx: GetProductContext = {}): Promise<Product> {
    const product = await this.repo.findById(id);
    if (!product || product.status === 'deleted') {
      throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');
    }

    if (product.status === 'inactive') {
      const isOwner =
        ctx.requesterId !== undefined && product.isOwnedBy(ctx.requesterId);
      const isPrivileged =
        ctx.requesterRole === 'admin' || ctx.requesterRole === 'superadmin';
      if (!isOwner && !isPrivileged) {
        throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');
      }
    }

    return product;
  }
}
