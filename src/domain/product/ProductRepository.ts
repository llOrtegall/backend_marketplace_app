import type { DbSession } from '../shared/DbSession';
import type { PaginatedResult } from '../../shared/types/ApiResponse';
import type { Product } from './Product';
import type { ProductStatus } from './ProductValueObjects';

export type { PaginatedResult };

export interface ProductFilters {
  category?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: 'price' | 'createdAt';
  order: 'asc' | 'desc';
  cursor?: string;
}

export interface IProductRepository {
  findById(id: string, session?: DbSession): Promise<Product | null>;
  findAll(
    filters: ProductFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<void>;
  update(product: Product, session?: DbSession): Promise<void>;
}
