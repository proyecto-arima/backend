import { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);
import { SessionRequest } from '@/common/middleware/session';
import { ApiError } from '@/common/models/apiError';
import { logger } from '@/common/utils/serverLogger';

const checkSessionContext = (req: SessionRequest, res: Response, next: NextFunction) => {
  const sessionContext = req.sessionContext;
  if (!sessionContext?.user?.id) {
    logger.trace('[AuthRouter] - [/setPassword] - Session context is missing, sending error response');
    return next(UNAUTHORIZED);
  }
  next();
};

export { checkSessionContext };
