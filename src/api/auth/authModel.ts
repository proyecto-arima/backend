import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose from 'mongoose';
import { z } from 'zod';

import { ObjectId } from '@/common/utils/commonTypes';

import { UserDTO } from '../user/userModel';

extendZodWithOpenApi(z);

export const PasswordResetSchema = z.object({
  body: z.object({
    oldPassword: z.string(),
    newPassword: z.string(),
    newPasswordConfirmation: z.string(),
  }),
});

export type PasswordReset = z.infer<typeof PasswordResetSchema.shape.body>; // Inferred type of PasswordReset

export const SessionContextSchema = z.object({
  user: z.custom<UserDTO>().optional(),
});
export type SessionContext = z.infer<typeof SessionContextSchema>; // Inferred type of Context

// Info in JWT token
export const SessionPayloadSchema = z.object({
  id: z.custom<ObjectId>((v: string): ObjectId => new mongoose.Types.ObjectId(v)),
});

export type SessionPayload = z.infer<typeof SessionPayloadSchema>; // Inferred type of SessionPayload

export class UserNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}
