import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
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

  const testCreationExample = {
    answers: [
      [4, 2, 3, 1],
      [4, 2, 3, 1],
      [4, 2, 3, 1],
      [4, 2, 3, 1],
      [4, 2, 3, 1],
      [4, 2, 3, 1],
      [4, 2, 3, 1],
      [4, 2, 3, 1],
      [3, 2, 4, 1],
      [4, 2, 3, 1],
      [1, 2, 3, 4],
      [4, 2, 3, 1],
    ],
  };

  testRegistry.registerPath({
    method: 'post',
    path: '/test',
    tags: ['Test'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: TestCreationSchema.shape.body,
            example: testCreationExample,
          },
        },
        description:
          'Por body se manda una matriz de 12X4 donde cada fila corresponde a una pregunta y cada columna es una respuesta, el valor de la intersección entre ambas es la valoración del estudiante, un número de 1 a 4 sin repetir',
      },
    },
    responses: createApiResponse(z.string(), 'Success'),
  });
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
