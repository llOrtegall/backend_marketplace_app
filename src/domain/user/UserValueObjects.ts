import { ValidationError } from '../../shared/errors/AppError';

export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new ValidationError('Invalid email format');
    }
    return new Email(normalized);
  }

  static fromPersistence(value: string): Email {
    return new Email(value);
  }
}

export type UserRole = 'superadmin' | 'admin' | 'user';
export type UserStatus = 'active' | 'inactive' | 'banned';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 3,
  admin: 2,
  user: 1,
};

export function hasHigherOrEqualRole(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[targetRole];
}

export function canManageRole(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}
