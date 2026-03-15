import type { ClientSession } from 'mongoose';
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

export interface ProductRepository {
  findById(id: string, session?: ClientSession): Promise<Product | null>;
  findAll(
    filters: ProductFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<void>;
  update(product: Product, session?: ClientSession): Promise<void>;
}
