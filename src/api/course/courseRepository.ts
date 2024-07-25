import { Types } from 'mongoose';

import { Course, CourseCreation, CourseCreationDTO, CourseModel } from '@/api/course/courseModel';
import { SectionCreationDTO, SectionModel } from '@/api/course/section/sectionModel';

export const courseRepository = {
  // Retrieves all courses from the database
  findAllAsync: async (): Promise<Course[]> => CourseModel.find<Course>(),

  // Retrieves a course by its ID
  findByIdAsync: async (id: string): Promise<Course> => {
    const course = await CourseModel.findById<Course>(id);
    if (!course) {
      return Promise.reject(new Error('Course not found'));
    }
    return course;
  },

  // Creates a new course
  create: async (course: CourseCreation): Promise<Course> => {
    const newCourse = await CourseModel.create<CourseCreationDTO>(course);
    return courseRepository.findByIdAsync(newCourse.id);
  },

  addSectionToCourse: async (course: Course, sectionData: SectionCreationDTO): Promise<any> => {
    try {
      // Crear la nueva sección
      const newSection = new SectionModel({
        name: sectionData.name,
        description: sectionData.description,
        visible: sectionData.visible,
      });

      // Guardar la nueva sección
      await newSection.save();

      // Agregar la nueva sección al curso
      course.sections.push(newSection._id as Types.ObjectId); // Usar _id en lugar de objeto completo
      await course.save();

      // Retornar la sección recién creada en formato DTO
      return newSection.toDto();
    } catch (error) {
      // Manejo de errores
      return Promise.reject(error);
    }
  },
};
