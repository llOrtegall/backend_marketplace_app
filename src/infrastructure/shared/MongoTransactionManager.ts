import mongoose, { type ClientSession } from 'mongoose';
import type { ITransactionManager } from '../../application/shared/ITransactionManager';

export class MongoTransactionManager implements ITransactionManager {
  async runInTransaction<T>(
    fn: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await mongoose.startSession();
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    await session.endSession();
    return result;
  }
}
