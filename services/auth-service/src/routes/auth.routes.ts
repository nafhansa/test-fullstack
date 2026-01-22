import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

// Public endpoints (no internal auth needed for register/login)
router.post('/register', register);
router.post('/login', login);

export default router;
