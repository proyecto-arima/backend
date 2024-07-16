import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';

import { UserCreationSchema, UserDTOSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleServiceResponse, validateRequest } from '@/common/utils/httpHandlers';

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

  router.post('/', validateRequest(UserCreationSchema), async (req: Request, res: Response) => {
    const serviceResponse = await adminService.create(req.body);
    handleServiceResponse(serviceResponse, res);
  });

  return router;
})();
