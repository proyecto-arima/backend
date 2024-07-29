// contentModel.ts

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, Model, Schema } from 'mongoose';
import { z } from 'zod';

import { PublicationType } from '@/common/models/publicationType';

extendZodWithOpenApi(z);

export const ContentDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  sectionId: z.string(),
  publicationType: z.enum([PublicationType.AUTOMATIC, PublicationType.DEFERRED]),
  publicationDate: z.date().optional(),
  file: z.string(),
  reactions: z
    .array(
      z.object({
        idStudent: z.string(),
        isSatisfied: z.boolean(),
      })
    )
    .optional(),
});
export type ContentDTO = z.infer<typeof ContentDTOSchema>;

const reactionSchema = new Schema(
  {
    idStudent: { type: String, required: true },
    isSatisfied: { type: Boolean, required: true },
  },
  { _id: false }
);

const contentModelSchemaDefinition: Record<keyof Omit<ContentDTO, 'id'>, any> = {
  title: { type: String, required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
  publicationType: { type: String, enum: Object.values(PublicationType), required: true },
  publicationDate: { type: Date, required: false },
  file: { type: String, required: true },
  reactions: {
    type: [reactionSchema],
    default: [],
    required: false,
  },
};

type IContentSchemaDefinition = Omit<ContentDTO, 'id'>;

interface IContentSchemaDefinitionMethods {
  toDto(): ContentDTO;
}

type ContentModelDefinition = Model<
  IContentSchemaDefinition & Document,
  Record<string, never>,
  IContentSchemaDefinitionMethods
>;

const contentModelSchema = new Schema<
  IContentSchemaDefinition,
  ContentModelDefinition,
  IContentSchemaDefinitionMethods
>(contentModelSchemaDefinition, {
  timestamps: true,
  versionKey: false,
});

contentModelSchema.method('toDto', function (): ContentDTO {
  return {
    id: this._id.toString(),
    title: this.title,
    sectionId: this.sectionId.toString(),
    publicationType: this.publicationType as PublicationType,
    publicationDate: this.publicationDate,
    file: this.file,
    reactions: this.reactions || [],
  };
});

export const ContentModel = mongoose.model<IContentSchemaDefinition, ContentModelDefinition>(
  'Content',
  contentModelSchema
);

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

export const AddReactionsSchema = z.object({
  params: z.object({
    contentId: z.string(),
  }),
  body: z.object({
    isSatisfied: z.boolean(),
  }),
});
export type AddReactionsDTO = z.infer<typeof AddReactionsSchema.shape.body>;
export type ContentCreationDTO = z.infer<typeof ContentCreationSchema.shape.body>;
export type ContentCreation = ContentCreationDTO;
