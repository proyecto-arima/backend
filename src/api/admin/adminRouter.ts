import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { UserCreationSchema, UserDTO, UserDTOSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { sessionMiddleware } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

import { adminService } from './adminService';

export const adminRegistry = new OpenAPIRegistry();

adminRegistry.register('Admin', UserDTOSchema);

export const studentRouter: Router = (() => {
  const router = express.Router();

  adminRegistry.registerPath({
    method: 'post',
    path: '/admins/',
    tags: ['Admin'],
    request: { body: { content: { 'application/json': { schema: UserCreationSchema.shape.body } }, description: '' } },
    responses: createApiResponse(UserDTOSchema, 'Success'),
  });

  router.post(
    '/',
    validateRequest(UserCreationSchema),
    sessionMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        logger.trace('[AdminRouter] - [/] - Start');
        logger.trace('[AdminRouter] - [/] - Creating admin...');
        const userDto: UserDTO = await adminService.create(req.body);
        logger.trace(`[AdminRouter] - [/] - Admin created. Sending response`);
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Admin created successfully',
          userDto,
          StatusCodes.CREATED
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        logger.error(`[AdminRouter] - [/] - Error: ${error}`);
        const apiError = new ApiError('Failed to create admin', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      } finally {
        logger.trace('[AdminRouter] - [/] - End');
      }
    }
  );

  return router;
})();
