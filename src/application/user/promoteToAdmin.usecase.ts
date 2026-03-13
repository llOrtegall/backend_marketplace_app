import type { User } from '../../domain/user/User';
import type { UserRepository } from '../../domain/user/UserRepository';
import { NotFoundError } from '../../shared/errors/AppError';

export interface PromoteToAdminDTO {
  targetId: string;
  actorId: string;
}

export class PromoteToAdminUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: PromoteToAdminDTO): Promise<User> {
    const [target, actor] = await Promise.all([
      this.repo.findById(input.targetId),
      this.repo.findById(input.actorId),
    ]);

    if (!target) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    if (!actor) throw new NotFoundError('USER_NOT_FOUND', 'Actor not found');

    const promoted = target.promote(actor);
    await this.repo.update(promoted);
    return promoted;
  }
}
