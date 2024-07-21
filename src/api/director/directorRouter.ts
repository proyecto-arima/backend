import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { UserCreationSchema, UserDTO, UserDTOSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';

import { directorService } from './directorService';

export const directorRegistry = new OpenAPIRegistry();

directorRegistry.register('Director', UserDTOSchema);

export const directorRouter: Router = (() => {
  const router = express.Router();

  directorRegistry.registerPath({
    method: 'post',
    path: '/directors/',
    tags: ['Director'],
    request: { body: { content: { 'application/json': { schema: UserCreationSchema.shape.body } }, description: '' } },
    responses: createApiResponse(UserDTOSchema, 'Success'),
  });

  router.post('/', validateRequest(UserCreationSchema), async (req: Request, res: Response) => {
    const userDTO: UserDTO = await directorService.create(req.body);
    const apiResponse = new ApiResponse(
      ResponseStatus.Success,
      'Director created successfully',
      userDTO,
      StatusCodes.CREATED
    );
    handleApiResponse(apiResponse, res);
  });

  return router;
})();
