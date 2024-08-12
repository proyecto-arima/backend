import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { UserDirectorCreationSchema, UserDTO, UserDTOSchema } from '@/api/user/userModel';
import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { ApiError } from '@/common/models/apiError';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { Role } from '@/common/models/role';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';
import { logger } from '@/common/utils/serverLogger';

import { directorService } from './directorService';

export const directorRegistry = new OpenAPIRegistry();

directorRegistry.register('Director', UserDTOSchema);

export const directorRouter: Router = (() => {
  const router = express.Router();

  router.post(
    '/',
    validateRequest(UserDirectorCreationSchema),
    roleMiddleware([Role.ADMIN, Role.DIRECTOR]),
    async (req: Request, res: Response) => {
      try {
        logger.trace('[DirectorRouter] - [/:instituteId] - Start');
        const userDTO: UserDTO = await directorService.create(req.body);

        logger.trace(
          `[DirectorRouter] - [/:instituteId] - Director created: ${JSON.stringify(userDTO)}. Sending response`
        );
        const apiResponse = new ApiResponse(
          ResponseStatus.Success,
          'Director created successfully',
          userDTO,
          StatusCodes.CREATED
        );
        handleApiResponse(apiResponse, res);
      } catch (error) {
        logger.error(`[DirectorRouter] - [/:instituteId] - Error: ${error}`);
        const apiError = new ApiError('Failed to create director', StatusCodes.INTERNAL_SERVER_ERROR, error);
        return res.status(apiError.statusCode).json(apiError);
      } finally {
        logger.trace('[DirectorRouter] - [/:instituteId] - End');
      }
    }
  );

  return router;
})();
