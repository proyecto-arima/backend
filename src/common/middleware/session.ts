import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { SessionContext, SessionContextSchema } from '@/api/auth/authModel';

import { config } from '../utils/config';

export interface SessionRequest extends Request {
  sessionContext?: SessionContext;
}

export const sessionMiddleware = async (req: SessionRequest, res: Response, next: NextFunction) => {
  validateCookie(req);
  validateAuthHeader(req);
  if (!req.sessionContext) {
    return res.status(401).send('Unauthorized');
  }

  return next();
};

const validateCookie = (req: SessionRequest) => {
  const accessToken = req.cookies.access_token;

  if (!accessToken) return;

  if (!jwt.verify(accessToken, config.jwt.secret as string)) {
    return;
  }

  const decoded = jwt.decode(req.cookies.access_token);
  const userId = (decoded as { id: string }).id;
  const sessionContext: SessionContext = SessionContextSchema.parse({ userId });
  req.sessionContext = sessionContext;
};

const validateAuthHeader = (req: SessionRequest) => {
  const authorization = req.headers.authorization;
  if (!authorization) return;

  // Header: Authorization: Bearer <token>
  const token = authorization.split(' ')[1];

  if (!jwt.verify(token, config.jwt.secret as string)) {
    return;
  }

  const decoded = jwt.decode(token);
  const userId = (decoded as { id: string }).id;
  const sessionContext: SessionContext = SessionContextSchema.parse({ userId });
  req.sessionContext = sessionContext;
};
