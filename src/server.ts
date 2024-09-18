import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { adminRouter } from '@/api/admin/adminRouter';
import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter';
import { userRouter } from '@/api/user/userRouter';
import { openAPIRouter } from '@/api-docs/openAPIRouter';
import { errorHandler, unexpectedRequest } from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/utils/requestLogger';

import { authRouter } from './api/auth/authRouter';
import { contentRouter } from './api/course/content/contentRouter';
import { courseRouter } from './api/course/courseRouter';
import { directorRouter } from './api/director/directorRouter';
import { imagesRouter } from './api/images/imagesRouter';
import { instituteRouter } from './api/institute/instituteRouter';
import { testRouter } from './api/learningTest/testRouter';
import { studentRouter } from './api/student/studentRouter';
import { teacherRouter } from './api/teacher/teacherRouter';
import { sessionMiddleware } from './common/middleware/session';
import { config } from './common/utils/config';

const app: Express = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);
app.use(
  express.json({
    limit: '10mb',
  })
);
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

app.use('/admins', adminRouter);
app.use('/auth', authRouter);
app.use('/students', studentRouter);
app.use('/teachers', teacherRouter);
app.use('/directors', sessionMiddleware, directorRouter);
app.use('/courses', courseRouter);
app.use('/contents', contentRouter);
app.use('/test', testRouter);
app.use('/institutes', sessionMiddleware, instituteRouter);
app.use('/images', sessionMiddleware, imagesRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());
app.use('*', unexpectedRequest);

export { app };
