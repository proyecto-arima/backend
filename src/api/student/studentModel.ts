import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { InferRawDocType, Model, Schema } from 'mongoose';
import { z } from 'zod';

import { LearningProfile } from '@/common/models/learningProfile';

extendZodWithOpenApi(z);

/**
 * Student DTO (Data Transfer Object)
 * This is the shape of the data that will be sent or received from the API
 * Should not contain any sensitive information such as passwords, auditory fields, etc.
 *
 * It should be serializable, so it should not contain any functions, methods or any other non-serializable data
 *
 * Read more about DTO here: https://medium.com/@valksoft/uso-de-dto-vs-modelo-c1ae1d1797ea

 */
export const StudentDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  learningProfile: z.nativeEnum(LearningProfile),
  courses: z.array(
    z.object({
      id: z.string(),
      courseName: z.string(),
    })
  ),
});
export type StudentDTO = z.infer<typeof StudentDTOSchema>;

/**
 * Student Model Schema Definition
 */
const studentModelSchemaDefinition = {
  userId: { type: String, required: true },
  learningProfile: { type: String, required: true, enum: LearningProfile },
  courses: [
    {
      id: { type: String, required: true },
      courseName: { type: String, required: true },
    },
  ],
};

// Type used to tell mongoose the shape of the schema available
type IStudentSchemaDefinition = typeof studentModelSchemaDefinition;
// Type used to add methods to the schema
interface IStudentSchemaDefinitionMethods {
  toDto(): StudentDTO;
}
type StudentModelDefinition = Model<IStudentSchemaDefinition, Record<string, never>, IStudentSchemaDefinitionMethods>;

/**
 * Student Model Schema
 */
const studentModelSchema = new Schema<
  IStudentSchemaDefinition,
  StudentModelDefinition,
  IStudentSchemaDefinitionMethods
>(studentModelSchemaDefinition, {
  timestamps: true,
  versionKey: false,
});

/**
 * Method to convert a Student model to a StudentDTO
 */
studentModelSchema.method('toDto', function (): StudentDTO {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    learningProfile: this.learningProfile.toString() as LearningProfile,
    courses: this.courses.map((course) => ({
      id: course.id.toString(),
      courseName: course.courseName.toString(),
    })),
  };
});

// Create a new Mongoose model for the Student
export const StudentModel = mongoose.model<IStudentSchemaDefinition, StudentModelDefinition>(
  'Students',
  studentModelSchema
);

// Let's create a Typescript interface for the Student model
export type Student = InferRawDocType<typeof studentModelSchemaDefinition> & IStudentSchemaDefinitionMethods;
