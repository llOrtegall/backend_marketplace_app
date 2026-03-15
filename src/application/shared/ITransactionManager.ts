import type { DbSession } from '../../domain/shared/DbSession';

export interface ITransactionManager {
  runInTransaction<T>(fn: (session: DbSession) => Promise<T>): Promise<T>;
}
