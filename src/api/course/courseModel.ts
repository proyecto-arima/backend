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
  students: z.array(
    z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
  ),
  sections: z.array(
    z.object({
      id: z.string(),
      sectionName: z.string(),
      sectionDescription: z.string(),
      content: z.array(
        z.object({
          id: z.string(),
          contentName: z.string(),
        })
      ),
    })
  ),
});
export type CourseDTO = z.infer<typeof CourseDTOSchema>;

/**
 * Course Model Schema Definition
 */
const studentSchemaDefinition = new Schema({
  id: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
});

const contentSchemaDefinition = new Schema({
  id: { type: String, required: true },
  contentName: { type: String, required: true },
});

const sectionSchemaDefinition = new Schema({
  id: { type: String, required: true },
  sectionName: { type: String, required: true },
  sectionDescription: { type: String, required: true },
  content: { type: [contentSchemaDefinition], required: true },
});

const courseModelSchemaDefinition = {
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  matriculationCode: { type: String, required: true },
  students: { type: [studentSchemaDefinition], required: true },
  sections: { type: [sectionSchemaDefinition], required: true },
};

// Type used to tell mongoose the shape of the schema available
type ICourseSchemaDefinition = typeof courseModelSchemaDefinition & {
  students: Array<{ id: string; firstName: string; lastName: string }>;
  sections: Array<{
    id: string;
    sectionName: string;
    sectionDescription: string;
    content: Array<{ id: string; contentName: string }>;
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
    students: this.students.map((student) => ({
      id: student.id.toString(),
      firstName: student.firstName.toString(),
      lastName: student.lastName.toString(),
    })),
    sections: this.sections.map((section) => ({
      id: section.id.toString(),
      sectionName: section.sectionName.toString(),
      sectionDescription: section.sectionDescription.toString(),
      content: section.content.map((contentItem) => ({
        id: contentItem.id.toString(),
        contentName: contentItem.contentName.toString(),
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
        id: z.string(),
        sectionName: z.string(),
        sectionDescription: z.string(),
        content: z.array(
          z.object({
            id: z.string(),
            contentName: z.string(),
          })
        ),
      })
    ),
  }),
});
export type CourseCreationDTO = z.infer<typeof CourseCreationSchema.shape.body>;
export type CourseCreation = CourseCreationDTO;
