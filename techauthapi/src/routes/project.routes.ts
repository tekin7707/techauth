import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireGlobalAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Create Invitation (Global Admin Only)
router.post('/invitations', authMiddleware, requireGlobalAdmin, projectController.createInvitation);

// Create Project (Public, but requires valid invitation key in body)
router.post('/', projectController.createProject);

export default router;
