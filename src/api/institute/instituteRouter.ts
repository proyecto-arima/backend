import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { Role } from '@/common/models/role';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

import { InstituteCreationSchema, InstituteDTO, InstituteDTOSchema } from './instituteModel';
import { instituteService } from './instituteService';

export const instituteRegistry = new OpenAPIRegistry();

instituteRegistry.register('Institute', InstituteDTOSchema);

export const instituteRouter: Router = (() => {
  const router = express.Router();

  instituteRegistry.registerPath({
    method: 'post',
    path: '/institutes/',
    tags: ['Institute'],
    request: {
      body: { content: { 'application/json': { schema: InstituteCreationSchema.shape.body } }, description: '' },
    },
    responses: createApiResponse(InstituteDTOSchema, 'Success'),
  });

  router.post(
    '/',
    validateRequest(InstituteCreationSchema),
    roleMiddleware([Role.ADMIN]),
    async (req: Request, res: Response) => {
      try {
        logger.trace('[InstituteRouter] - [POST /institutes] - Start');
        logger.trace(
          `[InstituteRouter] - [POST /institutes] - Request to create institute: ${JSON.stringify(req.body)}`
        );

        const instituteDTO: InstituteDTO = await instituteService.create(req.body);

        logger.trace(
          `[InstituteRouter] - [POST /institutes] - Institute created: ${JSON.stringify(instituteDTO)}. Sending response`
        );
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Institute created successfully',
          instituteDTO,
          StatusCodes.CREATED
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        logger.error(`[InstituteRouter] - [POST /institutes] - Error: ${error}`);
        const apiError = new ApiError('Failed to create institute', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return res.status(apiError.statusCode).json(apiError);
      } finally {
        logger.trace('[InstituteRouter] - [POST /institutes] - End');
      }
    }
  );

  return router;
})();
