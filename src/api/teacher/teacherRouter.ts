import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CourseDTO } from '@/api/course/courseModel';
import { courseService } from '@/api/course/courseService';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { Role } from '@/common/models/role';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

import { UserCreationSchema, UserDTOSchema } from '../user/userModel';
import { teacherService } from './teacherService';

const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);

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

  router.get(
    '/me/courses',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),

    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        logger.trace('[TeacherRouter] - [/me/courses] - Session context is missing, sending error response');
        return next(UNAUTHORIZED);
      }

      try {
        logger.trace('[TeacherRouter] - [/me/courses] - Start');
        const teacherId = sessionContext.user.id;

        logger.trace(`[TeacherRouter] - [/me/courses] - Retrieving courses for teacher with id: ${teacherId}...`);
        const courses: CourseDTO[] = await courseService.findCoursesByTeacherId(teacherId);
        logger.trace(`[TeacherRouter] - [/me/courses] - Courses found: ${JSON.stringify(courses)}. Sending response`);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Courses retrieved successfully',
          courses,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        if (e instanceof ApiError) {
          logger.warn(`[TeacherRouter] - [/me/courses] - ApiError: ${e.message}`);
          return next(e);
        } else {
          logger.error(`[TeacherRouter] - [/me/courses] - Error: ${e}`);
          const apiError = new ApiError('Failed to retrieve courses', StatusCodes.INTERNAL_SERVER_ERROR, e);
          return next(apiError);
        }
      } finally {
        logger.trace('[TeacherRouter] - [/me/courses] - End');
      }
    }
  );

  return router;
})();
