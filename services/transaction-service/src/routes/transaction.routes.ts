// services/transaction-service/src/routes/transaction.routes.ts
import { Router } from 'express';
import {
  addToCart,
  getCart,
  createTransaction,
  getAllTransactions,
  getTransactionById,
  payTransaction
} from '../controllers/transaction.controller';
import { internalAuth } from '../middleware/internalAuth';

const router = Router();

// ===== CART ENDPOINTS =====
router.post('/cart/add', internalAuth, addToCart);     
router.get('/cart/:user_id', internalAuth, getCart);  
router.get('/cart', internalAuth, getCart);            

// ===== TRANSACTION ENDPOINTS =====
router.post('/checkout', internalAuth, createTransaction); 
router.post('/', internalAuth, createTransaction);     
router.get('/history', internalAuth, getAllTransactions); 
router.get('/', internalAuth, getAllTransactions);
router.get('/:id', internalAuth, getTransactionById);
router.post('/pay', internalAuth, payTransaction);

export default router;