import { User, type UserProps } from '../../domain/user/User';
import {
  Email,
  type UserRole,
  type UserStatus,
} from '../../domain/user/UserValueObjects';

function baseProps(): UserProps {
  return {
    id: 'user-1',
    name: 'Test User',
    email: Email.create('test@example.com'),
    passwordHash: '$2b$12$hashedpassword',
    role: 'user',
    status: 'active',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };
}

export function makeUser(overrides: Partial<UserProps> = {}): User {
  return User.reconstitute({ ...baseProps(), ...overrides });
}

export function makeSuperadmin(overrides: Partial<UserProps> = {}): User {
  return makeUser({ id: 'super-1', role: 'superadmin', ...overrides });
}

export function makeAdmin(overrides: Partial<UserProps> = {}): User {
  return makeUser({ id: 'admin-1', role: 'admin', ...overrides });
}

export function makeInactiveUser(overrides: Partial<UserProps> = {}): User {
  return makeUser({ status: 'inactive', ...overrides });
}

export function makeBannedUser(overrides: Partial<UserProps> = {}): User {
  return makeUser({ status: 'banned', ...overrides });
}

export function makeUserWithRole(role: UserRole, id?: string): User {
  return makeUser({ id: id ?? `${role}-1`, role });
}

export function makeUserWithStatus(status: UserStatus): User {
  return makeUser({ status });
}
