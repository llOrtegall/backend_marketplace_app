import type { ITransactionManager } from '../../application/shared/ITransactionManager';

export function createMockTransactionManager(): ITransactionManager {
  return {
    async runInTransaction(fn) {
      return fn(null as unknown);
    },
  };
}
