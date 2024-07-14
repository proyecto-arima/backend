import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose from 'mongoose';
import { z } from 'zod';

import { ObjectId } from '@/common/utils/commonTypes';

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
  userId: z.custom<ObjectId>((v: string): ObjectId => new mongoose.Types.ObjectId(v)),
});
export type SessionContext = z.infer<typeof SessionContextSchema>; // Inferred type of Context
