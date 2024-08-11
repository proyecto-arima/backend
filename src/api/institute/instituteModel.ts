import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, InferRawDocType, Model, Schema } from 'mongoose';
import { z } from 'zod';
extendZodWithOpenApi(z);

/**
 * Institute DTO (Data Transfer Object)
 * This is the shape of the data that will be sent or received from the API.
 * Should not contain any sensitive information such as passwords, auditory fields, etc.
 */
export const InstituteDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type InstituteDTO = z.infer<typeof InstituteDTOSchema>;

/**
 * Institute Model Schema Definition
 */
const instituteModelSchemaDefinition: Record<keyof Omit<InstituteDTO, 'id'>, any> = {
  name: { type: String, required: true },
};

// Type used to tell mongoose the shape of the schema available
type IInstituteSchemaDefinition = Omit<InstituteDTO, 'id'>;
// Type used to add methods to the schema
interface IInstituteSchemaDefinitionMethods {
  toDto(): InstituteDTO;
}
type InstituteModelDefinition = Model<
  IInstituteSchemaDefinition & Document,
  Record<string, never>,
  IInstituteSchemaDefinitionMethods
>;

/**
 * Institute Model Schema
 */
const instituteModelSchema = new Schema<
  IInstituteSchemaDefinition,
  InstituteModelDefinition,
  IInstituteSchemaDefinitionMethods
>(instituteModelSchemaDefinition, {
  timestamps: true,
  versionKey: false,
});

/**
 * Method to convert an Institute model to an InstituteDTO
 */
instituteModelSchema.method('toDto', function (): InstituteDTO {
  return {
    id: this._id.toString(),
    name: this.name.toString(),
  };
});

// Create a new Mongoose model for the Institute
export const InstituteModel = mongoose.model<IInstituteSchemaDefinition, InstituteModelDefinition>(
  'Institutes',
  instituteModelSchema
);

// Input Validation for 'POST institute/' endpoint
export const InstituteCreationSchema = z.object({
  body: z.object({
    name: z.string(),
  }),
});
export type InstituteCreationDTO = z.infer<typeof InstituteCreationSchema.shape.body>;

export type Institute = InferRawDocType<typeof instituteModelSchemaDefinition> & IInstituteSchemaDefinitionMethods;
