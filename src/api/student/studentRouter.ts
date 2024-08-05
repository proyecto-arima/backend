import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { CourseDTOSchema, CourseModel } from '@/api/course/courseModel';
import { UserCreationSchema, UserDTO, UserDTOSchema } from '@/api/user/userModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { checkSessionContext } from '@/common/middleware/checkSessionContext';
import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { LearningProfile } from '@/common/models/learningProfile';
import { Role } from '@/common/models/role';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

import { studentService } from './studentService';

export const studentRegistry = new OpenAPIRegistry();

studentRegistry.register('Student', UserDTOSchema);
studentRegistry.register('Course', CourseDTOSchema);

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

  studentRegistry.registerPath({
    method: 'get',
    path: '/me/courses/',
    tags: ['Student'],
    responses: createApiResponse(z.array(CourseDTOSchema), 'Success'),
  });

  router.get(
    '/me/courses',
    sessionMiddleware,
    checkSessionContext,
    roleMiddleware([Role.STUDENT]),

    async (req: SessionRequest, res: Response, next: NextFunction) => {
      try {
        const sessionContext = req.sessionContext;

        logger.trace(
          `[StudentRouter] - [/me/courses] - Retrieving courses for student with id: ${sessionContext?.user?.id}`
        );

        // Buscar todos los cursos donde el id del estudiante está en el array de students
        const courses = await CourseModel.find({ 'students.id': sessionContext?.user?.id }).exec();
        logger.trace(`[StudentRouter] - [/me/courses] - Found courses: ${JSON.stringify(courses)}`);

        // Convertir los cursos a su formato DTO
        const coursesDTO = courses.map((course) => course.toDto());

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Courses retrieved successfully',
          coursesDTO,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        logger.error(`[StudentRouter] - [/me/courses] - Error: ${error}`);
        const apiError = new ApiError('Failed to retrieve courses', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  studentRegistry.registerPath({
    method: 'get',
    path: '/:id/learning-profile',
    tags: ['Student'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Student ID',
      },
    ],
    responses: createApiResponse(z.object({ learningProfile: z.nativeEnum(LearningProfile) }), 'Success'),
  });

  router.get(
    '/:id/learning-profile',

    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const studentId = req.params.id;
        logger.trace(
          `[StudentRouter] - [/students/:id/learning-profile] - Retrieving learning profile for student with id: ${studentId}`
        );

        const learningProfile = await studentService.getLearningProfile(studentId);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Learning profile retrieved successfully',
          { learningProfile },
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        logger.error(`[StudentRouter] - [/students/:id/learning-profile] - Error: ${error}`);
        const apiError = new ApiError('Failed to retrieve learning profile', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  return router;
})();
