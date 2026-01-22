import { Router } from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  payTransaction
} from '../controllers/transaction.controller';
import { internalAuth } from '../middleware/internalAuth';

const router = Router();

// All endpoints require internal auth
router.post('/checkout', internalAuth, createTransaction); // Alias for frontend
router.post('/', internalAuth, createTransaction);
router.get('/history', internalAuth, getAllTransactions); // Alias for frontend
router.get('/', internalAuth, getAllTransactions);
router.get('/:id', internalAuth, getTransactionById);
router.post('/pay', internalAuth, payTransaction);

export default router;
