import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'bun:test';
import request from 'supertest';
import { createApp } from '../../app';
import { clearDB, startTestDB, stopTestDB } from './setup';

const app = createApp();

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

const buyerData = {
  name: 'Buyer User',
  email: 'buyer@example.com',
  password: 'Password1',
};

const sellerData = {
  name: 'Seller User',
  email: 'seller@example.com',
  password: 'Password1',
};

const otherBuyerData = {
  name: 'Other Buyer',
  email: 'other.buyer@example.com',
  password: 'Password1',
};

const validProduct = {
  name: 'Test Product',
  description: 'A valid product description for testing',
  price: 50.0,
  stock: 10,
  category: 'electronics',
  images: ['https://example.com/img1.jpg'],
};

// ---------------------------------------------------------------------------
// Helpers reutilizables
// ---------------------------------------------------------------------------

async function registerAndLogin(
  userData: { name: string; email: string; password: string } = buyerData,
): Promise<{ accessToken: string; refreshToken: string }> {
  await request(app).post('/api/v1/auth/register').send(userData);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: userData.email, password: userData.password });
  return res.body.data as { accessToken: string; refreshToken: string };
}

async function createProduct(
  accessToken: string,
  overrides: Partial<typeof validProduct> = {},
): Promise<string> {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ ...validProduct, ...overrides });
  return res.body.data.id as string;
}

async function createOrder(
  accessToken: string,
  productId: string,
  quantity = 1,
) {
  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ items: [{ productId, quantity }] });
  return res;
}

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await startTestDB();
});

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await clearDB();
});

// ---------------------------------------------------------------------------
// POST /api/v1/orders
// ---------------------------------------------------------------------------

describe('POST /api/v1/orders', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        items: [
          { productId: '00000000-0000-0000-0000-000000000001', quantity: 1 },
        ],
      });

    expect(res.status).toBe(401);
  });

  it('crea orden exitosamente y retorna 201 con los datos correctos', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const res = await createOrder(buyerToken, productId);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].productId).toBe(productId);
    expect(res.body.data.items[0].quantity).toBe(1);
    expect(res.body.data.total).toBe(50.0);
    expect(res.body.data.paymentId).toBeNull();
    expect(typeof res.body.data.buyerId).toBe('string');
  });

  it('retorna 400 si items está vacío', async () => {
    const { accessToken } = await registerAndLogin(buyerData);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ items: [] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 400 si el body tiene formato incorrecto (items no es array)', async () => {
    const { accessToken } = await registerAndLogin(buyerData);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ items: 'no-es-un-array' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 400 si productId no tiene formato UUID', async () => {
    const { accessToken } = await registerAndLogin(buyerData);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ items: [{ productId: 'id-invalido', quantity: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 404 si el productId no existe', async () => {
    const { accessToken } = await registerAndLogin(buyerData);

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        items: [
          { productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 },
        ],
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('retorna 422 si el stock es insuficiente', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken, { stock: 1 });

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const res = await createOrder(buyerToken, productId, 5);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/orders
// ---------------------------------------------------------------------------

describe('GET /api/v1/orders', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app).get('/api/v1/orders');

    expect(res.status).toBe(401);
  });

  it('retorna las órdenes del usuario autenticado con paginación', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    await createOrder(buyerToken, productId);
    await createOrder(buyerToken, productId);

    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.page).toBe(1);
    expect(typeof res.body.meta.limit).toBe('number');
    expect(typeof res.body.meta.totalPages).toBe('number');
  });

  it('un usuario solo ve sus propias órdenes, no las de otro usuario', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    await createOrder(buyerToken, productId);

    const { accessToken: otherToken } = await registerAndLogin(otherBuyerData);
    await createOrder(otherToken, productId);

    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);

    const otherRes = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(otherRes.status).toBe(200);
    expect(otherRes.body.data).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/orders/:id
// ---------------------------------------------------------------------------

describe('GET /api/v1/orders/:id', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app).get('/api/v1/orders/some-id');

    expect(res.status).toBe(401);
  });

  it('retorna 200 con la orden del usuario autenticado', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const createRes = await createOrder(buyerToken, productId);
    const orderId = createRes.body.data.id as string;

    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(orderId);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('retorna 403 si otro usuario intenta acceder a la orden', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const createRes = await createOrder(buyerToken, productId);
    const orderId = createRes.body.data.id as string;

    const { accessToken: otherToken } = await registerAndLogin(otherBuyerData);
    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORDER_FORBIDDEN');
  });

  it('retorna 404 si la orden no existe', async () => {
    const { accessToken } = await registerAndLogin(buyerData);

    const res = await request(app)
      .get('/api/v1/orders/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/orders/:id/cancel
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/orders/:id/cancel', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app).patch('/api/v1/orders/some-id/cancel');

    expect(res.status).toBe(401);
  });

  it('cancela la orden y retorna 204', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const createRes = await createOrder(buyerToken, productId);
    const orderId = createRes.body.data.id as string;

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 403 si otro usuario intenta cancelar la orden', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const createRes = await createOrder(buyerToken, productId);
    const orderId = createRes.body.data.id as string;

    const { accessToken: otherToken } = await registerAndLogin(otherBuyerData);
    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORDER_FORBIDDEN');
  });

  it('retorna 422 si la orden ya está CANCELLED (doble cancelación)', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const createRes = await createOrder(buyerToken, productId);
    const orderId = createRes.body.data.id as string;

    await request(app)
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`);

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ORDER_INVALID_TRANSITION');
  });
});
