import type { ProductRepository } from '../../domain/product/ProductRepository';
import { isPrivilegedRole } from '../../domain/user/UserValueObjects';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

export interface DeleteProductDTO {
  productId: string;
  requesterId: string;
  requesterRole: UserRole;
}

export class DeleteProductUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(input: DeleteProductDTO): Promise<void> {
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

    const deleted = product.softDelete();
    await this.repo.update(deleted);
  }
}
