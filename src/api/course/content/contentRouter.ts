import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { NextFunction, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  AddReactionsSchema,
  ContentDTOSchema,
  GamificationContentSchema,
  GetContentSchema,
  MindmapContentSchema,
  ReactionsResponseSchema,
  SpeechContentSchema,
  SummaryContentSchema,
  UpdateApproveSchema,
  UpdateContentSchema,
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

  contentRegistry.registerPath({
    method: 'post',
    path: '/contents/{contentId}/regenerate',
    tags: ['Content'],
    request: { params: GetContentSchema.shape.params },
    responses: createApiResponse(ContentDTOSchema, 'Success'),
  });
  router.post(
    '/:contentId/regenerate',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;

      try {
        const content = await contentService.regenerateContent(contentId);
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Content regenerated successfully',
          content,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to regenerate content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'patch',
    path: '/contents/{contentId}/approval',
    tags: ['Content'],
    request: {
      params: UpdateApproveSchema.shape.params,
      body: { content: { 'application/json': { schema: UpdateApproveSchema.shape.body } } },
    },
    responses: createApiResponse(ContentDTOSchema, 'Success'),
  });

  router.patch(
    '/:contentId/approval',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    validateRequest(UpdateApproveSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const approve = req.body;
      try {
        const updatedContent = await contentService.updateContentApproval(contentId, approve);
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Content approval status updated successfully',
          updatedContent,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        const apiError = new ApiError(
          'Failed to update content approval status',
          StatusCodes.INTERNAL_SERVER_ERROR,
          error
        );
        return next(apiError);
      }
    }
  );
  contentRegistry.registerPath({
    method: 'get',
    path: '/contents/{contentId}/summary',
    tags: ['Content'],
    request: { params: GetContentSchema.shape.params },
    responses: createApiResponse(SummaryContentSchema, 'Success'), // Define el esquema de respuesta
  });

  router.get(
    '/:contentId/summary',
    sessionMiddleware,
    roleMiddleware([Role.STUDENT, Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        return next(UNAUTHORIZED);
      }

      try {
        const studentUserId = sessionContext.user.id;
        const content = await contentService.getContentById(contentId, studentUserId);

        if (!content) {
          return next(new ApiError('Content not found', StatusCodes.NOT_FOUND));
        }

        const summaryContent = content.generated?.find((item) => item.type === 'SUMMARY');

        if (!summaryContent) {
          return next(new ApiError('Summary content not found', StatusCodes.NOT_FOUND));
        }

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Summary content retrieved successfully',
          {
            approved: summaryContent.approved,
            content: summaryContent.content,
            title: content.title,
            userIsSatisfied: content.userIsSatisfied,
          },
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve summary content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'get',
    path: '/contents/{contentId}/mindmap',
    tags: ['Content'],
    request: { params: GetContentSchema.shape.params },
    responses: createApiResponse(MindmapContentSchema, 'Success'), // Define el esquema de respuesta
  });

  router.get(
    '/:contentId/mindmap',
    sessionMiddleware,
    roleMiddleware([Role.STUDENT, Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        return next(UNAUTHORIZED);
      }

      try {
        const studentUserId = sessionContext.user.id;
        const content = await contentService.getContentById(contentId, studentUserId);

        if (!content) {
          return next(new ApiError('Content not found', StatusCodes.NOT_FOUND));
        }

        const mindmapContent = content.generated?.find((item) => item.type === 'MIND_MAP');

        if (!mindmapContent) {
          return next(new ApiError('Mind Map content not found', StatusCodes.NOT_FOUND));
        }

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Mind Map content retrieved successfully',
          {
            approved: mindmapContent.approved,
            content: mindmapContent.content,
            title: content.title,
            userIsSatisfied: content.userIsSatisfied,
          },
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve Mind Map content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'get',
    path: '/contents/{contentId}/gamification',
    tags: ['Content'],
    request: { params: GetContentSchema.shape.params },
    responses: createApiResponse(GamificationContentSchema, 'Success'), // Define el esquema de respuesta
  });

  router.get(
    '/:contentId/gamification',
    sessionMiddleware,
    roleMiddleware([Role.STUDENT, Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        return next(UNAUTHORIZED);
      }

      try {
        const studentUserId = sessionContext.user.id;
        const content = await contentService.getContentById(contentId, studentUserId);

        if (!content) {
          return next(new ApiError('Content not found', StatusCodes.NOT_FOUND));
        }

        const gamificationContent = content.generated?.find((item) => item.type === 'GAMIFICATION');

        if (!gamificationContent) {
          return next(new ApiError('Gamification content not found', StatusCodes.NOT_FOUND));
        }

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Gamification content retrieved successfully',
          {
            approved: gamificationContent.approved,
            content: gamificationContent.content,
            title: content.title,
            userIsSatisfied: content.userIsSatisfied,
          },
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve Gamification content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'get',
    path: '/contents/{contentId}/speech',
    tags: ['Content'],
    request: { params: GetContentSchema.shape.params },
    responses: createApiResponse(SpeechContentSchema, 'Success'), // Define el esquema de respuesta
  });

  router.get(
    '/:contentId/speech',
    sessionMiddleware,
    roleMiddleware([Role.STUDENT, Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const sessionContext = req.sessionContext;
      if (!sessionContext?.user?.id) {
        return next(UNAUTHORIZED);
      }

      try {
        const studentUserId = sessionContext.user.id;
        const content = await contentService.getContentById(contentId, studentUserId);

        if (!content) {
          return next(new ApiError('Content not found', StatusCodes.NOT_FOUND));
        }

        const speechContent = content.generated?.find((item) => item.type === 'SPEECH');

        if (!speechContent) {
          return next(new ApiError('Speech content not found', StatusCodes.NOT_FOUND));
        }

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Speech content retrieved successfully',
          {
            approved: speechContent.approved,
            content: speechContent.content,
            title: content.title,
            userIsSatisfied: content.userIsSatisfied,
          },
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve Speech content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'patch',
    path: '/contents/{contentId}/',
    tags: ['Content'],
    request: {
      params: UpdateContentSchema.shape.params,
      body: { content: { 'application/json': { schema: UpdateContentSchema.shape.body } } },
    },
    responses: createApiResponse(ContentDTOSchema, 'Success'),
  });

  router.patch(
    '/:contentId/',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    validateRequest(UpdateContentSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const { title, visibility } = req.body;

      try {
        const updatedContent = await contentService.updateContent(contentId, title, visibility);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Content updated successfully',
          updatedContent,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        const apiError = new ApiError('Failed to update content title', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'delete',
    path: '/contents/{contentId}',
    tags: ['Content'],
    request: {
      params: UpdateContentSchema.shape.params,
      body: { content: { 'application/json': { schema: UpdateContentSchema.shape.body } } },
    },
    responses: createApiResponse(ContentDTOSchema, 'Success'),
  });

  router.delete(
    '/:contentId',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    validateRequest(GetContentSchema),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;

      try {
        await contentService.deleteContent(contentId);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Content deleted successfully',
          null,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        const apiError = new ApiError('Failed to update content title', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return next(apiError);
      }
    }
  );

  contentRegistry.registerPath({
    method: 'patch',
    path: '/contents/{contentId}/summary',
    tags: ['Content'],
    request: { params: GetContentSchema.shape.params },
    responses: createApiResponse(SummaryContentSchema, 'Success'), // Define el esquema de respuesta
  });

  router.patch(
    '/:contentId/summary',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const { newContent } = req.body;

      try {
        const content = await contentService.updateGeneratedContent(contentId, 'SUMMARY', newContent);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Generated content updated successfully',
          content,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve summary content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  router.patch(
    '/:contentId/mindmap',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const { newContent } = req.body;

      try {
        const content = await contentService.updateGeneratedContent(contentId, 'MIND_MAP', newContent);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Generated content updated successfully',
          content,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve summary content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  router.patch(
    '/:contentId/gamification',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const { newContent } = req.body;

      try {
        const content = await contentService.updateGeneratedContent(contentId, 'GAMIFICATION', newContent);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Generated content updated successfully',
          content,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve summary content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  router.patch(
    '/:contentId/speech',
    sessionMiddleware,
    roleMiddleware([Role.TEACHER]),
    async (req: SessionRequest, res: Response, next: NextFunction) => {
      const { contentId } = req.params;
      const { newContent } = req.body;

      try {
        const content = await contentService.updateAudio(contentId, newContent);

        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Generated content updated successfully',
          content,
          StatusCodes.OK
        );
        handleApiResponse(apiResponse, res);
      } catch (e) {
        const apiError = new ApiError('Failed to retrieve summary content', StatusCodes.INTERNAL_SERVER_ERROR, e);
        return next(apiError);
      }
    }
  );

  return router;
})();
