import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/validators';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.error('Error:', err);

    if (err instanceof ValidationError) {
        res.status(400).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
        return;
    }

    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
};
