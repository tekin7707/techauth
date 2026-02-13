import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import prisma from './config/database';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    logger.info(`🚀 Auth Service running on port ${PORT}`);
    logger.info(`📧 SMTP configured: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    logger.info(`🗄️  Database: ${process.env.DATABASE_URL?.split('@')[1] || 'connected'}`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal, closing server...');

    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            await prisma.$disconnect();
            logger.info('Database connection closed');

            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown();
});
