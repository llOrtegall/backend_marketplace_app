import type { User } from '../../domain/user/User';
import type { UserRepository } from '../../domain/user/UserRepository';
import type { UserStatus } from '../../domain/user/UserValueObjects';
import { NotFoundError } from '../../shared/errors/AppError';

export interface UpdateUserStatusDTO {
  targetId: string;
  actorId: string;
  status: UserStatus;
}

export class UpdateUserStatusUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: UpdateUserStatusDTO): Promise<User> {
    const [target, actor] = await Promise.all([
      this.repo.findById(input.targetId),
      this.repo.findById(input.actorId),
    ]);

    if (!target) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    if (!actor) throw new NotFoundError('USER_NOT_FOUND', 'Actor not found');

    const updated = target.updateStatus(input.status, actor);
    await this.repo.update(updated);
    return updated;
  }
}
