import { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '@/common/models/apiError';
import { Role } from '@/common/models/role';

import { SessionRequest } from './session'; // Asegúrate de importar la interfaz correcta

export const roleMiddleware = (allowedRoles: Role[]) => {
  return (req: SessionRequest, res: Response, next: NextFunction) => {
    if (!req.sessionContext || !req.sessionContext.user) {
      return next(new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED, 'User is not authenticated'));
    }

    console.log(allowedRoles);
    console.log(req.sessionContext.user.role);

    // Verifica si el rol del usuario es el rol requerido
    if (!allowedRoles.includes(req.sessionContext.user.role)) {
      return next(new ApiError('Forbidden', StatusCodes.FORBIDDEN, 'User does not have the required role'));
    }

    next();
  };
};
