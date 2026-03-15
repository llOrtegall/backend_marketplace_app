import type { PaginatedResult } from '../../shared/types/ApiResponse';
import type { User } from '../../domain/user/User';
import type {
  UserFilters,
  IUserRepository,
} from '../../domain/user/UserRepository';

export interface ListUsersInput {
  filters: UserFilters;
  page: number;
  limit: number;
}

export class ListUsersUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(input: ListUsersInput): Promise<PaginatedResult<User>> {
    return this.repo.findAll(input.filters, {
      page: input.page,
      limit: input.limit,
    });
  }
}
