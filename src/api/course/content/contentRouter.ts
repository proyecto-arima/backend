import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  AddReactionsSchema,
  ContentDTOSchema,
  GetContentSchema,
  ReactionsResponseSchema,
} from '@/api/course/content/contentModel';
import { contentService } from '@/api/course/content/contentService';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);
import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { Role } from '@/common/models/role';

export const contentRegistry = new OpenAPIRegistry();

contentRegistry.register('Content', ContentDTOSchema);

export const contentRouter: Router = (() => {
  const router = express.Router();

  contentRegistry.registerPath({
    method: 'post',
    path: '/{:contentId}/reactions',
    tags: ['Content'],
    request: {
      params: AddReactionsSchema.shape.params,
      body: { content: { 'application/json': { schema: AddReactionsSchema.shape.body } }, description: '' },
    },
    responses: createApiResponse(ContentDTOSchema, 'Success'),
  });

  router.post(
    '/:contentId/reactions',
    sessionMiddleware,
    roleMiddleware([Role.STUDENT]),
    validateRequest(AddReactionsSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const sessionContext = req.sessionContext;
      const studentId = sessionContext?.user?.id;
      const { isSatisfied } = req.body;

      if (!studentId) {
        return next(UNAUTHORIZED);
      }

      try {
        const updatedContent = await contentService.addReactionToContent(contentId, isSatisfied, studentId);
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Reaction added to content successfully',
          updatedContent,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        const apiError = new ApiError('Failed to add reaction', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'get',
    path: '/{contentId}/reactions',
    tags: ['Content'],
    request: {
      params: GetContentSchema.shape.params,
    },
    responses: createApiResponse(ReactionsResponseSchema, 'Success'),
  });
  router.get(
    '/:contentId/reactions',
    sessionMiddleware,
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;

      try {
        const reactions = await contentService.getReactionsByContentId(contentId);
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Reactions retrieved successfully',
          reactions,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve reactions', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  return router;
})();
