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

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password1',
};

beforeAll(async () => {
  await startTestDB();
});

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await clearDB();
});

describe('POST /api/v1/auth/register', () => {
  it('registra un nuevo usuario y retorna 201 con UserDTO', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(validUser.email);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('retorna 400 si el email tiene formato inválido', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 400 si la contraseña no tiene mayúscula', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, password: 'password1' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 409 si el email ya está registrado', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
  });

  it('retorna accessToken y refreshToken con credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('retorna 401 con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('retorna 400 si el body está incompleto', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retorna 403 si el usuario está inactivo', async () => {
    await UserModel.updateOne(
      { email: validUser.email },
      { $set: { status: 'inactive' } },
    );

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('retorna 403 si el usuario está baneado', async () => {
    await UserModel.updateOne(
      { email: validUser.email },
      { $set: { status: 'banned' } },
    );

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('retorna nuevos tokens con refreshToken válido', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginRes.body.data.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('retorna 401 con refreshToken inválido', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.token.here' });

    expect(res.status).toBe(401);
  });

  it('retorna 403 si el usuario fue inactivado después del login', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    await UserModel.updateOne(
      { email: validUser.email },
      { $set: { status: 'inactive' } },
    );

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginRes.body.data.refreshToken });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('retorna 204 con token y refreshToken válidos', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    const { accessToken, refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(204);
  });

  it('retorna 401 sin Authorization header', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'any' });

    expect(res.status).toBe(401);
  });

  it('retorna 403 si el usuario fue baneado después del login', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    const { accessToken, refreshToken } = loginRes.body.data;

    await UserModel.updateOne(
      { email: validUser.email },
      { $set: { status: 'banned' } },
    );

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });
});
