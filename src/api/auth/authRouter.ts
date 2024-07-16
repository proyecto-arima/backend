import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { SessionToken, SessionTokenSchema, UserLoginSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { handleServiceResponse, validateRequest } from '@/common/utils/httpHandlers';

import { userService } from '../user/userService';
import { PasswordResetSchema } from './authModel';
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
    path: '/auth/login',
    tags: ['Authentication'],
    request: { body: { content: { 'application/json': { schema: UserLoginSchema.shape.body } }, description: '' } },
    responses: createApiResponse(SessionTokenSchema, 'Success'),
  });

  authRegistry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Authentication'],
    responses: createApiResponse(z.object({}), 'Success'),
  });

  router.post(
    '/reset',
    validateRequest(PasswordResetSchema),
    sessionMiddleware,
    async (req: SessionRequest, res: Response) => {
      const sessionContext = req.sessionContext;
      if (!sessionContext) {
        return res.status(StatusCodes.UNAUTHORIZED).send('Unauthorized');
      }
      try {
        const response: ServiceResponse = await authService.resetPassword(sessionContext.userId, req.body);
        return handleServiceResponse(response, res);
      } catch (ex) {
        const errorMessage = `Error resetting password: ${(ex as Error).message}`;
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(errorMessage);
      }
    }
  );

  router.post('/login', validateRequest(UserLoginSchema), async (req: Request, res: Response) => {
    try {
      const session: SessionToken = await userService.login(req.body);
      res.cookie('access_token', session.access_token, { httpOnly: true, maxAge: 12 * 60 * 60 * 1000 });
      const response = new ServiceResponse(ResponseStatus.Success, 'User logged in', session, StatusCodes.OK);
      handleServiceResponse(response, res);
    } catch (ex) {
      // Specify class
      if (ex instanceof Error) {
        const errorResponse = new ServiceResponse(ResponseStatus.Failed, ex.message, null, StatusCodes.UNAUTHORIZED);
        return handleServiceResponse(errorResponse, res);
      }
    }
  });

  router.post('/logout', sessionMiddleware, async (req: Request, res: Response) => {
    res.clearCookie('access_token');
    const response = new ServiceResponse(ResponseStatus.Success, 'User logged out', null, StatusCodes.OK);
    return handleServiceResponse(response, res);
  });

  return router;
})();
