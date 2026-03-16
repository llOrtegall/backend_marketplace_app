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
import { UserModel } from '../../infrastructure/user/UserSchema';
import { clearDB, startTestDB, stopTestDB } from './setup';

const app = createApp();

const sellerData = {
  name: 'Seller User',
  email: 'seller@example.com',
  password: 'Password1',
};

const validProduct = {
  name: 'Test Product',
  description: 'A valid product description for testing',
  price: 99.99,
  stock: 10,
  category: 'electronics',
  images: ['https://example.com/img1.jpg'],
};

async function registerAndLogin(
  userData = sellerData,
  role: 'user' | 'admin' | 'superadmin' = 'user',
) {
  await request(app).post('/api/v1/auth/register').send(userData);
  if (role !== 'user') {
    await UserModel.updateOne({ email: userData.email }, { $set: { role } });
  }
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: userData.email, password: userData.password });
  return res.body.data as { accessToken: string; refreshToken: string };
}

beforeAll(async () => {
  await startTestDB();
});

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await clearDB();
});

describe('POST /api/v1/products', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app).post('/api/v1/products').send(validProduct);
    expect(res.status).toBe(401);
  });

  it('crea producto y retorna 201 con token admin válido', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(validProduct.name);
    expect(res.body.data.status).toBe('active');
  });

  it('retorna 403 si un user normal intenta crear producto', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);

    expect(res.status).toBe(403);
  });

  it('retorna 400 si faltan campos requeridos', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');

    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Solo nombre' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/products', () => {
  it('retorna solo productos activos para usuario anónimo', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    // create inactive product
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...validProduct, name: 'Inactive Product' });
    await request(app)
      .patch(`/api/v1/products/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'inactive' });

    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(
      res.body.data.every((p: { status: string }) => p.status === 'active'),
    ).toBe(true);
  });

  it('ignora ?status=inactive para usuario anónimo y retorna active', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    await request(app)
      .patch(`/api/v1/products/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'inactive' });

    const res = await request(app).get('/api/v1/products?status=inactive');

    expect(res.status).toBe(200);
    expect(
      res.body.data.every((p: { status: string }) => p.status === 'active'),
    ).toBe(true);
  });
});

describe('GET /api/v1/products/:id', () => {
  it('retorna producto activo para usuario anónimo', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;

    const res = await request(app).get(`/api/v1/products/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(productId);
  });

  it('retorna 404 para producto inactivo sin autenticación', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;
    await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'inactive' });

    const res = await request(app).get(`/api/v1/products/${productId}`);

    expect(res.status).toBe(404);
  });

  it('retorna 404 para un user normal al consultar un producto inactivo', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;
    await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'inactive' });

    const { accessToken: userToken } = await registerAndLogin(
      {
        name: 'Plain User',
        email: 'plain-user-view@example.com',
        password: 'Password1',
      },
      'user',
    );

    const res = await request(app)
      .get(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it('retorna producto inactivo para superadmin', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;
    await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'inactive' });

    const { accessToken: superadminToken } = await registerAndLogin(
      {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'Password1',
      },
      'superadmin',
    );

    const res = await request(app)
      .get(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${superadminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('inactive');
  });
});

describe('PATCH /api/v1/products/:id', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app)
      .patch('/api/v1/products/some-id')
      .send({ name: 'New Name' });
    expect(res.status).toBe(401);
  });

  it('actualiza producto con token admin autenticado', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  it('retorna 403 si un user normal intenta actualizar el producto', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;

    const { accessToken: otherToken } = await registerAndLogin({
      name: 'Other User',
      email: 'other@example.com',
      password: 'Password1',
    });

    const res = await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(403);
  });
  it('permite a otro admin actualizar el producto', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;

    const { accessToken: otherAdminToken } = await registerAndLogin(
      {
        name: 'Other Admin',
        email: 'other-admin@example.com',
        password: 'Password1',
      },
      'admin',
    );

    const res = await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${otherAdminToken}`)
      .send({ name: 'Updated By Another Admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated By Another Admin');
  });
});

describe('DELETE /api/v1/products/:id', () => {
  it('retorna 401 sin autenticación', async () => {
    const res = await request(app).delete('/api/v1/products/some-id');
    expect(res.status).toBe(401);
  });

  it('elimina el producto y retorna 204', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
  });

  it('retorna 403 si un user normal intenta eliminar el producto', async () => {
    const { accessToken } = await registerAndLogin(sellerData, 'admin');
    const createRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProduct);
    const productId = createRes.body.data.id;

    const { accessToken: userToken } = await registerAndLogin(
      {
        name: 'Plain User',
        email: 'plain-user@example.com',
        password: 'Password1',
      },
      'user',
    );

    const res = await request(app)
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});
