import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';

/**
 * GET /api/admin/users
 * List all users with pagination and filtering
 */
export const listUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    emailVerified: true,
                    isActive: true,
                    isBanned: true,
                    isGlobalAdmin: true,
                    lastLoginAt: true,
                    createdAt: true,
                    projectMemberships: {
                        select: {
                            project: { select: { name: true, slug: true } },
                            role: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('List users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
        });
    }
};
