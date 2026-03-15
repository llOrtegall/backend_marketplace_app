import { beforeEach, describe, expect, it } from 'bun:test';
import { HandleWompiEventUseCase } from '../../../application/payment/handleWompiEvent.usecase';
import type { ITransactionManager } from '../../../application/shared/ITransactionManager';
import type { WompiTransactionData } from '../../../domain/payment/PaymentGateway';
import type { Product } from '../../../domain/product/Product';
import type {
  IProductRepository,
  PaginatedResult,
  PaginationOptions,
  ProductFilters,
} from '../../../domain/product/ProductRepository';
import { NotFoundError } from '../../../shared/errors/AppError';
import {
  createMockOrderRepository,
  createMockPaymentRepository,
  type MockOrderRepository,
  type MockPaymentRepository,
} from '../../helpers/mockRepositories';
import { makeOrderWithStatus } from '../../helpers/orderFixtures';
import {
  makeApprovedPayment,
  makeDeclinedPayment,
  makePayment,
} from '../../helpers/paymentFixtures';
import { makeProduct } from '../../helpers/productFixtures';
import { Stock } from '../../../domain/product/ProductValueObjects';

// ─── Mock de ITransactionManager ──────────────────────────────────────────────

function createMockTransactionManager(): ITransactionManager {
  return {
    async runInTransaction(fn) {
      return fn(null as unknown);
    },
  };
}

// ─── Mock de ProductRepository (extendido con update y tracking) ──────────────

interface MockProductRepo extends IProductRepository {
  _store: Map<string, Product>;
  updatedProducts: Product[];
}

function createMockProductRepo(seed: Product[] = []): MockProductRepo {
  const store = new Map(seed.map((p) => [p.id, p]));
  const updatedProducts: Product[] = [];

  return {
    _store: store,
    updatedProducts,

    async findById(id) {
      return store.get(id) ?? null;
    },
    async findAll(
      _filters: ProductFilters,
      _pagination: PaginationOptions,
    ): Promise<PaginatedResult<Product>> {
      return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    },
    async save(product) {
      store.set(product.id, product);
    },
    async update(product) {
      store.set(product.id, product);
      updatedProducts.push(product);
    },
  };
}

// ─── Helpers de datos de prueba ───────────────────────────────────────────────

function makeTxData(
  overrides: Partial<WompiTransactionData> = {},
): WompiTransactionData {
  return {
    id: 'wompi-tx-1',
    status: 'APPROVED',
    reference: 'payment-1',
    amount_in_cents: 20000000,
    currency: 'COP',
    payment_method_type: 'CARD',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HandleWompiEventUseCase', () => {
  let paymentRepo: MockPaymentRepository;
  let orderRepo: MockOrderRepository;
  let productRepo: MockProductRepo;
  let txManager: ITransactionManager;
  let useCase: HandleWompiEventUseCase;

  const producto = makeProduct({
    id: 'product-1',
    stock: Stock.create(10),
    status: 'active',
  });

  const orden = makeOrderWithStatus('AWAITING_PAYMENT', {
    id: 'order-1',
    buyerId: 'buyer-1',
  });

  const pago = makePayment({
    id: 'payment-1',
    orderId: 'order-1',
    buyerId: 'buyer-1',
  });

  beforeEach(() => {
    paymentRepo = createMockPaymentRepository([pago]);
    orderRepo = createMockOrderRepository([orden]);
    productRepo = createMockProductRepo([producto]);
    txManager = createMockTransactionManager();
    useCase = new HandleWompiEventUseCase(
      paymentRepo,
      orderRepo,
      productRepo,
      txManager,
    );
  });

  describe('flujo APPROVED', () => {
    it('actualiza el pago a APPROVED', async () => {
      await useCase.execute(
        makeTxData({ status: 'APPROVED', reference: 'payment-1' }),
      );

      const pagoActualizado = paymentRepo._store.get('payment-1');
      expect(pagoActualizado?.status).toBe('APPROVED');
    });

    it('confirma la orden cuando el pago es APPROVED', async () => {
      await useCase.execute(
        makeTxData({ status: 'APPROVED', reference: 'payment-1' }),
      );

      const ordenActualizada = orderRepo._store.get('order-1');
      expect(ordenActualizada?.status).toBe('CONFIRMED');
    });

    it('descuenta el stock de los productos cuando el pago es APPROVED', async () => {
      await useCase.execute(
        makeTxData({ status: 'APPROVED', reference: 'payment-1' }),
      );

      const productoActualizado = productRepo._store.get('product-1');
      // La orden tiene 2 unidades de product-1 (del fixture base de makeOrderWithStatus)
      expect(productoActualizado?.stock).toBeLessThan(10);
    });

    it('llama a update en paymentRepo', async () => {
      await useCase.execute(
        makeTxData({ status: 'APPROVED', reference: 'payment-1' }),
      );

      expect(paymentRepo.updatedPayments).toHaveLength(1);
    });

    it('llama a update en orderRepo', async () => {
      await useCase.execute(
        makeTxData({ status: 'APPROVED', reference: 'payment-1' }),
      );

      expect(orderRepo.updatedOrders).toHaveLength(1);
    });

    it('vincula el wompiTransactionId al pago', async () => {
      await useCase.execute(
        makeTxData({
          id: 'wompi-tx-xyz',
          status: 'APPROVED',
          reference: 'payment-1',
        }),
      );

      const pagoActualizado = paymentRepo._store.get('payment-1');
      expect(pagoActualizado?.wompiTransactionId).toBe('wompi-tx-xyz');
    });
  });

  describe('flujo DECLINED', () => {
    it('actualiza el pago a DECLINED', async () => {
      await useCase.execute(
        makeTxData({ status: 'DECLINED', reference: 'payment-1' }),
      );

      const pagoActualizado = paymentRepo._store.get('payment-1');
      expect(pagoActualizado?.status).toBe('DECLINED');
    });

    it('cancela la orden cuando el pago es DECLINED', async () => {
      await useCase.execute(
        makeTxData({ status: 'DECLINED', reference: 'payment-1' }),
      );

      const ordenActualizada = orderRepo._store.get('order-1');
      expect(ordenActualizada?.status).toBe('CANCELLED');
    });

    it('no descuenta stock cuando el pago es DECLINED', async () => {
      await useCase.execute(
        makeTxData({ status: 'DECLINED', reference: 'payment-1' }),
      );

      const productoActualizado = productRepo._store.get('product-1');
      expect(productoActualizado?.stock).toBe(10);
    });
  });

  describe('flujo VOIDED', () => {
    it('cancela la orden cuando el pago es VOIDED', async () => {
      await useCase.execute(
        makeTxData({ status: 'VOIDED', reference: 'payment-1' }),
      );

      const ordenActualizada = orderRepo._store.get('order-1');
      expect(ordenActualizada?.status).toBe('CANCELLED');
    });
  });

  describe('flujo ERROR', () => {
    it('cancela la orden cuando el pago es ERROR', async () => {
      await useCase.execute(
        makeTxData({ status: 'ERROR', reference: 'payment-1' }),
      );

      const ordenActualizada = orderRepo._store.get('order-1');
      expect(ordenActualizada?.status).toBe('CANCELLED');
    });
  });

  describe('flujo PENDING', () => {
    it('actualiza el pago a PENDING pero no modifica la orden', async () => {
      await useCase.execute(
        makeTxData({ status: 'PENDING', reference: 'payment-1' }),
      );

      const pagoActualizado = paymentRepo._store.get('payment-1');
      expect(pagoActualizado?.status).toBe('PENDING');

      const ordenActualizada = orderRepo._store.get('order-1');
      expect(ordenActualizada?.status).toBe('AWAITING_PAYMENT');
    });
  });

  describe('idempotencia', () => {
    it('no reprocesa un pago ya en estado terminal (APPROVED)', async () => {
      const pagoAprobado = makeApprovedPayment({ id: 'payment-terminal' });
      const ordenConfirmada = makeOrderWithStatus('CONFIRMED', {
        id: 'order-terminal',
        buyerId: 'buyer-1',
      });

      paymentRepo._store.set('payment-terminal', pagoAprobado);
      orderRepo._store.set('order-terminal', ordenConfirmada);

      await useCase.execute(
        makeTxData({ status: 'DECLINED', reference: 'payment-terminal' }),
      );

      // El pago no debe cambiar a DECLINED
      const pagoFinal = paymentRepo._store.get('payment-terminal');
      expect(pagoFinal?.status).toBe('APPROVED');
    });

    it('no actualiza la orden si el pago ya es terminal', async () => {
      const pagoAprobado = makeApprovedPayment({ id: 'payment-terminal' });
      const ordenConfirmada = makeOrderWithStatus('CONFIRMED', {
        id: 'order-terminal',
        buyerId: 'buyer-1',
      });

      paymentRepo._store.set('payment-terminal', pagoAprobado);
      orderRepo._store.set('order-terminal', ordenConfirmada);

      await useCase.execute(
        makeTxData({ status: 'DECLINED', reference: 'payment-terminal' }),
      );

      expect(orderRepo.updatedOrders).toHaveLength(0);
    });

    it('no actualiza paymentRepo si el pago ya es terminal', async () => {
      const pagoDeclinado = makeDeclinedPayment({ id: 'payment-declined' });
      paymentRepo._store.set('payment-declined', pagoDeclinado);

      await useCase.execute(
        makeTxData({ status: 'APPROVED', reference: 'payment-declined' }),
      );

      expect(paymentRepo.updatedPayments).toHaveLength(0);
    });
  });

  describe('errores', () => {
    it('lanza NotFoundError si el pago (txData.reference) no existe', async () => {
      await expect(
        useCase.execute(makeTxData({ reference: 'pago-inexistente' })),
      ).rejects.toThrow(
        expect.objectContaining({ code: 'PAYMENT_NOT_FOUND', statusCode: 404 }),
      );
    });

    it('lanza NotFoundError si la orden asociada al pago no existe', async () => {
      const pagoSinOrden = makePayment({
        id: 'payment-sin-orden',
        orderId: 'orden-inexistente',
      });
      paymentRepo._store.set('payment-sin-orden', pagoSinOrden);

      await expect(
        useCase.execute(makeTxData({ reference: 'payment-sin-orden' })),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
