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

import { InvalidCredentialsError, PasswordResetSchema, PasswordSetSchema } from './authModel';
import { authService } from './authService';

import { logger } from '@/common/utils/serverLogger';

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
      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        return next(UNAUTHORIZED);
      }
      try {
        await authService.passwordSetAtFirstLogin(sessionContext?.user?.id, req.body);
        const response = new ApiResponse(ResponseStatus.Success, 'Password set successfully', null, StatusCodes.OK);
        return handleApiResponse(response, res);
      } catch (ex) {
        // logger.error(ex);
        console.error(ex);
        if (ex instanceof InvalidCredentialsError) {
          return next(INVALID_CREDENTIALS);
        }
        return next(UNEXPECTED_ERROR);
      }
    }
  );

  router.post(
    '/resetPassword',
    validateRequest(PasswordResetSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      try {
        await authService.passwordResetRequest(req.body.email);
        const response = new ApiResponse(ResponseStatus.Success, 'Password reset successfully', null, StatusCodes.OK);
        return handleApiResponse(response, res);
      } catch (ex) {
        if (ex instanceof TokenExpiredError) {
          return next(TokenExpiredError);
        }
        return next(UNEXPECTED_ERROR);
      }
    }
  );

  router.post('/', validateRequest(UserLoginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session: SessionToken = await authService.login(req.body);
      res.cookie('access_token', session.access_token, { httpOnly: true, maxAge: 12 * 60 * 60 * 1000 });
      const response = new ApiResponse(ResponseStatus.Success, 'User logged in', session, StatusCodes.OK);
      handleApiResponse(response, res);
    } catch (ex: unknown) {
      if (ex instanceof InvalidCredentialsError) {
        return next(INVALID_CREDENTIALS);
      }
      return next(UNEXPECTED_ERROR);
    }
  });

  router.delete('/', sessionMiddleware, async (req: Request, res: Response) => {
    res.clearCookie('access_token');
    const response = new ApiResponse(ResponseStatus.Success, 'User logged out', null, StatusCodes.OK);
    return handleApiResponse(response, res);
  });

  return router;
})();
