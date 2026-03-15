import { randomUUID } from 'node:crypto';
import { User } from '../../domain/user/User';
import type { UserRepository } from '../../domain/user/UserRepository';
import { AppError } from '../../shared/errors/AppError';
import { hashPassword } from '../../shared/utils/password';

export interface RegisterUserDTO {
  name: string;
  email: string;
  password: string;
}

export class RegisterUserUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: RegisterUserDTO): Promise<User> {
    const exists = await this.repo.existsByEmail(input.email);
    if (exists) {
      throw new AppError('EMAIL_TAKEN', 'Email is already registered', 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = User.create({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'user',
    });

    await this.repo.save(user);
    return user;
  }
}
