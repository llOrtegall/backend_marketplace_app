import { Product, type ProductProps } from '../../domain/product/Product';
import {
  Price,
  Stock,
  type ProductStatus,
} from '../../domain/product/ProductValueObjects';

function baseProps(): ProductProps {
  return {
    id: 'product-1',
    name: 'Test Product',
    description: 'A valid product description',
    price: Price.create(99.99),
    stock: Stock.create(10),
    category: 'electronics',
    images: ['https://example.com/img1.jpg'],
    sellerId: 'seller-1',
    status: 'active',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };
}

export function makeProduct(overrides: Partial<ProductProps> = {}): Product {
  return Product.reconstitute({ ...baseProps(), ...overrides });
}

export function makeInactiveProduct(
  overrides: Partial<ProductProps> = {},
): Product {
  return makeProduct({ status: 'inactive', ...overrides });
}

export function makeDeletedProduct(
  overrides: Partial<ProductProps> = {},
): Product {
  return makeProduct({
    status: 'deleted',
    deletedAt: new Date('2025-06-01T00:00:00Z'),
    ...overrides,
  });
}

export function makeProductWithStatus(
  status: ProductStatus,
  overrides: Partial<ProductProps> = {},
): Product {
  return makeProduct({
    status,
    ...(status === 'deleted' && { deletedAt: new Date() }),
    ...overrides,
  });
}
