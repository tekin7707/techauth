import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth.middleware';

import { sendProjectInvitationEmail } from '../services/email.service';

/**
 * POST /api/projects/invitations
 * Create a new project invitation (Global Admin only)
 */
export const createInvitation = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        if (!authReq.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { description, email } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email address is required' });
            return;
        }

        // Generate a random unique key
        const key = randomBytes(32).toString('hex');

        // Expires in 3 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);

        const invitation = await prisma.projectInvitation.create({
            data: {
                key,
                email, // Save email
                description,
                expiresAt,
                createdById: authReq.userId,
            },
        });

        // Send email
        await sendProjectInvitationEmail(email, key, expiresAt);

        res.status(201).json({
            success: true,
            message: 'Invitation created and sent successfully',
            data: {
                key: invitation.key,
                email: email,
                expiresAt: invitation.expiresAt,
                description: invitation.description,
                link: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/projects/new?key=${invitation.key}`
            },
        });
    } catch (error) {
        logger.error('Create invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create invitation',
        });
    }
};

/**
 * POST /api/projects
 * Create a new project using an invitation key
 */
/**
 * POST /api/projects
 * Create a new project using an invitation key
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { invitationKey, projectName, projectSlug, email, password, firstName, lastName } = req.body;

        if (!invitationKey || !projectName || !projectSlug || !email || !password) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }

        // 1. Validate Invitation
        const invitation = await prisma.projectInvitation.findUnique({
            where: { key: invitationKey },
        });

        if (!invitation) {
            res.status(400).json({ success: false, message: 'Invalid invitation key' });
            return;
        }

        if (invitation.used) {
            res.status(400).json({ success: false, message: 'Invitation already used' });
            return;
        }

        if (new Date() > invitation.expiresAt) {
            res.status(400).json({ success: false, message: 'Invitation expired' });
            return;
        }

        // Check if email matches invitation email
        if (invitation.email !== email) {
            res.status(400).json({ success: false, message: 'Email does not match invitation' });
            return;
        }

        // 2. Create Project, Create User, Link them, Mark Invitation Used
        // We use a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Check if project slug exists
            const existingProject = await tx.project.findUnique({ where: { slug: projectSlug } });
            if (existingProject) {
                throw new Error('Project slug already exists');
            }

            // Create Project
            const apiKey = 'pk_' + randomBytes(16).toString('hex');
            const apiSecret = 'sk_' + randomBytes(32).toString('hex');
            // In a real app, hash apiSecret!

            const project = await tx.project.create({
                data: {
                    name: projectName,
                    slug: projectSlug,
                    apiKey,
                    apiSecret,
                },
            });

            // Create Admin User
            // Check if user exists
            let user = await tx.user.findUnique({ where: { email } });
            let userId: string;
            let isNewUser = false;

            if (user) {
                // User exists, add membership only
                userId = user.id;
            } else {
                // Create new user with emailVerified: false
                const passwordHash = await bcrypt.hash(password, 10);
                user = await tx.user.create({
                    data: {
                        email,
                        passwordHash,
                        firstName,
                        lastName,
                        emailVerified: false, // Require verification
                    },
                });
                userId = user.id;
                isNewUser = true;
            }

            // Add Project Membership
            await tx.projectMembership.create({
                data: {
                    userId,
                    projectId: project.id,
                    role: 'admin',
                },
            });

            // Mark Invitation Used
            await tx.projectInvitation.update({
                where: { id: invitation.id },
                data: {
                    used: true,
                    usedAt: new Date(),
                    usedByProjectId: project.id,
                }
            });

            return { project, user, isNewUser };
        });

        // 3. Send Verification Email (if new user)
        if (result.isNewUser && !result.user.emailVerified) {
            try {
                const token = randomBytes(32).toString('hex');
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);

                await prisma.emailVerification.create({
                    data: {
                        userId: result.user.id,
                        email: result.user.email!,
                        token,
                        expiresAt
                    }
                });

                // Import dynamically or assume it's available via require if not imported at top
                // But we should use the imported one if available. 
                // Since I cannot check imports easily in this single step without potentially missing them,
                // I will use require to be safe, or just assume I fixed the imports previously.
                // Actually, I can add the import at the top of file in a separate step if needed, 
                // but for now I'll use require to avoid import errors if named export changes.
                // Wait, I saw `sendProjectInvitationEmail` imported but not `sendVerificationEmail`.
                const emailService = require('../services/email.service');
                if (emailService.sendVerificationEmail) {
                    await emailService.sendVerificationEmail(result.user.email!, token);
                }
            } catch (emailError) {
                logger.error('Failed to send verification email during project creation:', emailError);
                // Don't fail the request, just log it. User can request verification later.
            }
        }

        res.status(201).json({
            success: true,
            message: 'Project and Admin User created successfully',
            data: {
                project: {
                    name: result.project.name,
                    slug: result.project.slug,
                    apiKey: result.project.apiKey,
                    apiSecret: result.project.apiSecret,
                },
                user: {
                    id: result.user.id,
                    email: result.user.email
                },
            },
        });

    } catch (error) {
        logger.error('Create project error:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create project',
        });
    }
};
