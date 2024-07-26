import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, InferSchemaType, Model, Schema } from 'mongoose';
import { z } from 'zod';

// Common validations
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Teacher DTO (Data Transfer Object)
 */
export const TeacherDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courses: z.array(
    z.object({
      id: z.string(),
      courseName: z.string(),
    })
  ),
});
export type TeacherDTO = z.infer<typeof TeacherDTOSchema>;

/**
 * Teacher Model Schema Definition
 */
const teacherCourseSchemaDefinition = new Schema({
  id: { type: String, required: true },
  courseName: { type: String, required: true },
});

const teacherModelSchemaDefinition = {
  userId: { type: String, required: true },
  courses: { type: [teacherCourseSchemaDefinition], required: true },
};

// Type used to tell mongoose the shape of the schema available
type ITeacherSchemaDefinition = typeof teacherModelSchemaDefinition & {
  courses: Array<{ id: string; courseName: string }>;
};

// Type used to add methods to the schema
interface ITeacherSchemaDefinitionMethods {
  toDto(): TeacherDTO;
}
type TeacherModelDefinition = Model<
  ITeacherSchemaDefinition & Document,
  Record<string, never>,
  ITeacherSchemaDefinitionMethods
>;

/**
 * Teacher Model Schema
 */
const teacherModelSchema = new Schema<
  ITeacherSchemaDefinition,
  TeacherModelDefinition,
  ITeacherSchemaDefinitionMethods
>(teacherModelSchemaDefinition, {
  timestamps: true,
  versionKey: false,
});

/**
 * Method to convert a Teacher model to a TeacherDTO
 */
teacherModelSchema.method('toDto', function (): TeacherDTO {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    courses: this.courses.map((course) => ({
      id: course.id.toString(),
      courseName: course.courseName.toString(),
    })),
  };
});

// Create a new Mongoose model for the Teacher
export const TeacherModel = mongoose.model<ITeacherSchemaDefinition, TeacherModelDefinition>(
  'Teachers',
  teacherModelSchema
);

// Let's create a Typescript interface for the Teacher model
export type Teacher = InferSchemaType<typeof teacherModelSchemaDefinition> & ITeacherSchemaDefinitionMethods;

// ----------------------- INPUT VALIDATIONS -----------------------

// Input Validation for 'GET teachers/:id' endpoint
export const GetTeacherSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
