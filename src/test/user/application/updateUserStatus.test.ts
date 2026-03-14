import { beforeEach, describe, expect, it } from 'bun:test';
import { UpdateUserStatusUseCase } from '../../../application/user/updateUserStatus.usecase';
import {
  createMockUserRepository,
  type MockUserRepository,
} from '../../helpers/mockRepositories';
import {
  makeAdmin,
  makeSuperadmin,
  makeUser,
} from '../../helpers/userFixtures';

describe('UpdateUserStatusUseCase', () => {
  let repo: MockUserRepository;
  let useCase: UpdateUserStatusUseCase;

  const superadmin = makeSuperadmin({ id: 'super-1' });
  const admin = makeAdmin({ id: 'admin-1' });
  const admin2 = makeAdmin({ id: 'admin-2' });
  const user = makeUser({ id: 'user-2' });

  beforeEach(() => {
    repo = createMockUserRepository([superadmin, admin, admin2, user]);
    useCase = new UpdateUserStatusUseCase(repo);
  });

  it("superadmin cambia status de user a 'inactive'", async () => {
    const updated = await useCase.execute({
      targetId: 'user-2',
      actorId: 'super-1',
      status: 'inactive',
    });

    expect(updated.status).toBe('inactive');
  });

  it('superadmin puede banear a un admin', async () => {
    const updated = await useCase.execute({
      targetId: 'admin-1',
      actorId: 'super-1',
      status: 'banned',
    });

    expect(updated.status).toBe('banned');
  });

  it('admin puede cambiar status de un user', async () => {
    const updated = await useCase.execute({
      targetId: 'user-2',
      actorId: 'admin-1',
      status: 'inactive',
    });

    expect(updated.status).toBe('inactive');
  });

  it('persiste el usuario actualizado en el repositorio', async () => {
    await useCase.execute({
      targetId: 'user-2',
      actorId: 'super-1',
      status: 'banned',
    });

    expect(repo.updatedUsers[0]?.status).toBe('banned');
  });

  it('lanza NotFoundError cuando el targetId no existe', async () => {
    await expect(
      useCase.execute({
        targetId: 'no-existe',
        actorId: 'super-1',
        status: 'inactive',
      }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND', statusCode: 404 });
  });

  it('lanza NotFoundError cuando el actorId no existe', async () => {
    await expect(
      useCase.execute({
        targetId: 'user-2',
        actorId: 'no-existe',
        status: 'inactive',
      }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND', statusCode: 404 });
  });

  it('lanza AppError USER_FORBIDDEN cuando admin intenta cambiar status de otro admin', async () => {
    await expect(
      useCase.execute({
        targetId: 'admin-2',
        actorId: 'admin-1',
        status: 'banned',
      }),
    ).rejects.toMatchObject({ code: 'USER_FORBIDDEN', statusCode: 403 });
  });

  it('lanza AppError USER_STATUS_UNCHANGED cuando el status ya es el mismo', async () => {
    await expect(
      useCase.execute({
        targetId: 'user-2',
        actorId: 'super-1',
        status: 'active',
      }),
    ).rejects.toMatchObject({ code: 'USER_STATUS_UNCHANGED', statusCode: 422 });
  });
});
