import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {
        return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
        throw new Error('Failed to hash password');
    }
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        throw new Error('Failed to compare password');
    }
};

/**
 * Generate a random token (for email verification, password reset, etc.)
 */
export const generateToken = (bytes: number = 32): string => {
    return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate a random numeric code (for SMS/2FA)
 */
export const generateNumericCode = (length: number = 6): string => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

/**
 * Generate API key and secret for projects
 */
export const generateApiCredentials = (): {
    apiKey: string;
    apiSecret: string;
    hashedSecret: string;
} => {
    const apiKey = `ak_${generateToken(16)}`;
    const apiSecret = generateToken(32);
    const hashedSecret = crypto
        .createHash('sha256')
        .update(apiSecret)
        .digest('hex');

    return { apiKey, apiSecret, hashedSecret };
};

/**
 * Verify API secret against hash
 */
export const verifyApiSecret = (secret: string, hash: string): boolean => {
    const hashedInput = crypto
        .createHash('sha256')
        .update(secret)
        .digest('hex');
    return hashedInput === hash;
};
