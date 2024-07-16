import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { Role } from '@/common/models/role';

extendZodWithOpenApi(z);

export const AdminCreationSchema = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    password: z.string(),
  }),
});
export type AdminCreationDTO = z.infer<typeof AdminCreationSchema.shape.body>;
export type AdminCreation = AdminCreationDTO & { role: Role };
