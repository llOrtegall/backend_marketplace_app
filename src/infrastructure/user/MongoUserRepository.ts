import { User } from '../../domain/user/User';
import type { PaginatedResult } from '../../shared/types/ApiResponse';
import type {
  UserFilters,
  UserPagination,
  UserRepository,
} from '../../domain/user/UserRepository';
import { Email } from '../../domain/user/UserValueObjects';
import { UserModel, type UserDocument } from './UserSchema';

export class MongoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({
      email: email.toLowerCase(),
    });
    return count > 0;
  }

  async findAll(
    filters: UserFilters,
    pagination: UserPagination,
  ): Promise<PaginatedResult<User>> {
    const query: Record<string, unknown> = {};

    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [docs, total] = await Promise.all([
      UserModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    return {
      items: docs.map((d) => this.toDomain(d)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async save(user: User): Promise<void> {
    await UserModel.create(this.toPersistence(user));
  }

  async update(user: User): Promise<void> {
    await UserModel.findByIdAndUpdate(user.id, this.toPersistence(user));
  }

  private toDomain(doc: UserDocument): User {
    return User.reconstitute({
      id: doc._id,
      name: doc.name,
      email: Email.create(doc.email),
      passwordHash: doc.passwordHash,
      role: doc.role,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(user: User): UserDocument {
    return {
      _id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
