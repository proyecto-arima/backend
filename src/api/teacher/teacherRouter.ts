import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

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


  router.post('/', validateRequest(UserCreationSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.trace('[TeacherRouter] - [/] - Start');
      const teacher = req.body;
      logger.trace(`[TeacherRouter] - [/] - Creating teacher: ${JSON.stringify(teacher)}`);
      const createdTeacher = await teacherService.create(teacher);
      logger.trace(`[TeacherRouter] - [/] - Teacher created: ${JSON.stringify(createdTeacher)}`);
      const apiResponse = new ApiResponse(
        ResponseStatus.Success,
        'Teacher successfully created',
        createdTeacher,
        StatusCodes.CREATED
      );
      handleApiResponse(apiResponse, res);
    } catch (e) {
      logger.error(`[TeacherRouter] - [/] - Error: ${e}`);
      return next(e);
    } finally {
      logger.trace('[TeacherRouter] - [/] - End');
    }
  });

  return router;
})();
