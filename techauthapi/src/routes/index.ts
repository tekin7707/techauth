import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import projectRoutes from './project.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/projects', projectRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Auth Service is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
