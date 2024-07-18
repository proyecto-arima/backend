import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { SessionToken, SessionTokenSchema, UserLoginSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { INVALID_CREDENTIALS, UNAUTHORIZED, UNEXPECTED_ERROR } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';

import { InvalidCredentialsError, PasswordResetSchema } from './authModel';
import { authService } from './authService';

export const authRegistry = new OpenAPIRegistry();

authRegistry.register('Auth', UserLoginSchema);

export const authRouter: Router = (() => {
  const router = express.Router();

  authRegistry.registerPath({
    method: 'post',
    path: '/auth/reset',
    tags: ['Authentication'],
    request: { body: { content: { 'application/json': { schema: PasswordResetSchema.shape.body } }, description: '' } },
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
    '/reset',
    validateRequest(PasswordResetSchema),
    sessionMiddleware,
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        return next(UNAUTHORIZED);
      }
      try {
        await authService.resetPassword(sessionContext?.user?.id, req.body);
        const response = new ApiResponse(ResponseStatus.Success, 'Password reset successfully', null, StatusCodes.OK);
        return handleApiResponse(response, res);
      } catch (ex) {
        if (ex instanceof InvalidCredentialsError) {
          return next(INVALID_CREDENTIALS);
        }
        return next(UNEXPECTED_ERROR(ex));
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
      return next(UNEXPECTED_ERROR(ex));
    }
  });

  router.delete('/', sessionMiddleware, async (req: Request, res: Response) => {
    res.clearCookie('access_token');
    const response = new ApiResponse(ResponseStatus.Success, 'User logged out', null, StatusCodes.OK);
    return handleApiResponse(response, res);
  });

  return router;
})();
