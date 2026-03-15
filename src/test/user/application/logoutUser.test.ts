import { beforeEach, describe, expect, it } from 'bun:test';
import { LogoutUserUseCase } from '../../../application/user/logoutUser.usecase';
import { signRefreshToken } from '../../../shared/utils/jwt';
import {
  createMockRefreshTokenRepository,
  type MockRefreshTokenRepository,
} from '../../helpers/mockRepositories';

describe('LogoutUserUseCase', () => {
  let tokenRepo: MockRefreshTokenRepository;
  let useCase: LogoutUserUseCase;

  beforeEach(() => {
    tokenRepo = createMockRefreshTokenRepository();
    useCase = new LogoutUserUseCase(tokenRepo);
  });

  it('elimina el refresh token del store', async () => {
    const { token, expiresAt } = signRefreshToken('user-1');
    await tokenRepo.save({ token, userId: 'user-1', expiresAt });

    await useCase.execute(token);

    expect(tokenRepo._store.has(token)).toBe(false);
  });

  it('es idempotente: no lanza error si el token no existe', async () => {
    await expect(useCase.execute('token-inexistente')).resolves.toBeUndefined();
  });

  it('no elimina otros tokens del store', async () => {
    const { token: t1, expiresAt: e1 } = signRefreshToken('user-1');
    const { token: t2, expiresAt: e2 } = signRefreshToken('user-2');
    await tokenRepo.save({ token: t1, userId: 'user-1', expiresAt: e1 });
    await tokenRepo.save({ token: t2, userId: 'user-2', expiresAt: e2 });

    await useCase.execute(t1);

    expect(tokenRepo._store.has(t2)).toBe(true);
  });
});
