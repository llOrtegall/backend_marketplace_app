import mongoose from 'mongoose';
import type { DbSession } from '../../domain/shared/DbSession';
import type { ITransactionManager } from '../../application/shared/ITransactionManager';

export class MongoTransactionManager implements ITransactionManager {
  async runInTransaction<T>(
    fn: (session: DbSession) => Promise<T>,
  ): Promise<T> {
    const session = await mongoose.startSession();
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session as DbSession);
    });
    await session.endSession();
    return result;
  }
}
