import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  refreshToken, 
  getAllUsers 
} from '../controllers/auth.controller';
import { internalAuth } from '../middleware/internalAuth';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// ===== PUBLIC ENDPOINTS (No Auth) =====
router.post('/register', register);
router.post('/login', login);

// ===== PROTECTED ENDPOINTS (Require JWT) =====
router.get('/me', internalAuth, jwtAuth, getMe);
router.post('/refresh-token', internalAuth, refreshToken);

// ===== INTERNAL ENDPOINTS (Require Internal Key) =====
router.get('/users', internalAuth, getAllUsers);

export default router;