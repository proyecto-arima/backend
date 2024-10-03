import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { SurveyCreationSchema, SurveyDTOSchema } from '@/api/survey/surveyModel';
import { surveyService } from '@/api/survey/surveyService';
import { userService } from '@/api/user/userService';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { Role } from '@/common/models/role';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';

const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);

export const surveyRegistry = new OpenAPIRegistry();
surveyRegistry.register('Survey', SurveyDTOSchema);

export const surveyRouter: Router = (() => {
  const router = express.Router();

  surveyRegistry.registerPath({
    method: 'post',
    path: '/survey/',
    tags: ['Survey'],
    request: {
      body: { content: { 'application/json': { schema: SurveyCreationSchema.shape.body } }, description: '' },
    },
    responses: createApiResponse(z.object({}), 'Success'),
  });
  router.post(
    '/',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER, Role.STUDENT]),
    validateRequest(SurveyCreationSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const answers = req.body.answers;
      const free = req.body.free;

      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        return next(UNAUTHORIZED);
      }

      const userId = sessionContext.user.id;
      const role = sessionContext.user.role;

      try {
        // Verificar si el usuario ya respondió la encuesta
        let existingSurvey;
        if (role === 'TEACHER') {
          existingSurvey = await surveyService.findTeacherSurveyByUserId(userId);
        } else {
          existingSurvey = await surveyService.findStudentSurveyByUserId(userId);
        }

        // Si existe una encuesta, actualizarla
        if (existingSurvey) {
          existingSurvey.answers = answers;
          existingSurvey.free = free;
          await existingSurvey.save();
        } else {
          if (role === 'TEACHER') {
            await surveyService.createTeacherSurvey(userId, answers, free);
          } else {
            await surveyService.createStudentSurvey(userId, answers, free);
          }
        }
        // Calcular la fecha dentro de un mes
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1); // Agregar un mes a la fecha actual
        await userService.updateNextDateSurvey(userId, nextMonthDate);

        const apiResponse = new ApiResponse(ResponseStatus.Success, 'Survey saved successfully', null, StatusCodes.OK);
        handleApiResponse(apiResponse, res);
      } catch (error) {
        const apiError = new ApiError('Failed to save survey', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  router.get(
    '/student-results',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      try {
        const { courseId, dateFrom, dateTo } = req.query;

        // Llamar al servicio con los filtros
        const responses = await surveyService.calculateStudentsSurveyResults(
          courseId as string,
          dateFrom as string,
          dateTo as string
        );

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Results retrieved successfully',
          responses,
          StatusCodes.OK
        );
        res.status(StatusCodes.OK).json(apiResponse);
      } catch (error) {
        const apiError = new ApiError('Failed to calculate survey results', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  router.get(
    '/teacher-results',
    sessionMiddleware,
    roleMiddleware([Role.DIRECTOR]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      try {
        const responses = await surveyService.calculateTeachersSurveyResults();

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Results retrieved successfully',
          responses,
          StatusCodes.OK
        );
        res.status(StatusCodes.OK).json(apiResponse);
      } catch (error) {
        const apiError = new ApiError('Failed to calculate survey results', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  return router;
})();
