import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import {
    validate,
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    resendVerificationSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from '../utils/validators';
import type { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

/**
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Inject API key from header if not in body
        if (!req.body.projectApiKey && req.headers['x-api-key']) {
            req.body.projectApiKey = req.headers['x-api-key'];
        }
        const data = validate(registerSchema, req.body);
        const result = await authService.register(data);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
            data: result,
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Registration failed',
        });
    }
};

/**
 * GET /api/auth/verify-email
 * Serve a simple HTML page for email verification result
 */
export const verifyEmailPage = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        res.status(400).send('<h1>Invalid Verification Link</h1><p>Missing token.</p>');
        return;
    }

    try {
        await authService.verifyEmail(token);
        res.status(200).send(`
            <html>
                <head><title>Email Verified</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #10B981;">🎉 Email Verified Successfully!</h1>
                    <p>Your account has been activated.</p>
                    <p>You can now close this window and log in to your application.</p>
                </body>
            </html>
        `);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Verification failed';
        res.status(400).send(`
            <html>
                <head><title>Verification Failed</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #EF4444;">Verification Failed</h1>
                    <p>${message}</p>
                </body>
            </html>
        `);
    }
};

/**
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = validate(verifyEmailSchema, req.body);
        await authService.verifyEmail(token);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
        });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Verification failed',
        });
    }
};

/**
 * POST /api/auth/resend-verification
 */
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
        // Inject API key from header if not in body
        if (!req.body.projectApiKey && req.headers['x-api-key']) {
            req.body.projectApiKey = req.headers['x-api-key'];
        }
        const { email, projectApiKey } = validate(resendVerificationSchema, req.body);
        await authService.resendVerification(email, projectApiKey);

        res.status(200).json({
            success: true,
            message: 'Verification email sent',
        });
    } catch (error) {
        logger.error('Resend verification error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to resend verification',
        });
    }
};

/**
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Inject API key from header if not in body
        if (!req.body.projectApiKey && req.headers['x-api-key']) {
            req.body.projectApiKey = req.headers['x-api-key'];
        }
        const data = validate(loginSchema, req.body);
        const result = await authService.login({
            ...data,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(401).json({
            success: false,
            message: error instanceof Error ? error.message : 'Login failed',
        });
    }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = validate(refreshTokenSchema, req.body);
        const result = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logger.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: error instanceof Error ? error.message : 'Token refresh failed',
        });
    }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = validate(refreshTokenSchema, req.body);
        await authService.logout(refreshToken);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Logout failed',
        });
    }
};

/**
 * POST /api/auth/logout-all
 */
export const logoutAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        await authService.logoutAll(req.userId);

        res.status(200).json({
            success: true,
            message: 'All sessions terminated',
        });
    } catch (error) {
        logger.error('Logout all error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Logout failed',
        });
    }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        // Inject API key from header if not in body
        if (!req.body.projectApiKey && req.headers['x-api-key']) {
            req.body.projectApiKey = req.headers['x-api-key'];
        }
        const { email, projectApiKey } = validate(forgotPasswordSchema, req.body);
        await authService.forgotPassword(email, projectApiKey, req.ip);

        res.status(200).json({
            success: true,
            message: 'Password reset email sent',
        });
    } catch (error) {
        logger.error('Forgot password error:', error);
        // Don't reveal if user exists
        res.status(200).json({
            success: true,
            message: 'Password reset email sent',
        });
    }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = validate(resetPasswordSchema, req.body);
        await authService.resetPassword(token, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Password reset failed',
        });
    }
};

/**
 * POST /api/auth/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { currentPassword, newPassword } = validate(changePasswordSchema, req.body);
        await authService.changePassword(req.userId, currentPassword, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        logger.error('Change password error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Password change failed',
        });
    }
};
