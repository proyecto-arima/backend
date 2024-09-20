import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { SurveyCreationSchema, SurveyDTOSchema } from '@/api/survey/surveyModel';
import { surveyService } from '@/api/survey/surveyService';
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
        if (role === 'TEACHER') {
          await surveyService.createTeacherSurvey(userId, answers, free);
        } else {
          await surveyService.createStudentSurvey(userId, answers, free);
        }
        const apiResponse = new ApiResponse(ResponseStatus.Success, 'Survey saved successfully', null, StatusCodes.OK);
        handleApiResponse(apiResponse, res);
      } catch (error) {
        const apiError = new ApiError('Failed to calculate profile', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  return router;
})();
