import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CourseCreationSchema, CourseDTO, CourseDTOSchema, GetCourseSchema } from '@/api/course/courseModel';
import { courseService } from '@/api/course/courseService';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

export const courseRegistry = new OpenAPIRegistry();
courseRegistry.register('Course', CourseDTOSchema);

export const courseRouter: Router = (() => {
  const router = express.Router();

  courseRegistry.registerPath({
    method: 'post',
    path: '/courses/create',
    tags: ['Course'],
    request: {
      body: { content: { 'application/json': { schema: CourseCreationSchema.shape.body } }, description: '' },
    },
    responses: createApiResponse(CourseDTOSchema, 'Success'),
  });

  courseRegistry.registerPath({
    method: 'get',
    path: '/courses/{id}',
    tags: ['Course'],
    request: { params: GetCourseSchema.shape.params },
    responses: createApiResponse(CourseDTOSchema, 'Success'),
  });

  router.post(
    '/create',
    validateRequest(CourseCreationSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        logger.trace('[CourseRouter] - [/create] - Start');
        logger.trace('[CourseRouter] - [/create] - Creating course...');
        const createdCourse: CourseDTO = await courseService.create(req.body);
        logger.trace(`[CourseRouter] - [/create] - Course created: ${JSON.stringify(createdCourse)}. Sending response`);
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Course created successfully',
          createdCourse,
          StatusCodes.CREATED
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        logger.error(`[CourseRouter] - [/create] - Error: ${error}`);
        const apiError = new ApiError('Failed to create course', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      } finally {
        logger.trace('[CourseRouter] - [/create] - End');
      }
    }
  );

  router.get('/:id', validateRequest(GetCourseSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.trace('[CourseRouter] - [/:id] - Start');
      const courseReq = GetCourseSchema.parse({ params: req.params });
      logger.trace(`[CourseRouter] - [/:id] - Retrieving course with id: ${courseReq.params.id}...`);
      const course: CourseDTO = await courseService.findById(courseReq.params.id.toString());
      logger.trace(`[CourseRouter] - [/:id] - Course found: ${JSON.stringify(course)}. Sending response`);
      const apiResponse = new ApiResponse(
        ResponseStatus.Success,
        'Course retrieved successfully',
        course,
        StatusCodes.OK
      );
      handleApiResponse(apiResponse, res);
    } catch (e) {
      logger.error(`[CourseRouter] - [/:id] - Error: ${e}`);
      const apiError = new ApiError('Failed to retrieve course', StatusCodes.INTERNAL_SERVER_ERROR, e);
      return next(apiError);
    } finally {
      logger.trace('[CourseRouter] - [/:id] - End');
    }
  });

  return router;
})();
