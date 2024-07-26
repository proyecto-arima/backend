import { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CourseDTO, CourseModel } from '@/api/course/courseModel';
import { UserDTO } from '@/api/user/userModel';
import { SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { Role } from '@/common/models/role';
import { logger } from '@/common/utils/serverLogger';

const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);

export const hasAccessToCourseMiddleware = (courseIdParam: string) => {
  return async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      const courseId: string = req.params[courseIdParam];

      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        logger.trace('[AuthRouter] - [/setPassword] - Session context is missing, sending error response');
        return next(UNAUTHORIZED);
      }

      if (!courseId) {
        throw new ApiError('Course ID is required', 400);
      }

      const course = await CourseModel.findById(courseId).exec();
      if (!course) {
        throw new ApiError('Course not found', 404);
      }

      const hasAccess = (user: UserDTO, course: CourseDTO): boolean => {
        if (user.role === Role.TEACHER) {
          return course.teacherId === user.id;
        } else if (user.role === Role.STUDENT) {
          return course.students.some((student) => student.id === user.id);
        }
        return false; // En caso de roles desconocidos
      };

      if (!hasAccess(sessionContext?.user, course.toDto())) {
        throw new ApiError('Access denied', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
