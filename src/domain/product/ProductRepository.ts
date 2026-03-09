import type { Product } from './Product';
import type { ProductStatus } from './ProductValueObjects';

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
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(
    filters: ProductFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
}
