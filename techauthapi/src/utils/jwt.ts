import jwt from 'jsonwebtoken';
import { logger } from './logger';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JWTPayload {
    userId: string;
    email?: string;
    projectId?: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
    try {
        return jwt.sign(payload, ACCESS_SECRET, {
            expiresIn: ACCESS_EXPIRES_IN as string,
        } as jwt.SignOptions);
    } catch (error) {
        logger.error('Error generating access token:', error);
        throw new Error('Failed to generate access token');
    }
};

export const generateRefreshToken = (payload: JWTPayload): string => {
    try {
        return jwt.sign(payload, REFRESH_SECRET, {
            expiresIn: REFRESH_EXPIRES_IN as string,
        } as jwt.SignOptions);
    } catch (error) {
        logger.error('Error generating refresh token:', error);
        throw new Error('Failed to generate refresh token');
    }
};

export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Access token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid access token');
        }
        throw new Error('Token verification failed');
    }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        throw new Error('Token verification failed');
    }
};

export const decodeToken = (token: string): JWTPayload | null => {
    try {
        return jwt.decode(token) as JWTPayload;
    } catch (error) {
        logger.error('Error decoding token:', error);
        return null;
    }
};

// Helper to extract expiration time in seconds
export const getExpirationTime = (expiresIn: string): number => {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 60 * 60;
        case 'd': return value * 24 * 60 * 60;
        default: return 900; // 15 minutes default
    }
};

export const getAccessTokenExpiresIn = (): number => {
    return getExpirationTime(ACCESS_EXPIRES_IN);
};
