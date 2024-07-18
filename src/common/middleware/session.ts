import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

import { SessionContext, SessionContextSchema, SessionPayload, SessionPayloadSchema } from '@/api/auth/authModel';
import { userRepository } from '@/api/user/userRepository';

import { ApiResponse, ResponseStatus } from '../models/apiResponse';
import { config } from '../utils/config';

export interface SessionRequest extends Request {
  sessionContext?: SessionContext;
}

const UNAUTHORIZED = new ApiResponse(
  ResponseStatus.Failed,
  'Unauthorized',
  'Authorization token is missing or invalid',
  StatusCodes.UNAUTHORIZED
);

export const sessionMiddleware = async (req: SessionRequest, res: Response, next: NextFunction) => {
  // Header: Authorization: Bearer <token>
  // Cookie: access_token=<token>
  const accessToken = req.cookies.access_token ?? req.headers.authorization?.split(' ')[1];
  if (!accessToken) {
    return next(UNAUTHORIZED);
  }

  if (!jwt.verify(accessToken, config.jwt.secret as string)) {
    return next(UNAUTHORIZED);
  }

  // TODO: Make it simpler
  const sessionPayload: SessionPayload = SessionPayloadSchema.parse(jwt.decode(accessToken, { json: true }));
  const user = await userRepository.findByIdAsync(sessionPayload.id.toString());
  const sessionContext: SessionContext = SessionContextSchema.parse({ user });
  req.sessionContext = sessionContext;

  if (!req.sessionContext) {
    return res.status(401).send('Unauthorized');
  }

  return next();
};
