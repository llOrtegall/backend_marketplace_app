import type { PaginatedResult } from '../../shared/types/ApiResponse';
import type { User } from './User';
import type { UserRole, UserStatus } from './UserValueObjects';

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string; // name or email partial match
}

export interface UserPagination {
  page: number;
  limit: number;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(
    filters: UserFilters,
    pagination: UserPagination,
  ): Promise<PaginatedResult<User>>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}
