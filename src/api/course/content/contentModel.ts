import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, Model, Schema } from 'mongoose';
import { z } from 'zod';

import { PublicationType } from '@/common/models/publicationType';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

export const ContentDTOSchema = z.object({
  id: z.string(),
  key: z.string(),
  title: z.string(),
  sectionId: z.string(),
  publicationType: z.enum([PublicationType.AUTOMATIC, PublicationType.DEFERRED]),
  publicationDate: z.date().optional(),
  visible: z.boolean(),
  reactions: z
    .array(
      z.object({
        userId: z.string(),
        isSatisfied: z.boolean(),
      })
    )
    .optional(),
  generated: z.string().optional(),
});
export type ContentDTO = z.infer<typeof ContentDTOSchema>;

const reactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    isSatisfied: { type: Boolean, required: true },
  },
  { _id: false }
);

const contentModelSchemaDefinition: Record<keyof Omit<ContentDTO, 'id'>, any> = {
  key: { type: String, required: true },
  title: { type: String, required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
  publicationType: { type: String, enum: Object.values(PublicationType), required: true },
  publicationDate: { type: Date, required: false },
  visible: { type: Boolean, required: true, default: true },
  reactions: {
    type: [reactionSchema],
    default: [],
    required: false,
  },
  generated: { type: String, required: false },
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
    key: this.key,
    title: this.title,
    sectionId: this.sectionId.toString(),
    publicationType: this.publicationType as PublicationType,
    publicationDate: this.publicationDate,
    visible: this.visible,
    reactions: this.reactions || [],
    generated: this.generated,
  };
});

export const ContentModel = mongoose.model<IContentSchemaDefinition, ContentModelDefinition>(
  'Content',
  contentModelSchema
);

export type Content = IContentSchemaDefinition & IContentSchemaDefinitionMethods;

export const ContentCreationSchema = z.object({
  params: z.object({
    courseId: z.string(),
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
    visible: z.boolean().optional(),
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

export const GetContentSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

// Definición del esquema de una reacción
const ReactionSchema = z.object({
  userId: z.string(),
  isSatisfied: z.boolean(),
});

// Definición del esquema de la respuesta
export const ReactionsResponseSchema = z.object({
  reactions: z.array(ReactionSchema),
});

export const ContentWithPresignedUrlSchema = ContentDTOSchema.extend({
  preSignedUrl: z.string(),
});

export const UpdateVisibilitySchema = z.object({
  params: z.object({
    contentId: z.string(),
  }),
  body: z.object({
    visible: z.boolean(),
  }),
});

export type AddReactionsDTO = z.infer<typeof AddReactionsSchema.shape.body>;
export type ContentCreationDTO = z.infer<typeof ContentCreationSchema.shape.body>;
export type ContentCreation = ContentCreationDTO;
