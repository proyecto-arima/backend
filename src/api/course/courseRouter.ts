import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ContentCreationSchema } from '@/api/course/content/contentModel';
import { ContentDTOSchema } from '@/api/course/content/contentModel';
import {
  AddStudentsSchema,
  CourseCreationSchema,
  CourseDTO,
  CourseDTOSchema,
  GetCourseSchema,
} from '@/api/course/courseModel';
import { courseService } from '@/api/course/courseService';
import { SectionCreationSchema, SectionDTOSchema } from '@/api/course/section/sectionModel';
import { StudentDTOSchema } from '@/api/student/studentModel';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { checkSessionContext } from '@/common/middleware/checkSessionContext';
import { hasAccessToCourseMiddleware } from '@/common/middleware/hasAccessToCourse';
import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { Role } from '@/common/models/role';
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
  router.post(
    '/create',
    sessionMiddleware,
    checkSessionContext,
    roleMiddleware([Role.TEACHER]),
    validateRequest(CourseCreationSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const sessionContext = req.sessionContext;

      try {
        logger.trace('[CourseRouter] - [/create] - Start');
        logger.trace('[CourseRouter] - [/create] - Creating course...');

        const courseData = {
          ...req.body,
          teacherId: sessionContext?.user?.id,
        };

        const createdCourse: CourseDTO = await courseService.create(courseData);
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

  courseRegistry.registerPath({
    method: 'get',
    path: '/courses/{id}',
    tags: ['Course'],
    request: { params: GetCourseSchema.shape.params },
    responses: createApiResponse(CourseDTOSchema, 'Success'),
  });
  router.get(
    '/:id',
    sessionMiddleware,
    checkSessionContext,
    hasAccessToCourseMiddleware('id'),
    roleMiddleware([Role.TEACHER, Role.STUDENT]),
    validateRequest(GetCourseSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
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
    }
  );

  courseRegistry.registerPath({
    method: 'post',
    path: '/courses/{courseId}/section',
    tags: ['Course'],
    request: {
      params: SectionCreationSchema.shape.params,
      body: { content: { 'application/json': { schema: SectionCreationSchema.shape.body } }, description: '' },
    },
    responses: createApiResponse(CourseDTOSchema, 'Success'),
  });
  router.post(
    '/:courseId/section',
    sessionMiddleware,
    checkSessionContext,
    hasAccessToCourseMiddleware('courseId'),
    roleMiddleware([Role.TEACHER]),
    validateRequest(SectionCreationSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { courseId } = req.params;
      const sectionData = req.body;

      try {
        logger.trace('[CourseRouter] - [/:courseId/section] - Start');
        const courseReq = GetCourseSchema.parse({ params: req.params });
        logger.trace(`[CourseRouter] - [/:courseId/section] - Retrieving course with id: ${courseReq.params.id}...`);

        const updatedCourse = await courseService.addSectionToCourse(courseId, sectionData);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Section added to course successfully',
          updatedCourse,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        logger.error(`[CourseRouter] - [/:courseId/section] - Error: ${e}`);
        const apiError = new ApiError('Failed to add section to course', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      } finally {
        logger.trace('[CourseRouter] - [/:courseId/section] - End');
      }
    }
  );

  courseRegistry.registerPath({
    method: 'get',
    path: '/courses/{id}/sections',
    tags: ['Course'],
    request: { params: GetCourseSchema.shape.params },
    responses: createApiResponse(z.array(SectionDTOSchema), 'Success'),
  });
  router.get(
    '/:id/sections',
    sessionMiddleware,
    checkSessionContext,
    hasAccessToCourseMiddleware('id'),
    roleMiddleware([Role.TEACHER, Role.STUDENT]),
    validateRequest(GetCourseSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;

      try {
        logger.trace('[CourseRouter] - [/:id/sections] - Start');
        const sections = await courseService.getSectionsOfCourse(id);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Sections retrieved successfully',
          sections,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        logger.error(`[CourseRouter] - [/:id/sections] - Error: ${e}`);
        const apiError = new ApiError('Failed to retrieve sections', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      } finally {
        logger.trace('[CourseRouter] - [/:id/sections] - End');
      }
    }
  );

  courseRegistry.registerPath({
    method: 'post',
    path: '/courses/{courseId}/sections/{sectionId}/content',
    tags: ['Course'],
    request: {
      params: ContentCreationSchema.shape.params,
      body: { content: { 'application/json': { schema: ContentCreationSchema.shape.body } }, description: '' },
    },
    responses: createApiResponse(ContentDTOSchema, 'Success'),
  });
  router.post(
    '/:courseId/sections/:sectionId/content',
    sessionMiddleware,
    checkSessionContext,
    hasAccessToCourseMiddleware('courseId'),
    roleMiddleware([Role.TEACHER]),
    validateRequest(ContentCreationSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { sectionId } = req.params;
      const contentData = req.body;

      try {
        logger.trace('[CourseRouter] - [/:courseId/sections/:sectionId/contents] - Start');

        const newContent = await courseService.addContentToSection(sectionId, contentData);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Content added to section successfully',
          newContent,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        logger.error(`[CourseRouter] - [/:courseId/sections/:sectionId/contents] - Error: ${e}`);
        const apiError = new ApiError('Failed to add content to section', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      } finally {
        logger.trace('[CourseRouter] - [/:courseId/sections/:sectionId/contents] - End');
      }
    }
  );

  courseRegistry.registerPath({
    method: 'post',
    path: '/courses/{courseId}/students',
    tags: ['Course'],
    request: {
      params: AddStudentsSchema.shape.params,
      body: { content: { 'application/json': { schema: AddStudentsSchema.shape.body } }, description: '' },
    },
    responses: createApiResponse(CourseDTOSchema, 'Success'),
  });
  router.post(
    '/:courseId/students',
    sessionMiddleware,
    checkSessionContext,
    roleMiddleware([Role.TEACHER]),
    validateRequest(AddStudentsSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { courseId } = req.params;
      const { studentEmails } = req.body;

      try {
        logger.trace('[CourseRouter] - [/:courseId/students] - Start');
        const updatedCourse = await courseService.addStudentsToCourse(courseId, studentEmails);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Students added to course successfully',
          updatedCourse,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        logger.error(`[CourseRouter] - [/:courseId/students] - Error: ${e}`);
        const apiError = new ApiError('Failed to add students to course', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      } finally {
        logger.trace('[CourseRouter] - [/:courseId/students] - End');
      }
    }
  );

  courseRegistry.registerPath({
    method: 'get',
    path: '/courses/{id}/students',
    tags: ['Course'],
    request: { params: GetCourseSchema.shape.params },
    responses: createApiResponse(z.array(StudentDTOSchema), 'Success'),
  });

  router.get(
    '/:id/students',
    sessionMiddleware,
    checkSessionContext,
    hasAccessToCourseMiddleware('id'),
    roleMiddleware([Role.TEACHER]),
    validateRequest(GetCourseSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;

      try {
        logger.trace('[CourseRouter] - [/:id/students] - Start');
        const students = await courseService.getStudentsOfCourse(id);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Students retrieved successfully',
          students,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        logger.error(`[CourseRouter] - [/:id/students] - Error: ${e}`);
        const apiError = new ApiError('Failed to retrieve students', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      } finally {
        logger.trace('[CourseRouter] - [/:id/students] - End');
      }
    }
  );

  return router;
})();
