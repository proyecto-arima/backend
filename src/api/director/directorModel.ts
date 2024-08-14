import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, InferRawDocType, Model, Schema } from 'mongoose';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * Director DTO (Data Transfer Object)
 * This is the shape of the data that will be sent or received from the API
 * Should not contain any sensitive information such as passwords, auditory fields, etc.
 *
 * It should be serializable, so it should not contain any functions, methods or any other non-serializable data
 */
export const DirectorDTOSchema = z.object({
  id: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  institute: z.object({
    id: z.string(),
    name: z.string(),
  }),
});
export type DirectorDTO = z.infer<typeof DirectorDTOSchema>;

/**
 * Director Model Schema Definition
 */
const directorModelSchemaDefinition: Record<keyof Omit<DirectorDTO, 'id'>, any> = {
  user: { type: Schema.Types.ObjectId, required: true, ref: 'Users' },
  institute: { type: Schema.Types.ObjectId, required: true, ref: 'Institutes' },
};

// Type used to tell mongoose the shape of the schema available
type IDirectorSchemaDefinition = Omit<DirectorDTO, 'id'>;
// Type used to add methods to the schema
interface IDirectorSchemaDefinitionMethods {
  toDto(): DirectorDTO;
}
type DirectorModelDefinition = Model<
  IDirectorSchemaDefinition & Document,
  Record<string, never>,
  IDirectorSchemaDefinitionMethods
>;

/**
 * Director Model Schema
 */
const directorModelSchema = new Schema<
  IDirectorSchemaDefinition,
  DirectorModelDefinition,
  IDirectorSchemaDefinitionMethods
>(directorModelSchemaDefinition, {
  timestamps: true, // Esto agregará los campos createdAt y updatedAt automáticamente
  versionKey: false,
});

/**
 * Method to convert a Director model to a DirectorDTO
 */
directorModelSchema.method('toDto', function (): DirectorDTO {
  return {
    id: this._id.toString(),
    user: this.user,
    institute: this.institute,
  };
});

// Create a new Mongoose model for the Director
export const DirectorModel = mongoose.model<IDirectorSchemaDefinition, DirectorModelDefinition>(
  'Directors',
  directorModelSchema
);

export type Director = InferRawDocType<typeof directorModelSchemaDefinition> & IDirectorSchemaDefinitionMethods;
