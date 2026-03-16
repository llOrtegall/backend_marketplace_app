import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/product/Product';
import type { IProductRepository } from '../../domain/product/ProductRepository';
import { isPrivilegedRole } from '../../domain/user/UserValueObjects';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { ForbiddenError } from '../../shared/errors/AppError';

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
  requesterRole: UserRole;
}

export class CreateProductUseCase {
  constructor(private readonly repo: IProductRepository) {}

  async execute(input: CreateProductDTO): Promise<Product> {
    if (!isPrivilegedRole(input.requesterRole)) {
      throw new ForbiddenError(
        'PRODUCT_FORBIDDEN',
        'Only admin or superadmin can create products',
      );
    }

    const product = Product.create({ id: randomUUID(), ...input });
    await this.repo.save(product);
    return product;
  }
}
