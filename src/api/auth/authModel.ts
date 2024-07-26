import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose from 'mongoose';
import { z } from 'zod';

import { ObjectId } from '@/common/utils/commonTypes';

import { UserDTO } from '../user/userModel';

extendZodWithOpenApi(z);

export const PasswordSetSchema = z.object({
  body: z.object({
    newPassword: z.string(),
    newPasswordConfirmation: z.string(),
  }),
});
export type PasswordSet = z.infer<typeof PasswordSetSchema.shape.body>;

export const PasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});
export type PasswordReset = z.infer<typeof PasswordResetSchema.shape.body>;

export const SessionContextSchema = z.object({
  user: z.custom<UserDTO>().optional(),
});
export type SessionContext = z.infer<typeof SessionContextSchema>;

export const SessionPayloadSchema = z.object({
  id: z.custom<ObjectId>((v: string): ObjectId => new mongoose.Types.ObjectId(v)),
});
export type SessionPayload = z.infer<typeof SessionPayloadSchema>;

export class InvalidCredentialsError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class PasswordChangeRequiredError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'PasswordChangeRequired';
  }
}

export class PasswordNotSecureError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'PasswordNotSecureError';
  }
}

export class PasswordsDoNotMatchError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'PasswordsDoNotMatchError';
  }
}
