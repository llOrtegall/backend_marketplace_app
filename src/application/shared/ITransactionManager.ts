import type { ClientSession } from 'mongoose';

export interface ITransactionManager {
  runInTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T>;
}
