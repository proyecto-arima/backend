import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, InferRawDocType, Model, Schema } from 'mongoose';
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
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  institute: z.object({
    id: z.string(),
    name: z.string(),
  }),
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
const studentModelSchemaDefinition: Record<keyof Omit<StudentDTO, 'id'>, any> = {
  user: { type: Schema.Types.ObjectId, required: true, ref: 'Users' },
  institute: { type: Schema.Types.ObjectId, required: true, ref: 'Institutes' },
  learningProfile: { type: String, required: false, enum: LearningProfile },
  courses: [
    {
      id: { type: Schema.Types.ObjectId, required: true, ref: 'Courses' },
      courseName: { type: String, required: true },
      _id: false,
    },
  ],
};

// Type used to tell mongoose the shape of the schema available
type IStudentSchemaDefinition = Omit<StudentDTO, 'id'>;
// Type used to add methods to the schema
interface IStudentSchemaDefinitionMethods {
  toDto(): StudentDTO;
}
type StudentModelDefinition = Model<
  IStudentSchemaDefinition & Document,
  Record<string, never>,
  IStudentSchemaDefinitionMethods
>;

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
    user: this.user,
    institute: this.institute,
    learningProfile: this.learningProfile.toString() as LearningProfile,
    courses: this.courses.map((course: any) => ({
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

export type Student = InferRawDocType<typeof studentModelSchemaDefinition> & IStudentSchemaDefinitionMethods;

export const StudentCreationSchema = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    document: z.object({
      type: z.string(),
      number: z.string(),
    }),
  }),
});

export interface StudentFilter {
  courseId?: string;
  studentUserId?: string;
  learningProfile?: string;
  teacherUserId?: string;
}

export interface StudentResponse {
  email: string;
  learningProfile: string;
}

// Definir el esquema de los filtros (StudentFilter)
export const StudentFilterSchema = z.object({
  courseId: z.string().optional(),
  studentUserId: z.string().optional(),
  learningProfile: z.string().optional(),
  teacherUserId: z.string().optional(),
});

// Definir el esquema de la respuesta (StudentResponse)
export const StudentResponseSchema = z.object({
  email: z.string(),
  learningProfile: z.string(),
});

// Si esperas una lista de estudiantes en la respuesta
export const StudentResponseArraySchema = z.array(StudentResponseSchema);

export type StudentCreationDTO = z.infer<typeof StudentCreationSchema.shape.body>;
export type StudentCreation = StudentCreationDTO;
