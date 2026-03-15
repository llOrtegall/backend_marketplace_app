import type { User } from '../../domain/user/User';
import type { IUserRepository } from '../../domain/user/UserRepository';
import type { UserRole } from '../../domain/user/UserValueObjects';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

export class GetUserUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(
    targetId: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<User> {
    if (requesterRole === 'user' && requesterId !== targetId) {
      throw new ForbiddenError('FORBIDDEN', 'Access denied');
    }
    const user = await this.repo.findById(targetId);
    if (!user) {
      throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    }
    return user;
  }
}
