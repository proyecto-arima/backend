import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { GetUserSchema, UserDTO, UserDTOSchema } from '@/api/user/userModel';
import { userService } from '@/api/user/userService';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

import { UserNotFoundError } from '../auth/authModel';

export const userRegistry = new OpenAPIRegistry();
userRegistry.register('User', UserDTOSchema);

export const userRouter: Router = (() => {
  const router = express.Router();

  userRegistry.registerPath({
    method: 'get',
    path: '/users',
    tags: ['User'],
    responses: createApiResponse(z.array(UserDTOSchema), 'Success'),
  });

  userRegistry.registerPath({
    method: 'get',
    path: '/users/{id}',
    tags: ['User'],
    request: { params: GetUserSchema.shape.params },
    responses: createApiResponse(UserDTOSchema, 'Success'),
  });

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      logger.trace('[UserRouter] - [/] - Start');
      logger.trace('[UserRouter] - [/] - Retrieving users...');
      const users: UserDTO[] = await userService.findAll();
      logger.trace(`[UserRouter] - [/] - ${users.length} users found}. Sending response`);
      const apiResponse = new ApiResponse(
        ResponseStatus.Success,
        'Users retrieved successfully',
        users,
        StatusCodes.OK
      );
      handleApiResponse(apiResponse, res);
    } catch (error) {
      logger.error(`[UserRouter] - [/] - Error: ${error}`);
      const apiError = new ApiError('Failed to retrieve users', StatusCodes.INTERNAL_SERVER_ERROR, error);
      return next(apiError);
    } finally {
      logger.trace('[UserRouter] - [/] - End');
    }
  });

  router.get('/:id', validateRequest(GetUserSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.trace('[UserRouter] - [/:id] - Start');
      const userReq = GetUserSchema.parse({ params: req.params });
      logger.trace(`[UserRouter] - [/:id] - Retrieving user with id: ${userReq.params.id}...`);
      const user: UserDTO = await userService.findById(userReq.params.id.toString());
      logger.trace(`[UserRouter] - [/:id] - User found: ${JSON.stringify(user)}. Sending response`);
      const apiResponse = new ApiResponse(ResponseStatus.Success, 'User retrieved successfully', user, StatusCodes.OK);
      handleApiResponse(apiResponse, res);
    } catch (e) {
      logger.error(`[UserRouter] - [/:id] - Error: ${e}`);
      if (e instanceof UserNotFoundError) {
        logger.error(`[UserRouter] - [/:id] - User not found`);
        const apiError = new ApiError('User not found', StatusCodes.NOT_FOUND, e);
        return next(apiError);
      }
      logger.error(`[UserRouter] - [/:id] - Failed to retrieve user`);
      return next(new ApiError('Failed to retrieve user', StatusCodes.INTERNAL_SERVER_ERROR, e));
    } finally {
      logger.trace('[UserRouter] - [/:id] - End');
    }
  });

  return router;
})();
