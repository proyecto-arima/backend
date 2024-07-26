import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, InferSchemaType, Model, Schema } from 'mongoose';
import { z } from 'zod';

// Common validations
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
  sections: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      description: z.string(),
      content: z.array(
        z.object({
          id: z.string().optional(),
          name: z.string(),
        })
      ),
    })
  ),
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

const contentSchemaDefinition = new Schema({
  name: { type: String, required: true },
});

const sectionSchemaDefinition = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: [contentSchemaDefinition], required: true },
});

const courseModelSchemaDefinition = {
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  matriculationCode: { type: String, required: true },
  teacherId: { type: String },
  students: { type: [studentSchemaDefinition], required: true },
  sections: { type: [sectionSchemaDefinition], required: true },
};

// Type used to tell mongoose the shape of the schema available
type ICourseSchemaDefinition = typeof courseModelSchemaDefinition & {
  students: Array<{ _id: string; firstName: string; lastName: string }>;
  sections: Array<{
    _id: string;
    name: string;
    description: string;
    content: Array<{ _id: string; name: string }>;
  }>;
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
    id: this._id.toString(),
    title: this.title.toString(),
    description: this.description.toString(),
    image: this.image.toString(),
    matriculationCode: this.matriculationCode.toString(),
    teacherId: this.teacherId.toString(),
    students: this.students.map((student) => ({
      id: student._id?.toString(),
      firstName: student.firstName.toString(),
      lastName: student.lastName.toString(),
    })),
    sections: this.sections.map((section) => ({
      id: section._id.toString(),
      name: section.name.toString(),
      description: section.description.toString(),
      content: section.content.map((contentItem) => ({
        id: contentItem._id.toString(),
        name: contentItem.name.toString(),
      })),
    })),
  };
});

// Create a new Mongoose model for the Course
export const CourseModel = mongoose.model<ICourseSchemaDefinition, CourseModelDefinition>('Courses', courseModelSchema);

// Let's create a Typescript interface for the Course model
export type Course = InferSchemaType<typeof courseModelSchemaDefinition> & ICourseSchemaDefinitionMethods;

// ----------------------- INPUT VALIDATIONS -----------------------

// Input Validation for 'GET courses/:id' endpoint
export const GetCourseSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

// Input Validation for 'POST courses/create' endpoint
export const CourseCreationSchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().url(),
    matriculationCode: z.string(),
    students: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      })
    ),
    sections: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        content: z.array(
          z.object({
            name: z.string(),
          })
        ),
      })
    ),
  }),
});
export type CourseCreationDTO = z.infer<typeof CourseCreationSchema.shape.body>;
export type CourseCreation = CourseCreationDTO;
