import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError, ZodSchema } from 'zod';

import { ApiResponse, ResponseStatus } from '../models/apiResponse';

export const handleApiResponse = (apiResponse: ApiResponse<any>, response: Response) => {
  return response.status(apiResponse.statusCode).send(apiResponse);
};

export const validateRequest = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  } catch (err) {
    console.log(err);
    const errorMessage = `Invalid input: ${(err as ZodError).errors.map((e) => e.message).join(', ')}`;
    const statusCode = StatusCodes.BAD_REQUEST;
    res.status(statusCode).send(new ApiResponse<null>(ResponseStatus.Failed, errorMessage, null, statusCode));
  }
};
