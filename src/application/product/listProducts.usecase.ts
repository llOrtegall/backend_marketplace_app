import type { Product } from '../../domain/product/Product';
import type {
  PaginatedResult,
  PaginationOptions,
  ProductFilters,
  ProductRepository,
} from '../../domain/product/ProductRepository';
import { isPrivilegedRole } from '../../domain/user/UserValueObjects';
import type { UserRole } from '../../domain/user/UserValueObjects';

export interface ListProductsInput {
  filters: ProductFilters;
  pagination: PaginationOptions;
  requesterId?: string;
  requesterRole?: UserRole;
}

export class ListProductsUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(input: ListProductsInput): Promise<PaginatedResult<Product>> {
    const isPrivileged = isPrivilegedRole(input.requesterRole ?? 'user');

    let filters: ProductFilters = { status: 'active', ...input.filters };

    if (input.filters.status === 'inactive') {
      if (isPrivileged) {
        // admin/superadmin can see all inactive products
        filters = { ...input.filters, status: 'inactive' };
      } else if (input.requesterId) {
        // authenticated seller: restrict to their own inactive products
        filters = {
          ...input.filters,
          status: 'inactive',
          sellerId: input.requesterId,
        };
      } else {
        // anonymous: silently fall back to active
        filters = { ...input.filters, status: 'active' };
      }
    }

    return this.repo.findAll(filters, input.pagination);
  }
}
