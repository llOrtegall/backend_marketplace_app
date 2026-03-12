import type { User } from '../../domain/user/User';
import type { UserRepository } from '../../domain/user/UserRepository';
import { NotFoundError } from '../../shared/errors/AppError';

export class GetUserUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    }
    return user;
  }
}
