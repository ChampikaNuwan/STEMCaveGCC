import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/auth/login', AuthController.login);

// Protected routes
router.get('/auth/profile', authenticate, AuthController.getProfile);

// User management (restricted by RBAC)
router.post('/users/register', authenticate, authorize('superadmin', 'admin', 'teacher'), AuthController.register);
router.get('/users', authenticate, authorize('superadmin', 'admin', 'teacher'), AuthController.getUsers);
router.get('/users/:id', authenticate, AuthController.getUserById);
router.delete('/users/:id', authenticate, authorize('superadmin', 'admin'), AuthController.deleteUser);

export default router;
