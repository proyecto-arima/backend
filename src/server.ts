import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';

import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter';
import { userRouter } from '@/api/user/userRouter';
import { openAPIRouter } from '@/api-docs/openAPIRouter';
import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';

import { authRouter } from './api/auth/authRouter';
import { studentRouter } from './api/student/studentRouter';
import { sessionMiddleware } from './common/middleware/session';
import { config } from './common/utils/config';

const logger = pino({ name: 'server start', level: 'debug' });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);
app.use(express.json());
app.use(cookieParser());

// Middlewares
app.use(cors({ origin: config.cors_origin, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health-check', healthCheckRouter);
app.use('/users', sessionMiddleware, userRouter);
app.use('/auth', authRouter);
app.use('/students', studentRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

app.use((_req, res, next, err) => {
  logger.error(`Unhandled error: ${err}`);
  res.status(500).send('Internal Server Error');
});

export { app, logger };
