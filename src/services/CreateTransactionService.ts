// import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const lowerCaseType = type.toLowerCase();

    if (lowerCaseType !== 'income' && lowerCaseType !== 'outcome')
      throw new AppError('Invalid transaction type', 400);

    if (
      lowerCaseType === 'outcome' &&
      value > (await transactionsRepository.getBalance()).total
    )
      throw new AppError('The outcome value exceded the balance', 400);

    const storedCategory = await categoriesRepository.findOne({
      title: category,
    });

    const category_id = storedCategory
      ? storedCategory.id
      : (
          await categoriesRepository.save(
            categoriesRepository.create({ title: category }),
          )
        ).id;

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
