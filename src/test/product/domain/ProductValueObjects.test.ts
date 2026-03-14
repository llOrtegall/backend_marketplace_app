import { describe, expect, it } from 'bun:test';
import {
  Price,
  Stock,
  VALID_STATUS_TRANSITIONS,
} from '../../../domain/product/ProductValueObjects';
import { UnprocessableError } from '../../../shared/errors/AppError';

describe('Price.create', () => {
  it('crea precio con 2 decimales', () => {
    const price = Price.create(99.99);
    expect(price.value).toBe(99.99);
  });

  it('crea precio entero', () => {
    const price = Price.create(100);
    expect(price.value).toBe(100);
  });

  it('crea precio con 1 decimal', () => {
    const price = Price.create(9.9);
    expect(price.value).toBe(9.9);
  });

  it('lanza UnprocessableError PRODUCT_INVALID_PRICE cuando precio es 0', () => {
    expect(() => Price.create(0)).toThrow(
      expect.objectContaining({
        code: 'PRODUCT_INVALID_PRICE',
        statusCode: 422,
      }),
    );
  });

  it('lanza UnprocessableError PRODUCT_INVALID_PRICE cuando precio es negativo', () => {
    expect(() => Price.create(-1)).toThrow(
      expect.objectContaining({ code: 'PRODUCT_INVALID_PRICE' }),
    );
  });

  it('lanza UnprocessableError PRODUCT_INVALID_PRICE con más de 2 decimales', () => {
    expect(() => Price.create(1.999)).toThrow(
      expect.objectContaining({ code: 'PRODUCT_INVALID_PRICE' }),
    );
  });
});

describe('Stock.create', () => {
  it('crea stock 0 (límite inferior permitido)', () => {
    const stock = Stock.create(0);
    expect(stock.value).toBe(0);
  });

  it('crea stock positivo entero', () => {
    const stock = Stock.create(100);
    expect(stock.value).toBe(100);
  });

  it('lanza UnprocessableError PRODUCT_INVALID_STOCK cuando stock es negativo', () => {
    expect(() => Stock.create(-1)).toThrow(
      expect.objectContaining({
        code: 'PRODUCT_INVALID_STOCK',
        statusCode: 422,
      }),
    );
  });

  it('lanza UnprocessableError PRODUCT_INVALID_STOCK cuando stock es decimal', () => {
    expect(() => Stock.create(1.5)).toThrow(
      expect.objectContaining({ code: 'PRODUCT_INVALID_STOCK' }),
    );
  });
});

describe('VALID_STATUS_TRANSITIONS', () => {
  it('active puede transicionar a inactive y deleted', () => {
    expect(VALID_STATUS_TRANSITIONS.active).toContain('inactive');
    expect(VALID_STATUS_TRANSITIONS.active).toContain('deleted');
  });

  it('inactive puede transicionar a active y deleted', () => {
    expect(VALID_STATUS_TRANSITIONS.inactive).toContain('active');
    expect(VALID_STATUS_TRANSITIONS.inactive).toContain('deleted');
  });

  it('deleted no puede transicionar a ningún estado', () => {
    expect(VALID_STATUS_TRANSITIONS.deleted).toHaveLength(0);
  });
});
