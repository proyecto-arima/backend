import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, Model, Schema } from 'mongoose';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * Survey DTO (Data Transfer Object)
 */
export const SurveyDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  answers: z.array(z.number().int().min(1).max(5)),
  free: z.string().optional(),
});
export type SurveyDTO = z.infer<typeof SurveyDTOSchema>;

/**
 * ResponseCounts and Percentages Interfaces
 */
export interface ResponseCounts {
  question1: number[];
  question2: number[];
  question3: number[];
  question4: number[];
  question5: number[];
}

export interface Percentages {
  question1: number[];
  question2: number[];
  question3: number[];
  question4: number[];
  question5: number[];
}

/**
 * Survey Model Schema Definition
 */
const surveyModelSchemaDefinition: Record<keyof Omit<SurveyDTO, 'id'>, any> = {
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'Users' },
  answers: { type: [Number], required: true },
  free: { type: String, required: false },
};

// Type used to define the structure of the schema
type ISurveySchemaDefinition = Omit<SurveyDTO, 'id'>;

// Type used to add methods to the schema
interface ISurveySchemaDefinitionMethods {
  toDto(): SurveyDTO;
}

type SurveyModelDefinition = Model<
  ISurveySchemaDefinition & Document,
  Record<string, never>,
  ISurveySchemaDefinitionMethods
>;

/**
 * Survey Model Schema
 */
const surveyModelSchema = new Schema<ISurveySchemaDefinition, SurveyModelDefinition, ISurveySchemaDefinitionMethods>(
  surveyModelSchemaDefinition,
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Method to convert a Survey model to a SurveyDTO
 */
surveyModelSchema.method('toDto', function (): SurveyDTO {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    answers: this.answers,
    free: this.free,
  };
});

// Create Mongoose models for survey_students and survey_teachers
export const StudentSurveyModel = mongoose.model<ISurveySchemaDefinition, SurveyModelDefinition>(
  'survey_students',
  surveyModelSchema
);

export const TeacherSurveyModel = mongoose.model<ISurveySchemaDefinition, SurveyModelDefinition>(
  'survey_teachers',
  surveyModelSchema
);

export const SurveyCreationSchema = z.object({
  body: z.object({
    answers: z.array(z.number().int().min(1).max(5)).length(5),
    free: z.string().optional(),
  }),
});

export type SurveyCreationDTO = z.infer<typeof SurveyCreationSchema.shape.body>;
