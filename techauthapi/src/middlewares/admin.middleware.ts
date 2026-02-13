import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/database';
import { logger } from '../utils/logger';

/**
 * Middleware to restrict access to Global Admins only
 */
export const requireGlobalAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { isGlobalAdmin: true },
        });

        if (!user || !user.isGlobalAdmin) {
            logger.warn(`Access denied: User ${req.userId} attempted to access global admin resource`);
            res.status(403).json({ success: false, message: 'Forbidden: Global Admin access required' });
            return;
        }

        next();
    } catch (error) {
        logger.error('Global admin check error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
