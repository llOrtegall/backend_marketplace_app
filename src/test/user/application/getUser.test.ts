import { beforeEach, describe, expect, it } from 'bun:test';
import { GetUserUseCase } from '../../../application/user/getUser.usecase';
import {
  createMockUserRepository,
  type MockUserRepository,
} from '../../helpers/mockRepositories';
import { makeUser } from '../../helpers/userFixtures';

describe('GetUserUseCase', () => {
  let repo: MockUserRepository;
  let useCase: GetUserUseCase;
  const existingUser = makeUser({ id: 'user-1' });

  beforeEach(() => {
    repo = createMockUserRepository([existingUser]);
    useCase = new GetUserUseCase(repo);
  });

  it('admin puede ver el perfil de otro usuario', async () => {
    const user = await useCase.execute('user-1', 'admin-1', 'admin');

    expect(user.id).toBe('user-1');
    expect(user.email).toBe(existingUser.email);
  });

  it('usuario puede ver su propio perfil', async () => {
    const user = await useCase.execute('user-1', 'user-1', 'user');

    expect(user.id).toBe('user-1');
  });

  it('lanza ForbiddenError cuando un usuario intenta ver el perfil de otro', async () => {
    await expect(
      useCase.execute('user-1', 'user-2', 'user'),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  });

  it('lanza NotFoundError USER_NOT_FOUND (404) cuando el id no existe', async () => {
    await expect(
      useCase.execute('no-existe', 'admin-1', 'admin'),
    ).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      statusCode: 404,
    });
  });
});
