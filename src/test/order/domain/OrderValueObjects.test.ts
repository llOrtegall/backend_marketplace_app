import { describe, expect, it } from 'bun:test';
import {
  Money,
  OrderItem,
  Quantity,
} from '../../../domain/order/OrderValueObjects';
import { UnprocessableError } from '../../../shared/errors/AppError';

describe('Money.create', () => {
  it('crea un Money con valor positivo válido', () => {
    const money = Money.create(100);
    expect(money.value).toBe(100);
  });

  it('acepta valores con hasta 2 decimales', () => {
    const money = Money.create(99.99);
    expect(money.value).toBe(99.99);
  });

  it('acepta valor con 1 decimal', () => {
    const money = Money.create(10.5);
    expect(money.value).toBe(10.5);
  });

  it('lanza UnprocessableError si el valor es 0', () => {
    expect(() => Money.create(0)).toThrow(
      expect.objectContaining({
        code: 'ORDER_INVALID_AMOUNT',
        statusCode: 422,
      }),
    );
  });

  it('lanza UnprocessableError si el valor es negativo', () => {
    expect(() => Money.create(-1)).toThrow(UnprocessableError);
  });

  it('lanza UnprocessableError si tiene más de 2 decimales', () => {
    expect(() => Money.create(10.123)).toThrow(
      expect.objectContaining({
        code: 'ORDER_INVALID_AMOUNT',
      }),
    );
  });

  it('lanza UnprocessableError con valor muy pequeño negativo', () => {
    expect(() => Money.create(-0.01)).toThrow(UnprocessableError);
  });
});

describe('Money.fromPersistence', () => {
  it('crea Money sin validaciones desde persistencia', () => {
    const money = Money.fromPersistence(0);
    expect(money.value).toBe(0);
  });

  it('acepta valores negativos desde persistencia', () => {
    const money = Money.fromPersistence(-5);
    expect(money.value).toBe(-5);
  });
});

describe('Quantity.create', () => {
  it('crea una Quantity con entero positivo', () => {
    const qty = Quantity.create(5);
    expect(qty.value).toBe(5);
  });

  it('acepta 1 como valor mínimo válido', () => {
    const qty = Quantity.create(1);
    expect(qty.value).toBe(1);
  });

  it('lanza UnprocessableError si el valor es 0', () => {
    expect(() => Quantity.create(0)).toThrow(
      expect.objectContaining({
        code: 'ORDER_INVALID_QUANTITY',
        statusCode: 422,
      }),
    );
  });

  it('lanza UnprocessableError si el valor es negativo', () => {
    expect(() => Quantity.create(-1)).toThrow(UnprocessableError);
  });

  it('lanza UnprocessableError si el valor no es entero', () => {
    expect(() => Quantity.create(2.5)).toThrow(
      expect.objectContaining({
        code: 'ORDER_INVALID_QUANTITY',
      }),
    );
  });

  it('lanza UnprocessableError con 0.1', () => {
    expect(() => Quantity.create(0.1)).toThrow(UnprocessableError);
  });
});

describe('OrderItem.create', () => {
  it('crea un OrderItem con subtotal calculado correctamente', () => {
    const item = OrderItem.create({
      productId: 'p-1',
      productName: 'Producto',
      unitPrice: 50,
      quantity: 3,
    });

    expect(item.subtotal).toBe(150);
  });

  it('asigna los campos productId y productName correctamente', () => {
    const item = OrderItem.create({
      productId: 'p-42',
      productName: 'Laptop Pro',
      unitPrice: 999.99,
      quantity: 1,
    });

    expect(item.productId).toBe('p-42');
    expect(item.productName).toBe('Laptop Pro');
    expect(item.unitPrice).toBe(999.99);
    expect(item.quantity).toBe(1);
  });

  it('calcula subtotal con decimales correctamente (redondeado a 2 lugares)', () => {
    const item = OrderItem.create({
      productId: 'p-1',
      productName: 'Producto',
      unitPrice: 10.1,
      quantity: 3,
    });

    expect(item.subtotal).toBe(30.3);
  });

  it('lanza UnprocessableError si unitPrice es 0', () => {
    expect(() =>
      OrderItem.create({
        productId: 'p-1',
        productName: 'Producto',
        unitPrice: 0,
        quantity: 1,
      }),
    ).toThrow(UnprocessableError);
  });

  it('lanza UnprocessableError si unitPrice es negativo', () => {
    expect(() =>
      OrderItem.create({
        productId: 'p-1',
        productName: 'Producto',
        unitPrice: -10,
        quantity: 1,
      }),
    ).toThrow(UnprocessableError);
  });

  it('lanza UnprocessableError si quantity es 0', () => {
    expect(() =>
      OrderItem.create({
        productId: 'p-1',
        productName: 'Producto',
        unitPrice: 10,
        quantity: 0,
      }),
    ).toThrow(UnprocessableError);
  });

  it('lanza UnprocessableError si quantity no es entero', () => {
    expect(() =>
      OrderItem.create({
        productId: 'p-1',
        productName: 'Producto',
        unitPrice: 10,
        quantity: 1.5,
      }),
    ).toThrow(UnprocessableError);
  });
});
