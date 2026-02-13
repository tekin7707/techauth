import prisma from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/encryption';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getAccessTokenExpiresIn } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from './email.service';
import { logger } from '../utils/logger';

const TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export interface RegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    projectApiKey?: string;
    invitationKey?: string;
}

export interface LoginInput {
    email: string;
    password: string;
    projectApiKey: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        emailVerified: boolean;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}

/**
 * Register new user
 */
export const register = async (input: RegisterInput): Promise<{ userId: string; email: string }> => {
    // Check for global admin bootstrapping
    if (input.invitationKey === 'ThisIsGlobalAdminAccountFBDAD4BF') {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            const passwordHash = await hashPassword(input.password);
            const user = await prisma.user.create({
                data: {
                    email: input.email,
                    passwordHash,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    emailVerified: true,
                    isActive: true,
                    isGlobalAdmin: true,
                },
            });
            logger.info(`Global Admin bootstrapped: ${user.email} (ID: ${user.id})`);
            return {
                userId: user.id,
                email: user.email!,
            };
        }
    }

    // Normal registration flow
    if (!input.projectApiKey) {
        throw new Error('Project API key is required');
    }

    // Check if project exists and is active
    const project = await prisma.project.findUnique({
        where: { apiKey: input.projectApiKey },
    });

    if (!project || !project.isActive) {
        throw new Error('Invalid or inactive project API key');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            emailVerified: false,
            projectMemberships: {
                create: {
                    projectId: project.id,
                    role: 'user',
                },
            },
        },
    });

    // Create email verification token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    await prisma.emailVerification.create({
        data: {
            userId: user.id,
            email: user.email!,
            token,
            expiresAt,
        },
    });

    // Send verification email
    await sendVerificationEmail(user.email!, token);

    logger.info(`User registered: ${user.email} (ID: ${user.id})`);

    return {
        userId: user.id,
        email: user.email!,
    };
};

/**
 * Verify email
 */
export const verifyEmail = async (token: string): Promise<boolean> => {
    const verification = await prisma.emailVerification.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!verification) {
        throw new Error('Invalid verification token');
    }

    if (verification.verified) {
        throw new Error('Email already verified');
    }

    if (new Date() > verification.expiresAt) {
        throw new Error('Verification token expired');
    }

    // Update verification and user
    await prisma.$transaction([
        prisma.emailVerification.update({
            where: { id: verification.id },
            data: {
                verified: true,
                verifiedAt: new Date(),
            },
        }),
        prisma.user.update({
            where: { id: verification.userId },
            data: { emailVerified: true },
        }),
    ]);

    // Send welcome email
    await sendWelcomeEmail(verification.user.email!, verification.user.firstName || 'User');

    logger.info(`Email verified for user: ${verification.user.email}`);

    return true;
};

/**
 * Resend verification email
 */
export const resendVerification = async (email: string, projectApiKey: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { projectMemberships: { where: { project: { apiKey: projectApiKey } } } },
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.emailVerified) {
        throw new Error('Email already verified');
    }

    if (user.projectMemberships.length === 0) {
        throw new Error('User not associated with this project');
    }

    // Delete old pending verifications
    await prisma.emailVerification.deleteMany({
        where: {
            userId: user.id,
            verified: false,
        },
    });

    // Create new verification token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    await prisma.emailVerification.create({
        data: {
            userId: user.id,
            email: user.email!,
            token,
            expiresAt,
        },
    });

    await sendVerificationEmail(user.email!, token);

    logger.info(`Verification email resent to: ${user.email}`);

    return true;
};

/**
 * Login user
 */
export const login = async (input: LoginInput): Promise<AuthResponse> => {
    // Check if project exists
    const project = await prisma.project.findUnique({
        where: { apiKey: input.projectApiKey },
    });

    if (!project || !project.isActive) {
        throw new Error('Invalid or inactive project API key');
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: input.email },
        include: {
            projectMemberships: {
                where: { projectId: project.id },
            },
        },
    });

    if (!user || (!user.isGlobalAdmin && user.projectMemberships.length === 0)) {
        throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
        throw new Error('Password not set for this account');
    }

    // Verify password
    const isValidPassword = await comparePassword(input.password, user.passwordHash);
    if (!isValidPassword) {
        // Log failed login attempt
        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                method: 'password',
                success: false,
                failureReason: 'Invalid password',
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            },
        });
        throw new Error('Invalid email or password');
    }

    if (user.isBanned) {
        throw new Error(`Account banned: ${user.banReason || 'No reason provided'}`);
    }

    if (!user.emailVerified) {
        throw new Error('Please verify your email before logging in');
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email! });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt,
            ipAddress: input.ipAddress,
            deviceInfo: input.userAgent ? { userAgent: input.userAgent } : undefined,
        },
    });

    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
            lastLoginIp: input.ipAddress,
        },
    });

    // Log successful login
    await prisma.loginHistory.create({
        data: {
            userId: user.id,
            method: 'password',
            success: true,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        },
    });

    logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
        },
        tokens: {
            accessToken,
            refreshToken,
            expiresIn: getAccessTokenExpiresIn(),
        },
    };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> => {
    // Verify refresh token
    verifyRefreshToken(refreshToken);

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
    });

    if (!session) {
        throw new Error('Invalid refresh token');
    }

    if (new Date() > session.expiresAt) {
        throw new Error('Refresh token expired');
    }

    if (session.user.isBanned) {
        throw new Error('Account banned');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
        userId: session.user.id,
        email: session.user.email!,
    });

    // Update session last used
    await prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
    });

    return {
        accessToken,
        expiresIn: getAccessTokenExpiresIn(),
    };
};

/**
 * Logout user
 */
export const logout = async (refreshToken: string): Promise<boolean> => {
    await prisma.session.delete({
        where: { refreshToken },
    });

    logger.info('User logged out');
    return true;
};

/**
 * Logout from all sessions
 */
export const logoutAll = async (userId: string): Promise<boolean> => {
    await prisma.session.deleteMany({
        where: { userId },
    });

    logger.info(`All sessions terminated for user: ${userId}`);
    return true;
};

/**
 * Request password reset
 */
export const forgotPassword = async (email: string, projectApiKey: string, ipAddress?: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { projectMemberships: { where: { project: { apiKey: projectApiKey } } } },
    });

    // Don't reveal if user exists or not
    if (!user || user.projectMemberships.length === 0) {
        logger.warn(`Password reset requested for non-existent user: ${email}`);
        return true;
    }

    // Create reset token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    await prisma.passwordReset.create({
        data: {
            userId: user.id,
            token,
            expiresAt,
            ipAddress,
        },
    });

    await sendPasswordResetEmail(user.email!, token);

    logger.info(`Password reset email sent to: ${email}`);

    return true;
};

/**
 * Reset password
 */
export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    const reset = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!reset) {
        throw new Error('Invalid reset token');
    }

    if (reset.used) {
        throw new Error('Reset token already used');
    }

    if (new Date() > reset.expiresAt) {
        throw new Error('Reset token expired');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
        prisma.user.update({
            where: { id: reset.userId },
            data: { passwordHash },
        }),
        prisma.passwordReset.update({
            where: { id: reset.id },
            data: {
                used: true,
                usedAt: new Date(),
            },
        }),
        // Invalidate all existing sessions
        prisma.session.deleteMany({
            where: { userId: reset.userId },
        }),
    ]);

    logger.info(`Password reset completed for user: ${reset.user.email}`);

    return true;
};

/**
 * Change password (when logged in)
 */
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || !user.passwordHash) {
        throw new Error('User not found');
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
        throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });

    logger.info(`Password changed for user: ${user.email}`);

    return true;
};
