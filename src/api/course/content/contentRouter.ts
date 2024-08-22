import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  AddReactionsSchema,
  ContentDTOSchema,
  GetContentSchema,
  ReactionsResponseSchema,
  UpdateVisibilitySchema,
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
    path: '/contents/{:contentId}/reactions',
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
      const userId = sessionContext?.user?.id;
      const { isSatisfied } = req.body;

      if (!userId) {
        return next(UNAUTHORIZED);
      }

      try {
        const updatedContent = await contentService.addReactionToContent(contentId, isSatisfied, userId);
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
    path: '/contents/{contentId}/reactions',
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

  contentRegistry.registerPath({
    method: 'get',
    path: '/contents/{id}',
    tags: ['Content'],
    request: { params: GetContentSchema.shape.params },
    responses: createApiResponse(ContentDTOSchema, 'Success'),
  });
  router.get(
    '/:contentId',
    sessionMiddleware,
    roleMiddleware([Role.STUDENT, Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;

      try {
        const content = await contentService.getContentById(contentId);
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Content retrieved successfully',
          content,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'patch',
    path: '/contents/{contentId}/visibility',
    tags: ['Content'],
    request: {
      params: UpdateVisibilitySchema.shape.params,
      body: { content: { 'application/json': { schema: UpdateVisibilitySchema.shape.body } } },
    },
    responses: createApiResponse(ContentDTOSchema, 'Success'),
  });
  router.patch(
    '/:contentId/visibility',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    validateRequest(UpdateVisibilitySchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const { visible } = req.body;

      try {
        const updatedContent = await contentService.updateContentVisibility(contentId, visible);
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Content visibility updated successfully',
          updatedContent,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        const apiError = new ApiError('Failed to update content visibility', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  return router;
})();
