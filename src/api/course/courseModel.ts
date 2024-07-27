// courseModel.ts

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, Model, Schema } from 'mongoose';
import { z } from 'zod';

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * Course DTO (Data Transfer Object)
 */
export const CourseDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.string().url(),
  matriculationCode: z.string(),
  teacherId: z.string(),
  students: z.array(
    z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
  ),
  sections: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
    )
    .optional(),
});
export type CourseDTO = z.infer<typeof CourseDTOSchema>;

/**
 * Course Model Schema Definition
 */
const studentSchemaDefinition = new Schema(
  {
    id: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
  { _id: false }
);

const sectionSchemaDefinition = new Schema(
  {
    id: { type: Schema.Types.ObjectId, ref: 'Section' },
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

// Usa el schema definido en sectionModel
const courseModelSchemaDefinition = {
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  matriculationCode: { type: String },
  teacherId: { type: String },
  students: { type: [studentSchemaDefinition], required: true },
  sections: { type: [sectionSchemaDefinition], required: false }, // Usa el schema de Section
};

// Type used to tell mongoose the shape of the schema available
type ICourseSchemaDefinition = {
  title: string;
  description: string;
  image: string;
  matriculationCode: string;
  teacherId: string;
  students: Array<{ id: string; firstName: string; lastName: string }>;
  sections?: Array<{ id: mongoose.Types.ObjectId; name: string; description: string }>;
};

// Type used to add methods to the schema
interface ICourseSchemaDefinitionMethods {
  toDto(): CourseDTO;
}
type CourseModelDefinition = Model<
  ICourseSchemaDefinition & Document,
  Record<string, never>,
  ICourseSchemaDefinitionMethods
>;

/**
 * Course Model Schema
 */
const courseModelSchema = new Schema<ICourseSchemaDefinition, CourseModelDefinition, ICourseSchemaDefinitionMethods>(
  courseModelSchemaDefinition,
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Method to convert a Course model to a CourseDTO
 */
courseModelSchema.method('toDto', function (): CourseDTO {
  return {
    id: this._id?.toString(),
    title: this.title?.toString() || '',
    description: this.description?.toString() || '',
    image: this.image?.toString() || '',
    matriculationCode: this.matriculationCode?.toString() || '',
    teacherId: this.teacherId?.toString() || '',
    students:
      this.students?.map((student) => ({
        id: student.id?.toString() || '',
        firstName: student.firstName?.toString() || '',
        lastName: student.lastName?.toString() || '',
      })) || [],
    sections:
      this.sections?.map((section) => ({
        id: section.id?.toString() || '',
        name: section.name?.toString() || '',
        description: section.description?.toString() || '',
      })) || [],
  };
});

// Create a new Mongoose model for the Course
export const CourseModel = mongoose.model<ICourseSchemaDefinition, CourseModelDefinition>('Courses', courseModelSchema);

// Let's create a Typescript interface for the Course model
export type Course = ICourseSchemaDefinition & ICourseSchemaDefinitionMethods & Document;

// ----------------------- INPUT VALIDATIONS -----------------------

// Input Validation for 'GET courses/:id' endpoint
export const GetCourseSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

// Input Validation for 'POST courses/create' endpoint
export const CourseCreationSchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    studentEmails: z.array(z.string().email()).optional(), // Array de emails
  }),
});
export type CourseCreationDTO = z.infer<typeof CourseCreationSchema.shape.body>;
export type CourseCreation = CourseCreationDTO;
