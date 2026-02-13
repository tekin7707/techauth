import { z } from 'zod';

// Password validation schema
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Email validation schema
export const emailSchema = z
    .string()
    .email('Invalid email address')
    .toLowerCase();

// Phone number validation (international format)
export const phoneSchema = z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (use international format with +)');

// User registration validation
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    projectApiKey: z.string().min(1, 'Project API key is required').optional(),
    invitationKey: z.string().optional(),
});

// Login validation
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    projectApiKey: z.string().min(1, 'Project API key is required'),
});

// Refresh token validation
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Password reset request validation
export const forgotPasswordSchema = z.object({
    email: emailSchema,
    projectApiKey: z.string().min(1, 'Project API key is required'),
});

// Password reset validation
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
});

// Change password validation
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
});

// Email verification validation
export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required'),
});

// Resend verification email validation
export const resendVerificationSchema = z.object({
    email: emailSchema,
    projectApiKey: z.string().min(1, 'Project API key is required'),
});

// Update user profile validation
export const updateProfileSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    locale: z.string().max(10).optional(),
    timezone: z.string().max(50).optional(),
});

// Project creation validation
export const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100),
    slug: z.string()
        .min(1, 'Slug is required')
        .max(50)
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().max(500).optional(),
    allowedOrigins: z.array(z.string().url()).optional(),
    webhookUrl: z.string().url().optional(),
});

// Validate request against schema
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.issues.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            throw new ValidationError('Validation failed', errors);
        }
        throw error;
    }
};

// Custom validation error class
export class ValidationError extends Error {
    constructor(
        message: string,
        public errors: Array<{ field: string; message: string }>
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}
