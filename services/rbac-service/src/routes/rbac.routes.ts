import { Router } from 'express';
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser
} from '../controllers/rbac.controller';
import { internalAuth } from '../middleware/internalAuth';

const router = Router();

// All endpoints require internal auth (X-INTERNAL-KEY)
// Primary routes (original)
router.get('/users', internalAuth, getUsers);
router.post('/add_users', internalAuth, addUser);
router.put('/update_users/:id', internalAuth, updateUser);
router.delete('/delete_users/:id', internalAuth, deleteUser);

// API-prefixed routes to allow gateway forwarding without URI rewrite
router.get('/api/users', internalAuth, getUsers);
router.post('/api/users', internalAuth, addUser);
router.put('/api/users/:id', internalAuth, updateUser);
router.delete('/api/users/:id', internalAuth, deleteUser);

export default router;