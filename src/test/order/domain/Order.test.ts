import { describe, expect, it } from 'bun:test';
import { Order } from '../../../domain/order/Order';
import { AppError } from '../../../shared/errors/AppError';
import {
  makeOrder,
  makeOrderWithPayment,
  makeOrderWithStatus,
} from '../../helpers/orderFixtures';

describe('Order.create', () => {
  it('crea la orden con status PENDING por defecto', () => {
    const order = Order.create({
      id: 'order-new',
      buyerId: 'buyer-1',
      items: [
        {
          productId: 'p-1',
          productName: 'Producto A',
          unitPrice: 50,
          quantity: 2,
        },
      ],
    });

    expect(order.status).toBe('PENDING');
  });

  it('calcula el total como suma de subtotales de items', () => {
    const order = Order.create({
      id: 'order-new',
      buyerId: 'buyer-1',
      items: [
        {
          productId: 'p-1',
          productName: 'Producto A',
          unitPrice: 100,
          quantity: 2,
        },
        {
          productId: 'p-2',
          productName: 'Producto B',
          unitPrice: 50,
          quantity: 3,
        },
      ],
    });

    // 100*2 + 50*3 = 200 + 150 = 350
    expect(order.total).toBe(350);
  });

  it('crea la orden con paymentId null', () => {
    const order = Order.create({
      id: 'order-new',
      buyerId: 'buyer-1',
      items: [
        {
          productId: 'p-1',
          productName: 'Producto A',
          unitPrice: 10,
          quantity: 1,
        },
      ],
    });

    expect(order.paymentId).toBeNull();
  });

  it('asigna el buyerId correctamente', () => {
    const order = Order.create({
      id: 'order-new',
      buyerId: 'buyer-42',
      items: [
        {
          productId: 'p-1',
          productName: 'Producto A',
          unitPrice: 10,
          quantity: 1,
        },
      ],
    });

    expect(order.buyerId).toBe('buyer-42');
  });

  it('redondea el total a 2 decimales', () => {
    const order = Order.create({
      id: 'order-new',
      buyerId: 'buyer-1',
      items: [
        {
          productId: 'p-1',
          productName: 'Producto A',
          unitPrice: 10.1,
          quantity: 3,
        },
      ],
    });

    expect(order.total).toBe(30.3);
  });
});

describe('Order.transitionTo', () => {
  it('permite transición PENDING -> AWAITING_PAYMENT', () => {
    const order = makeOrderWithStatus('PENDING');
    const updated = order.transitionTo('AWAITING_PAYMENT');

    expect(updated.status).toBe('AWAITING_PAYMENT');
  });

  it('permite transición PENDING -> CANCELLED', () => {
    const order = makeOrderWithStatus('PENDING');
    const updated = order.transitionTo('CANCELLED');

    expect(updated.status).toBe('CANCELLED');
  });

  it('permite transición AWAITING_PAYMENT -> CONFIRMED', () => {
    const order = makeOrderWithStatus('AWAITING_PAYMENT');
    const updated = order.transitionTo('CONFIRMED');

    expect(updated.status).toBe('CONFIRMED');
  });

  it('permite transición AWAITING_PAYMENT -> CANCELLED', () => {
    const order = makeOrderWithStatus('AWAITING_PAYMENT');
    const updated = order.transitionTo('CANCELLED');

    expect(updated.status).toBe('CANCELLED');
  });

  it('lanza AppError ORDER_INVALID_TRANSITION desde CONFIRMED', () => {
    const order = makeOrderWithStatus('CONFIRMED');

    expect(() => order.transitionTo('CANCELLED')).toThrow(
      expect.objectContaining({
        code: 'ORDER_INVALID_TRANSITION',
        statusCode: 422,
      }),
    );
  });

  it('lanza AppError ORDER_INVALID_TRANSITION desde CANCELLED', () => {
    const order = makeOrderWithStatus('CANCELLED');

    expect(() => order.transitionTo('CONFIRMED')).toThrow(
      expect.objectContaining({
        code: 'ORDER_INVALID_TRANSITION',
        statusCode: 422,
      }),
    );
  });

  it('lanza AppError al intentar PENDING -> CONFIRMED directamente', () => {
    const order = makeOrderWithStatus('PENDING');

    expect(() => order.transitionTo('CONFIRMED')).toThrow(AppError);
  });

  it('no muta la orden original', () => {
    const order = makeOrderWithStatus('PENDING');
    order.transitionTo('AWAITING_PAYMENT');

    expect(order.status).toBe('PENDING');
  });
});

describe('Order.cancel', () => {
  it('transiciona a CANCELLED desde PENDING', () => {
    const order = makeOrderWithStatus('PENDING');
    const cancelled = order.cancel();

    expect(cancelled.status).toBe('CANCELLED');
  });

  it('transiciona a CANCELLED desde AWAITING_PAYMENT', () => {
    const order = makeOrderWithStatus('AWAITING_PAYMENT');
    const cancelled = order.cancel();

    expect(cancelled.status).toBe('CANCELLED');
  });

  it('lanza AppError si la orden ya está CANCELLED', () => {
    const order = makeOrderWithStatus('CANCELLED');

    expect(() => order.cancel()).toThrow(AppError);
  });
});

describe('Order.confirm', () => {
  it('transiciona a CONFIRMED desde AWAITING_PAYMENT', () => {
    const order = makeOrderWithStatus('AWAITING_PAYMENT');
    const confirmed = order.confirm();

    expect(confirmed.status).toBe('CONFIRMED');
  });

  it('lanza AppError si se intenta confirmar desde PENDING', () => {
    const order = makeOrderWithStatus('PENDING');

    expect(() => order.confirm()).toThrow(AppError);
  });
});

describe('Order.linkPayment', () => {
  it('vincula un paymentId cuando no tiene uno previo', () => {
    const order = makeOrder();
    const linked = order.linkPayment('payment-99');

    expect(linked.paymentId).toBe('payment-99');
  });

  it('lanza AppError ORDER_PAYMENT_ALREADY_LINKED si ya tiene paymentId', () => {
    const order = makeOrderWithPayment('payment-1');

    expect(() => order.linkPayment('payment-2')).toThrow(
      expect.objectContaining({
        code: 'ORDER_PAYMENT_ALREADY_LINKED',
        statusCode: 422,
      }),
    );
  });

  it('no muta la orden original al vincular', () => {
    const order = makeOrder();
    order.linkPayment('payment-99');

    expect(order.paymentId).toBeNull();
  });
});

describe('Order.isOwnedBy', () => {
  it('retorna true cuando buyerId coincide', () => {
    const order = makeOrder({ buyerId: 'buyer-1' });
    expect(order.isOwnedBy('buyer-1')).toBe(true);
  });

  it('retorna false cuando buyerId no coincide', () => {
    const order = makeOrder({ buyerId: 'buyer-1' });
    expect(order.isOwnedBy('buyer-2')).toBe(false);
  });

  it('retorna false con string vacío', () => {
    const order = makeOrder({ buyerId: 'buyer-1' });
    expect(order.isOwnedBy('')).toBe(false);
  });
});
