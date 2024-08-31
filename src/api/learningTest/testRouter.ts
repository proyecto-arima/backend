import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { Role } from '@/common/models/role';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';

import { TestCreationSchema, TestDTOSchema } from './testModel';
import { testService } from './testService';
const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);

export const testRegistry = new OpenAPIRegistry();

testRegistry.register('Test', TestDTOSchema);

export const testRouter: Router = (() => {
  const router = express.Router();

  router.post(
    '/',
    sessionMiddleware,
    roleMiddleware([Role.STUDENT]),
    validateRequest(TestCreationSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const answers = req.body.answers;

      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        return next(UNAUTHORIZED);
      }

      const studentUserId = sessionContext.user.id;

      try {
        const profile = await testService.processAnswers(studentUserId, answers);
        res.json({ perfil: profile });
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Learning profile calculated successfully',
          profile,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        const apiError = new ApiError('Failed to calculate profile', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  return router;
})();
