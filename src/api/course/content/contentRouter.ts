import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AddReactionsSchema, ContentCreationSchema, ContentDTOSchema } from '@/api/course/content/contentModel';
import { contentService } from '@/api/course/content/contentService';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { sessionMiddleware, SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { validateRequest } from '@/common/utils/httpHandlers';
const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);
import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { Role } from '@/common/models/role';

export const contentRegistry = new OpenAPIRegistry();

contentRegistry.register('Content', ContentDTOSchema);

export const contentRouter: Router = (() => {
  const router = express.Router();

  contentRegistry.registerPath({
    method: 'post',
    path: '/:contentId/reactions',
    tags: ['Content'],
    request: {
      body: { content: { 'application/json': { schema: ContentCreationSchema.shape.body } }, description: '' },
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
        if (!updatedContent) {
          throw new ApiError('Content not found', StatusCodes.NOT_FOUND);
        }
        res.status(StatusCodes.OK).json(updatedContent);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/:contentId/reactions',
    sessionMiddleware,
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;

      try {
        const reactions = await contentService.getReactionsByContentId(contentId);
        if (!reactions) {
          throw new ApiError('Content not found', StatusCodes.NOT_FOUND);
        }
        res.status(StatusCodes.OK).json(reactions);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
})();
