import { beforeEach, describe, expect, it } from 'bun:test';
import { RegisterUserUseCase } from '../../../application/user/registerUser.usecase';
import { Email } from '../../../domain/user/UserValueObjects';
import {
  createMockUserRepository,
  type MockUserRepository,
} from '../../helpers/mockRepositories';
import { makeUser } from '../../helpers/userFixtures';

describe('RegisterUserUseCase', () => {
  let repo: MockUserRepository;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    repo = createMockUserRepository();
    useCase = new RegisterUserUseCase(repo);
  });

  it("registra usuario con role 'user' y status 'active'", async () => {
    const user = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
    });

    expect(user.role).toBe('user');
    expect(user.status).toBe('active');
    expect(user.email).toBe('john@example.com');
  });

  it('persiste el usuario en el repositorio', async () => {
    await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
    });

    expect(repo.savedUsers).toHaveLength(1);
  });

  it('hashea la contraseña (passwordHash ≠ password original)', async () => {
    const rawPassword = 'Password1';
    const user = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
      password: rawPassword,
    });

    expect(user.passwordHash).not.toBe(rawPassword);
    expect(user.passwordHash.length).toBeGreaterThan(20);
  });

  it('lanza AppError EMAIL_TAKEN (409) si el email ya existe', async () => {
    const existing = makeUser({ email: Email.create('john@example.com') });
    repo = createMockUserRepository([existing]);
    useCase = new RegisterUserUseCase(repo);

    await expect(
      useCase.execute({
        name: 'Other User',
        email: 'john@example.com',
        password: 'Password1',
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN', statusCode: 409 });
  });

  it('detecta email duplicado con distinto casing', async () => {
    const existing = makeUser({ email: Email.create('john@example.com') });
    repo = createMockUserRepository([existing]);
    useCase = new RegisterUserUseCase(repo);

    await expect(
      useCase.execute({
        name: 'Other',
        email: 'JOHN@EXAMPLE.COM',
        password: 'Password1',
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });

  it('genera un id único por registro', async () => {
    const user1 = await useCase.execute({
      name: 'A',
      email: 'a@example.com',
      password: 'Password1',
    });
    const user2 = await useCase.execute({
      name: 'B',
      email: 'b@example.com',
      password: 'Password1',
    });

    expect(user1.id).not.toBe(user2.id);
  });
});
