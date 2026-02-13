import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { logger } from './utils/logger';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
    stream: {
        write: (message: string) => logger.info(message.trim()),
    },
}));

// Root health check for deployment platforms (like Replit)
app.get('/', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Auth Service is healthy',
    });
});

// Routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
