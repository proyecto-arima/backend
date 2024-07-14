import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { z } from 'zod';

import { GetUserSchema, UserDTOSchema } from '@/api/user/userModel';
import { userService } from '@/api/user/userService';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleServiceResponse, validateRequest } from '@/common/utils/httpHandlers';

export const userRegistry = new OpenAPIRegistry();

userRegistry.register('User', UserDTOSchema);

export const userRouter: Router = (() => {
  const router = express.Router();

  // Path
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

  // Router
  router.get('/', async (_req: Request, res: Response) => {
    const serviceResponse = await userService.findAll();
    handleServiceResponse(serviceResponse, res);
  });

  router.get('/:id', validateRequest(GetUserSchema), async (req: Request, res: Response) => {
    const user = GetUserSchema.parse({ params: req.params });
    const serviceResponse = await userService.findById(user.params.id);
    handleServiceResponse(serviceResponse, res);
  });

  return router;
})();
