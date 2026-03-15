import type { Product, UpdateProductInput } from '../../domain/product/Product';
import type { IProductRepository } from '../../domain/product/ProductRepository';
import { isPrivilegedRole } from '../../domain/user/UserValueObjects';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

export interface UpdateProductDTO extends UpdateProductInput {
  productId: string;
  requesterId: string;
  requesterRole: UserRole;
}

export class UpdateProductUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(input: UpdateProductDTO): Promise<Product> {
    const product = await this.repo.findById(input.productId);
    if (!product || product.status === 'deleted') {
      throw new NotFoundError('PRODUCT_NOT_FOUND', 'Product not found');
    }

    const isPrivileged = isPrivilegedRole(input.requesterRole);
    if (!product.isOwnedBy(input.requesterId) && !isPrivileged) {
      throw new ForbiddenError(
        'PRODUCT_FORBIDDEN',
        'You are not the owner of this product',
      );
    }

    const {
      productId: _pid,
      requesterId: _rid,
      requesterRole: _role,
      ...changes
    } = input;
    const updated = product.update(changes);
    await this.repo.update(updated);
    return updated;
  }
}
