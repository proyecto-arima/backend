// contentModel.ts

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, Model, Schema } from 'mongoose';
import { z } from 'zod';

import { PublicationType } from '@/common/models/publicationType'; // Importa el enum

// Extiende Zod con OpenAPI
extendZodWithOpenApi(z);

// Content DTO (Data Transfer Object)
export const ContentDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  sectionId: z.string(),
  publicationType: z.enum([PublicationType.AUTOMATIC, PublicationType.DEFERRED]), // Usa el enum
  publicationDate: z.date().optional(),
  file: z.string(),
});
export type ContentDTO = z.infer<typeof ContentDTOSchema>;

// Content Model Schema Definition
const contentModelSchemaDefinition: Record<keyof Omit<ContentDTO, 'id'>, any> = {
  title: { type: String, required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
  publicationType: { type: String, enum: Object.values(PublicationType), required: true }, // Usa el enum
  publicationDate: { type: Date, required: false },
  file: { type: String, required: true },
};

// Type used to tell mongoose the shape of the schema available
type IContentSchemaDefinition = Omit<ContentDTO, 'id'>;

// Type used to add methods to the schema
interface IContentSchemaDefinitionMethods {
  toDto(): ContentDTO;
}

type ContentModelDefinition = Model<
  IContentSchemaDefinition & Document,
  Record<string, never>,
  IContentSchemaDefinitionMethods
>;

// Content Model Schema
const contentModelSchema = new Schema<
  IContentSchemaDefinition,
  ContentModelDefinition,
  IContentSchemaDefinitionMethods
>(contentModelSchemaDefinition, {
  timestamps: true,
  versionKey: false,
});

// Method to convert a Content model to a ContentDTO
contentModelSchema.method('toDto', function (): ContentDTO {
  return {
    id: this._id.toString(),
    title: this.title.toString(),
    sectionId: this.sectionId.toString(),
    publicationType: this.publicationType as PublicationType,
    publicationDate: this.publicationDate,
    file: this.file.toString(),
  };
});

// Create a new Mongoose model for the Content
export const ContentModel = mongoose.model<IContentSchemaDefinition, ContentModelDefinition>(
  'Content',
  contentModelSchema
);

// Let's create a Typescript interface for the Content model
export type Content = IContentSchemaDefinition & IContentSchemaDefinitionMethods;

export const ContentCreationSchema = z.object({
  params: z.object({
    sectionId: z.string(),
  }),
  body: z.object({
    title: z.string(),
    publicationType: z.enum([PublicationType.AUTOMATIC, PublicationType.DEFERRED]),
    publicationDate: z.preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) {
        return new Date(arg);
      }
      return null;
    }, z.date().nullable().optional()),
    file: z.string(),
  }),
});

export type ContentCreationDTO = z.infer<typeof ContentCreationSchema.shape.body>;
export type ContentCreation = ContentCreationDTO;
