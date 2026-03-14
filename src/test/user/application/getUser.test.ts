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

  it('retorna el usuario cuando el id existe', async () => {
    const user = await useCase.execute('user-1');

    expect(user.id).toBe('user-1');
    expect(user.email).toBe(existingUser.email);
  });

  it('lanza NotFoundError USER_NOT_FOUND (404) cuando el id no existe', async () => {
    await expect(useCase.execute('no-existe')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      statusCode: 404,
    });
  });
});
