import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { SessionContext, SessionContextSchema } from '@/api/auth/authModel';

export interface SessionRequest extends Request {
  sessionContext?: SessionContext;
}

export const sessionMiddleware = async (req: SessionRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.access_token;

  console.log('Access Token: ', accessToken);

  if (!accessToken) {
    req.cookies.access_token = '';
    res.status(401).send('Unauthorized');
  }

  // TODO: Check if get Authorization header
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).send('Unauthorized');
  }

  if (!jwt.verify(accessToken, process.env.JWT_SECRET as string)) {
    res.status(401).send('Unauthorized');
  }

  const decoded = jwt.decode(req.cookies.access_token);
  const userId = (decoded as { id: string }).id;

  const sessionContext: SessionContext = SessionContextSchema.parse({ userId });
  req.sessionContext = sessionContext;
  next();
};
