import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const EmailSchema = z.object({
  to: z.array(z.string().email()),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string(),
  bodyTemplateName: z.string(),
  templateParams: z.record(z.any()),
  attachments: z.array(z.any()).optional(),
});
export type Email = z.infer<typeof EmailSchema>;
