import { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../models/apiError';
import { ApiResponse, ResponseStatus } from '../models/apiResponse';
import { handleApiResponse } from '../utils/httpHandlers';

export const unexpectedRequest: RequestHandler = (_req, res) => {
  res.sendStatus(StatusCodes.NOT_FOUND);
};

const addErrorToRequestLog: ErrorRequestHandler = (err, _req, res, next) => {
  res.locals.err = err;
  next(err);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendResponseError: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.trace('[Error Handler] - Start');
  if (err instanceof ApiError) {
    logger.trace(`[Error Handler] - Handling API Error`);
    const error = err as ApiError;
    res.locals.err = error.err;
    logger.error(error.err);
    const apiResponse = new ApiResponse(ResponseStatus.Failed, err.message, null, err.statusCode);
    return handleApiResponse(apiResponse, res);
  }
  logger.trace(`[Error Handler] - Handling unexpected error`);
  logger.error(err);
  const apiResponse = new ApiResponse(
    ResponseStatus.Failed,
    'An unexpected error occurred',
    null,
    StatusCodes.INTERNAL_SERVER_ERROR
  );
  logger.trace('[Error Handler] - End');
  return handleApiResponse(apiResponse, res);
};

export const errorHandler = () => [addErrorToRequestLog, sendResponseError];
