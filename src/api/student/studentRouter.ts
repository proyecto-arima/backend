import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { UserCreationSchema, UserDTO, UserDTOSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';

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
    const userDTO: UserDTO = await studentService.create(req.body);
    const apiResponse = new ApiResponse(
      ResponseStatus.Success,
      'Student created successfully',
      userDTO,
      StatusCodes.CREATED
    );
    handleApiResponse(apiResponse, res);
  });

  return router;
})();
