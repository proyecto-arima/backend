import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

export const ApiErrorSchema = z.object({
  err: z.any().optional(),
  message: z.string(),
  statusCode: z.number(),
});

// export type ApiError = z.infer<typeof ApiErrorSchema>; // Inferred type of HttpError

export class ApiError extends Error implements z.infer<typeof ApiErrorSchema> {
  err?: any;
  message: string;
  statusCode: number;

  constructor(message: string, statusCode: number, err?: any) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.err = err;
  }
}

export const UNAUTHORIZED = new ApiError('Unauthorized', StatusCodes.UNAUTHORIZED);
export const INVALID_CREDENTIALS = new ApiError('Invalid credentials', StatusCodes.UNAUTHORIZED);
export const UNEXPECTED_ERROR = (err: any) =>
  new ApiError('An unexpected error occurred', StatusCodes.INTERNAL_SERVER_ERROR, err);
