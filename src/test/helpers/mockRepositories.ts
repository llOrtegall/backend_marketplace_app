import type { Order } from '../../domain/order/Order';
import type {
  IOrderRepository,
  OrderFilters,
  OrderPaginationOptions,
} from '../../domain/order/OrderRepository';
import type { Payment } from '../../domain/payment/Payment';
import type { IPaymentRepository } from '../../domain/payment/PaymentRepository';
import type { Product } from '../../domain/product/Product';
import type {
  IProductRepository,
  PaginatedResult,
  PaginationOptions,
  ProductFilters,
} from '../../domain/product/ProductRepository';
import type {
  RefreshTokenData,
  RefreshTokenRepository,
} from '../../domain/user/RefreshTokenRepository';
import type { User } from '../../domain/user/User';
import type {
  IUserRepository,
  UserFilters,
  UserPagination,
} from '../../domain/user/UserRepository';

// ─── User Repository ──────────────────────────────────────────────────────────

export interface MockUserRepository extends IUserRepository {
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

export interface MockProductRepository extends IProductRepository {
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
      if (filters.minPrice !== undefined) {
        const min = filters.minPrice;
        items = items.filter((p) => p.price >= min);
      }
      if (filters.maxPrice !== undefined) {
        const max = filters.maxPrice;
        items = items.filter((p) => p.price <= max);
      }
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

// ─── Order Repository ─────────────────────────────────────────────────────────

export interface MockOrderRepository extends IOrderRepository {
  _store: Map<string, Order>;
  savedOrders: Order[];
  updatedOrders: Order[];
}

export function createMockOrderRepository(
  seed: Order[] = [],
): MockOrderRepository {
  const store = new Map(seed.map((o) => [o.id, o]));
  const savedOrders: Order[] = [];
  const updatedOrders: Order[] = [];

  return {
    _store: store,
    savedOrders,
    updatedOrders,

    async findById(id) {
      return store.get(id) ?? null;
    },
    async findAll(
      filters: OrderFilters,
      pagination: OrderPaginationOptions,
    ): Promise<PaginatedResult<Order>> {
      let items = [...store.values()];
      if (filters.buyerId)
        items = items.filter((o) => o.buyerId === filters.buyerId);
      if (filters.status)
        items = items.filter((o) => o.status === filters.status);
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
    async save(order) {
      store.set(order.id, order);
      savedOrders.push(order);
    },
    async update(order) {
      store.set(order.id, order);
      updatedOrders.push(order);
    },
  };
}

// ─── Payment Repository ───────────────────────────────────────────────────────

export interface MockPaymentRepository extends IPaymentRepository {
  _store: Map<string, Payment>;
  savedPayments: Payment[];
  updatedPayments: Payment[];
}

export function createMockPaymentRepository(
  seed: Payment[] = [],
): MockPaymentRepository {
  const store = new Map(seed.map((p) => [p.id, p]));
  const savedPayments: Payment[] = [];
  const updatedPayments: Payment[] = [];

  return {
    _store: store,
    savedPayments,
    updatedPayments,

    async findById(id) {
      return store.get(id) ?? null;
    },
    async findByOrderId(orderId) {
      return [...store.values()].find((p) => p.orderId === orderId) ?? null;
    },
    async save(payment) {
      store.set(payment.id, payment);
      savedPayments.push(payment);
    },
    async update(payment) {
      store.set(payment.id, payment);
      updatedPayments.push(payment);
    },
  };
}
