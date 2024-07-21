import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TokenExpiredError } from 'jsonwebtoken';
import { z } from 'zod';

import { SessionToken, SessionTokenSchema, UserLoginSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

import { InvalidCredentialsError, PasswordResetSchema, PasswordSetSchema } from './authModel';
import { authService } from './authService';

export const authRegistry = new OpenAPIRegistry();

authRegistry.register('Auth', UserLoginSchema);

export const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);
export const INVALID_CREDENTIALS = new ApiError('Invalid credentials', StatusCodes.UNAUTHORIZED);
export const UNEXPECTED_ERROR = new ApiError('An unexpected error occurred', StatusCodes.INTERNAL_SERVER_ERROR);

export const authRouter: Router = (() => {
  const router = express.Router();

  authRegistry.registerPath({
    method: 'post',
    path: '/auth/setPassword',
    tags: ['Authentication'],
    request: { body: { content: { 'application/json': { schema: PasswordSetSchema.shape.body } }, description: '' } },
    responses: createApiResponse(z.object({}), 'Success'),
  });

  authRegistry.registerPath({
    method: 'post',
    path: '/auth',
    tags: ['Authentication'],
    request: { body: { content: { 'application/json': { schema: UserLoginSchema.shape.body } }, description: '' } },
    responses: createApiResponse(SessionTokenSchema, 'Success'),
  });

  authRegistry.registerPath({
    method: 'delete',
    path: '/auth',
    tags: ['Authentication'],
    responses: createApiResponse(z.object({}), 'Success'),
  });

  router.post(
    '/setPassword',
    validateRequest(PasswordSetSchema),
    sessionMiddleware,
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      logger.trace('[AuthRouter] - [/setPassword] - Start');
      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        logger.trace('[AuthRouter] - [/setPassword] - Session context is missing, sending error response');
        return next(UNAUTHORIZED);
      }
      try {
        logger.trace('[AuthRouter] - [/setPassword] - Setting password...');
        await authService.passwordSetAtFirstLogin(sessionContext?.user?.id, req.body);
        logger.trace('[AuthRouter] - [/setPassword] - Password set successfully');
        const response = new ApiResponse(ResponseStatus.Success, 'Password set successfully', null, StatusCodes.OK);
        return handleApiResponse(response, res);
      } catch (ex) {
        logger.trace(`[AuthRouter] - [/setPassword] - Error: ${ex}`);
        if (ex instanceof InvalidCredentialsError) {
          logger.trace('[AuthRouter] - [/setPassword] - Invalid credentials');
          return next(INVALID_CREDENTIALS);
        }
        return next(UNEXPECTED_ERROR);
      } finally {
        logger.trace('[AuthRouter] - [/setPassword] - End');
      }
    }
  );

  router.post(
    '/resetPassword',
    validateRequest(PasswordResetSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      logger.trace('[AuthRouter] - [/resetPassword] - Start');
      try {
        logger.trace('[AuthRouter] - [/resetPassword] - Requesting password reset...');
        await authService.passwordResetRequest(req.body.email);
        logger.trace('[AuthRouter] - [/resetPassword] - Password reset requested successfully');
        const response = new ApiResponse(ResponseStatus.Success, 'Password reset successfully', null, StatusCodes.OK);
        return handleApiResponse(response, res);
      } catch (ex) {
        logger.trace(`[AuthRouter] - [/resetPassword] - Error: ${ex}`);
        if (ex instanceof TokenExpiredError) {
          logger.trace('[AuthRouter] - [/resetPassword] - Token expired');
          return next(TokenExpiredError);
        }
        return next(UNEXPECTED_ERROR);
      } finally {
        logger.trace('[AuthRouter] - [/resetPassword] - End');
      }
    }
  );

  router.post('/', validateRequest(UserLoginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.trace('[AuthRouter] - [/] - Start');
      const session: SessionToken = await authService.login(req.body);
      logger.trace('[AuthRouter] - [/] - User logged in');
      logger.trace('[AuthRouter] - [/] - Setting access token cookie');
      res.cookie('access_token', session.access_token, { httpOnly: true, maxAge: 12 * 60 * 60 * 1000 });
      logger.trace('[AuthRouter] - [/] - Sending response');
      const response = new ApiResponse(ResponseStatus.Success, 'User logged in', session, StatusCodes.OK);
      handleApiResponse(response, res);
    } catch (ex: unknown) {
      logger.trace(`[AuthRouter] - [/] - Error: ${ex}`);
      if (ex instanceof InvalidCredentialsError) {
        logger.trace('[AuthRouter] - [/] - Invalid credentials');
        return next(INVALID_CREDENTIALS);
      }
      logger.trace('[AuthRouter] - [/] - Unexpected error');
      return next(UNEXPECTED_ERROR);
    } finally {
      logger.trace('[AuthRouter] - [/] - End');
    }
  });

  router.delete('/', sessionMiddleware, async (req: Request, res: Response) => {
    logger.trace('[AuthRouter] - [/] - Start');
    logger.trace('[AuthRouter] - [/] - Clearing access token from cookie');
    res.clearCookie('access_token');
    logger.trace('[AuthRouter] - [/] - Sending response');
    const response = new ApiResponse(ResponseStatus.Success, 'User logged out', null, StatusCodes.OK);
    return handleApiResponse(response, res);
  });

  return router;
})();
