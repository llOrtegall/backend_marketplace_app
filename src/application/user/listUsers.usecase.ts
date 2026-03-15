import type { PaginatedResult } from '../../shared/types/ApiResponse';
import type { User } from '../../domain/user/User';
import type {
  UserFilters,
  UserRepository,
} from '../../domain/user/UserRepository';

export interface ListUsersInput {
  filters: UserFilters;
  page: number;
  limit: number;
}

export class ListUsersUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: ListUsersInput): Promise<PaginatedResult<User>> {
    return this.repo.findAll(input.filters, {
      page: input.page,
      limit: input.limit,
    });
  }
}
