import { Router } from 'express';
import fs from 'fs';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import AppError from '../errors/AppError';

import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import Transaction from '../models/Transaction';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  let transactions = await transactionsRepository.find();

  transactions = transactions.map<Transaction>(transaction =>
    transactionsRepository.create({
      ...transaction,
      value: Number(transaction.value),
    }),
  );

  const balance = await transactionsRepository.getBalance();

  response.status(200).json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransactionService = new CreateTransactionService();

  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    category,
  });

  return response.status(200).json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransactionService = new DeleteTransactionService();

  await deleteTransactionService.execute({ id });

  return response.status(204).json({});
});

transactionsRouter.post(
  '/import',
  multer(uploadConfig).single('file'),
  async (request, response) => {
    if (!request.file.originalname.endsWith('.csv')) {
      await fs.promises.unlink(request.file.path);
      throw new AppError('Invalid file type', 400);
    }

    const importTransactionsService = new ImportTransactionsService();

    const transactions = await importTransactionsService.execute(
      request.file.path,
    );
    return response.status(200).json(transactions);
  },
);

export default transactionsRouter;
