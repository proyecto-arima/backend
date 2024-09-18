import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
extendZodWithOpenApi(z);

/**
 * ImageCreation DTO (Data Transfer Object)
 * This is the shape of the data that will be sent or received from the API.
 * Should not contain any sensitive information such as passwords, auditory fields, etc.
 */
export const ImageDTOSchema = z.object({
  name: z.string(),
  description: z.string(),
});
export type ImageDTO = z.infer<typeof ImageDTOSchema>;

export const ImageCreationDTOSchema = z.object({
  body: ImageDTOSchema,
});
export type ImageCreationDTO = z.infer<typeof ImageCreationDTOSchema>;
