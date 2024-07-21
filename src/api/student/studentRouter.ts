import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { UserCreationSchema, UserDTO, UserDTOSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

import { studentService } from './studentService';

export const studentRegistry = new OpenAPIRegistry();

studentRegistry.register('Student', UserDTOSchema);

export const studentRouter: Router = (() => {
  const router = express.Router();

  studentRegistry.registerPath({
    method: 'post',
    path: '/students/',
    tags: ['Student'],
    request: { body: { content: { 'application/json': { schema: UserCreationSchema.shape.body } }, description: '' } },
    responses: createApiResponse(UserDTOSchema, 'Success'),
  });

  router.post('/', validateRequest(UserCreationSchema), async (req: Request, res: Response) => {
    try {
      logger.trace('[StudentRouter] - [/] - Start');
      logger.trace(`[StudentRouter] - [/] - Request to create student: ${JSON.stringify(req.body)}`);
      const userDTO: UserDTO = await studentService.create(req.body);
      logger.trace(`[StudentRouter] - [/] - Student created: ${JSON.stringify(userDTO)}. Sending response`);
      const apiResponse = new ApiResponse(
        ResponseStatus.Success,
        'Student created successfully',
        userDTO,
        StatusCodes.CREATED
      );
      handleApiResponse(apiResponse, res);
    } catch (error) {
      logger.error(`[StudentRouter] - [/] - Error: ${error}`);
      const apiError = new ApiError('Failed to create student', StatusCodes.INTERNAL_SERVER_ERROR, error);
      return res.status(apiError.statusCode).json(apiError);
    } finally {
      logger.trace('[StudentRouter] - [/] - End');
    }
  });

  return router;
})();
