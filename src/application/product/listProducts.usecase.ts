import type { Product } from '../../domain/product/Product';
import type {
  PaginatedResult,
  PaginationOptions,
  ProductFilters,
  ProductRepository,
} from '../../domain/product/ProductRepository';

export interface ListProductsInput {
  filters: ProductFilters;
  pagination: PaginationOptions;
}

export class ListProductsUseCase {
  constructor(private readonly repo: ProductRepository) {}

  async execute(input: ListProductsInput): Promise<PaginatedResult<Product>> {
    const filters: ProductFilters = {
      status: 'active',
      ...input.filters,
    };
    return this.repo.findAll(filters, input.pagination);
  }
}
