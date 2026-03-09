import { UnprocessableError } from '../../shared/errors/AppError';

export class Price {
  private constructor(readonly value: number) {}

  static create(value: number): Price {
    if (value <= 0) {
      throw new UnprocessableError(
        'PRODUCT_INVALID_PRICE',
        'Price must be greater than 0',
      );
    }
    if (Math.round(value * 100) / 100 !== value) {
      throw new UnprocessableError(
        'PRODUCT_INVALID_PRICE',
        'Price must have at most 2 decimal places',
      );
    }
    return new Price(value);
  }
}

export class Stock {
  private constructor(readonly value: number) {}

  static create(value: number): Stock {
    if (!Number.isInteger(value) || value < 0) {
      throw new UnprocessableError(
        'PRODUCT_INVALID_STOCK',
        'Stock must be a non-negative integer',
      );
    }
    return new Stock(value);
  }
}

export type ProductStatus = 'active' | 'inactive' | 'deleted';

export const VALID_STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> =
  {
    active: ['inactive', 'deleted'],
    inactive: ['active', 'deleted'],
    deleted: [],
  };
