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
      const users: UserDTO[] = await userService.findAll();
      const apiResponse = new ApiResponse(
        ResponseStatus.Success,
        'Users retrieved successfully',
        users,
        StatusCodes.OK
      );
      handleApiResponse(apiResponse, res);
    } catch (error) {
      const apiError = new ApiError('Failed to retrieve users', StatusCodes.INTERNAL_SERVER_ERROR, error);
      return next(apiError);
    }
  });

  router.get('/:id', validateRequest(GetUserSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userReq = GetUserSchema.parse({ params: req.params });
      const user: UserDTO = await userService.findById(userReq.params.id.toString());
      const apiResponse = new ApiResponse(ResponseStatus.Success, 'User retrieved successfully', user, StatusCodes.OK);
      handleApiResponse(apiResponse, res);
    } catch (e) {
      if (e instanceof UserNotFoundError) {
        const apiResponse = new ApiResponse(ResponseStatus.Failed, 'User not found', null, StatusCodes.NOT_FOUND);
        return handleApiResponse(apiResponse, res);
      }
      return next(new ApiError('Failed to retrieve user', StatusCodes.INTERNAL_SERVER_ERROR, e));
    }
  });

  return router;
})();
