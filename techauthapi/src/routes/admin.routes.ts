import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireGlobalAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Apply authentication and global admin check to all admin routes
router.use(authMiddleware, requireGlobalAdmin);

// User Management
router.get('/users', adminController.listUsers);

export default router;
