import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionSum {
  sum: string;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsCount = await this.count();

    if (transactionsCount === 0) return { income: 0, outcome: 0, total: 0 };

    const incometotal = Number(
      (
        await this.createQueryBuilder('transactions')
          .select('SUM(value)', 'sum')
          .where('type = :type', { type: 'income' })
          .getRawOne<TransactionSum>()
      ).sum,
    );

    const outcomeTotal = Number(
      (
        await this.createQueryBuilder('transactions')
          .select('SUM(value)', 'sum')
          .where('type = :type', { type: 'outcome' })
          .getRawOne<TransactionSum>()
      ).sum,
    );

    const total = incometotal - outcomeTotal;

    return {
      income: incometotal,
      outcome: outcomeTotal,
      total,
    };
  }
}

export default TransactionsRepository;
