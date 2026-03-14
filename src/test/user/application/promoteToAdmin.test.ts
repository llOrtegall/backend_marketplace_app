import { beforeEach, describe, expect, it } from 'bun:test';
import { PromoteToAdminUseCase } from '../../../application/user/promoteToAdmin.usecase';
import {
  createMockUserRepository,
  type MockUserRepository,
} from '../../helpers/mockRepositories';
import {
  makeAdmin,
  makeSuperadmin,
  makeUser,
} from '../../helpers/userFixtures';

describe('PromoteToAdminUseCase', () => {
  let repo: MockUserRepository;
  let useCase: PromoteToAdminUseCase;

  const superadmin = makeSuperadmin({ id: 'super-1' });
  const admin = makeAdmin({ id: 'admin-1' });
  const user = makeUser({ id: 'user-2' });

  beforeEach(() => {
    repo = createMockUserRepository([superadmin, admin, user]);
    useCase = new PromoteToAdminUseCase(repo);
  });

  it('superadmin promueve user a admin', async () => {
    const promoted = await useCase.execute({
      targetId: 'user-2',
      actorId: 'super-1',
    });

    expect(promoted.role).toBe('admin');
  });

  it('persiste el usuario promovido en el repositorio', async () => {
    await useCase.execute({ targetId: 'user-2', actorId: 'super-1' });

    expect(repo.updatedUsers[0]?.role).toBe('admin');
  });

  it('lanza NotFoundError cuando el targetId no existe', async () => {
    await expect(
      useCase.execute({ targetId: 'no-existe', actorId: 'super-1' }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND', statusCode: 404 });
  });

  it('lanza NotFoundError cuando el actorId no existe', async () => {
    await expect(
      useCase.execute({ targetId: 'user-2', actorId: 'no-existe' }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND', statusCode: 404 });
  });

  it('lanza AppError USER_FORBIDDEN cuando actor es admin (no superadmin)', async () => {
    await expect(
      useCase.execute({ targetId: 'user-2', actorId: 'admin-1' }),
    ).rejects.toMatchObject({ code: 'USER_FORBIDDEN', statusCode: 403 });
  });

  it('lanza AppError USER_ALREADY_ADMIN cuando el target ya es admin', async () => {
    await expect(
      useCase.execute({ targetId: 'admin-1', actorId: 'super-1' }),
    ).rejects.toMatchObject({ code: 'USER_ALREADY_ADMIN', statusCode: 422 });
  });
});
