import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller';
import { internalAuth } from '../middleware/internalAuth';

const router = Router();

// Public endpoints
router.get('/', getAllProducts);

// Internal endpoints (require X-INTERNAL-KEY)
router.get('/:id', internalAuth, getProductById);
router.post('/', internalAuth, createProduct);
router.put('/:id', internalAuth, updateProduct);
router.delete('/:id', internalAuth, deleteProduct);

export default router;
