import { createHash } from 'node:crypto';
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
import type {
  WompiTransactionData,
  WompiWebhookPayload,
} from '../../domain/payment/PaymentGateway';
import { clearDB, startTestDB, stopTestDB } from './setup';

const app = createApp();

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

const sellerData = {
  name: 'Seller User',
  email: 'seller.pay@example.com',
  password: 'Password1',
};

const buyerData = {
  name: 'Buyer User',
  email: 'buyer.pay@example.com',
  password: 'Password1',
};

const otherBuyerData = {
  name: 'Other Buyer',
  email: 'other.pay@example.com',
  password: 'Password1',
};

const validProduct = {
  name: 'Pay Test Product',
  description: 'A product used for payment E2E tests',
  price: 50000,
  stock: 10,
  category: 'electronics',
  images: ['https://example.com/img1.jpg'],
};

const WOMPI_EVENTS_SECRET = 'test_events_secret_32chars_ok_xx';

const MOCK_WOMPI_TX_ID = 'wompi-tx-e2e-test-001';
const MOCK_REDIRECT_URL = 'https://checkout.wompi.co/l/test-redirect';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerAndLogin(userData: {
  name: string;
  email: string;
  password: string;
}): Promise<{ accessToken: string }> {
  await request(app).post('/api/v1/auth/register').send(userData);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: userData.email, password: userData.password });
  return res.body.data as { accessToken: string };
}

async function createProduct(accessToken: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(validProduct);
  return res.body.data.id as string;
}

async function createOrder(
  accessToken: string,
  productId: string,
  quantity = 1,
): Promise<string> {
  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ items: [{ productId, quantity }] });
  return res.body.data.id as string;
}

async function initiatePayment(
  accessToken: string,
  orderId: string,
): Promise<{ id: string; status: string; amountCOP: number }> {
  const res = await request(app)
    .post('/api/v1/payments/initiate')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      orderId,
      method: 'NEQUI',
      acceptanceToken: 'acc_token_test',
      personalDataAuthToken: 'personal_token_test',
    });
  return res.body.data as { id: string; status: string; amountCOP: number };
}

function buildWebhookPayload(transaction: WompiTransactionData): {
  payload: WompiWebhookPayload;
  body: string;
} {
  const timestamp = Math.floor(Date.now() / 1000);
  const properties = [
    'transaction.id',
    'transaction.status',
    'transaction.amount_in_cents',
    'transaction.currency',
    'transaction.payment_method_type',
    'transaction.reference',
  ];

  const valuesString = properties
    .map((prop) => {
      const fieldPath = prop.startsWith('transaction.')
        ? prop.slice('transaction.'.length)
        : prop;
      const value = transaction[fieldPath];
      return value !== undefined && value !== null ? String(value) : '';
    })
    .join('');

  const raw = `${valuesString}${timestamp}${WOMPI_EVENTS_SECRET}`;
  const checksum = createHash('sha256').update(raw, 'utf8').digest('hex');

  const payload: WompiWebhookPayload = {
    event: 'transaction.updated',
    data: { transaction },
    environment: 'test',
    signature: { properties, checksum },
    timestamp,
  };

  return { payload, body: JSON.stringify(payload) };
}

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

beforeAll(async () => {
  await startTestDB();
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          id: MOCK_WOMPI_TX_ID,
          status: 'PENDING',
          redirect_url: MOCK_REDIRECT_URL,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
});

afterAll(async () => {
  globalThis.fetch = originalFetch;
  await stopTestDB();
});

beforeEach(async () => {
  await clearDB();
});

// ---------------------------------------------------------------------------
// POST /api/v1/payments/initiate
// ---------------------------------------------------------------------------

describe('POST /api/v1/payments/initiate', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .send({ orderId: 'a0000000-0000-4000-8000-000000000001' });

    expect(res.status).toBe(401);
  });

  it('retorna 400 con body inválido', async () => {
    const { accessToken } = await registerAndLogin(buyerData);

    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ orderId: 'not-a-uuid', method: 'NEQUI' });

    expect(res.status).toBe(400);
  });

  it('retorna 404 si la orden no existe', async () => {
    const { accessToken } = await registerAndLogin(buyerData);

    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        orderId: 'a0000000-0000-4000-8000-000000000099',
        method: 'NEQUI',
        acceptanceToken: 'acc_token',
        personalDataAuthToken: 'personal_token',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('retorna 403 si el buyer no es dueño de la orden', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const orderId = await createOrder(buyerToken, productId);

    const { accessToken: otherToken } = await registerAndLogin(otherBuyerData);
    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        orderId,
        method: 'NEQUI',
        acceptanceToken: 'acc_token',
        personalDataAuthToken: 'personal_token',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORDER_FORBIDDEN');
  });

  it('retorna 422 si la orden no está en PENDING', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const orderId = await createOrder(buyerToken, productId);

    // Cancelar la orden antes de pagar
    await request(app)
      .patch(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`);

    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        orderId,
        method: 'NEQUI',
        acceptanceToken: 'acc_token',
        personalDataAuthToken: 'personal_token',
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ORDER_NOT_PAYABLE');
  });

  it('retorna 201 y crea el payment exitosamente', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const orderId = await createOrder(buyerToken, productId);

    const res = await request(app)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        orderId,
        method: 'NEQUI',
        acceptanceToken: 'acc_token',
        personalDataAuthToken: 'personal_token',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe(orderId);
    expect(res.body.data.method).toBe('NEQUI');
    expect(res.body.data.wompiTransactionId).toBe(MOCK_WOMPI_TX_ID);
    expect(res.body.data.wompiRedirectUrl).toBe(MOCK_REDIRECT_URL);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/payments/:id
// ---------------------------------------------------------------------------

describe('GET /api/v1/payments/:id', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app).get(
      '/api/v1/payments/00000000-0000-0000-0000-000000000001',
    );

    expect(res.status).toBe(401);
  });

  it('retorna 404 si el payment no existe', async () => {
    const { accessToken } = await registerAndLogin(buyerData);

    const res = await request(app)
      .get('/api/v1/payments/00000000-0000-0000-0000-000000000099')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna 403 si el usuario no es el dueño', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const orderId = await createOrder(buyerToken, productId);
    const payment = await initiatePayment(buyerToken, orderId);

    const { accessToken: otherToken } = await registerAndLogin(otherBuyerData);
    const res = await request(app)
      .get(`/api/v1/payments/${payment.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('retorna 200 con el payment al buyer dueño', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const orderId = await createOrder(buyerToken, productId);
    const payment = await initiatePayment(buyerToken, orderId);

    const res = await request(app)
      .get(`/api/v1/payments/${payment.id}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(payment.id);
    expect(res.body.data.orderId).toBe(orderId);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/payments/webhook
// ---------------------------------------------------------------------------

describe('POST /api/v1/payments/webhook', () => {
  it('retorna 200 para eventos desconocidos sin procesarlos', async () => {
    const unknownEvent = JSON.stringify({
      event: 'charge.created',
      data: {},
      environment: 'test',
      signature: { properties: [], checksum: 'irrelevant' },
      timestamp: 0,
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(unknownEvent);

    expect(res.status).toBe(200);
  });

  it('retorna 401 con firma inválida', async () => {
    const fakePayload = JSON.stringify({
      event: 'transaction.updated',
      data: {
        transaction: {
          id: 'tx-fake',
          status: 'APPROVED',
          reference: 'pay-fake',
          amount_in_cents: 5000000,
          currency: 'COP',
          payment_method_type: 'NEQUI',
        },
      },
      environment: 'test',
      signature: {
        properties: ['transaction.id', 'transaction.status'],
        checksum: 'invalid-checksum-abc123',
      },
      timestamp: Math.floor(Date.now() / 1000),
    });

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(fakePayload);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('WEBHOOK_INVALID_SIGNATURE');
  });

  it('retorna 200 y confirma la orden cuando el pago es APPROVED', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const orderId = await createOrder(buyerToken, productId);
    const payment = await initiatePayment(buyerToken, orderId);

    const tx: WompiTransactionData = {
      id: MOCK_WOMPI_TX_ID,
      status: 'APPROVED',
      reference: payment.id,
      amount_in_cents: payment.amountCOP * 100,
      currency: 'COP',
      payment_method_type: 'NEQUI',
    };
    const { body } = buildWebhookPayload(tx);

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(webhookRes.status).toBe(200);

    // Verificar que la orden quedó CONFIRMED
    const orderRes = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(orderRes.body.data.status).toBe('CONFIRMED');
  });

  it('retorna 200 y cancela la orden cuando el pago es DECLINED', async () => {
    const { accessToken: sellerToken } = await registerAndLogin(sellerData);
    const productId = await createProduct(sellerToken);

    const { accessToken: buyerToken } = await registerAndLogin(buyerData);
    const orderId = await createOrder(buyerToken, productId);
    const payment = await initiatePayment(buyerToken, orderId);

    const tx: WompiTransactionData = {
      id: MOCK_WOMPI_TX_ID,
      status: 'DECLINED',
      reference: payment.id,
      amount_in_cents: payment.amountCOP * 100,
      currency: 'COP',
      payment_method_type: 'NEQUI',
    };
    const { body } = buildWebhookPayload(tx);

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(webhookRes.status).toBe(200);

    // Verificar que la orden quedó CANCELLED
    const orderRes = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(orderRes.body.data.status).toBe('CANCELLED');
  });
});
