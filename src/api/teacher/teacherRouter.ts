import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';

import { UserCreationSchema, UserDTOSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleServiceResponse, validateRequest } from '@/common/utils/httpHandlers';

import { teacherService } from './teacherService';

export const studentRegistry = new OpenAPIRegistry();

studentRegistry.register('Student', UserDTOSchema);

export const studentRouter: Router = (() => {
  const router = express.Router();

  studentRegistry.registerPath({
    method: 'post',
    path: '/teachers/',
    tags: ['Teacher'],
    request: { body: { content: { 'application/json': { schema: UserCreationSchema.shape.body } }, description: '' } },
    responses: createApiResponse(UserDTOSchema, 'Success'),
  });

  router.post('/', validateRequest(UserCreationSchema), async (req: Request, res: Response) => {
    const serviceResponse = await teacherService.create(req.body);
    handleServiceResponse(serviceResponse, res);
  });

  return router;
})();
