import { beforeEach, describe, expect, it } from 'bun:test';
import { LoginUserUseCase } from '../../../application/user/loginUser.usecase';
import {
  createMockRefreshTokenRepository,
  createMockUserRepository,
  type MockRefreshTokenRepository,
  type MockUserRepository,
} from '../../helpers/mockRepositories';
import {
  makeBannedUser,
  makeInactiveUser,
  makeUser,
} from '../../helpers/userFixtures';

// Contraseña real hasheada con Bun.password para los tests
const PLAIN_PASSWORD = 'Password1';
const HASHED_PASSWORD = await Bun.password.hash(PLAIN_PASSWORD, {
  algorithm: 'bcrypt',
  cost: 4, // cost bajo para que los tests sean rápidos
});

describe('LoginUserUseCase', () => {
  let userRepo: MockUserRepository;
  let tokenRepo: MockRefreshTokenRepository;
  let useCase: LoginUserUseCase;

  beforeEach(() => {
    const activeUser = makeUser({ passwordHash: HASHED_PASSWORD });
    userRepo = createMockUserRepository([activeUser]);
    tokenRepo = createMockRefreshTokenRepository();
    useCase = new LoginUserUseCase(userRepo, tokenRepo);
  });

  it('retorna accessToken y refreshToken con credenciales válidas', async () => {
    const result = await useCase.execute({
      email: 'test@example.com',
      password: PLAIN_PASSWORD,
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('persiste el refresh token en el repositorio', async () => {
    await useCase.execute({
      email: 'test@example.com',
      password: PLAIN_PASSWORD,
    });

    expect(tokenRepo._store.size).toBe(1);
  });

  it('el accessToken y refreshToken son strings distintos', async () => {
    const result = await useCase.execute({
      email: 'test@example.com',
      password: PLAIN_PASSWORD,
    });

    expect(result.accessToken).not.toBe(result.refreshToken);
  });

  it('lanza UnauthorizedError cuando el email no existe', async () => {
    await expect(
      useCase.execute({
        email: 'noexiste@example.com',
        password: PLAIN_PASSWORD,
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('lanza UnauthorizedError cuando la contraseña es incorrecta', async () => {
    await expect(
      useCase.execute({ email: 'test@example.com', password: 'WrongPass1' }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('ambos errores (email/password) devuelven el mismo mensaje (no revela cuál falló)', async () => {
    const { message: msgEmail } = await useCase
      .execute({ email: 'noexiste@example.com', password: PLAIN_PASSWORD })
      .catch((e) => e);

    const { message: msgPass } = await useCase
      .execute({ email: 'test@example.com', password: 'WrongPass1' })
      .catch((e) => e);

    expect(msgEmail).toBe(msgPass);
  });

  it('lanza AppError ACCOUNT_INACTIVE (403) si el usuario está inactivo', async () => {
    const inactiveUser = makeInactiveUser({ passwordHash: HASHED_PASSWORD });
    userRepo = createMockUserRepository([inactiveUser]);
    useCase = new LoginUserUseCase(userRepo, tokenRepo);

    await expect(
      useCase.execute({ email: 'test@example.com', password: PLAIN_PASSWORD }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_INACTIVE', statusCode: 403 });
  });

  it('lanza AppError ACCOUNT_INACTIVE (403) si el usuario está baneado', async () => {
    const bannedUser = makeBannedUser({ passwordHash: HASHED_PASSWORD });
    userRepo = createMockUserRepository([bannedUser]);
    useCase = new LoginUserUseCase(userRepo, tokenRepo);

    await expect(
      useCase.execute({ email: 'test@example.com', password: PLAIN_PASSWORD }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_INACTIVE', statusCode: 403 });
  });
});
