import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.get('/verify-email', authController.verifyEmailPage);
router.post('/resend-verification', authController.resendVerification);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.post('/change-password', authMiddleware, authController.changePassword);

export default router;
