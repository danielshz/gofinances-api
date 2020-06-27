import fs from 'fs';
import csv from 'csv-parse';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    const parsedTransactions: Request[] = [];

    const parser = fs.createReadStream(filepath).pipe(
      csv({
        from_line: 2,
      }),
    );

    parser.on('data', (row: string[]) => {
      const [title, type, value, category] = row.map(column => column.trim());

      parsedTransactions.push({
        title,
        type,
        value: Number(value),
        category,
      } as Request);
    });

    await new Promise(resolve => parser.on('end', resolve));

    await fs.promises.unlink(filepath);

    const createTransactionService = new CreateTransactionService();

    const createdIncomeTransactions = await Promise.all(
      parsedTransactions
        .filter(parsedTransaction => parsedTransaction.type === 'income')
        .map(parsedTransaction =>
          createTransactionService.execute(parsedTransaction),
        ),
    );

    const createdOutcomeTransactions = await Promise.all(
      parsedTransactions
        .filter(parsedTransaction => parsedTransaction.type === 'outcome')
        .map(parsedTransaction =>
          createTransactionService.execute(parsedTransaction),
        ),
    );

    return [...createdIncomeTransactions, ...createdOutcomeTransactions];
  }
}

export default ImportTransactionsService;
