import type {
  RefreshTokenData,
  RefreshTokenRepository,
} from '../../domain/user/RefreshTokenRepository';
import { RefreshTokenModel } from './RefreshTokenSchema';

export class MongoRefreshTokenRepository implements RefreshTokenRepository {
  async save(data: RefreshTokenData): Promise<void> {
    await RefreshTokenModel.create(data);
  }

  async findAndDelete(token: string): Promise<RefreshTokenData | null> {
    const doc = await RefreshTokenModel.findOneAndDelete({ token }).lean();
    if (!doc) return null;
    return { token: doc.token, userId: doc.userId, expiresAt: doc.expiresAt };
  }

  async deleteByToken(token: string): Promise<void> {
    await RefreshTokenModel.deleteOne({ token });
  }
}
