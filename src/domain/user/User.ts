import { AppError } from '../../shared/errors/AppError';
import {
  Email,
  canManageRole,
  type UserRole,
  type UserStatus,
} from './UserValueObjects';

export interface UserProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(input: CreateUserInput): User {
    const now = new Date();
    return new User({
      id: input.id,
      name: input.name.trim(),
      email: Email.create(input.email),
      passwordHash: input.passwordHash,
      role: input.role ?? 'user',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  promote(actor: User): User {
    if (this.props.role !== 'user') {
      throw new AppError(
        'USER_ALREADY_ADMIN',
        "Only users with role 'user' can be promoted to admin",
        422,
      );
    }
    if (!canManageRole(actor.role, 'admin')) {
      throw new AppError(
        'USER_FORBIDDEN',
        'Only superadmin can promote users to admin',
        403,
      );
    }
    return new User({
      ...this.props,
      role: 'admin',
      updatedAt: new Date(),
    });
  }

  updateStatus(status: UserStatus, actor: User): User {
    if (!canManageRole(actor.role, this.props.role)) {
      throw new AppError(
        'USER_FORBIDDEN',
        'You cannot change the status of a user with equal or higher role',
        403,
      );
    }
    if (this.props.status === status) {
      throw new AppError(
        'USER_STATUS_UNCHANGED',
        `User is already ${status}`,
        422,
      );
    }
    return new User({ ...this.props, status, updatedAt: new Date() });
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get email() {
    return this.props.email.value;
  }
  get passwordHash() {
    return this.props.passwordHash;
  }
  get role() {
    return this.props.role;
  }
  get status() {
    return this.props.status;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
