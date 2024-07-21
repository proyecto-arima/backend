import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';

import { UserCreationSchema, UserDTOSchema } from '../user/userModel';
import { teacherService } from './teacherService';

export const teacherRegistry = new OpenAPIRegistry();

teacherRegistry.register('Teacher', UserDTOSchema);

export const teacherRouter: Router = (() => {
  const router = express.Router();

  teacherRegistry.registerPath({
    method: 'post',
    path: '/teachers/',
    tags: ['Teacher'],
    request: { body: { content: { 'application/json': { schema: UserCreationSchema.shape.body } }, description: '' } },
    responses: createApiResponse(UserDTOSchema, 'Success'),
  });

  router.post('/', validateRequest(UserCreationSchema), async (req: Request, res: Response) => {
    console.log('entro al post router');
    const serviceResponse = await teacherService.create(req.body);
    handleApiResponse(serviceResponse, res);
  });

  return router;
})();
