// sectionModel.ts

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, Model, Schema } from 'mongoose';
import { z } from 'zod';

// Extiende Zod con OpenAPI
extendZodWithOpenApi(z);

// Section DTO (Data Transfer Object)
export const SectionDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  visible: z.boolean(),
});
export type SectionDTO = z.infer<typeof SectionDTOSchema>;

// Section Model Schema Definition
const sectionModelSchemaDefinition: Record<keyof Omit<SectionDTO, 'id'>, any> = {
  name: { type: String, required: true },
  description: { type: String, required: false },
  visible: { type: Boolean, required: true },
};

// Type used to tell mongoose the shape of the schema available
type ISectionSchemaDefinition = Omit<SectionDTO, 'id'>;

// Type used to add methods to the schema
interface ISectionSchemaDefinitionMethods {
  toDto(): SectionDTO;
}

type SectionModelDefinition = Model<
  ISectionSchemaDefinition & Document,
  Record<string, never>,
  ISectionSchemaDefinitionMethods
>;

// Section Model Schema
const sectionModelSchema = new Schema<
  ISectionSchemaDefinition,
  SectionModelDefinition,
  ISectionSchemaDefinitionMethods
>(sectionModelSchemaDefinition, {
  timestamps: true,
  versionKey: false,
});

// Method to convert a Section model to a SectionDTO
sectionModelSchema.method('toDto', function (): SectionDTO {
  return {
    id: this._id.toString(),
    name: this.name.toString(),
    description: this.description?.toString(),
    visible: this.visible,
  };
});

// Create a new Mongoose model for the Section
export const SectionModel = mongoose.model<ISectionSchemaDefinition, SectionModelDefinition>(
  'Section',
  sectionModelSchema
);

// Let's create a Typescript interface for the Section model
export type Section = ISectionSchemaDefinition & ISectionSchemaDefinitionMethods;

export const SectionCreationSchema = z.object({
  params: z.object({
    courseId: z.string(),
  }),
  body: z.object({
    name: z.string(),
    description: z.string().optional(),
    visible: z.boolean(),
  }),
});

export type SectionCreationDTO = z.infer<typeof SectionCreationSchema.shape.body>;
export type SectionCreation = SectionCreationDTO;
