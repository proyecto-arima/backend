import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

import { SessionContext, SessionContextSchema, SessionPayload, SessionPayloadSchema } from '@/api/auth/authModel';
import { userRepository } from '@/api/user/userRepository';
import { ApiError } from '@/common/models/apiError';
import { logger } from '@/common/utils/serverLogger';

import { ApiResponse, ResponseStatus } from '../models/apiResponse';
import { config } from '../utils/config';

export interface SessionRequest extends Request {
  sessionContext?: SessionContext;
}

export const sessionMiddleware = async (req: SessionRequest, res: Response, next: NextFunction) => {
  try {
    // Header: Authorization: Bearer <token>
    // Cookie: access_token=<token>
    const accessToken = req.cookies.access_token ?? req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return next(new ApiError('Failed to retrieve session', StatusCodes.UNAUTHORIZED, 'Access token is missing'));
    }

    console.log('accessToken', accessToken);
    
  
    if (!jwt.verify(accessToken, config.jwt.secret as string)) {
      return next(new ApiError('Failed to retrieve session', StatusCodes.UNAUTHORIZED, 'Token not valid'));
    }
  
    // TODO: Make it simpler
    const sessionPayload: SessionPayload = SessionPayloadSchema.parse(jwt.decode(accessToken, { json: true }));
    const user = await userRepository.findByIdAsync(sessionPayload.id.toString());
    const sessionContext: SessionContext = SessionContextSchema.parse({ user });
    req.sessionContext = sessionContext;
  
    if (!req.sessionContext) {
      return next(new ApiError('Failed to retrieve session', StatusCodes.UNAUTHORIZED, 'Session not found'));
    }

    logger.info(`Session founded from ${req.sessionContext.user?.email}`);
    return next(new ApiResponse(ResponseStatus.Success, 'Sesion founded', null, StatusCodes.OK));
    
  } catch (e) {
    return next(new ApiError('Interal error founded', StatusCodes.INTERNAL_SERVER_ERROR, 'Internal error'));
  }
};
