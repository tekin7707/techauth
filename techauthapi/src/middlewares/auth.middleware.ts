import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
}

/**
 * Middleware to verify JWT access token
 */
export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No authorization token provided',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const payload = verifyAccessToken(token);
            req.userId = payload.userId;
            req.userEmail = payload.email;
            next();
        } catch (error) {
            logger.warn('Invalid access token:', error);
            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : 'Invalid token',
            });
        }
    } catch (error) {
        logger.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error',
        });
    }
};
