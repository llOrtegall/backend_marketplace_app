import type { Product } from '../../domain/product/Product';
import type {
  PaginatedResult,
  PaginationOptions,
  ProductFilters,
  ProductRepository,
} from '../../domain/product/ProductRepository';
import type {
  RefreshTokenData,
  RefreshTokenRepository,
} from '../../domain/user/RefreshTokenRepository';
import type { User } from '../../domain/user/User';
import type {
  UserFilters,
  UserPagination,
  UserRepository,
} from '../../domain/user/UserRepository';

// ─── User Repository ──────────────────────────────────────────────────────────

export interface MockUserRepository extends UserRepository {
  _store: Map<string, User>;
  savedUsers: User[];
  updatedUsers: User[];
}

export function createMockUserRepository(
  seed: User[] = [],
): MockUserRepository {
  const store = new Map(seed.map((u) => [u.id, u]));
  const savedUsers: User[] = [];
  const updatedUsers: User[] = [];

  return {
    _store: store,
    savedUsers,
    updatedUsers,

    async findById(id) {
      return store.get(id) ?? null;
    },
    async findByEmail(email) {
      return [...store.values()].find((u) => u.email === email) ?? null;
    },
    async existsByEmail(email) {
      const normalized = email.trim().toLowerCase();
      return [...store.values()].some((u) => u.email === normalized);
    },
    async findAll(
      filters: UserFilters,
      pagination: UserPagination,
    ): Promise<PaginatedResult<User>> {
      let items = [...store.values()];
      if (filters.role) items = items.filter((u) => u.role === filters.role);
      if (filters.status)
        items = items.filter((u) => u.status === filters.status);
      const start = (pagination.page - 1) * pagination.limit;
      const paginated = items.slice(start, start + pagination.limit);
      return {
        items: paginated,
        total: items.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(items.length / pagination.limit),
      };
    },
    async save(user) {
      store.set(user.id, user);
      savedUsers.push(user);
    },
    async update(user) {
      store.set(user.id, user);
      updatedUsers.push(user);
    },
  };
}

// ─── Refresh Token Repository ─────────────────────────────────────────────────

export interface MockRefreshTokenRepository extends RefreshTokenRepository {
  _store: Map<string, RefreshTokenData>;
}

export function createMockRefreshTokenRepository(): MockRefreshTokenRepository {
  const store = new Map<string, RefreshTokenData>();

  return {
    _store: store,
    async save(data) {
      store.set(data.token, data);
    },
    async findAndDelete(token) {
      const entry = store.get(token) ?? null;
      store.delete(token);
      return entry;
    },
    async deleteByToken(token) {
      store.delete(token);
    },
  };
}

// ─── Product Repository ───────────────────────────────────────────────────────

export interface MockProductRepository extends ProductRepository {
  _store: Map<string, Product>;
  savedProducts: Product[];
  updatedProducts: Product[];
}

export function createMockProductRepository(
  seed: Product[] = [],
): MockProductRepository {
  const store = new Map(seed.map((p) => [p.id, p]));
  const savedProducts: Product[] = [];
  const updatedProducts: Product[] = [];

  return {
    _store: store,
    savedProducts,
    updatedProducts,

    async findById(id) {
      return store.get(id) ?? null;
    },
    async findAll(
      filters: ProductFilters,
      pagination: PaginationOptions,
    ): Promise<PaginatedResult<Product>> {
      let items = [...store.values()];
      if (filters.status)
        items = items.filter((p) => p.status === filters.status);
      if (filters.category)
        items = items.filter((p) => p.category === filters.category);
      if (filters.sellerId)
        items = items.filter((p) => p.sellerId === filters.sellerId);
      if (filters.minPrice !== undefined)
        items = items.filter((p) => p.price >= filters.minPrice!);
      if (filters.maxPrice !== undefined)
        items = items.filter((p) => p.price <= filters.maxPrice!);
      const start = (pagination.page - 1) * pagination.limit;
      const paginated = items.slice(start, start + pagination.limit);
      return {
        items: paginated,
        total: items.length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(items.length / pagination.limit),
      };
    },
    async save(product) {
      store.set(product.id, product);
      savedProducts.push(product);
    },
    async update(product) {
      store.set(product.id, product);
      updatedProducts.push(product);
    },
  };
}
