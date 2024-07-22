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
