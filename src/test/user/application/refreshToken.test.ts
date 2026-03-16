import { beforeEach, describe, expect, it } from 'bun:test';
import { RefreshTokenUseCase } from '../../../application/user/refreshToken.usecase';
import { signRefreshToken } from '../../../shared/utils/jwt';
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

describe('RefreshTokenUseCase', () => {
  let userRepo: MockUserRepository;
  let tokenRepo: MockRefreshTokenRepository;
  let useCase: RefreshTokenUseCase;
  const activeUser = makeUser();

  beforeEach(() => {
    userRepo = createMockUserRepository([activeUser]);
    tokenRepo = createMockRefreshTokenRepository();
    useCase = new RefreshTokenUseCase(userRepo, tokenRepo);
  });

  async function seedToken(userId = activeUser.id) {
    const { token, expiresAt } = signRefreshToken(userId);
    await tokenRepo.save({ token, userId, expiresAt });
    return token;
  }

  it('retorna nuevo par de tokens con token válido', async () => {
    const token = await seedToken();

    const result = await useCase.execute(token);

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('el token viejo es eliminado del store (rotación)', async () => {
    const token = await seedToken();

    await useCase.execute(token);

    expect(tokenRepo._store.has(token)).toBe(false);
  });

  it('el nuevo refresh token es distinto al anterior', async () => {
    const token = await seedToken();

    const result = await useCase.execute(token);

    expect(result.refreshToken).not.toBe(token);
  });

  it('el nuevo refresh token queda persistido', async () => {
    const token = await seedToken();

    const result = await useCase.execute(token);

    expect(tokenRepo._store.has(result.refreshToken)).toBe(true);
  });

  it('lanza UnauthorizedError con token de firma inválida', async () => {
    await expect(useCase.execute('token.invalido.firma')).rejects.toMatchObject(
      {
        statusCode: 401,
      },
    );
  });

  it('lanza UnauthorizedError si el token es válido pero ya fue usado (no está en store)', async () => {
    const token = await seedToken();
    await tokenRepo.findAndDelete(token); // simula que ya se usó

    await expect(useCase.execute(token)).rejects.toMatchObject({
      statusCode: 401,
      message: expect.stringContaining('already used'),
    });
  });

  it('lanza UnauthorizedError si el usuario ya no existe', async () => {
    const orphanToken = await seedToken('user-que-no-existe');
    userRepo = createMockUserRepository([]); // repo vacío
    useCase = new RefreshTokenUseCase(userRepo, tokenRepo);

    await expect(useCase.execute(orphanToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('lanza AppError ACCOUNT_INACTIVE si el usuario está inactivo', async () => {
    const inactiveUser = makeInactiveUser({ id: 'inactive-1' });
    const token = await seedToken('inactive-1');
    userRepo = createMockUserRepository([inactiveUser]);
    useCase = new RefreshTokenUseCase(userRepo, tokenRepo);

    await expect(useCase.execute(token)).rejects.toMatchObject({
      code: 'ACCOUNT_INACTIVE',
      statusCode: 403,
    });
  });

  it('lanza AppError ACCOUNT_INACTIVE si el usuario está baneado', async () => {
    const bannedUser = makeBannedUser({ id: 'banned-1' });
    const token = await seedToken('banned-1');
    userRepo = createMockUserRepository([bannedUser]);
    useCase = new RefreshTokenUseCase(userRepo, tokenRepo);

    await expect(useCase.execute(token)).rejects.toMatchObject({
      code: 'ACCOUNT_INACTIVE',
      statusCode: 403,
    });
  });
});
