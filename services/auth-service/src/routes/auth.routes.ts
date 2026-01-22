import { Router } from 'express';
import { register, login, getAllUsers } from '../controllers/auth.controller';
import { internalAuth } from '../middleware/internalAuth';

const router = Router();

// Public endpoints (no internal auth needed for register/login)
router.post('/register', register);
router.post('/login', login);

// Protected endpoints
router.get('/users', internalAuth, getAllUsers);

export default router;
