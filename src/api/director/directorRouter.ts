import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { UserCreationSchema, UserDTO, UserDTOSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

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
    try {
      logger.trace('[DirectorRouter] - [/] - Start');
      logger.trace(`[DirectorRouter] - [/] - Request to create director: ${JSON.stringify(req.body)}`);
      const userDTO: UserDTO = await directorService.create(req.body);
      logger.trace(`[DirectorRouter] - [/] - Director created: ${JSON.stringify(userDTO)}. Sending response`);
      const apiResponse = new ApiResponse(
        ResponseStatus.Success,
        'Director created successfully',
        userDTO,
        StatusCodes.CREATED
      );
      handleApiResponse(apiResponse, res);
    } catch (error) {
      logger.error(`[DirectorRouter] - [/] - Error: ${error}`);
      const apiError = new ApiError('Failed to create director', StatusCodes.INTERNAL_SERVER_ERROR, error);
      return res.status(apiError.statusCode).json(apiError);
    } finally {
      logger.trace('[DirectorRouter] - [/] - End');
    }
  });

  return router;
})();
